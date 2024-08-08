import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { NavStackParamList } from "../../navigation/screens";
import KText from "../../components/KText";
import { useEffect, useState } from "react";
import auth from "../../api/auth";
import { toastSuccess } from "../../components/Toast/Toast";
import { ActivityIndicator } from "react-native";
import variables from "../../styles/variables";
import useAuthentication from "../../hooks/useAuthentication";

type Props = NativeStackScreenProps<NavStackParamList, 'Verify'>;

export default (props:Props) => {
    const {type, token} = props.route.params
    const {user, check} = useAuthentication()
    const [loading, setLoading] = useState<boolean>(true)
    const [message, setMessage] = useState<string>("Verifying...")
    useEffect(() => {
        if(!token || !token.length) setMessage("Invalid request, please try again.")
        else {
            setLoading(true)
            auth.verify({token})
            .then(s => {
                const promise = user ? check() : Promise.resolve()
                return promise
            })
            .then(() => {
                const msg = `${type.capitalizeFirst()} verified successfully`
                setMessage(msg)
                toastSuccess(msg)
                props.navigation.navigate("Home")
            })
            .catch(e => {
                setMessage("Invalid request, please try again.")
            })
            .finally(() => setLoading(false))
        }
    }, [type, token])
    
    return <KText
        style={{
            display: "flex",
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            flexDirection: "column",
        }}>
        {loading && <ActivityIndicator color={variables.colors.yellow} size="large"/>}
        {message}
    </KText>
}