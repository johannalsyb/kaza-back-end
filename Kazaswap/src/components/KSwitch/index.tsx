import { Platform, Switch, ViewStyle } from "react-native"
import variables from "../../styles/variables"

type Props = {
    loading?: boolean,
    value: boolean,
    disabled?: boolean,
    onValueChange: (t: boolean) => void,
    style?: ViewStyle
}

export default ({
    loading,
    disabled,
    value,
    onValueChange,
    style = {}
}:Props) => <Switch
        trackColor={{false: variables.colors.grey, true: 'black'}}
        thumbColor={value ? variables.colors.yellow : variables.colors.yellow}
        ios_backgroundColor="black"
        disabled={loading || disabled}
        style={style}
        {...Platform.select({web: {
            activeThumbColor: variables.colors.yellow
        }})}
        onValueChange={onValueChange}
        value={value}
    />