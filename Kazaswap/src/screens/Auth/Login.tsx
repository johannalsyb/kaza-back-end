import { useState } from "react";
import { Button, Image, ImageBackground, TextInput, View } from "react-native";
import useAuthentication from "../../hooks/useAuthentication";
import KTextInput from "../../components/Form/KTextInput/KTextInput";
import KButton from "../../components/KButton/KButton";
import KText from "../../components/KText";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { NavStackParamList } from "../../navigation/screens";
import FormField from "../../components/Form/FormField/FormField";
import variables from "../../styles/variables";
import useIsMobile from "../../hooks/useIsMobile";
import KIcon from "../../components/KIcon/KIcon";

const TopImg = require("../../assets/Auth/top.webp")
const LeftImg = require("../../assets/Auth/left_desktop.webp")

type Props = NativeStackScreenProps<NavStackParamList, 'Login'>;

export default ({
  route,
  navigation
}:Props) => {
    const {isMobile} = useIsMobile()
    const authentication = useAuthentication();
    const {isAuthLoading} = authentication;
    const [creds, setCreds] = useState({email: '', password: ''});
    const [showPassword, setShowPassword] = useState(false)
  
    // useEffect(() => {
    //   authentication.check();
    // }, []);
  
    const login = () => {
      authentication.login(creds.email, creds.password);
    };

    return <View style={{
      display: 'flex',
      flexDirection: isMobile ? 'column' : "row",
      // justifyContent: 'center',
      alignItems: 'center',
      height: '100%',
      // width: "90%",
      // padding: "15%",
      flex: 1,
      position: "relative",
    }}>

      <Image
        source={isMobile ? TopImg : LeftImg}
        resizeMode={isMobile ? "contain" : "cover"}
        style={{
          width: isMobile ? "100%" : "50%",
          height: isMobile ? 250 : "100%",
          position: "relative",
          top: 0,
          // left: 0,
          // right: 0,
          zIndex: -1,
          borderTopRightRadius: isMobile ? 0 : 30,
          borderBottomRightRadius: isMobile ? 0 : 30,
        }}/>
        {isMobile ?
          <View style={{
            height: 150,
            width: "100%",
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            backgroundColor: variables.colors.yellow,
            zIndex: -2,
            borderBottomLeftRadius: 20,
            borderBottomRightRadius: 20,
            display: isMobile ? "flex" : "none"
          }}/> : <View style={{
            position: "absolute",
            width: "50%",
            bottom: 50,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
          }}>
            <KIcon name="logoText2" style={{width: 200, height: 150}} />
            <KText style={{fontSize: 25, fontWeight: "bold" ,marginBottom: 50}}>Swap your place, explore the world</KText>
            <KText style={{fontSize: 15, color: variables.colors.grey, width: "90%", textAlign: "left"}}>
                © {new Date().getFullYear()} Kaza Swap LLC. All rights reserved.
            </KText>
          </View>}

      <View style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'center',
        flex: 1,
        paddingTop: isMobile ? 20 : "15%",
        paddingBottom: isMobile ? 30 : "15%",
        paddingLeft: isMobile ? 0 : "15%",
        paddingRight: isMobile ? 0 : "15%",
        height: isMobile ? "auto" : "100%",
      }}>
        <KText style={{
          fontSize: isMobile ? 20 : 30,
          fontWeight: "bold",
          marginBottom: 20,
        }}>Sign In</KText>

        <FormField labelAlign="center" label="Email">
          <KTextInput
            placeholder="Email"
            value={creds.email}
            onChangeText={email => setCreds({...creds, email})}
          />
        </FormField>

        <FormField labelAlign="center" label="Password">
          <KTextInput
            placeholder="Password"
            secureTextEntry={!showPassword}
            value={creds.password}
            onChangeText={password => setCreds({...creds, password})}
            rightComponent={<KIcon name={showPassword ? "eyeOpen" : "eyeClose"} size={"medium"} style={{marginRight: 10, opacity: .5}}/>}
            onRightComponentPress={() => setShowPassword(!showPassword)}
          />
        </FormField>

        <KText
          style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'center',
            width: "100%",
            alignItems: "center",
            marginTop: isMobile ? 0 : 30
          }}
          onPress={() => {
            navigation.navigate('ForgotPassword')
          }}>
          <KIcon name="password" size={"medium"} style={{marginRight: 10, opacity: .5}}/>
          Forgot Password?
        </KText>

        <KButton
          text="Sign In"
          style={{width: "100%", marginTop: isMobile ? 0 : 40, marginBottom: isMobile ? 0 : 50}}
          onPress={login} />

        <KText
          style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'center',
            width: "100%",
            alignItems: "center",
            color: variables.colors.grey,
          }}
          onPress={() => {
            navigation.navigate('SignUp')
          }}>
          Don't have an account yet?
          <KIcon name="register" size={"medium"} style={{marginLeft: 20, marginRight: 10, opacity: .5, stroke: "black"}}/>
          <KText style={{fontWeight: "bold", color: "black"}}>Register</KText>
        </KText>

      </View>
      {!isMobile && <View style={{position: "absolute", top: 20, right: 20}}>
            <KText onPress={() => {
                navigation.navigate('Home')
            }}>{"> Look around"}</KText>
        </View>}
      {!isMobile && <KText style={{position: "absolute", bottom: 20, right: 20, fontSize: 13, color: "black"}}>
        ♥️ Made by friends
      </KText>}
    </View>
}