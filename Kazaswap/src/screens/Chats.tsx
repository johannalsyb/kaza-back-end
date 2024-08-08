import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { NavStackParamList } from "../navigation/screens";
import KText from "../components/KText";
import { ActivityIndicator, Pressable, ScrollView, View } from "react-native";
import Menu from "../components/Menu";
import variables from "../styles/variables";
import KIcon from "../components/KIcon/KIcon";
import useAuthentication from "../hooks/useAuthentication";
import KButton from "../components/KButton/KButton";
import { Chat, ChatMessage } from "@kazaswap/common/lib/types/SwapRequest";
import { useEffect, useState } from "react";
import { SwapRequest } from "@kazaswap/common/lib/types/api/swap";
import ChatView from "../components/Views/Chats/Chat";
import { CircleImage } from "../components/CircleImage/CircleImage";
import useIsMobile from "../hooks/useIsMobile";
import Header from "../components/Header";
import KSideModal from "../components/KModal/KSideModal";
import ContractView from "../components/Views/ContractView";
import swaps from "../api/swaps";
import KModal from "../components/KModal/KModal";
import Decline from "../components/Views/SwapRequest/Decline";
import { toastError } from "../components/Toast/Toast";
import VerifyAccount from "../components/Views/SwapRequest/VerifyAccount";
import { timeAgo } from "../utils";
import useConfig from "../hooks/useConfig";
import { useCloseFromOutside } from "../hooks/useCloseFromOutside";
import ChatMenu from "../components/Views/Chats/ChatMenu";
import MenuIcon from "../components/Header/MenuIcon";

type Props = NativeStackScreenProps<NavStackParamList, 'Chats' | 'Chat'>;
export type SwapRequestChat = {
    swapRequest: SwapRequest,
    otherUser: {
        id: string,
        image: string,
        firstName: string
    }
}

export default ({
    route,
    navigation,
}:Props) => {
    const {isMobile} = useIsMobile()
    const auth = useAuthentication()
    const user = auth.user
    const isAdmin = auth.isAdmin
    const [loading, setLoading] = useState(false)
    const [requests, setRequests] = useState<SwapRequest[]>([])
    const [request, setRequest] = useState<SwapRequestChat | undefined>(undefined)
    const [showContractModal, setShowContractModal] = useState(false)
    const [showModal, setShowModal] = useState<React.ReactNode | undefined>(undefined)
    const [showArchive, setShowArchive] = useState(false)
    const [showChatMenuDots, setShowChatMenuDots] = useState<string | null>(null)
    const [showChatMenu, setShowChatMenu] = useState<string | null>(null)

    const {config, overlay} = useConfig()
    const showOverlay = overlay || config?.features.chat === false
    const id = route.params?.id

    const load = (force = false) => {
        if(!id) return
        setLoading(true)
        auth.requests[force ? "reload" : "get"]()
        .then(srs => {
            force && setRequests(srs)
            const sr = srs.find(sr => sr.id === id)
            if(sr) {
                setRequest({
                    swapRequest: sr,
                    otherUser: {
                        id: sr.fromProperty.owner.id === user?.id ? sr.toProperty.owner.id : sr.fromProperty.owner.id,
                        image: sr.fromProperty.owner.id === user?.id ? sr.toProperty.owner.primaryImage : sr.fromProperty.owner.primaryImage,
                        firstName: sr.fromProperty.owner.id === user?.id ? sr.toProperty.owner.firstName : sr.fromProperty.owner.firstName,
                    }
                })
                setShowArchive(sr.status === "declined")
            }
        })
        .catch(err => {
            console.log(err)
        })
        .finally(() => {
            setLoading(false)
        })
    }

    useEffect(() => {
        if(id) load(true)
    }, [id])

    useEffect(() => {
        if(user) {
            setLoading(true)
            auth.requests.get()
            .then(res => {
                setRequests(res)
            })
            .catch(err => {
                console.log(err)
            })
            .finally(() => {
                setLoading(false)
            })
        }
    }, [user])

    const openChat = (sr: SwapRequestChat) => {
        if(request && request.swapRequest.id === sr.swapRequest.id) return
        navigation.navigate('Chat', {id: sr.swapRequest.id})
    }

    const confirmRequest = (rid:string) => {
        setLoading(true)
        swaps.requests.accept(rid)
        .then(res => {
            if(!request || (request.swapRequest.id !== rid)) return
            setRequest({
                ...request,
                swapRequest: res.data
            })
        })
        .catch(e => {
            console.error(e);
            const message =
              e.json?.data?.error ||
              e.statusText ||
              e.message ||
              'An error occured';
            toastError(message);
            if (message === 'User not verified') {
              setShowModal(
                <VerifyAccount onClicked={() => {
                    setShowModal(undefined)
                    setShowContractModal(false)
                }} />,
              );
            }
            // setSwapRequestStatus(prevValue);
          })
        .finally(() => {
            setLoading(false)
        })
    }

    const declineRequest = (rid:string, note: string) => {
        setLoading(true)
        swaps.requests.decline(rid, note)
        .then(res => {
            setRequests(requests.map(r => {
                if(r.id === rid) {
                    r.status = "declined"
                }
                return r
            }))
            setShowArchive(true)
            if(!request || (request.swapRequest.id !== rid)) return
            setRequest({
                ...request,
                swapRequest: res.data
            })
        })
        .catch(e => {
            console.error(e);
            const message =
              e.json?.data?.error ||
              e.statusText ||
              e.message ||
              'An error occured';
            toastError(message);
          })
        .finally(() => {
            setLoading(false)
        })
    }

    const onSwapRequestStatusChange = (status: "accepted" | "declined") => load(true)

    const ShowStatus = () => user && request ? <ContractView
        user={user}
        request={request}
        style={{padding: 20, marginTop: isMobile ? 20 : undefined}}
        onConfirm={() => confirmRequest(request.swapRequest.id)}
        onCancel={() => setShowModal(<Decline
            swapRequest={request.swapRequest}
            onCancel={() => setShowModal(undefined)}
            onDeclined={(sr) => {
                setRequest({
                    ...request,
                    swapRequest: sr
                })
                setShowModal(undefined);
            }}
            onError={() => {
                // setShowModal(undefined)
            }}
        />)}
        loading={loading}
        onNavigateOut={() => setShowContractModal(false)}
        /> : null

    const visibleRequests = requests.filter(r => {
        let createdYrsAgo = 0
        try {
            createdYrsAgo = (Date.now() - new Date(r.createdAt).getTime())/(1000*3600*24*365)
        } catch(e) {}

        if(showArchive && (r.status === "declined" || createdYrsAgo >= 1)) return true
        if(!showArchive && r.status !== "declined" && createdYrsAgo < 1) return true
    }).map(r => {
        let rr = new Date(r.updatedAt).getTime()
        if(r.lastMessage) {
            try {
                const j = JSON.parse(r.lastMessage) as ChatMessage
                rr = new Date(j.at).getTime()
            } catch(err) {}
        }
        return {
            ...r,
            lastUpdateAt: rr
        }
    }).sort((a,b) => {
        return b.lastUpdateAt - a.lastUpdateAt
    })

    const emptyIcon = () => <View style={{width: 40, height: 40}} />
    const backIcon = () => <MenuIcon icon="back" onPress={() => navigation.canGoBack() ? navigation.goBack() : setShowArchive(false)}/>

    let headerLeftComponent = emptyIcon(), headerRightComponent = emptyIcon()
    if(isMobile) {
        if(request) {
            headerLeftComponent = <KIcon name="back" size="medium" style={{
                backgroundColor: 'white',
                borderRadius: 50,
                padding: 10,
            }}
            onPress={() => navigation.navigate("Chats")}/>
        }
        if(!showArchive) {
            headerRightComponent = <KIcon name={request ? "contract" : "archived"} size="medium" style={{
                    backgroundColor: request ? variables.colors.yellow : "white",
                    borderRadius: 50,
                    padding: 10,
                    flex: 1
                }}
                onPress={() => request ? setShowContractModal(true) : setShowArchive(!showArchive)}/>
        } else {
            headerLeftComponent = backIcon()
        }
    }

    const onMessageUpdate = (chat: SwapRequestChat, msg:ChatMessage) => {
        const req = requests.find(r => r.id === chat.swapRequest.id)
        if(!req) return
        req.lastMessage = JSON.stringify(msg)
        setRequests([...requests])
    }

    return <View style={{
              backgroundColor: isMobile ? "white" : variables.colors.greenLight,
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
            }}>

            {isMobile ? <Header
                route={route}
                navigation={navigation}
                options={{}}
                force={true}
                title={request ? <View style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center"
                }}>
                    <CircleImage
                        thumbnail={true}
                        imageId={`${request.otherUser.id}/${request.otherUser.image}`}
                        type="users"
                        style={{width: 40, height: 40, marginRight: 10, marginLeft: 10}}/>
                    <KText>{request.otherUser.firstName}</KText>
                </View> : (showArchive ? "Archive" : "Inbox")}
                leftComponent={headerLeftComponent}
                rightComponent={headerRightComponent}
            /> : null}
            <View style={{
                display: "flex",
                flexDirection: "row",
                flex: 1,
                width: "100%",
                padding: isMobile ? 0 : 20
            }}>
                <View style={{
                    maxWidth: isMobile ? "auto" : 300,
                    borderRadius: isMobile ? 5 : 20,
                    backgroundColor: "white",
                    flex: 1,
                    padding: isMobile ? 10 : 20
                }}>
                    <View style={{
                        display: isMobile ? "none" : "flex",
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 20
                    }}>
                        <KButton
                            icon="chat"
                            text="Inbox"
                            color="light"
                            onPress={() => setShowArchive(false)}
                            style={{marginBottom: 10, borderWidth: 0, width: "50%", backgroundColor: showArchive ? "transparent" : variables.colors.greenLight}}/>
                        <KButton
                            icon="archived"
                            text="Archived"
                            color="light"
                            onPress={() => setShowArchive(true)}
                            style={{marginBottom: 10, borderWidth: 0, width: "50%", backgroundColor: showArchive ? variables.colors.greenLight: "transparent"}}/>
                    </View>
                    <ScrollView>
                    {visibleRequests.length ? visibleRequests.map((request, i) => {
                        const otherUser = request.fromProperty.owner.id === user!.id ? request.toProperty.owner : request.fromProperty.owner
                        const otherUserImage = otherUser.primaryImage && otherUser.primaryImage.length ? otherUser.primaryImage : (
                            otherUser.images && otherUser.images.length ? (otherUser.images as string).split(",")[0] : ""
                        )

                        const lastMessage = request.lastMessage && request.lastMessage.length ? JSON.parse(request.lastMessage) as ChatMessage : null
                        const lastMessageTimeAgo = lastMessage ? timeAgo(typeof lastMessage.at === "string" ? new Date(lastMessage.at).getTime() : lastMessage.at) : null
                        const backgroundColor = `${request.id === id ? variables.colors.yellow : variables.colors.greenLight}${showChatMenuDots === request.id ? "aa" : "ff"}`
                        return <View
                        style={{
                            width: "100%",
                            padding: 10,
                            marginBottom: isMobile ? 5 : 10,
                            borderRadius: isMobile ? 10 : 20,
                            backgroundColor,
                            display: "flex",
                            flexDirection: "row",
                            justifyContent: "space-between",
                            zIndex: showChatMenu !== request.id ? -1 : 0,
                        }}
                        key={`request-${i}`}>
                            {request.newMessage ? <KText style={{
                                fontSize: 10,
                                color: "white",
                                textAlign: "center",
                                width: 14,
                                height: 14,
                                borderRadius: 10,
                                backgroundColor: variables.colors.orange,
                                top: 0,
                                right: 0,
                                position: "absolute"
                            }}>1</KText> : null}
                            <Pressable style={{
                                display: "flex",
                                flexDirection: "row",
                                justifyContent: "flex-start",
                                alignItems: "center",
                                // height: "100%",
                                flex: 1,
                            }}
                            onHoverIn={showArchive ? undefined : () => setShowChatMenuDots(request.id)}
                            onHoverOut={showArchive ? undefined : () => setShowChatMenuDots(null)}
                            onPress={() => {
                                openChat({
                                    swapRequest: request,
                                    otherUser: {
                                        id: otherUser.id,
                                        image: otherUserImage,
                                        firstName: otherUser.firstName
                                    }
                                })
                            }}>
                                <CircleImage
                                    thumbnail={true}
                                    imageId={`${otherUser.id}/${otherUserImage}`}
                                    type="users"
                                    style={{width: 40, height: 40, marginRight: 10}}/>
                                <View style={{
                                    flexDirection: "column"
                                }}>
                                    <KText>{otherUser.firstName}
                                        {lastMessage ? <KText style={{
                                            opacity: 0.4,
                                            fontSize: 10,
                                            marginLeft: 10
                                        }}>
                                            {lastMessageTimeAgo}
                                            </KText>
                                        : null}
                                    </KText>
                                    {request.status === "pending" ?
                                        lastMessage ? <KText style={{
                                            opacity: 0.6,
                                            fontSize: 11,
                                            marginTop: 5
                                        }}>
                                            {lastMessage.message.length > 20 ? lastMessage.message.substring(0, 20) + "..." : lastMessage.message}
                                            </KText>
                                        : null
                                    : <KText style={{
                                        opacity: 0.6,
                                        fontSize: 11,
                                        marginTop: 5
                                    }}>
                                        Request {request.status === "declined" ? "Declined" : "Accepted"}
                                    </KText>}
                                </View>
                            </Pressable>
                            
                            {request.status === "pending" && !showArchive && (isMobile || showChatMenuDots === request.id) ? <Pressable
                                style={{height: "100%", justifyContent: "center"}}
                                onPress={showArchive ? undefined : () => setShowChatMenu(request.id)}
                                onHoverIn={showArchive ? undefined : () => setShowChatMenuDots(request.id)}
                                onHoverOut={showArchive ? undefined : () => setShowChatMenuDots(null)}
                            >
                                <KIcon name="more" />
                            </Pressable> : null}
                            <ChatMenu
                                show={request.status === "pending" && showChatMenu === request.id}
                                setShow={(b) => setShowChatMenu(b ? request.id : null)}
                                onAccept={() => confirmRequest(request.id)}
                                onDecline={() => declineRequest(request.id, "Declined")}
                                />
                        </View>
                    }) : <View style={{alignItems: "center"}}>
                            <KIcon name="smile" size="xxlarge" style={{stroke: "black"}} />
                            <KText style={{alignSelf: "center"}}>{showArchive ? "No archived chats" : "No chats in inbox"}</KText>
                        </View>}
                    </ScrollView>
                </View>
                {!isMobile ? <>
                    <View style={{
                        flex: 1,
                        borderRadius: 20,
                        backgroundColor: "white",
                        marginLeft: 20,
                        marginRight: 20,
                        display: "flex",
                        flexDirection: "column",
                        padding: 20,
                        justifyContent: "center"
                    }}>{loading ? <ActivityIndicator /> :
                    !user || (requests && !requests.length) ?
                        <View style={{flex: 1, alignItems: "center", width: "100%", justifyContent: "center"}}>
                            <KIcon name="chat" size="xxlarge" style={{
                            stroke: "black",
                            backgroundColor: isMobile ? variables.colors.greenLight : "white",
                            borderRadius: 100,
                            padding: 10,
                            }} />
                            <KText style={{fontSize: 25, fontWeight: "bold", marginTop: 20, marginBottom: 20}}>
                                {user ? "Chat is empty" : "Please login to see your chats"}
                            </KText>
                            {user ?
                                <>
                                    <KText style={{maxWidth: isMobile ? "60%" : "25%", textAlign: "center", lineHeight: 20}}>
                                        Start exploring for Swap
                                    </KText>
                                    <KButton text="Explore" color="primary" onPress={() => {
                                    navigation.navigate('Home')
                                    }} style={{marginTop: 20}}/>
                                </>
                            :  (!isMobile ? <View style={{
                                display: "flex",
                                flexDirection: "row",
                                justifyContent: "space-evenly",
                                width: "30%",
                                marginTop: 20,
                            }}>
                                <KButton text="Sign in" color={isMobile ? "greenLight" : "light"} onPress={() => {
                                    navigation.navigate('Login')
                                }} style={{
                                    borderColor: !isMobile ? "black" : "white",
                                    borderWidth: 1,
                                    marginRight: 10,
                                }}/>
                                <KButton text="Register" color="primary" onPress={() => {
                                    navigation.navigate('SignUp')
                                }}/>    
                            </View> : null)}
                        </View> :
                        !request ? <View style={{alignItems: "center"}}>
                            <KIcon name="chat" size="xxlarge" style={{stroke: "black"}} />
                            <KText style={{
                                textAlign: "center",
                                padding: 20
                            }}>Select a request to start chatting</KText>
                        </View> :
                            <ChatView
                                request={request}
                                onSwapRequestStatusChange={onSwapRequestStatusChange}
                                onMessageUpdate={(msg) => onMessageUpdate(request, msg)}
                                />
                        }
                    </View>

                    <View style={{
                        maxWidth: 320,
                        borderRadius: 20,
                        backgroundColor: "white",
                        flex: 1,
                        alignItems: "flex-start",
                        justifyContent: "flex-start",
                        flexDirection: "column",
                        display: "flex",
                        // paddingTop: 20,
                    }}>
                        {request ? ShowStatus(): null}
                    </View>
                </> : <>
                    {request ? <View style={{
                        position: "absolute",
                        width: "100%",
                        height: "100%",
                        top: 0,
                        left: 0,
                        zIndex: 1000,
                        backgroundColor: "white",
                        paddingLeft: 10,
                        paddingRight: 10,
                        paddingBottom: 20,
                    }}>
                        <ChatView
                            request={request}
                            onSwapRequestStatusChange={onSwapRequestStatusChange}
                            onMessageUpdate={msg => onMessageUpdate(request, msg)}
                            />
                    </View>
                    : null}

                </>}
            </View>
            {/* } */}
        {isMobile && !request ? <Menu navigate={navigation.navigate}/> : null}
        {isMobile && user && request ? <KSideModal visible={showContractModal} onClose={() => setShowContractModal(false)}>
            {ShowStatus()}
        </KSideModal> : null}
        {user && request ? <KModal visible={!!showModal} setVisibility={() => setShowModal(undefined)}>
            {showModal}
        </KModal> : null}

        {(showOverlay && (!user || !isAdmin)) && <View style={{
                width:"100%",
                height: "100%",
                position: "absolute",
                top: 0,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                zIndex: 100,
                //@ts-ignore
                backdropFilter: "blur(10px)",
                //@ts-ignore
                webkitBackdropFilter: "blur(10px)"
            }}>
                <View style={{backgroundColor: variables.colors.darkYellow, padding: 20, borderRadius: 20, justifyContent: "center", alignItems: "center", alignContent: "center", top: 10}}>
                <KIcon name="logoText2" size={150}/>
                <KText style={{color: "black", textAlign: "center"}}>{overlay || "Coming soon 🚀"}</KText>
                </View>
            </View>}
    </View>
}