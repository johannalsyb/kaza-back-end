import { View } from "react-native"
import KButton from "../../components/KButton/KButton"
import { Property } from "../../components/forms/property"
import Property2 from "../../components/forms/property/Property2"
import { useState } from "react"
import properties from "../../api/properties"
import { toastError } from "../../components/Toast/Toast"
import users from "../../api/users"
import Api from "@kazaswap/common/lib/types/api"

type Props = {
    onPrev: () => void,
    onNext: () => void,
    onChange: (property:Property) => void,
    property: Property,
}

const isValid = (property:Property) => {
    if(property.size <= 0) return false
    if(property.bedrooms < 0) return false
    return true
}

export default (props:Props) => {

    const [loading, setLoading] = useState(false)

    const createOrUpdate = () => {
        setLoading(true)
        properties.ofUser("me")
        //@ts-ignore
        .then(({data}) => {
            const pdata:Partial<Api.Properties.PrivateProperty> = {
                name: `${props.property.type.capitalizeFirst()} ${props.property.location? `in ${props.property.location.split(",").slice(-2).join(",")}` : ""}`,
                id: data.length === 0 ? undefined : data[0].id,
                type: props.property.type,
                sizeM2: props.property.size,
                address: props.property.location,
                amenities: props.property.amenities.join(","),
                pets: props.property.petFriendly,
                beds: props.property.beds,
                bedrooms: props.property.bedrooms,
                bathrooms: props.property.bathrooms,
                bedArrangements: JSON.stringify(props.property.bedroomsBeds),
                // images: string | string[]
                // primaryImage: string
                // description: "",
                // flatmates: number
                // country: string
                // region: string | null
                // city: string
            }
            return data.length === 0 ? properties.create(pdata) : properties.update(pdata)
        })
        .then(p => {
            //@ts-ignore
            props.onChange({...props.property, id: p.data.id})
            props.onNext()
        }).catch(e => {
            if(e.code === 406) {
                // This is if the property address is not accurate enough
            }
            toastError("An error occured while creating your property")
        }).finally(() => {
            setLoading(false)
        })
    }


    return <>
        <Property2 property={props.property} onChange={props.onChange} />
        <View style={{flex: 1}} />
        <View style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            width: "100%",
            marginTop: 40,
            marginBottom: 20,
            alignItems: "flex-end",
            flex:1
        }}>
            <KButton
                text="Back"
                loading={loading}
                disabled={loading}
                onPress={props.onPrev}
                color="greenLight"
                style={{width: "48%"}}/>

            <KButton
                text="Next Step"
                loading={loading}
                disabled={loading || !isValid(props.property)}
                onPress={createOrUpdate}
                color="primary"
                style={{width: "48%"}}/>
        </View>
        <View style={{height: 10}} />
    </>
}