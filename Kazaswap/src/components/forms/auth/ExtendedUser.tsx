import { TextStyle, View } from "react-native"
import FormField from "../../Form/FormField/FormField"
import KPasswordInput, {getError as getPasswordError} from "../../Form/KPasswordInput"
import { Creds, RegisterFormError, isEmailValid } from "./Register"
import variables from "../../../styles/variables"
import BaseUser from "./BaseUser"
import KText from "../../KText"
import KTextInput from "../../Form/KTextInput/KTextInput"
import { isPhoneValid } from "../../../utils/phone"
import useAuthentication from "../../../hooks/useAuthentication"
import KButton from "../../KButton/KButton"
import { useState } from "react"
import auth from "../../../api/auth"
import { toastError, toastSuccess } from "../../Toast/Toast"

type Props = {
    creds: Creds,
    error: RegisterFormError,
    onChange: (creds:Creds) => void,
    imageLoading?: boolean,
    onRotationSaved?: (degrees:number) => Promise<void>
}

export default ({
    creds,
    onChange,
    error,
    imageLoading=false,
    onRotationSaved=()=>Promise.resolve()
}:Props) => {

    const [resetPasswordStatus, setResetPasswordStatus] = useState<'unsent' | 'loading' | 'sent'>('unsent')

    const resetPassword = () => {
        setResetPasswordStatus('loading')
        auth.resetPassword.request(creds.email)
        .then(() => {
            setResetPasswordStatus('sent')
            toastSuccess("Reset instructions sent to your email")
        })
        .catch(() => {
            setResetPasswordStatus('unsent')
            toastError("Error sending reset instructions, please try again later")
        })
    };

    const inputStyles:TextStyle = {
        textAlign: "left",
        height:  variables.button.size.medium.height
    }

    return <>
        <BaseUser
            creds={creds}
            error={error}
            onChange={onChange}
            imageStyles={{top: 0, width: 200, height: 200}}
            imageLoading={imageLoading}
            showImageRotate={true}
            onRotationSaved={onRotationSaved}
            />
        <KText style={{marginTop: 10}}>Change Password</KText>
        <View style={{display: "flex", flexDirection: "row", marginTop: 10, justifyContent: "center"}}>
            <KButton
                text={resetPasswordStatus === 'sent' ? "Reset password email sent" : "Send reset password email"}
                style={{marginRight: 5, width: "auto", paddingLeft: 10, paddingRight: 10}}
                onPress={resetPassword}
                loading={resetPasswordStatus === 'loading'}
                disabled={resetPasswordStatus === 'sent'}
                />
        </View>
        <FormField label="Description">
            <KTextInput
                placeholder="Description"
                onChangeText={hobby => onChange({...creds, hobby})}
                multiline
                numberOfLines={6}
                value={creds.hobby}
                inputStyles={{textAlign: 'left'}}
                />
        </FormField>
        <FormField label="Your Job">
            <KTextInput
                placeholder="Enter your job"
                onChangeText={job => onChange({...creds, job})}
                value={creds.job}
                inputStyles={{textAlign: 'left'}}
                />
        </FormField>
        <FormField label="Social Media">
            <KTextInput
                placeholder="Enter a link to your social media profile"
                onChangeText={socialMedia => onChange({...creds, socialMedia})}
                value={creds.socialMedia}
                inputStyles={{textAlign: 'left'}}
                />
        </FormField>
    </>
}