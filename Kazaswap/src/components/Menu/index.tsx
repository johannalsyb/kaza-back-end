import { Pressable, View, ViewStyle } from "react-native"
import useAuthentication from "../../hooks/useAuthentication";
import { CircleImage } from "../CircleImage/CircleImage";
import { useNavigationContainerRef, useRoute } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { NavStackParamList } from "../../navigation/screens";
import KButton from "../KButton/KButton";
import useIsMobile from "../../hooks/useIsMobile";
import KIcon from "../KIcon/KIcon";
import variables from "../../styles/variables";
import { useEffect, useState } from "react";
import KText from "../KText";
import { useSetAtom } from "jotai";
import { showSwapNowAtom } from "../../atoms";

const size = 30

export default ({
    navigate,
    style
}:{
    navigate: (name: keyof NavStackParamList) => void,
    style?: ViewStyle
}) => {

    const {isMobile} = useIsMobile()
    const auth = useAuthentication();
    const user = auth.user;
    const route = useRoute()
    const setShowSwapNow = useSetAtom(showSwapNowAtom);


    if(!isMobile) return <></>
    return <View style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        position: 'absolute',
        bottom: 10,
        zIndex: 101,
        ...style
    }}>
        <View style={{
            // width: '90%',
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-around',
            alignItems: 'center',
        }}>
            {user ?
            <>
            <View style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                borderRadius: size*2,
                padding: 10,
                backgroundColor: 'black',
            }}>
                
                <KIcon
                    onPress={() => navigate('Home')}
                    name="search" size="xlarge" style={{
                    marginRight: 5,
                    width: size,
                    height: size,
                    padding: 10,
                    borderRadius: size,
                    stroke: route.name === "Home" ? "black" : "white",
                    backgroundColor: route.name === "Home" ? "white" : variables.colors.blackLight
                }}/>
                {/* <KIcon
                    onPress={() => navigate('Matching')}
                    name="matching" size="xlarge" style={{
                    marginRight: 5,
                    width: size,
                    height: size,
                    padding: 10,
                    borderRadius: size,
                    stroke: route.name === "Matching" ? "black" : "white",
                    backgroundColor: route.name === "Matching" ? "white" : variables.colors.blackLight
                }}/> */}
                <KIcon
                    onPress={() => navigate('Favourites')}
                    name="fav" size="xlarge" style={{
                    marginRight: 5,
                    width: size,
                    height: size,
                    padding: 10,
                    borderRadius: size,
                    stroke: route.name === "Favourites" ? "black" : "white",
                    backgroundColor: route.name === "Favourites" ? "white" : variables.colors.blackLight
                }}/>
                <KIcon
                    onPress={() => navigate('Chats')}
                    name="chat" size="xlarge" style={{
                    marginRight: 5,
                    width: size,
                    height: size,
                    padding: 10,
                    borderRadius: size,
                    stroke: route.name === "Chats" ? "black" : "white",
                    backgroundColor: route.name === "Chats" ? "white" : variables.colors.blackLight
                }}/>
                <Pressable onPress={() => {navigate('Account')}}>
                    <CircleImage
                        thumbnail={true}
                        imageId={`${user.id}/${user.primaryImage}`}
                        type="users"
                        style={{
                            width: size+13,
                            height: size+13,
                            borderWidth: 2,
                            borderColor: 'white',
                            borderStyle: 'solid',
                        }}/>
                </Pressable>
            </View>
                
            {/* <KIcon
                name="logo"
                size="large"
                style={{
                    stroke: 'black',
                    backgroundColor: variables.colors.yellow,
                    width: size+5,
                    height: size+5,
                    padding: 10,
                    borderRadius: size+5,
                    marginLeft: 5,
                    borderWidth: 0,
                    borderColor: 'black',
                    borderStyle: 'solid',
                    boxShadow: '0px 0px 10px 0px rgba(0,0,0,0.4)',
                }}
                onPress={() => setShowSwapNow(true)}
                /> */}
            </>

            :
                <>
                    <KButton text="Sign In" icon="login" color="light" onPress={() => navigate('Login')} style={{marginRight: 5}}/>
                    <KButton text="Register" icon="register" onPress={() => navigate('SignUp')} />
                </>}
        </View>
    </View>
}