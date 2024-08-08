import { Text, View } from "react-native";
import KIcon from "../components/KIcon/KIcon";

export default () => {
    return (
        <View style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
        }}>
            <KIcon name="logo" size="xxlarge" style={{marginTop: 50}}/>
        </View>
    );
}