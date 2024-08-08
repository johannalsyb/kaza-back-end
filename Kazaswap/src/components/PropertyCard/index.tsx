import { PublicProperty } from "@kazaswap/common/lib/types/Property"
import { PropertyCard } from "./PropertyCard"
import Api from "@kazaswap/common/lib/types/api"
import { ViewStyle } from "react-native"

type Props = {
    property: Api.Properties.Property,
    style?: ViewStyle,
    hoverable?: boolean,
    bottomComponent?: React.ReactNode,
    swapButton?:boolean,
    onPress?: () => void
}

export default ({property, style, hoverable, bottomComponent, onPress, swapButton}:Props) => {

    if(!property) return null
    if(!property.owner) return null

    const photo = property.primaryImage && property.primaryImage.length ?
        `${property.id}/${property.primaryImage}` : (
            property.images && property.images.length ?
                `${property.id}/${(property.images as string).split(",")[0]}` : ""
        )

    const avatar = property.owner ? `${property.owner.id}/${property.owner.primaryImage && property.owner.primaryImage.length ?
            property.owner.primaryImage : (
                property.owner.images && property.owner.images.length ?
                    (property.owner.images as string).split(",")[0] : ""
            )}` : undefined

    const availableDate = property.owner.dateFrom && property.owner.dateTo ? {
        from: new Date(property.owner.dateFrom),
        to: new Date(property.owner.dateTo)
    } : undefined

    return <PropertyCard
        hoverable={hoverable}
        photo={photo}
        avatar={avatar}
        swapFor={property.owner.swapLocations}
        location={`${property.city}`}
        availableDate={availableDate}
        style={style}
        bottomComponent={bottomComponent}
        onPress={onPress}
        swapButton={swapButton}
    />
}