import User from "@kazaswap/common/lib/types/User"
import KSideModal from "../../components/KModal/KSideModal"
import ExtendedUser from "../../components/forms/auth/ExtendedUser"
import { ScrollView, View } from "react-native"
import { Phone } from "../../components/forms/auth/Register"
import { getPictureUrl } from "../../utils/pictures"
import useConfig from "../../hooks/useConfig"
import PropertyModal from "./PropertyModal"
import Property from "@kazaswap/common/lib/types/Property"
import { useEffect, useState } from "react"
import KButton from "../../components/KButton/KButton"
import properties from "../../api/properties"
import admin from "../../api/admin"
import KText from "../../components/KText"
import users from "../../api/users"
import { toastSuccess } from "../../components/Toast/Toast"
import variables from "../../styles/variables"

export default (props:{
    user:{user: User, phone:Phone} | undefined,
    hidePropertiesButton?: boolean
    onClose:() => void
    onDeleted?: () => void
}) => {
    const config = useConfig()
    const [property, setProperty] = useState<Property | undefined>()

    const [properties, setProperties] = useState<Property[]>()
    const [imageLoading, setImageLoading] = useState(false)

    const loadProperties = () => {
        if(!props.user) return
        admin.properties.get({filter: JSON.stringify({owner: props.user.user.id})})
        .then(d => {
            setProperties(d.data)
        })
    }

    useEffect(() => {
        loadProperties()
    }, [props.user])

    return <KSideModal visible={!!props.user} onClose={props.onClose}>
    <ScrollView style={{padding: 5}}>

        <View style={{width: "100%", borderBottomWidth: 1, marginVertical: 5}}><KText>ADMIN</KText></View>

        {!props.hidePropertiesButton && <KButton
            style={{width: "100%", marginBottom: 5}}
            disabled={!properties?.length}
            text={`Show properties (${properties?.length })`}
                onPress={() => {
                if(!properties) return
                if(!properties.length) return
                setProperty(properties[0])
            }} />}

        <KButton
            style={{width: "100%", marginBottom: 5, backgroundColor: "red"}}
            textStyle={{color: "white"}}
            disabled={!!properties?.length}
            text={!!properties?.length ? "Must delete properties first" : "!!!!! Delete User !!!!!"}
            onPress={() => {
                admin.users.delete(props.user!.user.id)
                .then(d => props.onDeleted && props.onDeleted())
            }} />

        <KButton
            style={{width: "100%", marginBottom: 5, backgroundColor: variables.colors.green}}
            textStyle={{color: "white"}}
            disabled={false}
            text={"Show Matches"}
            onPress={() => {

            }} />


        <View style={{width: "100%", borderBottomWidth: 1, marginVertical: 5}}><KText>EDIT USER</KText></View>

        {props.user ? <ExtendedUser 
            creds={{
                firstName: props.user.user.firstName,
                gender: props.user.user.gender,
                email: props.user.user.email,
                password: "",
                phone: props.user.phone,
                image: getPictureUrl(config, props.user.user.id, props.user.user.primaryImage, "users", false) || undefined
            }}
            error={{}}
            onChange={(creds) => {}}
            imageLoading={imageLoading}
            onRotationSaved={async (d) => {
                users.rotatePicture(props.user!.user.id, d)
                .then(() => toastSuccess("Image rotated"))
                .catch(() => toastSuccess("An error occured while rotating the image"))
            }}
            /> : null}
    </ScrollView>

    {property && <PropertyModal
        property={property}
        hideOwnerButton={true}
        onClose={() => setProperty(undefined)}
        onDeleted={() => {
            loadProperties()
            setProperty(undefined)
        }} />}
</KSideModal>
}