import type { PropertySwapRequest } from "./properties"
import type { Chat, SwapRequest as TSwapRequest } from "../SwapRequest"
import type { Swap as TSwap } from "../Swap"
import { PublicUser } from "../User"

export type SwapRequest = TSwapRequest & {
    from: string,
    to: string,
    fromProperty: PropertySwapRequest,
    toProperty: PropertySwapRequest,
    newMessage?: number
}

export type SwapRequestAndChat = SwapRequest & Chat

export type Swap = TSwap & {
    request: SwapRequest & {
        fromProperty: PropertySwapRequest & {
            address: string,
            lat: number,
            lon: number,
            owner: PublicUser
        },
        toProperty: PropertySwapRequest & {
            address: string,
            lat: number,
            lon: number,
            owner: PublicUser
        }
    }
}