import { TextStyle, View } from "react-native"
import FormField from "../../Form/FormField/FormField"
import KTextInput from "../../Form/KTextInput/KTextInput"
import variables from "../../../styles/variables"
import KIcon from "../../KIcon/KIcon"
import { useEffect, useState } from "react"
import KButton from "../../KButton/KButton"
import CheckBox from "../../CheckBox/CheckBox"
import { Property } from "."
import KText from "../../KText"
import KNumberInput from "../../Form/KNumberInput/KNumberInput"

const inputStyles:TextStyle = {
    textAlign: "left",
    height:  variables.button.size.medium.height
}

type Props = {
    onChange: (property:Property) => void,
    property: Property,
}

export default (props:Props) => {
    return <>
        <FormField label="How big is your space?">
            <KTextInput
                leftComponent={<KIcon name="sqm2" size="medium" />}
                rightComponent={<KText>m²</KText>}
                placeholder="Size"
                value={props.property.size ? props.property.size+"" : ""}
                keyboardType="numeric"
                inputMode="decimal"
                onChangeText={size => {
                    if(size === "") return props.onChange({...props.property, size: 0})
                    const nb = parseInt(size);
                    if(isNaN(nb)) return;
                    if(nb < 0) return;
                    if(nb > 10000) return;
                    props.onChange({...props.property, size: nb})
                }}
                inputStyles={inputStyles} />
        </FormField>

        <FormField labelAlign="left" label="How many bedroom(s)?">
            <KNumberInput
                inputStyles={inputStyles}
                topStyle={inputStyles}
                min={0}
                max={20}
                value={props.property.bedrooms+""}
                onChange={n => props.onChange({...props.property, bedrooms: n as number})}/>
        </FormField>

        <FormField labelAlign="left" label="How many beds?">
            {new Array(props.property.bedrooms).fill(undefined).map((bedroom, i) => {
                if(props.property.bedroomsBeds.length < i+1) props.property.bedroomsBeds.push({single: 0, double: 0})
                const bb = props.property.bedroomsBeds[i]
                return <View key={`br_${i}`}>
                    <KText>Room {i+1}</KText>
                    <View style={{
                        display: "flex",
                        flexDirection: "row",
                        justifyContent: "space-between",
                        width: "100%",
                    }}>
                        <FormField labelAlign="left" label="Single" style={{flex: 1, marginRight: 10}}>
                            <KNumberInput
                                inputStyles={inputStyles}
                                topStyle={inputStyles}
                                min={0}
                                max={20}
                                value={bb.single+""}
                                onChange={n => {
                                    bb.single = n as number
                                    props.onChange({
                                        ...props.property,
                                        bedroomsBeds: [...props.property.bedroomsBeds]
                                    })
                                }}/>
                        </FormField>

                        <FormField labelAlign="left" label="Double" style={{flex: 1}}>
                            <KNumberInput
                                inputStyles={inputStyles}
                                topStyle={inputStyles}
                                min={0}
                                max={20}
                                value={bb.double+""}
                                onChange={n => {
                                    bb.double = n as number
                                    props.onChange({
                                        ...props.property,
                                        bedroomsBeds: [...props.property.bedroomsBeds]
                                    })
                                }}/>
                        </FormField>
                    </View>
                </View>})}
        </FormField>

        <FormField labelAlign="left" label="How many bathroom(s)?">
        <KNumberInput
                inputStyles={inputStyles}
                topStyle={inputStyles}
                min={0}
                max={20}
                value={props.property.bathrooms+""}
                onChange={n => props.onChange({...props.property, bathrooms: n as number})}/>
        </FormField>

    </>
}