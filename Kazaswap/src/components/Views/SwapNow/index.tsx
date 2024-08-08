import { ScrollView, View } from "react-native"
import KText from "../../KText"
import User1, { Preferences } from "../../forms/user/User1"
import KButton from "../../KButton/KButton"
import { useState } from "react"
import users from "../../../api/users"
import useAuthentication from "../../../hooks/useAuthentication"
import { toastError } from "../../Toast/Toast"
import { Me } from "@kazaswap/common/lib/types/api/auth"
import { Api } from "@kazaswap/common"

type Props = {
    onCancel: () => void,
    onUpdated: (user:Api.ApiResponse<Me>) => void,
    preferences: Preferences,
}

export default (props:Props) => {

    const {user} = useAuthentication()

    const [prefs, setPrefs] = useState<Preferences>(props.preferences)
    const [loading, setLoading] = useState(false)

    const update = () => {
        if(!user) return
        setLoading(true)
        return users.update({
            id: user.id,
            swapLocations: prefs.location ? prefs.location.join("\n") : null,
            dateFrom: prefs.dateFromTo ? prefs.dateFromTo[0] : undefined,
            dateTo: prefs.dateFromTo ? prefs.dateFromTo[1] : undefined,
        })
        .then(props.onUpdated)
        .catch(() => {
            toastError("An error occured while updating your profile")
        })
        .finally(() => {
            setLoading(false)
        })
    }

    return <ScrollView
        style={{
            width: "100%",
        }}
        contentContainerStyle={{
            width: "100%",
            justifyContent: "center",
            alignItems: "center",
        }}>
        <KText style={{fontSize: 30, marginBottom: 20}}>Swap Now</KText>
        <User1 preferences={prefs} onChange={setPrefs} />
        <View style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-evenly",
            width: "100%",
            marginTop: 20,
        }}>
            <KButton text="Cancel" onPress={props.onCancel} color="greenLight" loading={loading} disabled={loading}/>
            <KButton text="Confirm Request" onPress={update} loading={loading} disabled={loading} />
        </View>
    </ScrollView>
}