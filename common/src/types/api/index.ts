import { PublicUser, User as PrivateUser } from '../User'
import type * as TAuth from './auth'
import type * as TProperties from "./properties"
import type {SwapRequest as TSwapRequest, Swap as TSwap} from "./swap"
import type {Match as TMatch} from "../Match"
import { PublicProperty } from '../Property'
import { Chat as TChat, ChatMessage as TCM } from '../SwapRequest'
import Notification from '../Notification'

export namespace Api {
    export type ApiResponse<T> = {
        meta: {
            time: number,
            code: number,
        },
        data: T
    }
    export namespace Auth {
        export type Me = TAuth.Me & {unreadNotifications?: number, newMatches?: number}
        export type Login = TAuth.Login
        export type Logout = TAuth.Logout
        export type Signup = TAuth.Signup
        export type ResetPassword = TAuth.ResetPassword
        export type Verify = TAuth.Verify
    }

    export namespace Users {
        export type User = PublicUser
        export type Me = PrivateUser
        export type Update = TAuth.Me
        export type Pictures = {images: string[]}
        export type Notifications = Notification[]
    }

    export namespace Properties {
        export type Property = TProperties.Property
        export type PrivateProperty = TProperties.PrivateProperty
        export type Update = TProperties.UpdateProperty
        export type Pictures = {images: string[]}
        export type Favourites = TProperties.Property[]
    }

    export namespace Swaps {
        export type SwapRequest = TSwapRequest
        export type Swap = TSwap
        export type Chat = TChat
        export type ChatMessage = TCM
        export type WSURL = {url: string}
    }

    export namespace Matches {
        export type Match = TMatch & {
            // user: PublicUser,
            property: PublicProperty,
        }
        export type Matches = {
            matches: Match[]
            debug?: any
        }
    }

    export namespace Autocomplete {
        type Result = {
            description: string,
            matched_substrings: {
                length: number,
                offset: number
            }[],
            terms: {
                offset: number,
                value: string
            }[],
            types: string[]
        }
        export type Response = {
            address: string,
            results: Result[],
            ts: number
        }
    }

    export namespace Config {
        export type Response = {
            images: {
                properties: {
                    url: string,
                    suffix: string,
                    thumbnailSuffix: string,
                    resizePx?: number
                },
                users: {
                    url: string,
                    suffix: string,
                    thumbnailSuffix: string,
                    resizePx?: number
                }
            },
            emails: {
                community: string,
                support: string
            },
            keys: {
                gmaps: string,
            },
            upload: {
                maxFileSizeMb: number
            },
            query: {
                limit: number
            },
            maintenanceMessage?: string,
            features: {
                chat?: boolean,
                swapRequest?: boolean,
                matching?: boolean,
                sms?: boolean,
            }
        }
    }

    export namespace Blog {
        export type Article = {
            slug: string,
            title: string,
            image: string | null,
            content: string | null,
            createdAt: string,
            updatedAt: string,
            visible: boolean,
        }
    }
}

export default Api