import { CSSProperties } from "react"
import { ViewStyle } from "react-native"

import RegistrationFee from "./comp/"

export type RegistrationFeeProps = {
    onSuccess?: () => void,
    style?: CSSProperties | ViewStyle
}

export default RegistrationFee