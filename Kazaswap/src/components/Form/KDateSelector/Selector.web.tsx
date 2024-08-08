import { forwardRef, useImperativeHandle, useRef } from "react"
import { InputHandle, InputProps } from "."

export default forwardRef<InputHandle, InputProps>((props:InputProps, ref) => {

    const inputRef = useRef<HTMLInputElement>(null)

    const dd = typeof props.date === "number" ? new Date(props.date) : props.date
    const mind = (props.minDate && typeof props.minDate === "number" ? new Date(props.minDate) : props.minDate) as Date | undefined
    const maxd = (props.maxDate && typeof props.maxDate === "number" ? new Date(props.maxDate) : props.maxDate) as Date | undefined

    const format = (d:Date) => d.getFullYear() + "-" + (d.getMonth()+1).toString().padStart(2, "0") + "-" + d.getDate().toString().padStart(2, "0")

    useImperativeHandle(ref, () => ({
        open: () => {
            try {
                inputRef.current?.showPicker() // For chrome browsers
                inputRef.current?.focus()      // For safari
                console.log("!!!")
            } catch(e) {
                console.log(e)
            }
        }
    }));

    return <input
        ref={inputRef}
        type="date"
        // id="start"
        // name="trip-start"
        style={{
            height: 0,
            border: 0,
            padding: 0,
            margin: 0,
            width: "100%",
            opacity: 0,
        }}
        value={format(dd)}
        min={mind ? format(mind) : undefined}
        max={maxd ? format(maxd) : undefined}
        onChange={e => {
            const d = new Date(e.target.value)
            if(isNaN(d.getTime())) return // Cancelled
            props.onChange(d.getTime())
        }} />
})