import { CSSProperties, ForwardedRef, forwardRef } from "react"
import KDragAndDropZone from "./KDragAndDropZone"
import { ViewStyle } from "react-native"
export type Props = {
    onDrop: (base64: Promise<string>[]) => void,
    onDragOver?: () => void,
    style?: CSSProperties,
    children?: React.ReactNode,
    onPress?: () => void
}

export type Handle = {
    // open: () => Promise<void>,
}

export default KDragAndDropZone