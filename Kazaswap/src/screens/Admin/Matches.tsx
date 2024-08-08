import { useEffect, useState } from "react"
import useAuthentication from "../../hooks/useAuthentication"
import User from "@kazaswap/common/lib/types/User"
import Property from "@kazaswap/common/lib/types/Property"
import admin from "../../api/admin"
import { ActivityIndicator, Modal, Pressable, ScrollView, View } from "react-native"
import variables from "../../styles/variables"
import KText from "../../components/KText"
import KButton from "../../components/KButton/KButton"
import { toastError, toastSuccess } from "../../components/Toast/Toast"
import KSideModal from "../../components/KModal/KSideModal"
import ExtendedUser from "../../components/forms/auth/ExtendedUser"
import { Phone } from "../../components/forms/auth/Register"
import { parsePhone } from "../../utils/phone"
import { CircleImage } from "../../components/CircleImage/CircleImage"
import { getPictureUrl } from "../../utils/pictures"
import useConfig from "../../hooks/useConfig"
import usersApi from "../../api/users"
import { defaultProperty } from "../Onboarding"
import KTextInput from "../../components/Form/KTextInput/KTextInput"
import UserModal from "./UserModal"
import { OnboardingInfo } from "@kazaswap/common/lib/types/api/auth"
import KNumberInput from "../../components/Form/KNumberInput/KNumberInput"
import KModal from "../../components/KModal/KModal"
import MatchesModal from "./MatchesModal"

type Filters = {
    verified?: 0 | 1,
    search?: string
}

export default () => {
    const {user} = useAuthentication()
    const {config} = useConfig()

    if(!user || (user.role !== "admin" && user.role !== "superadmin")) {
        return null
    }

    const [users, setUsers] = useState<(User & {matchCount: number})[]>()
    const [filters, setFilters] = useState<Filters>({
        verified: undefined,
    })
    const [selectedUser, setSelectedUser] = useState<User | undefined>()
    const [currentPage, setCurrentPage] = useState(1)
    const [loading, setLoading] = useState(false)
    
    const load = () => {
        setLoading(true)
        return admin.matches.getUsersWithMatches()
        .then(d => setUsers([...(users || []), ...d.data].sort((a,b) => b.matchCount-a.matchCount)))
        .finally(() => setLoading(false))
    }

    useEffect(() => {
        load()        
    }, [currentPage])

    useEffect(() => {
        if(currentPage === 1) load()        
    }, [])

    const filteredUsers = users?.filter(u => {
        if(filters.verified !== undefined && !!u.verified !== !!filters.verified) return false
        if(filters.search && !(u.email+" "+u.firstName+" "+u.lastName).toLowerCase().includes(filters.search.trim().toLowerCase())) return false
        const onboarding = u.onboarding ? JSON.parse(u.onboarding) as OnboardingInfo : undefined
        return true
    })

    return <View style={{flex: 1}}>

        <View style={{padding: 5, flexDirection: "row", justifyContent: "space-between"}}>
            <View style={{flexDirection: "row", alignItems: "center"}}>
                <KTextInput placeholder="Search user" onChangeText={v => setFilters({...filters, search: v.length ? v : undefined})} />
            </View>
        </View>

        {users && <KText>Current view: {filteredUsers?.length || 0}/{users.length} users</KText>}

        <View style={{
            flex: 1,
            display: "flex",
            flexDirection: "row",
            flexWrap: "wrap"
        }}>
            {!users || !filteredUsers ? <ActivityIndicator /> :
                filteredUsers.length ? <>{filteredUsers.map(u => {
                    return <Pressable
                    key={u.id}
                    onPress={() => setSelectedUser(u)}
                    style={{
                        backgroundColor: variables.colors.yellow,
                        margin: 2,
                        borderRadius: 5,
                        padding: 10,
                        width: 250,
                    }}>
                        <View style={{display: "flex", width: "100%", flexDirection: "row", justifyContent: "space-between"}}>
                            <View>
                                <KText>{u.firstName} {u.lastName}</KText>
                                <KText style={{fontSize: 10}}>{new Date(u.createdAt).toLocaleString()}</KText>
                            </View>
                            <CircleImage size="xsmall" imageId={`${u.id}/${u.primaryImage}`} thumbnail={true} type="users" />
                        </View>
                        <KText>{u.matchCount} matches</KText>
                    </Pressable>})}
                </>: <><KText>NO USER</KText></>
            }
        </View>

        {selectedUser && <MatchesModal
            userId={selectedUser.id}
            onClose={() => setSelectedUser(undefined)}
            onDeleted={() => {
                // setUsers(users?.filter(u => u.id !== user.id))
                // setSelectedUser(undefined)
            }}
        />}

        {/* <KModal
            visible={!!confirm}
            setVisibility={(visible) => setConfirm(null)}
            style={{
                padding: 20
            }}>
            {!confirm ? null : <>
                <KText>Confirm {confirm.verified ? "un" : ""}verify {confirm.user.email}?</KText>
                <View style={{display: "flex", flexDirection: "row", marginTop: 10}}>
                    <KButton text="YES"
                        color="greenLight"
                        onPress={() => {
                            toggleVerified(confirm.user.id, !confirm.verified)
                            setConfirm(null)
                        }}/>
                    <KButton text="NO"
                        color="primary"
                        onPress={() => {
                            setConfirm(null)
                        }}/>
                </View>
            </>}
        </KModal> */}

    </View>
}