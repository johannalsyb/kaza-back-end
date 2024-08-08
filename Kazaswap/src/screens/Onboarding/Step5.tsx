import { View } from "react-native"
import KButton from "../../components/KButton/KButton"
import { useEffect, useState } from "react"
import User1, { Preferences } from "../../components/forms/user/User1"
import users from "../../api/users"
import useAuthentication from "../../hooks/useAuthentication"
import { toastError } from "../../components/Toast/Toast"

type Props = {
    onPrev: () => void,
    onNext: () => void,
    onChange: (prefs:Preferences) => void,
    preferences?: Preferences,
}

export default (props:Props) => {
    const {user} = useAuthentication()
    const [loading, setLoading] = useState(false)
    const [prefs, setPrefs] = useState<Preferences>(props.preferences || {
        location: undefined,
        dateFromTo: undefined,
    })

    useEffect(() => {
        props.onChange(prefs)
    }, [prefs])

    const isValid = (prefs.dateFromTo === null || (Array.isArray(prefs.dateFromTo) && prefs.dateFromTo[0] < prefs.dateFromTo[1])) &&
        prefs.location === null || (Array.isArray(prefs.location) && prefs.location.length > 0)

    const updateUser = () => {
        if(!user) return
        setLoading(true)
        return users.update({
            id: user.id,
            swapLocations: prefs.location ? prefs.location.join("\n") : null,
            dateTo: prefs.dateFromTo ? prefs.dateFromTo[1] : undefined,
            dateFrom: prefs.dateFromTo ? prefs.dateFromTo[0] : undefined,
        })
        .then(() => props.onNext())
        .catch(() => {
            toastError("An error occured while updating your profile")
        })
        .finally(() => {
            setLoading(false)
        })
    }

    return <>
        <User1 onChange={setPrefs} preferences={prefs}/>
        <View style={{flex: 1}} />
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
                loading={loading}
                disabled={loading}
                onPress={props.onPrev}
                color="greenLight"
                style={{width: "48%"}}/>

            <KButton
                text="Next"
                loading={loading}
                disabled={loading || !isValid}
                onPress={updateUser}
                color="primary"
                style={{width: "48%"}}/>
        </View>
        <View style={{height: 10}} />
    </>
}