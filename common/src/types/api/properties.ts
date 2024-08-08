import { PublicProperty } from "../Property"
import { Property as FullProperty } from "../Property"
import { PublicUser } from "../User"

export type Property = PublicProperty & {
    owner: PublicUser,
}

export type PropertySwapRequest = Property & {
    owner: string,
}

/** This represent a property once it's swapped, with more accurate info about its location */
export type PropertySwap = Property & {
    owner: string,
    lat: number,
    lon: number,
    address: string,
}

export type PrivateProperty = FullProperty
export type UpdateProperty = FullProperty