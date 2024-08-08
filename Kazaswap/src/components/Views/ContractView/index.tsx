import { ActivityIndicator, ScrollView, View, ViewStyle } from "react-native"
import PropertyCard from "../../PropertyCard"
import variables from "../../../styles/variables"
import User from "@kazaswap/common/lib/types/User"
import { SwapRequestChat } from "../../../screens/Chats"
import KIcon from "../../KIcon/KIcon"
import KButton from "../../KButton/KButton"
import KText from "../../KText"
import Api from "@kazaswap/common/lib/types/api"
import swaps from "../../../api/swaps"
import { useEffect, useState } from "react"
import { set } from "../../../utils/Storage/storage"
import { toastError } from "../../Toast/Toast"
import Swap from "../Swap"
import { useNavigation } from "@react-navigation/native"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { NavStackParamList } from "../../../navigation/screens"

type Props = {
    user: User,
    request: SwapRequestChat,
    style?: ViewStyle,
    onConfirm: () => void,
    onCancel: () => void,
    loading?: boolean,
    onViewSwap?: (swap:Api.Swaps.Swap) => void,
    onNavigateOut: () => void
}

export default ({
    user,
    request,
    style = {},
    onConfirm,
    onCancel,
    loading = false,
    onViewSwap,
    onNavigateOut
}:Props) => {

    const [nloading, setLoading] = useState<boolean>(loading)
    const [swap, setSwap] = useState<Api.Swaps.Swap>()
    const navigation = useNavigation<NativeStackNavigationProp<NavStackParamList, "Chat", undefined>>()

    useEffect(() => {
        setLoading(loading)
    }, [loading])

    let status: "noneConfirmed" | "fromConfirmed" | "toConfirmed" | "bothConfirmed" | "contractSigned" | "declined" = "noneConfirmed"
    if(request.swapRequest.fromAccepted && request.swapRequest.toAccepted) status = "bothConfirmed"
    else if(request.swapRequest.fromAccepted) status = "fromConfirmed"
    else if(request.swapRequest.toAccepted) status = "toConfirmed"
    if(request.swapRequest.status === "declined") status = "declined"
    // else if(request.swapRequest.contractSigned) status = "contractSigned"

    let statusText = "Confirm if you agree to swap"
    switch(status){
        case "fromConfirmed":
            statusText = user.id === request.swapRequest.from ?
                `${request.otherUser.firstName} must confirm the swap`
                : `${request.otherUser.firstName} has confirmed the swap`
            break
        case "toConfirmed":
            statusText = user.id === request.swapRequest.to ?
                `${request.otherUser.firstName} must confirm the swap`
                : `${request.otherUser.firstName} has confirmed the swap`
            break
        case "bothConfirmed":
            statusText = "Both sides confirmed the swap"
            break
        // case "contractSigned":
        //     statusText = "Contract signed"
        //     break
        case "declined":
            statusText = "Swap Request declined"
            break
    }

    const mineConfirmed = user.id === request.swapRequest.from ? request.swapRequest.fromAccepted : request.swapRequest.toAccepted

    const getSwap = () => {
        setLoading(true)
        swaps.requests.swap(request.swapRequest.id)
        .then(r => {
            // onViewSwap && onViewSwap(r.data)
            setSwap(r.data)
        })
        .catch(e => {
            console.error(e)
            toastError(e)
        })
        .finally(() => {
            setLoading(false)
        })
    }

    useEffect(() => {
        if(request && request.swapRequest.status === "accepted") {
            getSwap()
        }
    }, [request])

    const property = user.id === request.swapRequest.from ? request.swapRequest.toProperty : request.swapRequest.fromProperty

    return <ScrollView style={[{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        width: "100%",
    }, style]}>
        <PropertyCard
            onPress={() => {
                onNavigateOut()
                navigation.navigate("Property", {id: property.id})
            }}
            hoverable={false}
            style={{backgroundColor: variables.colors.greenLight, width: "100%"}}
            property={property}/>
        
        <KText style={{width: "100%", textAlign: "center", marginTop: 10}}>{statusText}</KText>

        
        {status !== "declined" ? <View style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
            marginTop: 20
        }}>
            <KIcon name="waiting" size="medium" style={{
                backgroundColor: status === "fromConfirmed" || status === "toConfirmed" || status === "bothConfirmed" ? variables.colors.green : variables.colors.greenLight,
                padding: 5, borderRadius: 100}}/>
            <View style={{
                height: 0, borderWidth: 1, borderColor: status === "fromConfirmed" || status === "toConfirmed" || status === "bothConfirmed" ? variables.colors.green : variables.colors.greenLight,
                flex: 1, borderStyle: "dashed"}}/>
            <KIcon name="doc" size="medium" style={{
                backgroundColor: variables.colors.greenLight,
                padding: 5, borderRadius: 100}}/>
            <View style={{
                height: 0, borderWidth: 1, borderColor: status === "bothConfirmed" ? variables.colors.green : variables.colors.greenLight,
                flex: 1, borderStyle: "dashed"}}/>
            <KIcon name="waiting" size="medium" style={{
                backgroundColor: status === "bothConfirmed" ? variables.colors.green : variables.colors.greenLight,
                padding: 5, borderRadius: 100}}/>
        </View> : null}
        
        {status !== "declined" ? <View style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            width: "100%",
            marginTop: 20
        }}>
            {status === "bothConfirmed" ?
                // <KButton
                //     icon="swap"
                //     iconSize="medium"
                //     text="View Swap"
                //     color="secondary"
                //     loading={nloading}
                //     style={{flex: 1}}
                //     onPress={getSwap} />
                (loading || !swap ? <ActivityIndicator color={variables.colors.yellow} /> : <Swap id={swap.id} swap={swap}/>)
            : <>
                <KButton
                    icon="crossCircle"
                    iconSize="medium"
                    text="Cancel"
                    color="greenLight"
                    loading={nloading}
                    style={{flex: 1, marginRight: 10}}
                    onPress={onCancel} />
                {!mineConfirmed ? <KButton
                    icon="accept"
                    iconSize="medium"
                    text="Confirm"
                    color="secondary"
                    loading={nloading}
                    style={{flex: 1, marginLeft: 10}}
                    onPress={onConfirm} /> : null}
            </>}
        </View> : null}
    </ScrollView>
}