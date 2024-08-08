import { ActivityIndicator, Pressable, TextStyle, View, ViewStyle } from "react-native";
import FormField from "../../Form/FormField/FormField";
import KPhoneInput from "../../Form/KPhoneInput";
import KFileUpload, { Handle as KFileUploadHandle } from "../../Form/KFileUpload";
import KTextInput from "../../Form/KTextInput/KTextInput";
import variables from "../../../styles/variables";
import { useEffect, useRef, useState } from "react";
import { Creds, RegisterFormError } from "./Register";
import KImage from "../../KImage/KImage";
import KIcon from "../../KIcon/KIcon";
import KButton from "../../KButton/KButton";
import useConfig from "../../../hooks/useConfig";
import { getPictureUrl } from "../../../utils/pictures";
import useAuthentication from "../../../hooks/useAuthentication";
import useIsMobile from "../../../hooks/useIsMobile";
import KText from "../../KText";
import { toastError } from "../../Toast/Toast";
import { set } from "../../../utils/Storage/storage";
import { resizeImage } from "../../../hooks/useResizeImage";

type Props = {
    creds: Creds,
    error: RegisterFormError,
    onChange: (creds:Creds) => void,
    imageStyles?: ViewStyle,
    imageLoading?: boolean,
    showImageRotate?: boolean,
    onRotationSaved?: (degrees:number) => Promise<void>
}

export default ({
    creds,
    error,
    onChange,
    imageStyles = {},
    imageLoading = false,
    showImageRotate = false,
    onRotationSaved = () => Promise.resolve()
}:Props) => {
    const config = useConfig()
    const {user} = useAuthentication()
    const {isMobile} = useIsMobile()

    const [imageRotate, setImageRotate] = useState(0)
    const [imgLoading, setImgLoading] = useState(true || imageLoading)

    const inputStyles:TextStyle = {
        textAlign: "left",
        height:  variables.button.size.medium.height
    }

    const picRef = useRef<KFileUploadHandle>(null);

    let source = creds.image;
    if(source?.startsWith("data:")) {
        // A new image has just been added
    } if(source?.startsWith("http")) {
        // Do nothing
    } else {
        const ii = creds.image || creds.primaryImage
        if(user && config && ii && !ii.startsWith("data:")) {
            const img = getPictureUrl(config, user.id, ii, "users", false)
            if(img) source = img+"?"+Date.now();
        }
    }

    const iheight = ((imageStyles.height || variables.icon.size.xxlarge+10) as number)*((!source || !user )? (isMobile ? 1.5 : 3) : 1);
    const imageMissingError = Object.keys(error).length === 1 && error.image

    useEffect(() => {
        if(imageLoading !== imgLoading) {
            setImgLoading(imageLoading)
        }
    }, [imageLoading])

    return <>
        <Pressable onPress={() => {
            if(picRef && picRef.current) {
                picRef.current.open();
            }
        }}>
            <View
                style={[{
                    alignSelf: 'center',
                    alignContent: 'center',
                    justifyContent: 'center',
                    alignItems: 'center',
                    position: 'relative',
                    top: isMobile ? -10 : 0,
                    borderRadius: 100,
                    width: iheight,
                    height: iheight,
                    backgroundColor: variables.colors.yellow,
                    zIndex: 10,
                    borderWidth: imageMissingError ? 1 : 1,
                    borderColor: imageMissingError ? variables.colors.orange : "white"
                }, imageStyles]}>
                {source ?
                    <>
                        <KImage
                            source={source}
                            style={{
                                objectFit: 'cover',
                                width: iheight-2,
                                height: iheight-2,
                                borderRadius: 100,
                                transform: `rotate(${imageRotate}deg)`,
                            }} />
                        {imgLoading && <ActivityIndicator
                            color={variables.colors.yellow}
                            style={{
                                padding: 5,
                                backgroundColor: "rgba(0,0,0,0.5)",
                                borderRadius: 100,
                                position: "absolute",
                                // zIndex: 1000
                            }}/>}
                    </>: <>
                        <KIcon
                            name="addPicture"
                            size={"xlarge"}
                            style={{
                                stroke: variables.colors.green,
                                width: "50%",
                                height: "50%",
                            }}
                            />
                        {imageMissingError ? <KText style={{
                            position: "absolute",
                            bottom: -5,
                            left: 0,
                            right: 0,
                            textAlign: "center",
                            color: variables.colors.white,
                            fontSize: 10,
                            backgroundColor: variables.colors.orange,
                            borderRadius: 10,
                        }}>You must choose a profile picture</KText> : null}
                    </>
                }
                <KFileUpload
                    ref={picRef}
                    onFiles={([image]) => {
                        setImgLoading(true)
                        resizeImage(image, config.config?.images.users.resizePx || 800)
                        .then(resized => onChange({...creds, image: resized}))
                        .catch(() => toastError("Failed to load image"))
                        .finally(() => setImgLoading(false))
                    }}/>
            </View>
        </Pressable>
        {showImageRotate && <View style={{
            flexDirection: "row",
            width: "100%",
            justifyContent: "center",
            alignItems: "center",
        }}>
            <KText style={{
                color: variables.colors.grey,
                fontSize: 20,
                textAlign: "center",
            }} onPress={() => {
                !imgLoading && setImageRotate((imageRotate + 90) % 360)
            }}>↻</KText>
            <KButton
                text="Save"
                onPress={() => {
                    setImgLoading(true)
                    return onRotationSaved(imageRotate)
                    .catch(() => {toastError("Failed to save rotation")})
                    .finally(() => {
                        setImageRotate(0)
                        setImgLoading(false)
                    })
                }}
                disabled={imageRotate === 0 || imageLoading}
                style={{height: 25, width: 50}}/>
        </View>}

        <FormField labelAlign="left" label="First Name">
            <KTextInput
                error={creds.firstName.length ? error.firstName : ""}
                inputStyles={{...inputStyles}}
                placeholder="First Name"
                value={creds.firstName}
                onChangeText={firstName => onChange({...creds, firstName})}
                />
        </FormField>

        <FormField labelAlign="left" label="Email">
            <KTextInput
                inputStyles={{...inputStyles}}
                placeholder="Email"
                error={creds.email.length ? error.email : ""}
                value={creds.email}
                onChangeText={email => onChange({...creds, email})}
                />
        </FormField>

        <FormField labelAlign="left" label="Gender">
            <View style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
            }}>
                <KButton
                    style={{width:"30%"}}
                    color={creds.gender === "male" ? "primary" : "light"}
                    text="Male"
                    onPress={() => onChange({...creds, gender: "male"})}
                    />
                <KButton
                    style={{width:"30%"}}
                    color={creds.gender === "female" ? "primary" : "light"}
                    text="Female"
                    onPress={() => onChange({...creds, gender: "female"})}
                    />
                <KButton
                    style={{width:"30%"}}
                    color={creds.gender === "other" ? "primary" : "light"}
                    text="Other"
                    onPress={() => onChange({...creds, gender: "other"})}
                    />
            </View>
        </FormField>

        <FormField labelAlign="left" label="Phone" style={{zIndex: 5}}>
            <KPhoneInput
                phone={creds.phone}
                onChange={(phone) => {
                    onChange({
                        ...creds,
                        phone: {
                            code: (phone.code || "" ),
                            number: (phone.number + "")
                        }
                    })
                }} />
        </FormField>
    </>
}