import { Linking, Pressable, View } from "react-native";
import KIcon from "../KIcon/KIcon";

import { NavStackParamList, isFooterHidden } from "../../navigation/screens";
import variables from "../../styles/variables";
import KText from "../KText";
import useIsMobile from "../../hooks/useIsMobile";
import useConfig from "../../hooks/useConfig";

type Props = {
    route?: string
}
export default ({route}:Props) => {
    const {config} = useConfig()
    const {isMobile} = useIsMobile()
    if(isFooterHidden(route as keyof NavStackParamList, isMobile)) return null

    return <View style={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        backgroundColor: variables.colors.greenLight,
        padding: isMobile ? 5 : 20
        // flex: 1,
    }}>
        <View style={{flex:1}}>
            <KIcon
                name="logoText2"
                width={130}
                height={40}
                style={{
                }}/>
        </View>

        <View style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
        }}>
            <Pressable onPress={() => Linking.openURL("/confidentiality")}><KText style={{marginLeft: 10, marginRight: 10}}>Confidentiality</KText></Pressable>
            <Pressable onPress={() => Linking.openURL("/terms-of-use")}><KText style={{marginLeft: 10, marginRight: 10}}>Terms of Use</KText></Pressable>
            <Pressable onPress={() => Linking.openURL("/blog")}><KText style={{marginLeft: 10, marginRight: 10}}>Blog</KText></Pressable>
        </View>

        <View style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'flex-end',
            justifyContent: 'flex-end',
            flex: 1
        }}>
            <KText style={{color: variables.colors.grey, marginRight: 20}}>30 N Gould St, Sheridan, WY 82801</KText>
            <KText onPress={() => Linking.openURL(`mailto:${config?.emails.community}`)}>{config?.emails.community || ""}</KText>
        </View>

    </View>
}