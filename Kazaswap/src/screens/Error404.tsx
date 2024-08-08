import { Text, View } from "react-native";
import KIcon from "../components/KIcon/KIcon";
import KText from "../components/KText";

export default () => {
    return (
        <View style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
        }}>
            <KIcon name="smile" size="xxlarge" />
            <KText>Woops... This page doesn't seem to exist !</KText>
        </View>
    );
}