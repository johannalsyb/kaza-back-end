import { ActivityIndicator, Linking, Platform, ScrollView, View } from "react-native"
import KText from "../../KText"
import { Api } from "@kazaswap/common"
import { useEffect, useState } from "react"
import swaps from "../../../api/swaps"
import PlaceOwner from "../Property/PlaceOwner"
import variables from "../../../styles/variables"
import useAuthentication from "../../../hooks/useAuthentication"
import Map from "../../MapView"
import KIcon from "../../KIcon/KIcon"
import KButton from "../../KButton/KButton"
import useIsMobile from "../../../hooks/useIsMobile"

type Props = {
    id: string,
    swap?: Api.Swaps.Swap
    children?: React.ReactNode,
    showPlaceOwner?: boolean,
    showMap?: boolean,
}

export default ({
    id,
    swap,
    showPlaceOwner = false,
    showMap = true,
    children
}:Props) => {

    if(showPlaceOwner === undefined) showPlaceOwner = false
    if(showMap === undefined) showMap = true

    const [loading, setLoading] = useState<boolean>(false)
    const [sswap, setSwap] = useState<Api.Swaps.Swap | undefined>(swap)
    const {user} = useAuthentication()
    const {isMobile} = useIsMobile()

    const load = () => {
        setLoading(true)
        swaps.swaps.get(id)
        .then(r => {
            setSwap(r.data)
        })
        .catch(e => {
            console.error(e)
        })
        .finally(() => {
            setLoading(false)
        })
    }

    useEffect(() => {
        if(!sswap && swap) setSwap(swap)
    }, [swap])

    useEffect(() => {
        if(!swap) load()
    }, [])

    const prop = (user && user.id === sswap?.request.from) ? sswap?.request.toProperty : sswap?.request.fromProperty

    const openMap = () => {
        if(!prop) return
        const scheme = Platform.select({
            ios: 'maps://0,0?q=',
            android: 'geo:0,0?q=',
        });
        const latLng = `${prop?.lat},${prop.lon}`;
        const label = 'Pin';
        const url = Platform.select({
            ios: `${scheme}${label}@${latLng}`,
            android: `${scheme}${latLng}(${label})`,
            web: `https://www.google.com/maps/search/?api=1&query=${prop.lat},${prop.lon}`
        });

        Linking.openURL(url!);
    }

    return <View style={{
        display: "flex",
        flex: 1,
        width: "100%"
    }}>
    {loading || !sswap || !user || !prop ? 
        <ActivityIndicator color={variables.colors.yellow} />
    :
        <View style={{alignItems: "center"}}>
            {showPlaceOwner ? <PlaceOwner property={prop}/> : null}

            <View style={{
                marginTop: 20,
                display: "flex",
                flexDirection: "column",
                backgroundColor: variables.colors.darkYellow,
                maxWidth: 700, width: "95%", 
                borderRadius: 20,
                paddingTop: 5
            }}>
                <View style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginLeft:5,
                    marginRight: 5
                }}>
                    <KText style={{
                        color: variables.colors.grey,
                        fontWeight: "bold",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "flex-start",
                    }}>
                        <KIcon name="location" size="medium" />
                        Full address:
                        <KText style={{color: "black", marginLeft: 5}}>{prop.address}</KText>
                    </KText>
                </View>
                {showMap ? <Map
                    lat={prop.lat} lng={prop.lon} zoom={17}
                    points={[{lat: prop.lat, lng: prop.lon}]}
                    style={{aspectRatio: 3/2, marginTop: 5}} /> : null}

                <View style={{width:"100%", alignItems: "center", margin: 5}}>
                    <KButton icon="map" iconSize="medium" text="View on map" color="primary" onPress={openMap} />
                </View>

            </View>
            {children || null}
        </View>
    }
</View>
}