import { ForwardedRef, forwardRef } from "react"
import KFileUpload from "./KFileUpload"
export type Props = {
    onFiles: (base64: string[]) => void,
    accept?: string,
    multiple?: boolean,
    max?: number
}

export type Handle = {
    open: () => Promise<void>,
}

export default KFileUpload