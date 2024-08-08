import { Image, View, useWindowDimensions } from "react-native";
import KButton from "../../components/KButton/KButton";
import { NativeStackNavigationProp, NativeStackScreenProps } from "@react-navigation/native-stack";
import { NavStackParamList } from "../../navigation/screens";
import KText from "../../components/KText";
import useIsMobile from "../../hooks/useIsMobile";
import { useNavigation } from "@react-navigation/native";
import KIcon from "../../components/KIcon/KIcon";


const BackImg = require("../../assets/Auth/back.webp")

export default ({
    onHide
}:{
    onHide?: () => void
}) => {

    const {isMobile} = useIsMobile()
    const navigation = useNavigation<NativeStackNavigationProp<NavStackParamList, "Login", undefined>>()

    if(!isMobile) return null

    return <View style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'column',
            flex: 1,
            paddingBottom: 30,
        }}>

            <Image
                source={BackImg}
                resizeMode="cover"
                style={{
                    width: "100%",
                    height: "100%",
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    zIndex: -1
                }}/>
            <View style={{flex: 1}}>
            </View>
            <View style={{
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                flexDirection: 'column',
                flex: 1,
                width: "100%",
            }}>

                <KIcon name="logoText2" style={{width: "100%", height: 40}} />
                <KText style={{fontSize: 25, fontWeight: "bold" ,marginTop: 20}}>Swap your place,</KText>
                <KText style={{fontSize: 25, fontWeight: "bold" ,marginBottom: 50}}>explore the world</KText>

                <View style={{
                    display: 'flex',
                    justifyContent: 'space-around',
                    alignItems: 'center',
                    flexDirection: 'row',
                    width: "90%"
                }}>
                    <KButton
                        color="light"
                        text="Sign In"
                        onPress={() => navigation.navigate('Login')}
                        style={{borderWidth: 0}}/>
                    <KButton
                        text="Register"
                        onPress={() => navigation.navigate('SignUp')} />
                </View>
            </View>
            <View style={{position: "absolute", top: 20, right: 20}}>
                <KText onPress={() => {
                    // navigation.navigate('Properties')
                    onHide && onHide()
                }}>{"> Look around"}</KText>
            </View>
        </View>
}