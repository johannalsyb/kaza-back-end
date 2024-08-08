import { ScrollView, View, ViewStyle } from "react-native"
import { Creds } from "../../forms/auth/Register"
import ExtendedUser from "../../forms/auth/ExtendedUser"
import KButton from "../../KButton/KButton"
import { useEffect, useState } from "react"
import users from "../../../api/users"
import { Me } from "@kazaswap/common/lib/types/api/auth"
import Api from "@kazaswap/common/lib/types/api"
import { toastError } from "../../Toast/Toast"
import useAuthentication from "../../../hooks/useAuthentication"

type Props = {
    creds:Creds,
    style?: ViewStyle,
    onChange: (creds:Creds) => void,
    onClose?: () => void,
    onUpdated: (u?: Api.ApiResponse<Me>) => void,
}

export default (props:Props) => {

    const [creds, setCreds] = useState<Creds>(props.creds)

    useEffect(() => {
        if(props.creds) setCreds(props.creds)
    }, [props.creds])

    const {updateUser} = useAuthentication()

    const [loading, setLoading] = useState(false)
    const [imageLoading, setImageLoading] = useState(false)
    const update = () => {
        setLoading(true)
        users.update({
            ...creds,
            email: creds.email === props.creds.email || creds.email === "" ? undefined : creds.email,
            phone: `${creds.phone.code}${creds.phone.number}`,
        })
        .then(props.onUpdated)
        .catch(err => {
            const msg = err.json?.data?.error as unknown as string
            toastError(msg || "An error occured while updating your profile")
        })
        .finally(() => {
            setLoading(false)
        })
    }

    useEffect(() => {
        if(creds.image && creds.image.startsWith("data:image/")) {
            setImageLoading(true)
            users.me.postPictures([creds.image.split(",")[1]])
            .then(({data: {images}}) => {
                const nc = {
                    ...creds,
                    image: images[0],
                    primaryImage: images[0],
                }
                setCreds && setCreds(nc)
                updateUser({primaryImage: images[0]})
            })
            .catch(() => {
                toastError("An error occured while uploading your image, please try again later")
            })
            .finally(() => {
                setImageLoading(false)
            })
        }
    }, [creds.image])

    return <ScrollView style={props.style}>
        <ExtendedUser creds={creds} error={{}} onChange={setCreds} imageLoading={imageLoading} onRotationSaved={d => {
            setImageLoading(true)
            return users.me.rotatePicture(d)
            .then(({data: {images}}) => {
                const nc = {
                    ...creds,
                    image: images[0],
                    primaryImage: images[0],
                }
                setCreds && setCreds(nc)
                updateUser({primaryImage: images[0]})
                props.onUpdated && props.onUpdated()
            })
            .catch(() => {
                toastError("An error occured while rotating your image, please try again later")
            })
            .finally(() => {
                setImageLoading(false)
            })
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
                color="greenLight"
                text="Cancel"
                disabled={loading}
                onPress={() => props.onClose && props.onClose()}
                />
            <KButton
                text="Save Changes"
                loading={loading}
                disabled={loading}
                onPress={update}
                />
        </View>
    </ScrollView>
}