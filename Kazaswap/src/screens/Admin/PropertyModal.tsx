import Property from "@kazaswap/common/lib/types/Property"
import KSideModal from "../../components/KModal/KSideModal"
import KText from "../../components/KText"
import { useState } from "react"
import KSlider from "../../components/KSlider/KSlider"
import { update } from "./Properties"
import { ScrollView, View } from "react-native"
import KButton from "../../components/KButton/KButton"
import EditProperty from "../../components/Views/Account/EditProperty"
import UserModal from "./UserModal"
import User from "@kazaswap/common/lib/types/User"
import { Phone } from "../../components/forms/auth/Register"
import users from "../../api/users"
import { parsePhone } from "../../utils/phone"
import admin from "../../api/admin"

export const AttractivenessView = (p:{
    property: Property,
    showText?: boolean,
}) => {
    const [att, setAtt] = useState(p.property.attractiveness)
    return <>
        {p.showText && <KText>Attractiveness ({att}): </KText>}
        <KSlider min={0} max={10} value={p.property.attractiveness} onChange={v => {
            setAtt(v)
            update({id:p.property.id, attractiveness:v})
        }}/>
    </>
}

export default (props:{
    property:Property
    hideOwnerButton?: boolean
    onClose:() => void
    onDeleted?: () => void
}) => {

    const [user, setUser] = useState<{user: User, phone:Phone} | undefined>()

    return <KSideModal visible={!!props.property} onClose={props.onClose}>
        <ScrollView style={{padding: 10}}>
            {props.property && <>
                <View style={{width: "100%", borderBottomWidth: 1, marginVertical: 5}}><KText>ADMIN</KText></View>
                <AttractivenessView property={props.property} showText={true} />
                {!props.hideOwnerButton && <KButton style={{width: "100%", marginBottom: 5}} text="Show owner" onPress={() => {
                    admin.users.get({filter: JSON.stringify({id: props.property.owner})})
                    .then(d => {
                        if(!d.data.length) return
                        return Promise.all([d.data[0]!, parsePhone(d.data[0]!.phone)])
                    })
                    .then(dd => setUser({user:dd![0], phone:dd![1]!}))

                }} />}

                <KButton
                    style={{width: "100%", marginBottom: 5, backgroundColor: "red"}}
                    textStyle={{color: "white"}}
                    text="!!!!! Delete property !!!!!"
                    onPress={() => {
                        admin.properties.delete(props.property.id)
                        .then(() => props.onDeleted && props.onDeleted())
                    }} />
                <View style={{width: "100%", borderBottomWidth: 1, marginVertical: 5}}><KText>EDIT PROPERTY</KText></View>
                <EditProperty property={{
                    location: props.property.address,
                    type: props.property.type,
                    amenities: props.property.amenities.split(",").filter(f => f.length),
                    size: props.property.sizeM2,
                    bathrooms: props.property.bathrooms,
                    bedrooms: props.property.bedrooms,
                    beds: props.property.beds,
                    bedroomsBeds: JSON.parse(props.property.bedArrangements),
                    pics: props.property.images.split(",").filter(f => f.length),
                    id: props.property.id,
                    petFriendly: props.property.pets,
                    childrenAllowed: !!props.property.childrenAllowed,
                    smokingAllowed: !!props.property.smokingAllowed,
                    private: props.property.private,
                    lat: props.property.lat,
                    lon: props.property.lon,
                }}
                verified={props.property.verified}
                onUpdated={() => {}}
                />
            </>}
        </ScrollView>

        <UserModal user={user} onClose={() => setUser(undefined)} hidePropertiesButton={true}/>
    </KSideModal>
}