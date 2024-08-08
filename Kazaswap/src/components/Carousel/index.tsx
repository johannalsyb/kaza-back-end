import { ReactNode } from "react"
import C from "./Comp"
import { ViewStyle } from "react-native/types"

export type Props = {
    data: React.JSX.Element[]
    style?: ViewStyle
    onIndexChange?: (index:number) => void
}

export default (props:Props) => <C {...props} />