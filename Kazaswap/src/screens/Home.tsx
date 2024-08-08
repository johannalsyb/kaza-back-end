import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { NavStackParamList } from "../navigation/screens";
import Auth from "./Auth";
import Properties from "./Properties";
import { useEffect, useState } from "react";
import { View } from "react-native";
import useIsMobile from "../hooks/useIsMobile";
import { showHeaderAtom } from "../atoms";
import { useAtomValue, useSetAtom } from "jotai";
import useAuthentication from "../hooks/useAuthentication";

type HomeProps = NativeStackScreenProps<NavStackParamList, 'Properties'>;
export default (props:HomeProps) => {
    const {user} = useAuthentication()
    const {isMobile} = useIsMobile()
    const [showAuth, setShowAuth] = useState(false); // useState(isMobile && !user);
    const setShowHeader = useSetAtom(showHeaderAtom);

    useEffect(() => {
        setShowHeader(!showAuth);
    }, [showAuth]);

    useEffect(() => {
        if(user) setShowAuth(false);
    }, [user]);

    return <>
        {showAuth ? 
            <View style={{
                position:"absolute",
                width: "100%",
                height: "100%",
                top:0,
                zIndex: 1000
            }}>
                <Auth onHide={() => setShowAuth(false)}/>
            </View>
        : <Properties {...props} />}
    </>
};