import { CSSProperties, useEffect } from "react"
import { RegistrationFeeProps } from ".."

export default (props:RegistrationFeeProps) => {

    useEffect(() => {
        const listener = (event:MessageEvent) => {
            console.log(event)
            if(event.origin === window.location.origin && event.data === "payment_successful") {
                if(props.onSuccess) props.onSuccess()
            }
        }
        window.addEventListener("message", listener)
        return () => window.removeEventListener("message", listener)
    }, [])

    return <iframe
        style={{
            width: "100%",
            height: "100vh",
            border: "none",
            // position: "absolute !important" as CSSProperties["position"],
            top: 0,
            left: 0,
            ...props.style as CSSProperties
        }}
        src={`/payments/checkout.html`} />
}