import { ForwardedRef, forwardRef, useImperativeHandle } from "react";
import { Handle, Props } from ".";

export default forwardRef<Handle, Props>(({
    onFiles,
},
ref) => {
    return null
})