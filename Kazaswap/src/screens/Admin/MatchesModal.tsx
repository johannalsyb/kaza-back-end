import {Property} from '@kazaswap/common/lib/types/api/properties';
import KSideModal from "../../components/KModal/KSideModal"
import KText from "../../components/KText"
import { useEffect, useState } from "react"
import { ScrollView, View } from "react-native"
import properties from "../../api/properties"
import admin from "../../api/admin"
import PropertyCard from "../../components/PropertyCard"
import { Api } from "@kazaswap/common"
import SwapAvailabilities from "../../components/Views/Property/SwapAvailabilities"
import KButton from '../../components/KButton/KButton';


export default (props:{
    userId:string,
    hideOwnerButton?: boolean
    onClose:() => void
    onDeleted?: () => void
}) => {
    const [matches, setMatches] = useState<Api.Matches.Matches>({matches: []})
    const [property, setProperty] = useState<Property>()

    const loadMatches = (refresh = false, debug = false) => {
        return admin.matches.forUser(props.userId, refresh, debug)
        .then(d => {
            setMatches(d.data)
            return d.data
        })
    }

    useEffect(() => {
        Promise.all([
            loadMatches(),
            properties.ofUser(props.userId)
        ])
        .then(([m, p]) => {
            if(!p.data.length) return
            return properties.get(p.data[0].id)
        })
        .then(d => {
            if(!d) return
            console.log(d.data)
            if(d) setProperty(d.data as unknown as Property)
        })
    }, [props.userId])

    return <KSideModal visible={!!matches} onClose={props.onClose}>
        <ScrollView style={{padding: 10, width: "100%"}} contentContainerStyle={{display: "flex", flexDirection: "row", flexWrap: "wrap"}}>

            <SwapAvailabilities property={property}/>

            <View style={{width: "100%", borderBottomWidth: 1, marginVertical: 5, paddingBottom: 5, display: "flex", justifyContent: "space-between", alignItems: "center", flexDirection: "row"}}>
                <KText>MATCHES</KText>
                <KButton color="secondary" onPress={() => loadMatches(true, true)} text='Refresh' />
            </View>
            {(matches.matches || []).map(match => <View key={`matches_${match.id}`}>
                {/* {!props.hideOwnerButton && <KButton style={{width: "100%", marginBottom: 5}} text="Show owner" onPress={() => {
                    admin.users.get({filter: JSON.stringify({id: props.property.owner})})
                    .then(d => {
                        if(!d.data.length) return
                        return Promise.all([d.data[0]!, parsePhone(d.data[0]!.phone)])
                    })
                    .then(dd => setUser({user:dd![0], phone:dd![1]!}))

                }} />} */}

                <PropertyCard property={match.property as unknown as Api.Properties.Property} style={{padding: 5}}/>
            </View>)}
        </ScrollView>

        {/* <UserModal user={user} onClose={() => setUser(undefined)} hidePropertiesButton={true}/> */}
    </KSideModal>
}