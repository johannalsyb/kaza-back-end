import React, { useEffect, useState } from "react"
import { Text } from "react-native"
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
import apiProperties from "../../api/properties"
import KSlider from "../../components/KSlider/KSlider"
import KTextInput from "../../components/Form/KTextInput/KTextInput"
import PropertyModal, { AttractivenessView } from "./PropertyModal"

type Filters = {
    verified?: 0 | 1
    search?: string
}

export const update = (data:Partial<Property>) => {
    apiProperties.update(data)
    .then(d => {
        toastSuccess(`PROPERTY ${d.data.id} UPDATED`)
    })
    .catch(e => {
        toastError(JSON.stringify(e))
    })
}

export default () => {
    const {user} = useAuthentication()
    const config = useConfig()

    if(!user || (user.role !== "admin" && user.role !== "superadmin")) {
        return null
    }

    const [properties, setProperties] = useState<Property[]>()
    const [filters, setFilters] = useState<Filters>({
        verified: 0
    })
    const [selectedProperty, setSelectedProprty] = useState<Property | undefined>()
    const [currentPage, setCurrentPage] = useState(1)

    const load = () => admin.properties.get({page: `${currentPage}`, sort: `-createdAt`})
    .then(d => setProperties([...(properties || []), ...d.data]))
    
    useEffect(() => {
        load()
    }, [currentPage])

    useEffect(() => {
        if(currentPage === 1)   load() 
    }, [])


    const toggleVerified = (id:string, value:boolean, userId:string) => {
        Promise.all([
            admin.properties.verify(id, value),
            admin.users.verify(userId, value)
        ])
        .then(([d, u]) => {
            toastSuccess(`PROPERTY ${d.data.id} NOW ${value ? "" : "UN"}VERIFIED`)
            setProperties(properties?.map(u => {
                if(u.id === id) u.verified = value
                return u
            }))
        })
        .catch(e => {
            toastError(JSON.stringify(e))
        })
    }

    return <View style={{flex: 1}}>

        <View style={{padding: 5, flexDirection: "row", justifyContent: "space-between"}}>
            <View style={{flexDirection: "row"}}>
                {([["All", undefined], ["Verified", 1], ["Unverified", 0]] as [string, any][]).map(i => 
                    <KButton text={i[0]} color={i[1] === filters.verified ? "primary" : "light"} onPress={() => setFilters({...filters, verified: i[1]})} />
                )}
            </View>
            <KTextInput placeholder="Search property" onChangeText={v => setFilters({...filters, search: v.length ? v : undefined})} />
        </View>

        <View style={{
            flex: 1,
            display: "flex",
            flexDirection: "row",
            flexWrap: "wrap"
        }}>
            {!properties ? <ActivityIndicator /> :
                properties.length ? <>{properties.map(u => {
                if(filters.verified !== undefined && !!u.verified !== !!filters.verified) return null
                if(filters.search && !([u.address,u.city,u.country,u.description,u.region,u.name,u.owner].join(" ")).toLowerCase().includes(filters.search.trim().toLowerCase())) return null
                const images = u.images.split(",").filter(f => f.length)
                return <View style={{
                    backgroundColor: variables.colors.yellow,
                    margin: 2,
                    borderRadius: 5,
                    padding: 10,
                    width: 250,
                }}>
                    <View style={{display: "flex", width: "100%", flexDirection: "column", justifyContent: "space-between"}}>
                        <View>
                            <KText style={{flexWrap: "wrap"}}>{u.address}</KText>
                        </View>
                        <View style={{flexDirection: "row", justifyContent: "space-between"}}>
                            <Text>{`${u.type} - ${u.sizeM2}m2`}</Text>
                            <KText style={{fontSize: 10}}>{u.createdDate}</KText>
                        </View>
                    </View>

                    {images.length ?
                        <KCarousel id={u.id} images={images} type="properties" imageStyle={{objectFit: "contain", maxHeight: 200}}/>
                    : <KText style={{height: 200, textAlign: "center", alignContent: "center", backgroundColor: "#00000022"}}>No images</KText>}

                    <KButton
                        style={{width: "100%", marginBottom: 5}}
                        text={u.verified ? "VERIFIED" : "NOT VERIFIED"}
                        onPress={() => {
                            toggleVerified(u.id, !u.verified, u.owner) // Disabling to simplify process
                        }} />
                    <KButton style={{width: "100%", marginBottom: 5}} color="greenLight" text="OPEN" onPress={() => {
                        console.log(u)
                        setSelectedProprty(u)
                    }} />

                    <AttractivenessView property={u} />
                    
                </View>})}
                <KButton text="Load more" onPress={() => setCurrentPage(currentPage + 1)} />   
                </> : "NO PROPERTIES"
            }
        </View>

        {selectedProperty && <PropertyModal
            property={selectedProperty}
            onDeleted={() => {
                setProperties(properties?.filter(p => p.id !== selectedProperty.id))
                setSelectedProprty(undefined)
            }}
            onClose={() => setSelectedProprty(undefined)}
            />}
        {/* <KSideModal visible={!!selectedProperty} onClose={() => setSelectedProprty(undefined)}>
            <ScrollView style={{padding: 10}}>
                {selectedProperty && <>
                    <View style={{width: "100%", borderBottomWidth: 1, marginVertical: 5}}><KText>ADMIN</KText></View>
                    <AttractivenessView property={selectedProperty} showText={true} />
                    <KButton style={{width: "100%", marginBottom: 5}} text="Show owner" onPress={() => {}} />

                    <KButton style={{width: "100%", marginBottom: 5, backgroundColor: "red"}} textStyle={{color: "white"}} text="DELETE" onPress={() => {}} />
                    <View style={{width: "100%", borderBottomWidth: 1, marginVertical: 5}}><KText>EDIT PROPERTY</KText></View>
                    <EditProperty property={{
                        location: selectedProperty.address,
                        type: selectedProperty.type,
                        amenities: selectedProperty.amenities.split(",").filter(f => f.length),
                        size: selectedProperty.sizeM2,
                        bathrooms: selectedProperty.bathrooms,
                        bedrooms: selectedProperty.bedrooms,
                        beds: selectedProperty.beds,
                        bedroomsBeds: JSON.parse(selectedProperty.bedArrangements),
                        pics: selectedProperty.images.split(",").filter(f => f.length),
                        id: selectedProperty.id,
                        petFriendly: selectedProperty.pets,
                        childrenAllowed: !!selectedProperty.childrenAllowed,
                        smokingAllowed: !!selectedProperty.smokingAllowed,
                        private: selectedProperty.private,
                        lat: selectedProperty.lat,
                        lon: selectedProperty.lon,
                    }}
                    verified={selectedProperty.verified}
                    onUpdated={() => {}}
                    />
                </>}
            </ScrollView>
        </KSideModal> */}
    </View>
}