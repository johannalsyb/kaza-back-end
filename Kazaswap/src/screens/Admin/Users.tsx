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

type Filters = {
    verified?: 0 | 1,
    onboardingStep: number,
    search?: string
}

export default () => {
    const {user} = useAuthentication()
    const {config} = useConfig()

    if(!user || (user.role !== "admin" && user.role !== "superadmin")) {
        return null
    }

    const [users, setUsers] = useState<User[]>()
    const [filters, setFilters] = useState<Filters>({
        verified: 0,
        onboardingStep: 0
    })
    const [selectedUser, setSelectedUser] = useState<{user: User, phone:Phone} | undefined>()
    const [confirm, setConfirm] = useState<null | {user:User, verified:boolean}>(null)
    const [currentPage, setCurrentPage] = useState(1)
    const [loading, setLoading] = useState(false)
    
    const load = () => {
        setLoading(true)
        return admin.users.get({page: `${currentPage}`, sort: `-createdAt`})
        .then(d => setUsers([...(users || []), ...d.data]))
        .finally(() => setLoading(false))
    }

    useEffect(() => {
        load()        
    }, [currentPage])

    useEffect(() => {
        if(currentPage === 1) load()        
    }, [])

    const sendResetPassword = (id:string) => {
        admin.users.resetPassword(id)
        .then(d => {
            toastSuccess(`EMAIL SENT (${d.data.url})`, "Reset password")
        })
        .catch(e => {
            toastError(JSON.stringify(e))
        })
    }

    const toggleVerified = (id:string, value:boolean) => {
        admin.users.verify(id, value)
        .then(d => {
            toastSuccess(`USER ${d.data.email} NOW ${value ? "" : "UN"}VERIFIED`)
            setUsers(users?.map(u => {
                if(u.id === id) u.verified = value
                return u
            }))
        })
        .catch(e => {
            toastError(JSON.stringify(e))
        })
    }

    const setOnboarding = (id:string, reset:boolean) => {
        usersApi.update({id, onboarding: JSON.stringify({step:2, data: defaultProperty, completed:!reset})})
        .then(d => {
            toastSuccess(`USER ${d.data.email} UPDATED`)
        })
        .catch(e => {
            toastError(JSON.stringify(e))
        })
    }

    const filteredUsers = users?.filter(u => {
        if(filters.verified !== undefined && !!u.verified !== !!filters.verified) return false
        if(filters.search && !(u.email+" "+u.firstName+" "+u.lastName+" "+u.id).toLowerCase().includes(filters.search.trim().toLowerCase())) return false
        const onboarding = u.onboarding ? JSON.parse(u.onboarding) as OnboardingInfo : undefined
        if(filters.onboardingStep > 0) {
            if(filters.onboardingStep === 5) {
                if(onboarding?.completed) return true
                else return false
            }
            else if(onboarding?.step !== filters.onboardingStep) return false
        }
        return true
    })

    return <View style={{flex: 1}}>

        <View style={{padding: 5, flexDirection: "row", justifyContent: "space-between"}}>
            <View style={{flexDirection: "row"}}>
                {([["All", undefined], ["Verified", 1], ["Unverified", 0]] as [string, any][]).map(i => 
                    <KButton text={i[0]} color={i[1] === filters.verified ? "primary" : "light"} onPress={() => setFilters({...filters, verified: i[1]})} />
                )}
            </View>
            <View style={{flexDirection: "row", alignItems: "center"}}>
                OB step: <KNumberInput
                    min={0}
                    max={5}
                    onChange={n => setFilters({...filters, onboardingStep: n as number})}
                    topStyle={{width: 200, marginRight: 5}}
                    value={`${filters.onboardingStep}`}/>
                <KTextInput placeholder="Search user" onChangeText={v => setFilters({...filters, search: v.length ? v : undefined})} />
            </View>
        </View>

        {users && <View>Current view: {filteredUsers?.length || 0}/{users.length} users</View>}

        <View style={{
            flex: 1,
            display: "flex",
            flexDirection: "row",
            flexWrap: "wrap"
        }}>
            {!users || !filteredUsers ? <ActivityIndicator /> :
                filteredUsers.length ? <>{filteredUsers.map(u => {
                    const onboarding = u.onboarding ? JSON.parse(u.onboarding) as OnboardingInfo : undefined
                    return <Pressable
                    onPress={() => {
                        parsePhone(u.phone)
                        .then(p => {
                            if(!p) toastError("Cannot parse user phone (1)")
                            setSelectedUser({user:u, phone:p!})
                        })
                        .catch(err => {
                            toastError("Cannot parse user phone (2)")
                        })
                    }}
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
                        <KText>{u.email} {u.emailVerified ? "✅" : "❌"}</KText>
                        <KText>{u.phone} {u.phoneVerified ? "✅" : "❌"}</KText>

                        <KButton style={{
                            width: "100%",
                            marginBottom: 5,
                            backgroundColor: u.verified ? variables.colors.orange : variables.colors.green,
                        }}
                        // disabled={!u.verified && !onboarding?.completed ? true : false}
                        textStyle={{color: "black"}}
                        text={u.verified ? "Unverify" : `Verify ${u.firstName}`} onPress={() => setConfirm({user: u, verified: u.verified})} />
                        <View style={{
                            width: "100%",
                            marginBottom: 5,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            borderColor: "black",
                            borderWidth: 1,
                            borderRadius: 10,
                            padding: 5,
                            backgroundColor: onboarding?.completed ? variables.colors.green : variables.colors.orange
                        }}>
                            <KText>OB step:{onboarding?.step || "-"} completed:{onboarding?.completed ? "✅" : "❌"}</KText>
                            <View style={{flexDirection: "row"}}>
                                <KButton style={{width: "auto", height: "auto", padding: 3, marginRight: 3}} textStyle={{fontSize: 10}} text={"Reset"} onPress={() => setOnboarding(u.id, true)} />
                                <KButton disabled={onboarding?.completed} style={{width: "auto", height: "auto", padding: 3}} textStyle={{fontSize: 10}} text={"Mark complete"} onPress={() => setOnboarding(u.id, false)} />
                            </View>
                        </View>
                        <KButton style={{width: "100%", marginBottom: 5}} text="Send Reset Password Email" onPress={() => sendResetPassword(u.id)} />
                        {/* <KButton style={{width: "100%", marginBottom: 5}} color="greenLight" text="OPEN" onPress={() => {
                            parsePhone(u.phone)
                            .then(p => {
                                if(!p) toastError("Cannot parse user phone (1)")
                                setSelectedUser({user:u, phone:p!})
                            })
                            .catch(err => {
                                toastError("Cannot parse user phone (2)")
                            })

                        }} /> */}
                    </Pressable>})}
                {config && <KButton text="Load more" onPress={() => setCurrentPage(currentPage + 1)} loading={loading} disabled={users.length === config.query.limit*currentPage}/>}   
                </>: "NO USER"
            }
        </View>

        <UserModal user={selectedUser} onClose={() => setSelectedUser(undefined)} onDeleted={() => {
            setUsers(users?.filter(u => u.id !== selectedUser?.user.id))
            setSelectedUser(undefined)
        }}/>

        <KModal
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
        </KModal>

    </View>
}