import { Pressable, TextStyle, View } from "react-native"
import FormField from "../../Form/FormField/FormField"
import variables from "../../../styles/variables"
import { RefObject, createRef, useEffect, useRef, useState } from "react"
import KImageUpload from "../../KImageUpload"
import properties from "../../../api/properties"
import KButton from "../../KButton/KButton"
import KTextInput from "../../Form/KTextInput/KTextInput"
import KModal from "../../KModal/KModal"
import KIcon from "../../KIcon/KIcon"
import autocomplete from "../../../api/autocomplete"
import { toastError, toastWarning } from "../../Toast/Toast"
import KText from "../../KText"
import KDateSelector, {InputHandle as KDateSelectorHandle} from "../../Form/KDateSelector"

type Props = {
    preferences:Preferences,
    onChange: (prefs:Preferences) => void,
}

export type Preferences = {
    location: (string)[] | null | undefined,
    dateFromTo: number[] | null | undefined,
}

export default (props:Props) => {

    const [search, setSearch] = useState<string | undefined>()
    const [prefs, setPrefs] = useState<Preferences>(props.preferences)

    useEffect(() => {
        props.onChange(prefs)
    }, [prefs])

    return <View style={{
            width: "100%",
        }}>
        <FormField label="Where do you want to go?" style={{
            width: "100%",
        }}>
            <View style={{
                display: 'flex',
                flexDirection: 'column',
            }}>
                <KButton
                    style={{width:"100%", marginBottom: 10}}
                    color={prefs.location === undefined ? "light" : (prefs.location === null ? "primary" : "light") }
                    text="I'm flexible, take me anywhere"
                    onPress={() => setPrefs({...prefs, location: null})}
                    />
                <KButton
                    style={{width:"100%"}}
                    color={prefs.location === undefined ? "light" : (!!prefs.location ? "primary" : "light")}
                    text="I have specific places in mind"
                    onPress={() => setPrefs({...prefs, location: []})}
                    />
            </View>
        </FormField>
        {prefs.location &&
            <View style={{
                width: "100%",
                marginBottom: 10,
            }}>
                {prefs.location.map((loc, i) => {
                    if(loc) return <KTextInput
                        leftComponent={<KIcon name="location" size="medium" />}
                        rightComponent={<KIcon name="minusCircle" size="medium" style={{stroke: variables.colors.grey}} />}
                        onRightComponentPress={() => setPrefs({...prefs, location: prefs.location?.filter((_, j) => j !== i)})}
                        value={loc}
                        editable={false}
                        topStyle={{marginTop: 5}}
                        inputStyles={{
                            height: variables.button.size.xsmall.height,
                            textAlign: "left",
                        }}
                        />
                })}
                <KButton
                    color="greenLight"
                    onPress={() => setSearch("")}
                    style={{
                        flexDirection: 'row',
                        width: "100%",
                        height: variables.button.size.xsmall.height,
                        marginTop: 10,
                        marginBottom: 10,
                        display: prefs.location.length >= 3 ? 'none' : 'flex',
                    }}>
                        <KIcon
                            name="plusCircle"
                            size="medium"
                            style={{
                                stroke: variables.colors.borderGray,
                                marginRight: 10,
                            }} />
                        <KText>Add one</KText>
                </KButton>
            </View>
        }

        <FormField label="When would you like to go?" style={{
            width: "100%",
        }}>
            <View style={{
                display: 'flex',
                flexDirection: 'column',
            }}>
                <KButton
                    style={{width:"100%", marginBottom: 10}}
                    color={prefs.dateFromTo === undefined ? "light" : (prefs.dateFromTo === null ? "primary" : "light") }
                    text="I'm flexible on dates"
                    onPress={() => setPrefs({...prefs, dateFromTo: null})}
                    />
                <KButton
                    style={{width:"100%"}}
                    color={prefs.dateFromTo === undefined ? "light" : (prefs.dateFromTo !== null ? "primary" : "light")}
                    text="I have specific dates in mind"
                    onPress={() => setPrefs({...prefs, dateFromTo: [Date.now(), Date.now()+(7*24*3600*1000)]})}
                    />
            </View>
        </FormField>
        {prefs.dateFromTo &&
            <View style={{
                width: "100%",
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
            }}>
                <FormField label="Starting date" style={{
                    flex: 1,
                    marginRight: 10,
                }}>
                    <KDateSelector
                        date={prefs.dateFromTo[0]}
                        minDate={Date.now()}
                        onChange={t => setPrefs({...prefs, dateFromTo: [t, prefs.dateFromTo![1]]})}/>
                </FormField>
                <FormField label="Ending date" style={{
                    flex: 1,
                }}>
                    <KDateSelector
                        date={prefs.dateFromTo[1]}
                        minDate={prefs.dateFromTo[0]}
                        onChange={t => setPrefs({...prefs, dateFromTo: [prefs.dateFromTo![0], t]})}/>
                </FormField>
            </View>
        }

        <KModal
            visible={search !== undefined}
            setVisibility={(visible) => setSearch(undefined)}
            showCross={false}
            >
                <View style={{
                    padding: 5,
                    width: "100%",
                    height: "90%"
                    // display: 'flex',
                    // alignItems: 'flex-start',
                    // justifyContent: 'flex-start',
                }}>
                <KTextInput
                    inputStyles={{textAlign: "left"}}
                    leftComponent={<KIcon name="search" size="medium" />}
                    suggestionCallback={async (query) => {
                        return autocomplete.zone(query)
                        .then(res => {
                            const results = res.data.results.map(r => r.description)
                            if(results.length === 0) toastWarning("No results found")
                            return results
                        })
                        .catch(err => {
                            toastError("An error occured while searching for your location")
                            return []
                        })
                    }}
                    onSuggestionSelected={(loc) => {
                        setPrefs({...prefs, location: [...(prefs.location || []), loc]})
                        setSearch(undefined)
                    }}
                    />

            </View>
            
        </KModal>
    </View>
}