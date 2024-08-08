import { Modal, ScrollView, TextInput, TextStyle, View } from "react-native"
import KButton from "../../KButton/KButton"
import variables from "../../../styles/variables"
import KText from "../../KText"
import KIcon from "../../KIcon/KIcon"
import KTextInput from "../KTextInput/KTextInput"
import { useEffect, useRef, useState } from "react"
import KModal from "../../KModal/KModal"
import { Phone } from "../../forms/auth/Register"
import { Countries, getCountries, isPhoneValid } from "../../../utils/phone"
import useIsMobile from "../../../hooks/useIsMobile"
import Dropdown from "../../Dropdown/Dropdown"

const inputStyles:TextStyle = {
    textAlign: "left",
    height: variables.button.size.medium.height
}

type Props = {
    phone?: Phone
    onChange: (phone:Partial<Phone>) => void
}

export default (props:Props) => {
    const {isMobile} = useIsMobile()
    const [modalVisible, setModalVisible] = useState(false)
    const [code, setCode] = useState(props.phone?.code || "+1")
    const [number, setNumber] = useState(props.phone?.number || "")
    const [countries, setCountries] = useState<Countries>({})
    const [countrySearch, setCountrySearch] = useState("")
    const [selectedIndex, setSelectedIndex] = useState(-1)

    const modalSearchInput = useRef<TextInput>(null)
    const modalRef = useRef<View>(null)

    useEffect(() => {
        if(!Object.keys(countries).length) {
            getCountries()
            .then(c => {
                setCountries(c)
                const index = Object.keys(c).findIndex(code => code === props.phone?.code)
                setSelectedIndex(index)
            })
        }
    }, [])

    useEffect(() => {
        if(code !== undefined && number !== undefined) props.onChange({code, number})
    }, [code, number])

    return <View style={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
    }}>
        <View style={{width: "30%"}}>
        {isMobile ? <KButton
            style={{width:"100%", display: 'flex', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingLeft:10, paddingRight: 10}}
            color={"light"}
            onPress={() => setModalVisible(true)}
            >
                <KText>{code}</KText>
                <KIcon name="down" size="medium" />
            </KButton> : (Object.keys(countries).length && selectedIndex >= 0 ? <Dropdown
                showSearch={true}
                textStyle={{color: "black", fontSize: 13}}
                onChange={([i]) => {
                    const code = i.lastIndexOf("(") > 0 ? i.substring(i.lastIndexOf("(")+1).replace(")", "") : i
                    setCode(code)
                }}
                iconStyle={{color: "black"}}
                selectedIndex={selectedIndex}
                dropdownStyle={{width: 300, zIndex: 10, borderRadius: 30, maxHeight: 300, display: "flex", overflow: "scroll", padding: 5}}
                style={{width: "100%", height: 46, borderRadius: 30, backgroundColor: "white", borderWidth:1, borderColor: variables.colors.borderGray, zIndex: 1,}}
                items={Object.entries(countries).map(([code, cc]) => `${cc.join(", ")} (${code})`)} /> : null)}
        </View>
        <KTextInput
            topStyle={{width: "65%"}}
            error={number.length && !isPhoneValid(code, number) ? "Invalid phone number" : ""}
            keyboardType="phone-pad"
            placeholder="Phone number"
            inputStyles={{...inputStyles}}
            value={number}
            onChangeText={setNumber}
            />

        {isMobile ? <KModal
            ref={modalRef}
            visible={modalVisible}
            setVisibility={(visible) => setModalVisible(visible)}
            style={{justifyContent: "center", alignItems: "flex-start", backgroundColor: "white", top: 0}}
            onLayout={() => {
                // @ts-ignore
                modalRef.current?.addEventListener('touchmove', (e) => {
                    e.preventDefault();
                });
            }}
            >
            
            <KTextInput
                ref={modalSearchInput}
                value={countrySearch}
                onChangeText={setCountrySearch}
                onLayout={() => {
                    if(modalSearchInput.current) modalSearchInput.current.focus()
                }}
                topStyle={{marginTop: 10, display: "flex", flexDirection: "row", alignItems: "center", width: "90%", marginLeft: 5}}
                inputStyles={{textAlign: "left", width: "90%", fontSize: 16}}
                leftComponent={<KIcon name="search" size="medium" />}
                placeholder="Search for country"
                focusable={true}
                />
            <ScrollView
                contentContainerStyle={{
                    width: "100%",
                }}
                style={{
                    // width: "90%",
                    width: "100%",
                    marginBottom: 10,
                    // backgroundColor: "white",
                }}>
                    {Object.entries(countries).filter(([code, c]) => c.join(",").toLowerCase().includes(countrySearch.toLowerCase())).map(([code, cc], i) => <KText
                        key={code}
                        style={{
                            padding: 10,
                            paddingHorizontal: 20,
                            borderTopWidth: i === 0 ? 0 : 1,
                            borderTopColor: variables.colors.xxLightGray,
                        }}
                        onPress={() => {
                            setCode(code)
                            setModalVisible(false)
                        }}
                        >
                            {cc.join(", ")} ({code})
                        </KText>)}
            </ScrollView>
        </KModal> : null}
    </View>
}