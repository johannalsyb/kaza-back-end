import { StyleSheet } from "react-native"
import variables from "../../../styles/variables"
import KIcon from "../../KIcon/KIcon"
import KImage from "../../KImage/KImage"
import { CSSProperties } from "react"

type Props = {
    attachment: string,
    style?: CSSProperties
}

export default (props:Props) => {
    if(props.attachment.startsWith("data:image/"))
        return <KImage source={props.attachment} style={{...styles.attachment, borderWidth: 1, objectFit: "cover", ...(props.style || {})}} />
    else if(props.attachment.startsWith("data:video/"))
        return <KIcon name="play" style={{...styles.attachment, backgroundColor: variables.colors.grey, stroke: "white", ...(props.style || {})}} />
    else return null
}

const styles = StyleSheet.create({
    attachment: {
        width: 50,
        height: 50,
        // marginRight:1,
        // marginLeft:1,
        borderRadius: 10
    }
})