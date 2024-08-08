import { View } from "react-native"
import KButton from "../../components/KButton/KButton"
import { useEffect, useState } from "react"
import User1, { Preferences } from "../../components/forms/user/User1"
import users from "../../api/users"
import useAuthentication from "../../hooks/useAuthentication"
import { toastError } from "../../components/Toast/Toast"
import RegistrationFee from "../../components/Payment/RegistrationFee"

type Props = {
    onPrev: () => void,
    onNext: () => void,
    // onChange: (prefs:Preferences) => void,
    // preferences?: Preferences,
}

export default (props:Props) => {
    const {user} = useAuthentication()

    return <>
        <View style={{}} />
            <RegistrationFee onSuccess={() => {
                props.onNext()
            }}/>
            <View style={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
                width: "100%",
                marginTop: 20,
                marginBottom: 20
            }}>
                <KButton
                    text="Back"
                    // loading={loading}
                    // disabled={loading}
                    onPress={props.onPrev}
                    color="greenLight"
                    style={{width: "48%"}}/>
            </View>
        <View style={{height: 10}} />
    </>
}