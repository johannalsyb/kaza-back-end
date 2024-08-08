import { View, ViewStyle } from "react-native"

type Props = {
    number: number,
    current: number,
    style?: ViewStyle,
}
export default (props:Props) => {
    const height = props.style?.height || 2
    return <View style={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        height,
        width: '100%',
        ...(props.style || {})
        }}>
        {new Array(props.number).fill(0).map((_, i) => {
            return <View 
            key={`step_${i}`}
            style={{
                width: `${95/props.number}%`,
                height,
                borderRadius: 50,
                backgroundColor: props.current === i+1 ? 'black' : (props.current > i+1 ? 'green' : '#ddd')
            }}>{""}</View>
        })}
    </View>
}