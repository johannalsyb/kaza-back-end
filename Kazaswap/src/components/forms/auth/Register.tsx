import { useEffect, useRef, useState } from "react";
import FormField from "../../Form/FormField/FormField"
import KTextInput from "../../Form/KTextInput/KTextInput"
import KButton from "../../KButton/KButton";
import { Pressable, TextStyle, View } from "react-native";
import KIcon from "../../KIcon/KIcon";
import variables from "../../../styles/variables";
import KPasswordInput, {getError as getPasswordError} from "../../Form/KPasswordInput";
import KPhoneInput from "../../Form/KPhoneInput";
import KFileUpload, { Handle as KFileUploadHandle } from "../../Form/KFileUpload/index";
import KImage from "../../KImage/KImage";
import api, { ApiResponseError } from "../../../api";
import auth from "../../../api/auth";
import { Api } from "@kazaswap/common/lib/types/api";
import { Me } from "@kazaswap/common/lib/types/api/auth";
import { HTTPError, User } from "@kazaswap/common";
import users from "../../../api/users";
import useAuthentication from "../../../hooks/useAuthentication";
import { isPhoneValid } from "../../../utils/phone";
import BaseUser from "./BaseUser";
import UserEvent from "../../../events/UserEvent";
import { useSetAtom } from "jotai";
import { showMessageAtom } from "../../../atoms";
import useIsMobile from "../../../hooks/useIsMobile";

export type Phone = {
    code: string,
    number: string,
}

export type Creds = {
    firstName: string,
    lastName?: string,
    gender: string,
    email: string,
    password: string,
    currentPassword?: string,
    phone: Phone,
    image?: string,
    hobby?: string,
    job?: string,
    socialMedia?: string,
    primaryImage?: string
    phoneVerified?: boolean
    emailVerified?: boolean
}

type Props = {
    creds?:Creds
    onChange?: (creds:Creds) => void
    onCreated?: (user:Partial<User>) => void
}

export const isEmailValid = (email:string) => {
    return email.match(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/);
}
export type RegisterFormError = {
    firstName?: string,
    gender?: string,
    email?: string,
    password?: string,
    phone?: string,
    image?: string,
}
const isValid = (creds:Creds, setShowMessage: (msg: string | null) => void) => {
    const error:RegisterFormError = {}
    const pwdError = getPasswordError(creds.password, setShowMessage)
    if(!creds.firstName || creds.firstName.length < 2)
        error.firstName = "Minimum 2 characters";
    if(!creds.gender || creds.gender.length < 2)
        error.gender = "Please select one"
    if(!creds.email || !isEmailValid(creds.email))
        error.email = "Invalid Email";
    if(!creds.password || pwdError)
        error.password = pwdError?.props.childen || "Enter a password";
    if(!creds.phone || !isPhoneValid(creds.phone.code, creds.phone.number))
        error.phone = "Invalid Phone Number";
    if(!creds.image)
        error.image = "Please upload a profile picture"
    // console.log(error)
    return error;
}

export default (props:Props) => {
    const {login} = useAuthentication()
    const setShowMessage = useSetAtom(showMessageAtom);
    const {isMobile} = useIsMobile()

    const [creds, setCreds] = useState(props.creds || {
        firstName: '',
        lastName: '',
        gender: '',
        email: '',
        password: '',
        phone: {
            code: '+1',
            number: ""
        }
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<RegisterFormError>({});

    useEffect(() => {
        if(creds) {
            setError(isValid(creds, setShowMessage));
            props.onChange && props.onChange(creds)
        }
    }, [creds])

    const inputStyles:TextStyle = {
        textAlign: "left",
        height:  variables.button.size.medium.height
    }

    return <>
        <BaseUser
            creds={creds}
            onChange={setCreds}
            error={error}
            imageStyles={isMobile ? {
                height: 120,
                width: 120,
            } : {}}/>

        <FormField labelAlign="left" label="Password">
            <KPasswordInput
                inputStyles={{...inputStyles}}
                placeholder="Password"
                value={creds.password}
                onChangeText={password => setCreds({...creds, password})}
                />
        </FormField>

        <KButton
            text="Next Step"
            loading={loading}
            disabled={loading || Object.keys(error).length > 0}
            onPress={() => {

                const onLogin = (user:Partial<User>) => {
                    props.onCreated && props.onCreated(user)
                }

                const id = UserEvent.addListener("login", onLogin)
                setLoading(true);
                auth.signup({...creds, phone: creds.phone.code+creds.phone.number, onboarding: JSON.stringify({step: 2, data: {}, completed: false}) as any})
                .then(res => login(creds.email, creds.password))
                .then(async user => {
                    props.onCreated && props.onCreated(user!);
                    if(creds.image) await users.postPictures(user!.id!, [creds.image])
                })
                .catch(async (err:ApiResponseError) => {
                    const error = err.json
                    if(error?.data?.error && error?.data?.error.indexOf("User already exists") >=0) {
                        setError({...error, email: "Email already exists"})
                    }
                }).finally(() => {
                    setLoading(false);
                    UserEvent.removeListener("login", id)
                })
            }}
            color="primary"
            style={{
                width: "100%",
                marginTop: 20,
                marginBottom: 20
            }}/>
        <View style={{height: 10}} />

    </>
}