import { View } from "react-native"
import KText from "../../../KText"
import KButton from "../../../KButton/KButton"
import { useNavigation } from "@react-navigation/native"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { NavStackParamList } from "../../../../navigation/screens"

type Props = {
    onClicked: () => void
}
export default (props:Props) => {
    const navigation = useNavigation<NativeStackNavigationProp<NavStackParamList, "Login", undefined>>()

    return <View style={{padding: 20, alignItems: "center"}}>
          <KText style={{fontSize: 20, fontWeight: "normal", marginBottom: 10, textAlign: "center"}}>
          Your profile is currently under review. To expedite approval, please complete your profile.
          </KText>
          <KButton text={"Complete profile"} color="primary" onPress={() => {
            navigation.navigate("Account", {edit: undefined})
            props.onClicked()
          }} />
    </View>
}