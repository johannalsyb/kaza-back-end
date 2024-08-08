import { View } from "react-native"
import KButton from "../../components/KButton/KButton"
import { Property } from "../../components/forms/property"
import Property3 from "../../components/forms/property/Property3"
import properties from "../../api/properties"
import { toastError } from "../../components/Toast/Toast"

type Props = {
    onPrev: () => void,
    onNext: () => void,
    onChange: (property:Property) => void,
    property: Property,
}

export default (props:Props) => {
    return <>
        <Property3 property={props.property} onChange={props.onChange} />
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
                // loading={loading}
                // disabled={loading || Object.keys(error).length > 0}
                onPress={props.onPrev}
                color="greenLight"
                style={{width: "48%"}}/>

            <KButton
                text="Next Step"
                // loading={loading}
                disabled={props.property.pics.length < 3}
                onPress={() => {
                    if(props.property.primaryImage) {
                        properties.update({
                            id: props.property.id,
                            primaryImage: props.property.primaryImage
                        }).then(p => {
                            props.onChange({...props.property, id: p.data.id})
                            props.onNext()
                        }).catch(() => {
                            toastError("An error occured while updating your property")
                        })
                    }
                    props.onNext()
                }}
                color="primary"
                style={{width: "48%"}}/>
        </View>
        <View style={{height: 10}} />
    </>
}