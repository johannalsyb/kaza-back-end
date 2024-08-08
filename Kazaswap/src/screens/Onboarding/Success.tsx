import { ScrollView, View } from "react-native"
import KButton from "../../components/KButton/KButton"
import { useEffect, useState } from "react"
import User1, { Preferences } from "../../components/forms/user/User1"
import users from "../../api/users"
import useAuthentication from "../../hooks/useAuthentication"
import { toastError } from "../../components/Toast/Toast"
import KText from "../../components/KText"
import KImage from "../../components/KImage/KImage"
import variables from "../../styles/variables"
import { useNavigation } from "@react-navigation/native"
import { NavStackParamList } from "../../navigation/screens"
import { NativeStackScreenProps } from "@react-navigation/native-stack"
import useIsMobile from "../../hooks/useIsMobile"
import KIcon from "../../components/KIcon/KIcon"

type Props = NativeStackScreenProps<NavStackParamList, 'Success'>

const mimg = require("../../assets/Onboarding/Congrats.webp")
const dimg = require("../../assets/Onboarding/Desktop_Congrats.jpg")

export default (props:Props) => {
    const {user} = useAuthentication()
    const {isMobile} = useIsMobile()
    const [loading, setLoading] = useState(false)
    // if(!user) {
    //     props.navigation.navigate("Home")
    //     return null
    // }
    return <ScrollView
        style={{
            paddingBottom: isMobile ? 20 : 0,
            width: "100%",       
        }}
        contentContainerStyle={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
            paddingBottom: isMobile ? 20 : 0,
            marginBottom: isMobile ? 20 : 0,
            flex: 1
        }}>
            <View style={{
                width: isMobile ? "100%" : "50%",
                height: isMobile ? 380 : "100%",
            }}>
                <KImage
                    source={isMobile ? mimg : dimg}
                    style={{
                        width: "100%",
                        height: isMobile ? "auto" : "100%",
                        objectFit: isMobile ? "contain" : "cover",
                    }} />
                <View style={{
                    alignItems: "center",
                    width: "100%",
                    top: isMobile ? -120 : undefined,
                    bottom: isMobile ? undefined : 100,
                    marginTop: isMobile ? 20 : 0,
                    marginBottom: isMobile ? 20 : 0,
                    position: isMobile ? "relative" : "absolute",
                }}>
                    <KText style={{fontWeight: "bold", fontSize: isMobile ? 30 : 50}}>Congratulations</KText>
                    <KText style={{fontWeight: "bold", fontSize: isMobile ? 30 : 50}}>{user?.firstName}!</KText>
                </View>

                {!isMobile && <>
                    <KIcon name="logoText2" size={120} style={{position: "absolute", top: 0, left: 40}} />
                    <KText
                    style={{position: "absolute", bottom: 10, left: 10, fontSize: 10, color: variables.colors.black}}>
                        © {new Date().getFullYear()} Kaza Swap LLC. All rights reserved.
                    </KText>
                    <KText
                    style={{position: "absolute", bottom: 10, right: 20, fontSize: 10, color: variables.colors.black}}>
                    ♥️ Made by friends
                    </KText>
                </>}
            </View>

            <View style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                alignItems: "center",
                flex: 1,
                width: "90%",
                marginTop: 20,
                marginBottom: 20
            }}>
                <View style={{
                    display: "flex",
                    width: isMobile ? "100%" : "90%",
                    marginTop: 30,
                    marginBottom: 20
                }}>
                    <KText style={{fontWeight: "bold", fontSize: isMobile ? 18 : 30}}>Thank you for registering with us! Check your mailbox to confirm your email address.</KText>
                    <KText style={{fontWeight: "100", fontSize: isMobile ? 18 : 30, marginTop: 15, color: variables.colors.blackLight}}>🚨 Please note that your profile is currently under review. You will be notified once it is approved. 🚨</KText>
                </View>

                <KButton
                    text="Start Exploring"
                    loading={loading}
                    onPress={() => {
                        setLoading(true)
                        localStorage.setItem("onboardingFinishedAt", `${new Date().toISOString()}`)
                        users.me.update({onboarding: JSON.stringify({step: 5, data: {}, completed: true})})
                        .catch(e => {
                            console.log(e)
                        })
                        .finally(() => {
                            setLoading(false)
                            // props.navigation.navigate("Home")
                            document.location.href = "/" // Force reload
                        })
                    }}
                    color="primary"
                    style={{width: isMobile ? "100%" : "90%", marginBottom: 10}}
                    textStyle={{fontSize: 18}}
                    />
                <KText>{" "}</KText> {/* Spacer */}
            </View>

        </ScrollView>
        
}