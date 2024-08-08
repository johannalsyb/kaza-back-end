import { Pressable, ScrollView, TextStyle, View } from "react-native"
import KButton from "../../KButton/KButton"
import variables from "../../../styles/variables"
import KText from "../../KText"
import KIcon from "../../KIcon/KIcon"
import KTextInput from "../KTextInput/KTextInput"
import { createRef, forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react"
import KModal from "../../KModal/KModal"
import { Phone } from "../../forms/auth/Register"
import Selector from "./Selector"

type Country = {
    name: string
    dial_code: string
    code: string
}

const inputStyles:TextStyle = {
    textAlign: "left",
    height: variables.button.size.medium.height
}

type Props = {
    date: number | Date
    minDate?: number | Date
    maxDate?: number | Date
    onChange: (date:number) => void
}

export type InputProps = {
    date: number | Date
    minDate?: number | Date
    maxDate?: number | Date
    onChange: (date:number) => void
}
export type InputHandle = {
    open: () => void
}
export default forwardRef<InputHandle, Props>((props, ref) => {
    const [modalVisible, setModalVisible] = useState(false)
    const dateRef = useRef<InputHandle>(null)
    useImperativeHandle(ref, () => ({
        open: () => dateRef.current?.open()
    }))
    const dd = typeof props.date === "number" ? new Date(props.date) : props.date
    return <View
        style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            width: '100%',
        }}>
        <Pressable onPress={() => {
            dateRef.current?.open()
        }} style={{width: "100%"}}>
            <KTextInput
                topStyle={{width: "100%"}}
                editable={false}
                // errorText={number.length && !isPhoneValid(code+number) ? "Invalid phone number" : ""}
                // keyboardType="phone-pad"
                // placeholder="Phone number"
                inputStyles={{...inputStyles}}
                value={dd.toLocaleDateString()}
                // onChangeText={setNumber}
                rightComponent={<KIcon name="down" size="medium" />}
                onRightComponentPress={() => dateRef.current?.open()}
                />
            <Selector
                ref={dateRef}
                date={props.date}
                minDate={props.minDate}
                maxDate={props.maxDate}
                onChange={props.onChange}/>
        </Pressable>

        <KModal
            visible={modalVisible}
            setVisibility={(visible) => setModalVisible(visible)}>
                {null}
            {/* <ScrollView
                style={{
                    // width: "90%",
                    marginTop: 10,
                    marginBottom: 10,
                    // backgroundColor: "white",
                }}>
                    {countries.map((country, i) => <KText
                        key={country.code}
                        style={{
                            padding: 10,
                            borderTopWidth: i === 0 ? 0 : 1,
                            borderTopColor: variables.colors.borderGray,
                        }}
                        onPress={() => {
                            setCode(country.dial_code)
                            setModalVisible(false)
                        }}
                        >
                            {country.name} ({country.dial_code})
                        </KText>)}
            </ScrollView> */}
        </KModal>
    </View>
})