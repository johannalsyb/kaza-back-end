import { useEffect, useRef, useState } from "react"
import { ActivityIndicator, ScrollView, View, StyleSheet, Image } from "react-native"
import KTextInput from "../../Form/KTextInput/KTextInput"
import KButton from "../../KButton/KButton"
import swaps from "../../../api/swaps"
import { Chat, ChatMessage as ChatMessageT, SwapRequest } from "@kazaswap/common/lib/types/SwapRequest"
import { toastError, toastWarning } from "../../Toast/Toast"
import KText from "../../KText"
import useAuthentication from "../../../hooks/useAuthentication"
import variables from "../../../styles/variables"
import { CircleImage } from "../../CircleImage/CircleImage"
import useChatFeed from "../../../hooks/useChatFeed"
import { SwapRequestChat } from "../../../screens/Chats"
import useIsMobile from "../../../hooks/useIsMobile"
import KIcon from "../../KIcon/KIcon"
import ChatMessage from "./ChatMessage"
import KFileUpload, {Handle as KFileUploadHandle} from "../../Form/KFileUpload"
import { set } from "../../../utils/Storage/storage"
import Attachment from "./Attachment"
import KModal from "../../KModal/KModal"
import ProgressBar from "../../ProgressBar"
import ChatEvent from "./ChatEvent"
import { isImageExtension, isVideoExtension } from "../../../utils/pictures"
import { resizeImage } from "../../../hooks/useResizeImage"
import useConfig from "../../../hooks/useConfig"

type Props = {
    request: SwapRequestChat,
    onSwapRequestStatusChange: (status: "accepted" | "declined") => void,
    onMessageUpdate: (message: ChatMessageT) => void,
}

const msgsMap = new Map<string, ChatMessageT[]>()

export default ({
    request,
    onSwapRequestStatusChange,
    onMessageUpdate,
}:Props) => {
    const {config} = useConfig()
    const [text, setText] = useState<{text: string, attachments: string[]}>({text: "", attachments: []})
    const [loading, setLoading] = useState<boolean>(false)
    const [progress, setProgress] = useState<[number, number] | null>(null)
    const [messages, setMessages] = useState<Chat>()
    const [attachment, setAttachment] = useState<string | null>(null)
    const {user} = useAuthentication()
    const {isMobile} = useIsMobile()
    const [swapRequest, setSwapRequest] = useState<{
        swapRequest: SwapRequest,
        otherUser: {
            id: string,
            image: string,
            firstName: string
        },
    }>(request)

    const fileUploadRef = useRef<KFileUploadHandle>(null)

    const onMessage = (message: ChatMessageT) => {
        const msgs = msgsMap.get(swapRequest.swapRequest.id) || [] // Get messages from map
        msgs.push(message)
        setMessages(msgs)
        if(message.type) {
            onSwapRequestStatusChange(message.type)
        }
        onMessageUpdate(message)
    }
    const {connected} = useChatFeed({
        swapRequestId: swapRequest.swapRequest.id,
        status: swapRequest.swapRequest.status,
        onMessage
    })

    const svref = useRef<ScrollView>(null)

    const send = () => {
        if(!text.text.length && !text.attachments.length) return
        if(!swapRequest.swapRequest.id) return
        if(swapRequest.swapRequest.status === "declined") return
        setLoading(true)

        let promise
        if(text.attachments.length) {
            promise = new Promise<void>(async (res, rej) => {
                for(var i = 0; i < text.attachments.length; i++) {
                    setProgress([i, text.attachments.length])
                    await swaps.requests.chat.send(swapRequest.swapRequest.id, i === 0 ? text.text : "", [text.attachments[i]])
                    .catch(err => toastError("An error occured uploading this file"))
                }
                res()
            })
        } else {
            promise = swaps.requests.chat.send(swapRequest.swapRequest.id, text.text)
        }

        promise
        .then(r => {            
            setText({text: "", attachments: []})
            setProgress(null)
            // setMessages(messages ? [...messages, r.data] : [r.data]) .
            if(r) onMessageUpdate(r.data)
        })
        .catch(e => {
            console.log(e)
        })
        .finally(() => {
            setLoading(false)
        })
    }

    useEffect(() => {
        svref.current?.scrollToEnd({animated: true})
        if(messages) {
            msgsMap.set(swapRequest.swapRequest.id, [...messages])
        }
    }, [messages])

    useEffect(() => {
        setSwapRequest(request)
    }, [request])

    useEffect(() => {
        if(!swapRequest.swapRequest.id) return
        setLoading(true)
        swaps.requests.chat.get(swapRequest.swapRequest.id)
        .then(r => {
            setMessages(r.data)
        })
        .catch(e => {
            console.log(e)
            toastError("An error occured")
            setMessages([])
        })
        .finally(() => {
            setLoading(false)
        })
    }, [swapRequest])

    useEffect(() => {        
        return () => {
            msgsMap.delete(swapRequest.swapRequest.id)
        }
    }, [])

    if(!user) return null

    const otherUserImageId = `${swapRequest.otherUser.id}/${swapRequest.otherUser.image}`
    const myImageId = `${user.id}/${((user.primaryImage || user.images) as string)?.split(',')[0]}`
    const fromMe = swapRequest.swapRequest.from === user.id
    return <>
        <ScrollView
            ref={svref}
            onContentSizeChange={() => svref.current?.scrollToEnd({animated: true})}
            contentContainerStyle={{
                flex: 1,
            }}>
            <ChatEvent
                message={{
                    type: "new",
                    at: new Date(swapRequest.swapRequest.createdAt).getTime()
                }}
                fromMe={fromMe}
                fromFirstName={fromMe ? user.firstName : swapRequest.otherUser.firstName}/>
            {messages ? 
                (messages.length ? messages.map((message, i) => {
                    const msgFromMe = message.from === user.id
                    const fromImageId = msgFromMe ? myImageId : otherUserImageId
                    const fromFirstName = msgFromMe ? user.firstName : swapRequest.otherUser.firstName
                    const toImageId = msgFromMe ? otherUserImageId : myImageId
                    const toFirstName = msgFromMe ? swapRequest.otherUser.firstName : user.firstName

                    return <ChatMessage
                        key={`msg_${i}`}
                        message={message}
                        fromImageId={fromImageId}
                        toImageId={toImageId}
                        fromFirstName={fromFirstName}
                        toFirstName={toFirstName}
                        onAttachmentPressed={setAttachment}
                        style={{
                            marginTop: isMobile && i === 0 ? 10 : 0,
                        }} />
                    })
                : <KText style={{alignSelf: "center"}}>No Messages</KText>) : <ActivityIndicator size="large" color={variables.colors.yellow}/>}
        </ScrollView>
        {request.swapRequest.status !== "declined" ? <View style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 20
        }}>
            <KTextInput
                inputStyles={{borderRadius: 10, textAlign: "left"}}
                topStyle={{flex: 1, marginRight: 10, borderRadius: 15}}
                value={text.text}
                multiline={true}
                onChangeText={t => setText({...text, text: t})}
                attachments={text.attachments.map((a, i) => <>
                    <Attachment key={`attachment_${i}`} attachment={a} style={{marginLeft: i === 0 ? 0 : 0}}/>
                    <KIcon
                        name="crossCircle"
                        onPress={() => {
                            text.attachments.splice(i, 1)
                            setText({...text, attachments: [...text.attachments]})
                        }}
                        style={{
                            backgroundColor: variables.colors.orange,
                            position: "relative",
                            padding: 5,
                            left: -15,
                            borderRadius: 30,
                            width: 15,
                            opacity: !!progress ? 0 : 1
                        }}/>
                </>)}
                onSubmitEditing={send}
                enterKeyHint={loading ? "done" : "send"}
                onKeyPress={({nativeEvent}) => {
                    if(nativeEvent.key === "Enter" && !loading) {
                        send()
                    }
                }}
                editable={connected && !loading}
                />
            <KIcon
                name="attach"
                size="large"
                onPress={() => {
                    if(loading) return
                    if(text.attachments.length >= 10) {
                        toastWarning("Maximum 10 files per message")
                        return
                    }
                    if(fileUploadRef && fileUploadRef.current) {
                        fileUploadRef.current.open();
                    }
                }}
                style={{
                    marginRight: 10,
                    stroke: variables.colors.grey
                }}
                />
            <KFileUpload
                multiple={true}
                max={10}
                ref={fileUploadRef}
                accept={["image/*", "video/*"].join(",")}
                onFiles={(files) => {
                    if(files.length > 10) {
                        toastWarning("Maximum 10 files per message")
                        files = files.slice(0, 10)
                    }
                    Promise.all(files.map(f => resizeImage(f, config?.images.properties.resizePx || 1200)))
                    .then(resizedFiles => {
                        setText({...text, attachments: [...text.attachments, ...resizedFiles]})
                    })
                }} />
            <KButton
                color="primary"
                loading={loading || !!progress}
                size={isMobile ? "small" : "medium"}
                onPress={send}>
                    {isMobile ? 
                        <KIcon
                            name="chevronRight"
                            size="large"
                            style={{stroke: variables.colors.yellow}}/>
                    : <KText style={{color: variables.colors.yellow}}>Send</KText>}
            </KButton>
        </View> : null}
        {/* <KModal
            visible={!!progress}
            setVisibility={() => setProgress(null)}
            >
            {progress ? <>
                <KText>Sending {`${progress[0]}/${progress[1]}`}...</KText>
                <ProgressBar pcent={progress[0]*100/progress[1]} width={200}/>
            </> : null}
        </KModal> */}

        <KModal
            visible={!!attachment}
            setVisibility={() => setAttachment(null)}
            style={{backgroundColor: "transparent", width: "100%", height: "100%"}}
            crossStyle={{backgroundColor: "white", borderRadius: 30, padding: 5}}
            >
            {!!attachment && <>
                {isImageExtension(attachment.split(".").pop() || "") && <Image
                    key={`attachment_i`}
                    source={{uri: attachment}}
                    style={{
                        width: "100%",
                        height: "90%",
                        borderRadius: 10,

                        resizeMode: "contain"
                    }} />}
                {isVideoExtension(attachment.split(".").pop() || "") && <video
                    key={`attachment_v`}
                    playsInline={true}
                    controls={true}
                    src={attachment}
                    style={{
                        width: "100%",
                        height: "90%",
                        borderRadius: 10,
                    }}
                    />}
            </>}
        </KModal>
    </>
}