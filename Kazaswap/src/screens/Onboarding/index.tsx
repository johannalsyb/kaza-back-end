
import { ActivityIndicator, Button, Linking, Pressable, ScrollView, TextInput, View } from "react-native";
import KText from "../../components/KText";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { NavStackParamList } from "../../navigation/screens";
import StepView from "../../components/StepView";
import React, { useEffect, useState } from "react";
import { clamp } from "../../utils/math";
import Step2 from "./Step2";
import Step3 from "./Step3";
import Step4 from "./Step4";
import Step5 from "./Step5";
import variables from "../../styles/variables";
import { Property } from "../../components/forms/property";
import properties from "../../api/properties";
import useAuthentication from "../../hooks/useAuthentication";
import useIsMobile from "../../hooks/useIsMobile";
import KIcon from "../../components/KIcon/KIcon";
import users from "../../api/users";
import { OnboardingInfo } from "@kazaswap/common/lib/types/api/auth";
import Step6 from "./Step6";

type Props = NativeStackScreenProps<NavStackParamList, 'Onboarding'> 
// & {
//   step: number,
// };

export const onboardingSteps:{
    icon: string,
    title: string,
    subtitle?: string,
    content?: JSX.Element,
}[] = [
  {
    icon: "✋",
    title: "Tell us more about you",
  },
  {
    icon: "🏡",
    title: "About your place",
  },
  {
    icon: "🤓",
    title: "A bit more details",
  },
  {
    icon: "📷",
    title: "Time to show off",
    subtitle: "Minimum 3 pictures"
  },
  {
    icon: "✈️",
    title: "Finally, tell us about your trip!",
  },
  {
    icon: "💸",
    title: "Registration fee",
  },
]

export const defaultProperty:Property = {
  location: '',
  type: '',
  amenities: [],
  petFriendly: undefined,
  size: 25,
  bedrooms: 1,
  beds: 1,
  bathrooms: 1,
  bedroomsBeds: [
    {single: 0, double: 1},
  ],
  pics: [],
}

let callback: (() => void ) | undefined

export default (props:Props) => {
    const [currentStep, setCurrentStep] = useState<number | undefined>()
    const [property, setProperty] = useState<Property>();
    const {user} = useAuthentication()
    const {isMobile, height} = useIsMobile()

    const navigationListenerFn = (e:any) => {
      if(currentStep === 1) return props.navigation.push("Login")
      if(!props.route?.params) return
      if(currentStep === undefined && props.route.params.step === onboardingSteps.length) {
        callback && callback()
        return; // DO NOTHING WHEN FINISHED. This was creating a bug where the user would be redirected to onboarding when opening the profile after signing up
      }
      e.preventDefault();
      stepDown()
    }

    useEffect(() => {
      if(!callback) {
        // console.log("ADDING NAVIGATION LISTENER")
        callback = props.navigation.addListener('beforeRemove', navigationListenerFn)
      }
      return () => {
        // console.log("UNMOUNTING calling callback...")
        callback && callback()
      }
    }, [props.navigation]);

    useEffect(() => {
      Promise.all([users.me.get(), properties.ofUser("me")])
      .then(([me, properties]) => {

        // const onboarding:OnboardingInfo = me.data.onboarding ? JSON.parse(me.data.onboarding) : {step: 1, data: defaultProperty, completed: false}
        let onboarding:OnboardingInfo
        if(me.data.onboarding) {
          onboarding = JSON.parse(me.data.onboarding)
        } else {
          let step = 1
          let completed = false
          let data:any = defaultProperty
          if(properties.data.length) {
            data = {}
            step = 5
            if(me.data.payment) {
              step = 6 // If the user has already paid, skip to the end
              completed = true
            }
          }
          onboarding = {step, data, completed}
        }

        if(onboarding.completed) return props.navigation.navigate("Success")

        const propData = onboarding.data && Object.keys(onboarding.data).length ? onboarding.data : defaultProperty

        if(properties.data.length) {
          setProperty({...propData, id: properties.data[0].id})
        } else {
          setProperty(propData)
        }
        setCurrentStep(onboarding.step)
        // if(currentStep === 1) {
        //   if(user) setCurrentStep(2)
        // } else {
        //   if(!property || !property.id) {
        //     properties.ofUser("me")
        //     .then(({data}) => {
        //       if(!data[0]) return;
        //       return properties.get(data[0].id)
        //     })
        //     .then(r => {
        //       if(!r || !r?.data) return;
        //       const pics = typeof r.data.images === "string" ? (r.data.images.length ? r.data.images.split(",") : []) : r.data.images
        //       const p:Property = {
        //         id: r.data.id,
        //         location: r.data.address,
        //         type: r.data.type,
        //         amenities: r.data.amenities.split(","),
        //         petFriendly: !!r.data.pets,
        //         size: r.data.sizeM2,
        //         bedrooms: r.data.bedrooms,
        //         beds: r.data.beds,
        //         bathrooms: r.data.bathrooms,
        //         bedroomsBeds: new Array(r.data.bedrooms).fill(null).map(b => ({single: 1, double: 0})),
        //         pics,
        //       }
        //       setProperty(p)
        //     })
        //     .catch(err => setProperty(defaultProperty))
        //   } else {
        //     setProperty(defaultProperty)
        //   }
        // }
      })
      .catch(err => {
        // We're most likely not logged in
        setCurrentStep(1)
      })
    }, [])

    // useEffect(() => {
    //   console.log("property", property)
    // }, [property])

    const stepUp = (v = (currentStep || 1)+1) => {
      const vv = clamp(v, 1, onboardingSteps.length)
      return users.me.update({onboarding: JSON.stringify({step: vv, data: property, completed: false})})
      .then(() => {
        setCurrentStep(vv)
        props.navigation.push("Onboarding", {step: vv})
      })
    }

    const stepDown = (v = (currentStep || 2)-1) => {
      const vv = clamp(v, 1, onboardingSteps.length)
      return users.me.update({onboarding: JSON.stringify({step: vv, data: property, completed: false})})
      .then(() => {
        setCurrentStep(vv)
        props.navigation.push("Onboarding", {step: vv})
      })
      .catch(err => {
        console.log(err)
        props.navigation.push("Login")
      })
    }

    const finish = () => {
      return users.me.update({onboarding: JSON.stringify({step: currentStep, data: property, completed: true})})
      .then(() => {
        // console.log("FINISHED, calling callback to unsubscribe...")
        callback && callback()
        props.navigation.navigate("Success")
      })
    }

    // if(user && !property) {
    //   return <Pressable onPress={() => {
    //     // alert(currentStep)
    //     // setCurrentStep(2)
    //     finish()
    //   }}>
    //     {user.id}
    //     <ActivityIndicator />
    //   </Pressable>
    // }

    // if(property) {
      onboardingSteps[1].content = <Step2 property={property || defaultProperty} onChange={setProperty} onNext={() => stepUp(3)} />
      onboardingSteps[2].content = <Step3 property={property || defaultProperty} onChange={setProperty} onNext={() => stepUp(4)} onPrev={() => stepDown(2)} />
      onboardingSteps[3].content = <Step4 property={property || defaultProperty} onChange={setProperty} onNext={() => stepUp(5)} onPrev={() => stepDown(3)} />
      onboardingSteps[4].content = <Step5 onChange={p => {}} onNext={() => stepUp(6)} onPrev={() => stepDown(4)}/>
      onboardingSteps[5].content = <Step6 onNext={finish} onPrev={() => stepDown(5)}/>
    // }

    const currentStepObject = onboardingSteps[(currentStep || 1)-1]
    const Comp = isMobile ? ScrollView : View

    const ContentView = () => <View style={{
      width: isMobile ? '90%' : '70%',
      zIndex: 10,
      flex: 1,
      marginTop: 20,
      justifyContent: isMobile ? "flex-start" : 'center',
      alignItems: isMobile ? "flex-start" : 'center',
    }}>
      {currentStepObject.content}
    </View>

    return <Comp style={{
      display: "flex",
      flex: 1,
      backgroundColor: 'white',
      flexDirection: isMobile ? 'column' : 'row',  
    }}
    contentContainerStyle={{
      display: 'flex',
      alignItems: 'center',
      flex: 1,
      backgroundColor: 'white',
      flexDirection: isMobile ? 'column' : 'row',
    }}>
        <View style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'column',
          paddingBottom: 30,
          paddingTop: 20,
          borderBottomLeftRadius: 20,
          borderBottomRightRadius: 20,
          zIndex: 1,
          width: isMobile ? '100%' : undefined,
          // height: isMobile ? "auto" : '100%',
          flex: isMobile ? undefined : 1,
          backgroundColor: variables.colors.greenLight,
        }}>
          {isMobile && <StepView number={onboardingSteps.length} current={currentStep || 1} style={{height: 3, width: "90%", flex: 1, opacity: !currentStep ? 0 : 1}}/>}
          <KText style={{
            fontSize: isMobile ? 40 : 70,
            backgroundColor: isMobile ? "transparent" : "white",
            padding: isMobile ? 0 : 10,
            borderRadius: isMobile ? 0 : 60,
            width: isMobile ? "auto" : 120,
            textAlign: "center",
          }}>{currentStepObject.icon}</KText>
          <KText style={{fontWeight: "bold", fontSize: isMobile ? 15 : 20, marginTop: isMobile ? 0 : 20}}>{currentStepObject.title}</KText>
          {currentStepObject.subtitle && <KText style={{
            fontSize: 10,
            color: variables.colors.grey,
            marginTop: 5
          }}>{currentStepObject.subtitle}</KText>}

          {!isMobile && <>
            <KText style={{marginTop: 20, opacity: !currentStep ? 0 : 1}}>Step {currentStep} of {onboardingSteps.length}</KText>
            <StepView number={onboardingSteps.length} current={currentStep || 1} style={{height: 3, width: "90%", marginTop: 30, opacity: !currentStep ? 0 : 1}}/>
            <Pressable style={{position: "absolute", top: 0, left: 40}} onPress={() => {
              Linking.openURL("https://www.kazaswap.co")
            }}><KIcon name="logoText2" size={120} /></Pressable>
            <KText
              style={{position: "absolute", bottom: 10, left: 10, fontSize: 10, color: variables.colors.grey}}>
                © {new Date().getFullYear()} Kaza Swap LLC. All rights reserved.
            </KText>
            <KText
            style={{position: "absolute", bottom: 10, right: 20, fontSize: 10, color: variables.colors.grey}}>
              ♥️ Made by friends
            </KText>
          </>}
        </View>
        <ScrollView contentContainerStyle={{
          display: 'flex',
          alignItems: 'center',
          flexDirection: 'column',
          // paddingBottom: 30,
          flex: 1,
          backgroundColor: 'white',
          // width: '100%',
          // justifyContent: isMobile ? "flex-start" : "center"
        }} style={{
          flex: 1,
          width: "100%"
        }}>
          {!currentStep ? <ActivityIndicator color={variables.colors.yellow} size="large" style={{marginTop: 20}} /> :
          <View style={{
            width: '90%',
            zIndex: 10,
            flex: 1,
            marginTop: 20,
            // justifyContent: isMobile ? "flex-start" : "center"
          }}>
            {currentStepObject.content}
          </View>}
        </ScrollView>
   </Comp>
}