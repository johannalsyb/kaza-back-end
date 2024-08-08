import { useEffect, useState } from "react"
import useAuthentication from "../../hooks/useAuthentication"
import User from "@kazaswap/common/lib/types/User"
import Property from "@kazaswap/common/lib/types/Property"
import admin from "../../api/admin"
import Users from "./Users"
import KButton from "../../components/KButton/KButton"
import { ScrollView, View } from "react-native"
import Properties from "./Properties"
import Dashboard from "./Dashboard"
import SwapRequests from "./SwapRequests"
import { NativeStackScreenProps } from "@react-navigation/native-stack"
import { NavStackParamList } from "../../navigation/screens"
import Matches from "./Matches"

type Tabs = 'dashboard' | 'users' | 'properties' | 'swapRequests' | "matches"
type Props = NativeStackScreenProps<NavStackParamList, "Admin">;


export default (props:Props) => {
    const {user} = useAuthentication()

    if(!user || (user.role !== "admin" && user.role !== "superadmin")) {
        return null
    }

    const [tab, setTab] = useState<Tabs>(props.route.params?.tab as Tabs || 'dashboard')

    useEffect(() => {
        props.navigation.setParams({tab})
    }, [tab])

    return <View style={{display: "flex", flexDirection: "row", flex: 1}}>
        <View style={{display: "flex", flexDirection: "column", borderRightColor: "black", borderRightWidth: 1}}>
            <KButton style={{borderRadius: 0}} text="Dashboard" onPress={() => setTab('dashboard')} color={tab === 'dashboard' ? 'primary' : "light"}/>
            <KButton style={{borderRadius: 0}} text="Users" onPress={() => setTab('users')} color={tab === 'users' ? 'primary' : "light"}/>
            <KButton style={{borderRadius: 0}} text="Properties" onPress={() => setTab('properties')} color={tab === 'properties' ? 'primary' : "light"}/>
            <KButton style={{borderRadius: 0}} text="Swap Requests" onPress={() => setTab('swapRequests')} color={tab === 'swapRequests' ? 'primary' : "light"}/>
            <KButton style={{borderRadius: 0}} text="Matches" onPress={() => setTab('matches')} color={tab === 'matches' ? 'primary' : "light"}/>
        </View>
        <ScrollView style={{flex: 1}}>
            {tab === "dashboard" ? <Dashboard /> : null}
            {tab === "users" ? <Users /> : null}
            {tab === "properties" ? <Properties /> : null}
            {tab === "swapRequests" ? <SwapRequests /> : null}
            {tab === "matches" ? <Matches /> : null}
        </ScrollView>
    </View>

}