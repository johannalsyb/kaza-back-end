import { View } from "react-native"
import { ChatMessage } from "@kazaswap/common/lib/types/SwapRequest"
import variables from "../../../styles/variables"
import KText from "../../KText"
import useIsMobile from "../../../hooks/useIsMobile"

type Props = {
    message: ChatMessage | {type: "new", at: number},
    fromFirstName?: string,
    fromMe: boolean
}
export default ({
    message,
    fromFirstName = "",
    fromMe
}:Props) => {
    const {isMobile} = useIsMobile()
    if(!message.type) return null
    
    let color = variables.colors.grey
    let text = `Swap request ${fromMe ? "sent" : "received"}`
    if(message.type === "accepted" || message.type === "declined") {
        text = `${message.type.capitalizeFirst()} by`
        if(message.type === "accepted") color = variables.colors.green
        else if(message.type === "declined") color = variables.colors.orange
    }

    return <View style={{
    // width: "100%",
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center"}}
    >
        <View style={{
            height: 0,
            borderWidth: 1,
            borderColor: color,
            flex: 1,
            borderStyle: "dashed"
        }} />
            <KText style={{
                fontSize: isMobile ? 10 : 15,
                alignSelf: "center",
                margin: 10,
                color: variables.colors.grey,
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
                justifyContent: "center",
                alignItems: "center"
            }}>
                {text}
                {message.type !== "new" ? <KText style={{
                    color: "black",
                    marginLeft: 5,
                    // marginRight: 5,
                }}>{fromMe ? "me" : fromFirstName}</KText> : null}
                {` on ${new Date(message.at).toLocaleString()}`}
            </KText>
        <View style={{
            height: 0,
            borderWidth: 1,
            borderColor: color,
            flex: 1,
            borderStyle: "dashed"
        }} />
    </View> 
}