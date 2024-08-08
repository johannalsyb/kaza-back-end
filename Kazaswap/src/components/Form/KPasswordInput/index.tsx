import { ForwardedRef, ReactNode, forwardRef, useImperativeHandle, useState } from "react";
import KIcon from "../../KIcon/KIcon";
import KTextInput, { KInputProps } from "../KTextInput/KTextInput";
import KText from "../../KText";
import { useSetAtom } from "jotai";
import { showMessageAtom } from "../../../atoms";

export const getError = (text:string, setShowMessage: (msg:string | null) => void) => {
    if(!text || text.length < 6) return <KText>Password too small</KText>;
    if(!text.match(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9]).{6,}$/))
        return <KText
            onPress={() => {
                setShowMessage && setShowMessage("Passwords must contain one number, one uppercase and one lowercase letter, and at least 6 characters")
            }}
            style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                padding: 3
            }}>
            Wrong format
            <KText style={{marginLeft: 10, textAlign: "center", width: 17, height: 17, borderRadius: 20, borderWidth: 1, borderColor: "white", borderStyle: "solid"}}>i</KText>
        </KText>
    return null
}

export type Handle = {
    isValid: () => boolean,
}

export default forwardRef<Handle, KInputProps>((props:KInputProps, ref:ForwardedRef<any>) => {
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [password, setPassword] = useState<string>(props.value || '');
    const [error, setError] = useState<ReactNode>();
    const setShowMessage = useSetAtom(showMessageAtom);

    useImperativeHandle(ref, () => ({
        isValid: () => !error
    }));

    return <KTextInput
        {...props}
        ref={ref}
        placeholder="Password"
        textContentType="password"
        secureTextEntry={!isPasswordVisible}
        autoComplete="password"
        rightComponent={<KIcon size="medium" name={isPasswordVisible ? "eyeClose" : "eyeOpen"} />}
        onRightComponentPress={() => {
            setIsPasswordVisible(!isPasswordVisible);
        }}
        error={error}
        onChangeText={(text) => {
            setPassword(text);
            setError(text.length ? getError(text, setShowMessage) : "");
            props.onChangeText && props.onChangeText(text);
        }}
        value={password}
        />
})