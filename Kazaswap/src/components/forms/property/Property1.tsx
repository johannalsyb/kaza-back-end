import { Pressable, TextStyle, View } from "react-native"
import FormField from "../../Form/FormField/FormField"
import KTextInput from "../../Form/KTextInput/KTextInput"
import variables from "../../../styles/variables"
import KIcon from "../../KIcon/KIcon"
import { useEffect, useState } from "react"
import KButton from "../../KButton/KButton"
import CheckBox from "../../CheckBox/CheckBox"
import { Property } from "."
import autocomplete from "../../../api/autocomplete"
import MapView from "../../MapView"
import KText from "../../KText"
import KModal from "../../KModal/KModal"

const inputStyles:TextStyle = {
    textAlign: "left",
    height:  variables.button.size.medium.height
}

type Props = {
    onChange?: (property:Property) => void,
    property: Property,
    error?: {
        location?: string
    },
    propertyExtra?: {
        lat: number,
        lng: number,
    }
}

const amenities = [
    // Place
    "Garden",
    "Balcony",
    "Terrace",
    "Ground floor",
    "Rooftop",
    // Temp control
    "Heating",
    "A/C",
    //Kitchen
    "Refrigerator",
    "Coffee machine",
    "Microwave",
    "Oven",
    "Barbecue",
    "Dishwasher",
    // Clothes
    "Iron",
    "Washing machine",
    "Dryer",
    "Closet space",
    // Stuff
    "Crib",
    "Hair dryer",
    "TV",
    "Fireplace",
    "Desk",
    "Wi-fi",
    // Outside
    "Parking spot",
    "Jacuzzi",
    "Swimming pool",
    "Wheelchair accessible",
]

export default (props:Props) => {

    const [property, setProperty] = useState<Property>(props.property);
    const [modal, setModal] = useState<string | null>(null);

    useEffect(() => {
        props.onChange && props.onChange(property)
    }, [property])

    const autocompleteAddress = (address:string) => {
        return autocomplete.address(address)
        .then(res => {
            return res.data.results.map(r => r.description)
        })
        .catch(err => [] as string[])
    }

    return <>
        <FormField label={<KText>
            Where is your place located?
            <Pressable style={{
                // position: "absolute",
                // right: 0,
                marginLeft: 10,
            }} onPress={() => setModal("This information is required to verify your property. However it is private and is only shared with another person that has accepted a swap request with you.")}>
                <KText style={{ width: 20, height: 20, borderWidth: 1, borderColor: variables.colors.borderGray, color: variables.colors.borderGray, borderRadius: 20, textAlign: "center"}}>?</KText>
            </Pressable>
        </KText>} style={{zIndex: 100}}>
            
            <KTextInput
                leftComponent={<KIcon name="location" size="medium" />}
                placeholder="Address"
                value={property.location}
                inputStyles={inputStyles}
                suggestionCallback={autocompleteAddress}
                onChangeText={location => setProperty({...property, location})}
                error={props.error?.location}
                />
        </FormField>

        {props.propertyExtra && 
            <MapView
                lat={props.propertyExtra?.lat}
                lng={props.propertyExtra?.lng}
                points={[props.propertyExtra]}
                zoom={17}
                style={{
                    width: "100%",
                    height: 200,
                    borderRadius: 10,
                    marginBottom: 20,
                }}
                />
        }

        <FormField labelAlign="left" label="What do you want to swap?">
            <View style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
            }}>
                <KButton
                    style={{width:"48%", marginBottom: 10}}
                    color={property.type === "room" ? "primary" : "light"}
                    text="Room"
                    onPress={() => setProperty({...property, type: "room"})}
                    />
                <KButton
                    style={{width:"48%", marginBottom: 10}}
                    color={property.type === "flat" ? "primary" : "light"}
                    text="Flat"
                    onPress={() => setProperty({...property, type: "flat"})}
                    />
                <KButton
                    style={{width:"48%"}}
                    color={property.type === "studio" ? "primary" : "light"}
                    text="Studio"
                    onPress={() => setProperty({...property, type: "studio"})}
                    />
                <KButton
                    style={{width:"48%"}}
                    color={property.type === "house" ? "primary" : "light"}
                    text="House"
                    onPress={() => setProperty({...property, type: "house"})}
                    />
            </View>
        </FormField>

        <FormField labelAlign="left" label="Pets friendly?">
            <View style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
            }}>
                <KButton
                    style={{width:"48%", marginBottom: 10}}
                    color={property.petFriendly ? "primary" : "light"}
                    text="Yes"
                    onPress={() => setProperty({...property, petFriendly: true})}
                    />
                <KButton
                    style={{width:"48%", marginBottom: 10}}
                    color={property.petFriendly !== undefined && !property.petFriendly ? "primary" : "light"}
                    text="No"
                    onPress={() => setProperty({...property, petFriendly: false})}
                    />
            </View>
        </FormField>

        <FormField labelAlign="left" label="Add some amenities (3 minimum)">
            <View style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
            }}>
                {amenities.map((amenity, i) => {
                    return <CheckBox
                        key={i}
                        style={{width:"48%", marginBottom: 20}}
                        name={amenity}
                        checked={property.amenities.includes(amenity)}
                        onPress={() => {
                            const ams = property.amenities.includes(amenity) ?
                                property.amenities.filter(a => a !== amenity)
                                : [...property.amenities, amenity]
                            setProperty({...property, amenities: ams})
                        }}
                        />
                })}
            </View>
        </FormField>

        <KModal
            visible={!!modal}
            setVisibility={(visible) => {setModal(null)}}
            style={{
                padding: 20,
                paddingTop: 40,
                backgroundColor: variables.colors.white,
                borderRadius: 10,
            }}
            >
            <KText>{modal}</KText>
        </KModal>
    </>
}