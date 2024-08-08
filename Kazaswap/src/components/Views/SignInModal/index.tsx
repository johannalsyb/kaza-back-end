import { View } from "react-native"
import KText from "../../KText"
import User1, { Preferences } from "../../forms/user/User1"
import KButton from "../../KButton/KButton"
import { useState } from "react"
import users from "../../../api/users"
import useAuthentication from "../../../hooks/useAuthentication"
import { toastError } from "../../Toast/Toast"
import { Me } from "@kazaswap/common/lib/types/api/auth"
import { Api } from "@kazaswap/common"
import { useNavigation } from "@react-navigation/native"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { NavStackParamList } from "../../../navigation/screens"

type Props = {
    onSelected: (string: "login" | "register") => void
}

export default (props:Props) => {
    const navigation = useNavigation<NativeStackNavigationProp<NavStackParamList, "Login", undefined>>()

    return <>
        <KText style={{fontSize: 30, marginBottom: 20, marginTop: 20}}>You are not signed in</KText>
        <KText style={{
            textAlign: "center",
        }}>You cannot make a swap request</KText>
        <KText style={{
            textAlign: "center",
            marginBottom: 10
        }}>because you haven't registered your place yet.</KText>
        <View style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-evenly",
            width: "100%",
            marginTop: 20,
        }}>
            <KButton text="Sign in" color="light" onPress={() => {
                navigation.navigate('Login')
                props.onSelected("login")
            }} style={{borderColor: "white"}}/>
            <KButton text="Register" color="primary" onPress={() => {
                navigation.navigate('SignUp')
                props.onSelected("register")
            }}/>    
        </View>
    </>
}