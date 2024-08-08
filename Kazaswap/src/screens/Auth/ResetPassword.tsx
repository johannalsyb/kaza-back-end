import { useEffect, useState } from "react";
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
import auth from "../../api/auth";
import { toastSuccess } from "../../components/Toast/Toast";
import KIcon from "../../components/KIcon/KIcon";
import {getError as getPasswordError} from "../../components/Form/KPasswordInput"
import { useSetAtom } from "jotai";
import { showMessageAtom } from "../../atoms";

const TopImg = require("../../assets/Auth/top.webp")
const LeftImg = require("../../assets/Auth/left_desktop.webp")

type Props = NativeStackScreenProps<NavStackParamList, 'ResetPassword'>;

export default ({
  route,
  navigation
}:Props) => {
    const {isMobile} = useIsMobile()
    const [creds, setCreds] = useState({password: ''});
    const [loading, setLoading] = useState(false)
    const [disabled, setDisabled] = useState(false)
    const [tokenValid, setTokenValid] = useState<boolean>()
    const [showPassword, setShowPassword] = useState(false)
    const setShowMessage = useSetAtom(showMessageAtom);

    //@ts-ignore
    const token = route.params?.token

    useEffect(() => {
      if(!token) return
      auth.resetPassword.isValid(token)
      .then(() => {
        setTokenValid(true)
      })
      .catch(() => {
        setTokenValid(false)
      })
    }, [token]) 
    
    const resetPassword = () => {
      setLoading(true)
      auth.resetPassword.update({password: creds.password, token})
      .then(() => {
        toastSuccess("Password successfully reset")
        navigation.navigate("Login")
      })
      .catch(() => {
        toastSuccess("Error resetting password, please try again later.")
      })
      .finally(() => {
        setLoading(false)
        setDisabled(true)
      })
    };

    const pwdError = getPasswordError(creds.password, setShowMessage)

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
        {isMobile && 
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
          }}/>}

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
        // height: isMobile ? "auto" : "100%",
      }}>
        {!token || !tokenValid ? <>
          <KText style={{
            color: variables.colors.grey,
          }}>Invalid token</KText>
        </> : <>
        <KText style={{
          fontSize: isMobile ? 20 : 30,
          fontWeight: "bold",
          marginBottom: 20,
        }}>Forgot Password?</KText>
        <KText style={{
          color: variables.colors.grey,
          marginBottom: 40,
        }}>Enter your new password below</KText>

        <FormField labelAlign="center" label="Password">
        <KTextInput
            placeholder="Password"
            secureTextEntry={!showPassword}
            error={creds.password.length > 0 ? pwdError : ""}
            value={creds.password}
            onChangeText={password => setCreds({...creds, password})}
            rightComponent={<KIcon name={showPassword ? "eyeOpen" : "eyeClose"} size={"medium"} style={{marginRight: 10, opacity: .5}}/>}
            onRightComponentPress={() => setShowPassword(!showPassword)}
          />
        </FormField>


        <KButton
          text={disabled ? "Password successfully reset" : "Confirm"}
          loading={loading}
          disabled={disabled || !!pwdError}
          style={{width: "100%", marginTop: 40}}
          onPress={resetPassword} />
        </>}

      </View>
      {!isMobile && <View style={{position: "absolute", top: 20, right: 20}}>
            <KText onPress={() => {
                navigation.navigate('Login')
            }}>{"> Back to sign in"}</KText>
        </View>}
    </View>
}