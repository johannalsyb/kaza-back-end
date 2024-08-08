import React, { useEffect, useState } from "react"
import { Pressable, Text } from "react-native"
import useAuthentication from "../../hooks/useAuthentication"
import Property from "@kazaswap/common/lib/types/Property"
import admin from "../../api/admin"
import { ActivityIndicator, ScrollView, View, ViewStyle } from "react-native"
import variables from "../../styles/variables"
import KText from "../../components/KText"
import KButton from "../../components/KButton/KButton"
import { toastError, toastSuccess } from "../../components/Toast/Toast"
import KSideModal from "../../components/KModal/KSideModal"
import useConfig from "../../hooks/useConfig"
import EditProperty from "../../components/Views/Account/EditProperty"
import KCarousel from "../../components/KCarousel"
import KNumberInput from "../../components/Form/KNumberInput/KNumberInput"
import KSlider from "../../components/KSlider/KSlider"
import KTextInput from "../../components/Form/KTextInput/KTextInput"
import PropertyModal, { AttractivenessView } from "./PropertyModal"
import { Chat, SwapRequest } from "@kazaswap/common/lib/types/SwapRequest"
import KImage from "../../components/KImage/KImage"
import ChatEvent from "../../components/Views/Chats/ChatEvent"
import ChatMessage from "../../components/Views/Chats/ChatMessage"

type Filters = {
    status: string
}

type UserDetails = {
    id: string
    firstName: string
    primaryImage: string
}

type ExtSwapRequest = SwapRequest & {
    from: UserDetails
    to: UserDetails
}

export default () => {
    const {user} = useAuthentication()
    const config = useConfig()

    if(!user || (user.role !== "admin" && user.role !== "superadmin")) {
        return null
    }

    const [swapRequests, setSwapRequests] = useState<ExtSwapRequest[]>()
    const [filters, setFilters] = useState<Filters>({
        status: "All"
    })
    const [selectedSR, setSelectedSR] = useState<{request: SwapRequest, chat: Chat, from: UserDetails, to: UserDetails}>()
    const [currentPage, setCurrentPage] = useState(1)

    const load = () => admin.swapRequests.all({page: `${currentPage}`, sort: `-createdAt`, "fields[]": "*,from.id,from.firstName,from.primaryImage,to.id,to.firstName,to.primaryImage"})
    .then(d => {
        setSwapRequests([...(swapRequests || []), ...d.data] as ExtSwapRequest[])
    })
    
    useEffect(() => {
        load()
    }, [currentPage])

    useEffect(() => {
        if(currentPage === 1)   load() 
    }, [])


    const getSR = (id:string, from:UserDetails, to:UserDetails) => {
        admin.swapRequests.get(id)
        .then(sr => {
            if(!sr) return
            setSelectedSR({...sr.data, from, to})
        })
        .catch(e => {
            toastError(JSON.stringify(e))
        })
    }

    return <View style={{flex: 1}}>

        <View style={{padding: 5, flexDirection: "row", justifyContent: "space-between"}}>
            <View style={{flexDirection: "row"}}>
                {(["All", "pending", "accepted", "declined"]).map(i => 
                    <KButton key={i} text={i.capitalize()} color={i === filters.status ? "primary" : "light"} onPress={() => setFilters({...filters, status: i})} />
                )}
            </View>
        </View>

        <View style={{
            flex: 1,
            display: "flex",
            flexDirection: "row",
            flexWrap: "wrap"
        }}>
            {!swapRequests ? <ActivityIndicator /> :
                swapRequests.length ? <>{swapRequests.map(u => {
                if(filters.status !== "All" && u.status !== filters.status) return null
                return <Pressable
                key={u.id}
                onPress={() => getSR(u.id, u.from, u.to)}
                style={{
                    backgroundColor: u.status === "pending" ? variables.colors.yellow : (u.status === "accepted" ? variables.colors.green : variables.colors.orange),
                    margin: 2,
                    borderRadius: 5,
                    padding: 10,
                    width: 250,
                    display: "flex",
                    flexDirection: "column",
                }}>
                    <View style={{flexDirection: "row", justifyContent: "space-between"}}>
                        <KText>{u.createdAt.split("T")[0]}</KText>
                        <KText>{u.status}</KText>
                    </View>
                    <View style={{flexDirection: "row", justifyContent: "space-between", alignItems: "center"}}>
                        <View style={{flexDirection: "column", justifyContent: "center", alignItems: "center"}}>
                            <KText>{u.from.firstName} {!!u.fromAccepted ? "✅" : "⏱️"}</KText>
                            <KImage type="users" thumbnail={true} imageId={`${u.from.id}/${u.from.primaryImage}`}  style={{width: 50, height: 50, borderRadius: 25}} />
                        </View>
                        <KText>{"->"}</KText>
                        <View style={{flexDirection: "column", justifyContent: "center", alignItems: "center"}}>
                            <KText>{u.to.firstName} {!!u.toAccepted ? "✅" : "⏱️"}</KText>
                            <KImage type="users" thumbnail={true} imageId={`${u.to.id}/${u.to.primaryImage}`}  style={{width: 50, height: 50, borderRadius: 25}} />
                        </View>
                    </View>
                </Pressable>})}
                <KButton text="Load more" onPress={() => setCurrentPage(currentPage + 1)} />   
                </> : "NO Swap Requests"
            }
        </View>

        <KSideModal visible={!!selectedSR} onClose={() => setSelectedSR(undefined)}>
            {selectedSR ? <View style={{
                display: "flex",
                flexDirection: "column",
                padding: 10,
                width: "100%",
                flex: 1,
            }}>
                <KText>Created at: {selectedSR.request.createdAt}</KText>
                <KText>Status: {selectedSR.request.status}</KText>
                <KText>From: {selectedSR.from.firstName} {!!selectedSR.request.fromAccepted ? "✅" : "⏱️"}</KText>
                <KText>To: {selectedSR.to.firstName} {!!selectedSR.request.toAccepted ? "✅" : "⏱️"}</KText>
                <ScrollView
                    style={{}}
                    contentContainerStyle={{
                        flex: 1,
                        borderWidth: 1,
                        borderRadius: 10,
                        width: "100%",
                    }}>
                    <ChatEvent
                        message={{
                            type: "new",
                            at: new Date(selectedSR.request.createdAt).getTime()
                        }}
                        fromMe={false}
                        fromFirstName={selectedSR.request.from}/>
                        {selectedSR.chat.length ? selectedSR.chat.map((message, i) => {
                            const sender = message.from === selectedSR.request.from ? selectedSR.from : selectedSR.to
                            const receiver = message.from === selectedSR.request.from ? selectedSR.to : selectedSR.from
                            return <ChatMessage
                                key={`msg_${i}`}
                                message={message}
                                fromFirstName={sender.firstName}
                                fromImageId={`${sender.id}/${sender.primaryImage}`}
                                toFirstName={receiver.firstName}
                                toImageId={`${receiver.id}/${receiver.primaryImage}`}
                                onAttachmentPressed={() => {}}
                                style={{
                                    // marginTop: isMobile && i === 0 ? 10 : 0,
                                }} />
                            })
                        : <KText style={{alignSelf: "center"}}>No Messages</KText>}
                </ScrollView>
            </View> : <ActivityIndicator />}
        </KSideModal>
    </View>
}