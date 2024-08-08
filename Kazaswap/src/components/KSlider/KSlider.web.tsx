import { View } from "react-native";
import { uuid } from "../../utils";
import { Props } from ".";
import { useState } from "react";

export default (props:Props) => {
    const lpos = props.labelPosition || "left"
    const name = uuid()
    const [value, setValue] = useState(props.value)
    return (
        <View style={props.topStyle}>
            {props.label && lpos === "left" ? <label htmlFor={name}>{props.label}</label> : null}
            <input
                disabled={props.disabled}
                type="range"
                id={name}
                name={name}
                min={props.min}
                max={props.max}
                style={props.style}
                value={value}
                onChange={e => {
                    // props.onChange(parseInt(e.target.value))
                    setValue(parseInt(e.target.value))
                }}
                onMouseUp={() => props.onChange(value)}
                onTouchEnd={() => props.onChange(value)}
                />
            {props.label && lpos === "right" ? <label htmlFor={name}>{props.label}</label> : null}
        </View>
    );
}