import { CSSProperties, useState } from "react"
import { View, ViewStyle } from "react-native"
import KIcon from "../KIcon/KIcon"
import KImage from "../KImage/KImage"

export default ({
    id,
    images,
    type,
    style = {},
    thumbnail = false,
    imageStyle
}:{
    id:string,
    type: "properties" | "users"
    images: string[],
    thumbnail?: boolean,
    style?: ViewStyle,
    imageStyle?: CSSProperties
}) => {
    const [pos, setPos] = useState(0)
    
    return <View style={[{width:"100%", height: 200, display: "flex", flexDirection: "row", marginTop: 5, marginBottom: 5}, style]}>
        <KIcon name="chevronLeft" onPress={() => {
            setPos(pos === 0 ? images.length-1 : pos-1)
        }} style={{flex: 1}}/>
        <View style={{flex: 1, backgroundColor: "#00000044"}}>
            <KImage imageId={`${id}/${images[pos] || ""}`} type={type} thumbnail={thumbnail} style={imageStyle} />
        </View>
        <KIcon name="chevronRight" onPress={() => {
            setPos(pos === images.length-1 ? 0 : pos+1)
        }} style={{flex: 1}}/>
    </View>
}