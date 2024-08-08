import { useEffect, useState } from "react"
import useIsMobile from "../../hooks/useIsMobile"
import Property, { leftColumnWidth, rightColumnWidth } from "../../components/Views/Property"
import PropertyCard from "../../components/PropertyCard"
import { PrivateProperty, Property as PropertyT} from "@kazaswap/common/lib/types/api/properties"
import propertiesApi from "../../api/properties"
import { ActivityIndicator, BackHandler, NativeEventSubscription, Platform, Pressable, ScrollView, Switch, View, ViewStyle } from "react-native"
import variables from "../../styles/variables"
import KButton from "../../components/KButton/KButton"
import KText from "../../components/KText"
import KIcon from "../../components/KIcon/KIcon"
import HeaderEvent from "../../events/HeaderEvent"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { ParamListBase, useRoute } from "@react-navigation/native"
import { useSetAtom } from "jotai"
import { showSwapNowAtom } from "../../atoms"
import useAuthentication from "../../hooks/useAuthentication"
import KSwitch from "../../components/KSwitch"
import Footer from "../../components/Footer"
import { shareProperty } from "../../utils/Share"

type Props = {
    id?: string,
    property?: PropertyT,
    privateProperty?: PrivateProperty,
    onBackPressed: () => void,
    navigation: NativeStackNavigationProp<ParamListBase>,
    onEditPropertyPressed?: () => void,
    onPropertyEdited?: () => void,
}

type ExtProp = {public: PropertyT, private: PrivateProperty}

let lid:string | undefined = undefined

export default (props:Props) => {
    const {isMobile} = useIsMobile()
    const route = useRoute()
    const preview = (route.params as Readonly<{preview: boolean}>)?.preview;
    const [showPreview, setShowPreview] = useState(preview)
    const [property, setProperty] = useState<ExtProp | undefined>(undefined);
    // const [hidden, setHidden] = useState(false)
    const [loading, setLoading] = useState(false)
    const setShowSwapNow = useSetAtom(showSwapNowAtom);
    const {properties, user} = useAuthentication()

    useEffect(() => {
        if(props.id || props.privateProperty) {
            const id = props.id || props.privateProperty?.id
            if(!id) return
            let pub = props.property ? Promise.resolve(props.property) : propertiesApi.get(id)
                .then(res => {
                    if (!res.data) return;
                    return res.data as unknown as PropertyT
                })
                .catch(err => {
                    console.log(err);
                });

            Promise.all([pub, properties.get()])
            .then(([pup, prps]) => {
                if(!pup) return
                const prop = prps.filter(p => p.id === props.id)
                setProperty({public: pup, private: prop[0]})
            })
        }
    }, [props.privateProperty, props.id]);

    useEffect(() => {
        return () => {
            setShowPreview(false)
            if(lid) HeaderEvent.removeListener("back", lid!)
        }
    }, [])

    useEffect(() => {
        if(lid) HeaderEvent.removeListener("back", lid!)
        lid = HeaderEvent.addListener("back", () => {
            if(showPreview) setShowPreview(false)
            else {
                props.onBackPressed()
            }
            return
        })

        if(!showPreview) props.navigation.setParams({preview: undefined})
    }, [showPreview])

    const updateHidden = (priv:boolean) => {
        setLoading(loading)
        propertiesApi.update({id: props.id, private: priv})
        .then(() => {
            properties.reload(priv)
            .then(() => props.onPropertyEdited && props.onPropertyEdited())
        })
        .catch(err => {
            console.log(err)
            // setProperty({...property, private: {...property.private, private: !priv}})
        })
        .finally(() => {
            setLoading(false)
        })
    }

    const hideMyPlaceButton = (prop:ExtProp, {
        style = {},
        switchStyle = {}
    }:{
        style?: ViewStyle,
        switchStyle?: ViewStyle
    } = {}) => {
        console.log("IS PRIVATE", prop.private.private)
        return <KButton
        color="light"
        onPress={() => {
            // setHidden(!hidden)
            // updateHidden(!hidden)
        }}
        style={{
            width: isMobile ? '100%' : 'auto',
            display: 'flex',
            flexDirection: 'row',
            justifyContent: "flex-start",
            marginTop: isMobile ? 5 : 0,
            marginBottom: isMobile ? 5 : 0,
            borderColor: "white",
            ...style
        }}>
            <KIcon name="eyeClose" style={{marginRight: 10, marginLeft: 10}} size="medium" />
            <KText style={{flex: 1, color: propVerified ? "black" : variables.colors.orange}}>Hide my place{!propVerified ? " (Property not verified)" : ""}</KText>
            <KSwitch
                disabled={loading || !propVerified}
                loading={loading}
                style={{marginRight: 10, ...switchStyle}}
                onValueChange={(t) => {
                    setProperty({...prop, private: {...prop.private, private: t}})
                    updateHidden(t)
                }}
                value={prop.private.private}
            />
        </KButton>
    }

    const hasProperty = !!props.id
    const propVerified = user && user.verified && (property && property.private.verified)

    if(!hasProperty) return <View style={{
        backgroundColor: variables.colors.greenLight,
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}>
        <KIcon name="placeType" size="xxlarge" style={{
          stroke: "black",
          backgroundColor: "white",
          borderRadius: 100,
          padding: 10,
        }} />
        <KText style={{fontSize: isMobile ? 18 : 25, fontWeight: "bold", marginTop: 20, marginBottom: 20, textAlign: "center"}}>
          Oops ! You don't have a property yet...
        </KText>
            <KText style={{maxWidth: isMobile ? "90%" : "25%", textAlign: "center", lineHeight: 20}}>
              Add your property to start swapping.
            </KText>
            <KButton text="Add my property" color="primary" onPress={() => {
                props.navigation.navigate('Onboarding')
            }} style={{marginTop: 20}}/>
      </View>

    return <ScrollView style={{
        marginLeft: isMobile ? 10 : 0,
        marginRight: isMobile ? 10 : 0,
        marginBottom: isMobile ? 10 : 0,
    }}>
        {property ? 
            showPreview ? <View style={{
                width: "100%",
                display: "flex",
                flexDirection: "column",
                // justifyContent: "flex-end",
            }}>
                <View style={{
                    width: "100%",
                    flexDirection: "row",
                    justifyContent: "space-around",
                    alignItems: "center",
                    paddingTop: 10,
                    paddingBottom: 0,
                    paddingLeft: 40,
                    paddingRight: 40,
                    display: isMobile ? "none" : "flex",
                    flexWrap: "wrap",
                }}>
                    <View style={{backgroundColor: "transparent", height: 0, width: leftColumnWidth}} />
                    <View style={{display: "flex", flexDirection: "row", justifyContent: "space-between", width: rightColumnWidth}}>
                        {hideMyPlaceButton(property, {switchStyle: {marginLeft: 20}})}

                        <View style={{display: "flex", flexDirection: "row"}}>
                            <Pressable
                            onPress={() => shareProperty(`${window.location.origin}/property/${property.public.id}`)}
                                style={{
                                    marginLeft: 20,
                                    marginRight: 20,
                                    borderWidth: 1,
                                    borderColor: "grey",
                                    borderRadius: 30,
                                    padding: 10
                                }}>
                                <KIcon name="share" size="medium" />
                            </Pressable>
                            <KButton
                                color="tertiary"
                                text="Edit Place"
                                icon="edit"
                                iconStyle={{stroke: variables.colors.yellow}}
                                onPress={() => {
                                    props.onEditPropertyPressed && props.onEditPropertyPressed()
                                }} />
                        </View>
                    </View>
                </View>
                <Property id={props.id!} />
            </View>
            : <>
                {property && <PropertyCard
                    property={property.public}
                    hoverable={false}
                    onPress={() => {
                        props.navigation.push(route.name, {preview: true})
                        // setShowPreview(true)
                    }}/>}

                <KButton
                    color="light"
                    onPress={() => {
                        props.navigation.push(route.name, {preview: true})
                        // setShowPreview(true)
                    }}
                    style={{
                        width: isMobile ? '100%' : 'auto',
                        display: 'flex',
                        flexDirection: 'row',
                        justifyContent: "flex-start",
                        marginTop: isMobile ? 10 : 0,
                        marginBottom: isMobile ? 5 : 0,
                        borderColor: "white"
                    }}>
                        <KIcon name="placeType" style={{marginRight: 10, marginLeft: 10}} size="medium" />
                        <KText style={{flex: 1}}>Preview my place</KText>
                        <KIcon name="chevronRight" style={{marginRight: 10, marginLeft: 10}} size="medium" />
                </KButton>

                <KButton
                    color="light"
                    onPress={() => setShowSwapNow(true)}
                    style={{
                        width: isMobile ? '100%' : 'auto',
                        display: 'flex',
                        flexDirection: 'row',
                        justifyContent: "flex-start",
                        marginTop: isMobile ? 5 : 0,
                        marginBottom: isMobile ? 5 : 0,
                        borderColor: "white"
                    }}>
                        <KIcon name="calendarEdit" style={{marginRight: 10, marginLeft: 10, stroke: "#555"}} size="medium" />
                        <KText style={{flex: 1}}>Edit Availabilities</KText>
                        <KIcon name="chevronRight" style={{marginRight: 10, marginLeft: 10}} size="medium" />
                </KButton>
                {hideMyPlaceButton(property)}
            </>
        : <ActivityIndicator color={variables.colors.yellow} />}
      <Footer route={"Myplace"} />

    </ScrollView>
}