import { useEffect, useState } from "react"
import useAuthentication from "../../../hooks/useAuthentication"
import { Api } from "@kazaswap/common"
import users from "../../../api/users"
import { toastError } from "../../Toast/Toast"
import { ActivityIndicator, Linking, Pressable, ScrollView, View } from "react-native"
import variables from "../../../styles/variables"
import KText from "../../KText"
import { timeAgo } from "../../../utils"
import KIcon from "../../KIcon/KIcon"
import { CircleImage } from "../../CircleImage/CircleImage"
import useIsMobile from "../../../hooks/useIsMobile"

type Props = {
    unreadNotifications: number,
}

export default (props:Props) => {
    const auth = useAuthentication()
    const {isMobile} = useIsMobile()
    const [loading, setLoading] = useState<boolean>(true)
    const [notifications, setNotifications] = useState<Api.Users.Notifications>()
    const [hovered, setHovered] = useState<string | null>(null);

    const readNotification = (id: string) => {
        return auth.notifications.read(id)
        .then(() => {
            setNotifications(notifications?.filter(nn => id !== nn.id))
            localStorage.setItem("unreadNotifications", `${(notifications?.length || 1)-1}`)
        })
    }

    const readAllNotifications = () => {
        return auth.notifications.readAll()
        .then(() => {
            setNotifications([])
            localStorage.setItem("unreadNotifications", `0`)
        })
    }

    useEffect(() => {
        if(!auth.user) return
        setLoading(true)
        auth.notifications.get()
        .then(setNotifications)
        .catch(e => {
            if(typeof e === "object") {
                // DO NOTHING
            } else {
                toastError(e)
            }
        })
        .finally(() => setLoading(false))
    }, [props.unreadNotifications])


    if(!auth.user || loading || !notifications) return <ActivityIndicator color={variables.colors.yellow} />
    return notifications.length ? <View style={{
        width: "100%",
        paddingTop: isMobile ? 20 : 0,
        paddingLeft: isMobile ? 10 : 0,
        paddingRight: isMobile ? 10 : 0,
    }}>
        <View style={{display: "flex", flexDirection:"row", justifyContent: "space-between", marginBottom: 5}}>
            <KText style={{textAlign: "left"}}>Notifications</KText>
            <KText
                style={{
                    textAlign: "right",
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "center",
                    marginRight: isMobile ? 40 : 0
                }}
                onPress={() => readAllNotifications()}>
                <KIcon name="tickCircle" size="small" style={{marginRight: 5}} />
                Mark all as read
            </KText>
        </View>
        <ScrollView>
            {notifications.map(n => {
                const notificationTimeAgo = timeAgo(n.time)
                const isHovered = hovered === n.id || hovered === n.id+"_delete"
                return <View
                    key={n.id}
                    style={{
                        padding: 10,
                        backgroundColor: isHovered ? variables.colors.yellow : variables.colors.greenLight,
                        marginBottom: 5,
                        borderRadius: 10,
                    }}>
                        <Pressable
                            onHoverIn={() => setHovered(n.id)}
                            onHoverOut={() => setHovered(null)}
                            onPress={() => {
                                if(n.url)   Linking.openURL(n.url)
                                readNotification(n.id)
                            }}
                            style={{flexDirection: "row", alignItems: "center"}}
                            >
                            {n.from ? <CircleImage source={users.getProfilePictureUrl(n.from)} size="xsmall" style={{marginRight: 10}} /> : null}
                            <View style={{flexDirection: "column", alignItems: "center"}}>
                                <KText>{n.title || "Click to open"}</KText>
                            </View>
                            <KText style={{textAlign: "right", position:"absolute", right:5, bottom: 5}}>{notificationTimeAgo}</KText>

                        </Pressable>
                        <Pressable
                            onHoverIn={() => setHovered(n.id+"_delete")}
                            onHoverOut={() => setHovered(null)}
                            onPress={() => readNotification(n.id)}
                            style={{
                                backgroundColor: variables.colors.orange,
                                position:"absolute",
                                borderRadius: 20,
                                padding: 5,
                                right: 0,
                                top: -2,
                                display: isHovered ? "flex" : "none",
                                zIndex: 100,
                            }}>
                            <KIcon name="crossCircle" />
                        </Pressable>
                    </View>
            })}
        </ScrollView>
    </View> : <View style={{padding: 10}}>
        <KText>You have no notifications</KText>
    </View>
}