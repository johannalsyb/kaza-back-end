import { ActivityIndicator, ScrollView, View } from "react-native"
import KText from "../../KText"
import { useEffect, useState } from "react"
import swapsApi from "../../../api/swaps"
import { Api } from "@kazaswap/common"
import variables from "../../../styles/variables"
import KIcon from "../../KIcon/KIcon"
import KButton from "../../KButton/KButton"
import { useNavigation, useRoute } from "@react-navigation/native"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { NavStackParamList } from "../../../navigation/screens"
import PropertyCard from "../../PropertyCard"
import useAuthentication from "../../../hooks/useAuthentication"
import KSideModal from "../../KModal/KSideModal"
import Swap from "../Swap"
import useIsMobile from "../../../hooks/useIsMobile"

export default () => {
    const [loading, setLoading] = useState<boolean>(false)
    const [swaps, setSwaps] = useState<Api.Swaps.Swap[]>()
    const {user} = useAuthentication()
    const navigation = useNavigation<NativeStackNavigationProp<NavStackParamList, "Account" | 'Swap', undefined>>()
    const route = useRoute()
    //@ts-ignore
    const swapId = route.params?.id
    const [modal, setModal] = useState<boolean>(!!swapId)
    const {isMobile} = useIsMobile()

    useEffect(() => {
        if(!swapId) return;
        setModal(true);
      }, [swapId])

    const load = () => {
        setLoading(true)
        swapsApi.swaps.all()
        .then(r => {
            setSwaps(r.data)
        })
        .catch(e => {
            console.error(e)
            setSwaps([])
        })
        .finally(() => {
            setLoading(false)
        })
    }

    useEffect(() => {
        if(swaps === undefined) load()
    }, [])

    if(!user) return <KText>You must be logged in to view this page</KText>

    return <ScrollView style={{flex: 1, minHeight: 400, paddingLeft: 20, paddingRight: 20, paddingTop: 20, display: "flex"}} contentContainerStyle={{display: "flex", flexDirection: "row", flexWrap: "wrap"}}>
        {loading ? <ActivityIndicator color={variables.colors.yellow} style={{marginTop: 20, marginBottom: 20}}/> : 
            <>
                {swaps?.map(s => {
                    const dd = new Date(s.updatedAt)
                    return <PropertyCard
                        key={`swap_${s.id}`}
                        property={s.request.from === user.id ? s.request.toProperty : s.request.fromProperty}
                        hoverable={false}
                        style={{
                            aspectRatio: 1/1.3,
                            marginRight: isMobile ? 0 : 10,
                            marginBottom: 10
                        }}
                        bottomComponent={<View style={{
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginTop: 0,
                            marginBottom: 10,
                        }}>
                            {!isNaN(dd.getTime()) ? <KText>{dd.toLocaleDateString()}</KText> : null}
                            <KButton style={{marginBottom:5, marginTop:5}}icon="swap" text="View swap" color="secondary" onPress={() => {navigation.navigate("Swap", {id: s.id})}}/>
                            {/* <KButton style={{marginBottom:5, marginTop:5}}icon="contract" text="View contract" size="medium" color="secondary" onPress={() => navigation.navigate("Swap", {swapId: s.id})}/> */}
                        </View>}
                    />}
                )}
                {!swaps?.length && <View style={{
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 20,
                }}>
                    <KIcon name="swap" size="xxlarge" style={{backgroundColor: "white", borderRadius: 100, padding: 10}} />
                    <KText style={{margin: 20}}>No swaps yet !</KText>
                    <KButton text="Start swapping" color="primary" onPress={() => navigation.navigate("Home")}/>
                </View>}
            </>
        }

    <KSideModal
        style={{
          padding: 20,
        }}
        visible={!!modal && swapId}
        onClose={() => {
            navigation.navigate("History")
            setModal(false)
        }}>
            <KText style={{fontSize: 30, fontWeight: "bold", marginBottom: 20}}>Swap Details</KText>
            <Swap id={swapId}>
                <KButton icon="chat" text="Open Chat" color="secondary" onPress={() => {
                    console.log(swaps)
                    const rid = swaps?.find(s => s.id === swapId)?.request.id
                    if(!rid) return
                    navigation.navigate("Chat", {id: rid})
                    setModal(false)
                }} style={{marginTop: 20}}/>
            </Swap>
      </KSideModal>

    </ScrollView>
}