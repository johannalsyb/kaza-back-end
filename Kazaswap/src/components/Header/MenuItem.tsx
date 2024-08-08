import { View, ViewStyle } from "react-native"
import KButton from "../KButton/KButton"
import variables from "../../styles/variables"
import KText from "../KText"
import KIcon from "../KIcon/KIcon"

type Props = {
    onPress: () => void,
    selected: boolean
    bubble?: number
    icon: string
    text: string,
    style?: ViewStyle
}

export default (props:Props) => {
    return <KButton
        onPress={props.onPress}
        color={props.selected ? 'light' : 'tertiary'}
        style={{
            display: 'flex',
            flexDirection: 'row',
            marginLeft: 5,
            marginRight: 5,
        }}>
            {props.bubble ? <View
            style={{    
                position: 'absolute',
                top: -5,
                right: -10,
                width: 20,
                height: 20,
                padding: 5,
                aspectRatio: 1,
                borderRadius: 15,
                backgroundColor: variables.colors.orange,
                borderColor: 'white',
                // borderWidth: 1,
                justifyContent: 'center',
                alignItems: 'center',
            }}>
                {/* <KText
                    style={{
                        color: 'white',
                        fontSize: 12,
                    }}>
                    {props.bubble}
                </KText> */}
            </View> : null}
        <KIcon
            name={props.icon as any}
            size="medium"
            style={{
            marginRight: 5,
            stroke: props.selected ? 'black' : 'white',
            }}
        />
        <KText style={{color: props.selected ? 'black' : 'white'}}>
            {props.text}
        </KText>
    </KButton>
}
