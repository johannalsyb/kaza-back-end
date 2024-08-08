import { TextInput, TextInputProps, TextStyle, View, ViewStyle } from "react-native"
import KText from "../KText"
import KNumberInput from "../Form/KNumberInput/KNumberInput"
import KButton from "../KButton/KButton"
import variables from "../../styles/variables"
import React, { LegacyRef } from "react"
import users from "../../api/users"
import auth from "../../api/auth"
import { toastError } from "../Toast/Toast"

const style:TextStyle = {
    borderWidth: 1,
    borderColor: variables.colors.grey,
    width: 40,
    height: 40,
    padding: 5,
    backgroundColor: 'white',
    borderRadius: 15,
    textAlign: 'center',
    fontSize: 20,
    marginLeft: 5,
    marginRight: 5,
}

const codeLength = 6

export default (props:{
    onVerified: () => void
}) => {

    const [state, setState] = React.useState<{
        code: string[]
    }>({
        code: Array(codeLength).fill(''),
    })

    const [resendDisabledFor, setResendDisabledFor] = React.useState<number>(20)
    const [loading, setLoading] = React.useState<boolean>(false)

    const refs = Array(codeLength).fill(null).map(() => React.createRef<TextInput>())

    React.useEffect(() => {
        refs[0].current?.focus()
    }, [])

    React.useEffect(() => {
        const code = state.code.join('')
        if(code.length === codeLength) {
            verify()
        } else {
            refs[code.length]?.current?.focus()
        }
    }, [state.code])

    React.useEffect(() => {
        const interval = setInterval((n) => {
            if(n === 0) {
                clearInterval(interval)
                return
            }
            setResendDisabledFor(n-1)
        }, 1000, resendDisabledFor)
        return () => clearInterval(interval)
    }, [resendDisabledFor])

    const resend = () => {
        if(resendDisabledFor > 0) return
        setLoading(true)
        users.me.requestVerify('phone')
        .then(() => {
            setResendDisabledFor(20)
            console.log('resend success')
        })
        .catch(() => {
            console.log('resend failed')
        })
        .finally(() => setLoading(false))
    }

    const verify = () => {
        setLoading(true)
        auth.verify({code: state.code.join("")})
        .then(() => {
            props.onVerified()
        })
        .catch(() => {
            toastError("Invalid code")
        })
        .finally(() => setLoading(false))
    }

    return (<View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        display: 'flex',
        flexDirection: 'column',
    }}>
        <KText style={{fontSize: 25, fontWeight: "bold"}}>Enter verification code</KText>
        <KText style={{fontSize: 15, color: variables.colors.grey, marginTop: 20}}>We've sent a text to your phone number</KText>

        <View style={{
            flexDirection: 'row',
            marginTop: 20,
            marginBottom: 20,
            // width: "100%"
        }}>
            {state.code.map((char, i) => 
                <TextInput
                    key={`code_char_${i}`}
                    ref={refs[i]}
                    keyboardType="numeric"
                    style={style}
                    onChange={n => {
                        const text = n.nativeEvent.text
                        if(!text.match(/[0-9]/)) return
                        const code = [...state.code]
                        code[i] = text
                        setState({code})
                    }}
                    onKeyPress={(e) => {
                        if (e.nativeEvent.key === 'Backspace') {
                            const code = [...state.code]
                            if(code[i] === '' && i > 0) {
                                code[i - 1] = ''
                            } else {
                                code[i] = ''
                            }
                            setState({code})
                        }
                    }}
                    maxLength={1}
                    placeholder={`0`}
                    placeholderTextColor={variables.colors.grey}
                    value={char}/>
            )}
        </View>

        <KButton color="primary" onPress={() => verify()} text="Verify" loading={loading} disabled={state.code.join("").length < codeLength} />

        <KText style={{fontSize: 13, color: variables.colors.grey, marginTop: 20}}>
            {resendDisabledFor === 0 ? <>
                Didn't get a code? 
                <KText style={{color: variables.colors.black}} onPress={() => {
                    resend()
                }}> Click to resend</KText>
            </> : `Resend code available in ${resendDisabledFor} seconds`}
        </KText>

    </View>)
}