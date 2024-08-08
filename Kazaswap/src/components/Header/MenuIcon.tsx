import { Pressable, View, ViewStyle } from "react-native";
import variables from "../../styles/variables";
import KText from "../KText";
import KIcon from "../KIcon/KIcon";
import useIsMobile from "../../hooks/useIsMobile";
import { CSSProperties } from "react";

type Props = {
    onPress: () => void,
    bubble?: number
    icon: string
    style?: ViewStyle
    iconStyle?: CSSProperties
}

export default (props:Props) => {
    const {isMobile} = useIsMobile()
    return <Pressable onPress={props.onPress} style={props.style}>
        {props.bubble ? <View
        style={{    
            position: 'absolute',
            top: 13,
            right: 35,
            width: 15,
            height: 15,
            padding: 5,
            aspectRatio: 1,
            borderRadius: 15,
            backgroundColor: variables.colors.orange,
            borderColor: 'white',
            // borderWidth: 1,
            justifyContent: 'center',
            alignItems: 'center',
        }}>
            <KText
                style={{
                    color: 'white',
                    fontSize: 10,
                }}>
                {props.bubble}
            </KText>
        </View> : null}
        <KIcon
            name={props.icon as any}
            size="medium"
            style={{
              backgroundColor: isMobile ? 'white' : 'transparent',
              borderRadius: 50,
              padding: 10,
              stroke: isMobile ? 'black' : 'white',
              ...(props.iconStyle || {})
            }}
        />
    </Pressable>
}