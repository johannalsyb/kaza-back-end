import { ChatMessage } from "@kazaswap/common/lib/types/SwapRequest"
import { View, ViewStyle, Image, Pressable, Linking } from "react-native"
import useAuthentication from "../../../hooks/useAuthentication"
import useIsMobile from "../../../hooks/useIsMobile"
import { CircleImage } from "../../CircleImage/CircleImage"
import KText from "../../KText"
import variables from "../../../styles/variables"
import { isImageExtension, isVideoExtension } from "../../../utils/pictures"
import KIcon from "../../KIcon/KIcon"
import ChatEvent from "./ChatEvent"

type Props = {
    message: ChatMessage,
    fromImageId?: string,
    fromFirstName?: string,
    toImageId?: string,
    toFirstName?: string,
    style?: ViewStyle,
    onAttachmentPressed: (url: string) => void
}
export default ({
    message,
    onAttachmentPressed,
    fromImageId = "",
    fromFirstName = "",
    toImageId = "",
    toFirstName = "",
    style={}
}:Props) => {
    const {user} = useAuthentication()
    const {isMobile} = useIsMobile()
    const fromMe = message.from === user?.id

    const renderAttachment = (a: string, i:number) => {
        if(isImageExtension(a.split(".").pop() || ""))
            return <Image
                key={`attachment_${i}_${message.at}`}
                source={{uri: a}}
                style={{
                    width: 100,
                    height: 100,
                    borderRadius: 10,

                    // resizeMode: "contain"
                }} />
        else if(isVideoExtension(a.split(".").pop() || ""))
            return <video
                key={`attachment_${i}_${message.at}`}
                playsInline={false}
                src={a}
                style={{
                    width: 100,
                    borderRadius: 10,
                    // height: 100,
                }}
                />
        else return <View key={`attachment_${i}_${message.at}`} style={{
            width: 100,
            height: 100,
            borderRadius: 10,
            backgroundColor: variables.colors.grey,
        }} />
    }

    if(message.type === "accepted" || message.type === "declined") {
        return <ChatEvent message={message} fromFirstName={fromFirstName} fromMe={fromMe} />
    }

    return <View style={{
        width: "auto",
        marginBottom: 10,
        alignSelf: fromMe ? "flex-end" : "flex-start",
        justifyContent: fromMe ? "flex-end" : "flex-start",
        flexDirection: "row",
        ...style
    }}>
        <CircleImage
            thumbnail={true}
            imageId={fromImageId}
            type="users"
            style={{width: 40, height: 40, marginRight: 10}}/>
        <KText style={{
            backgroundColor: fromMe ? variables.colors.greenLight : variables.colors.yellow,
            borderTopLeftRadius: 10,
            borderTopRightRadius: 10,
            borderBottomLeftRadius: fromMe ? 10 : 0,
            borderBottomRightRadius: fromMe ? 0 : 10,
            padding: 10,
            width: "80%",
            display: "flex",
            flexDirection: "column" ,
            alignItems: "flex-start",
            justifyContent: "space-between"
        }}>
            {message.attachments ? message.attachments.map((a, i) => 
                <Pressable key={`attachment_${i}_${message.at}`} onPress={() => {
                    onAttachmentPressed(a)
                    // Linking.openURL(a)
                }}>
                    {renderAttachment(a, i)}
                    <View style={{position: "absolute", height: "100%", width: "100%", display: "flex", justifyContent: "center", alignItems: "center"}}>
                        <KIcon name="search" size="medium" style={{backgroundColor: "#00000044", borderRadius: 30, padding: 5}}/>
                    </View>
                </Pressable>
            ) : null}
            {message.message}
            <KText style={{
                fontSize: 10,
                color: variables.colors.grey,
                alignSelf: "flex-end",
            }}>{new Date(message.at).toLocaleString()}</KText>
        </KText>
    </View>
}