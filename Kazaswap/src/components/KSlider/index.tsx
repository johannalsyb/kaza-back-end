import { CSSProperties } from "react"
import { ViewStyle } from "react-native"

export type Props = {
    min:number,
    max:number,
    value:number
    label?:string
    labelPosition?: "left" | "right"
    style?:CSSProperties
    topStyle?:ViewStyle
    disabled?:boolean
    onChange:(value:number) => void
}