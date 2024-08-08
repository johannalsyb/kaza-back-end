import type { Api } from "@kazaswap/common/lib/types/api/index"
import api from "."
import { User } from "@kazaswap/common/lib/types/User"
import Property from "@kazaswap/common/lib/types/Property"
import { Chat, SwapRequest } from "@kazaswap/common/lib/types/SwapRequest"
import { Swap } from "@kazaswap/common/lib/types/Swap"

export const me = () => api.get<Api.Users.Me>(`/auth/me`)
export const login = (email:string, password:string) => api.post<Api.Auth.Login>(`/auth/login`, {email, password})
export const logout = () => api.get<Api.Auth.Logout>(`/auth/logout`)
export const signup = (user:Partial<User> & {
    email:string,
    password:string,
    firstName:string,
    gender:string,
    phone:string,
}) => api.post<Api.Auth.Signup>(`/auth/signup`, user)
export const resetPasswordRequest = (data:{email?:string, token?:string}) => api.get<Api.Auth.ResetPassword>(`/auth/reset?${new URLSearchParams(data).toString()}`)
export const resetPasswordUpdate = (data:{password:string, token:string}) => api.post<Api.Auth.ResetPassword>(`/auth/reset`, data)
export const verifyEmail = (token:string) => api.get<Api.Auth.Verify>(`/auth/verify?token=${token}`)

type Query = {
    [key: string]: string
}

export default {
    users: {
        get: (qs:Query = {}) => api.get<User[]>(`/admin/users?${new URLSearchParams(qs).toString()}`),
        verify: (id:string, value: boolean) => api.get<User>(`/admin/users/${id}/verify?verify=${value}`),
        resetPassword: (id:string) => api.get<{url:string}>(`/admin/users/${id}/resetPassword`),
        delete: (id:string) => api.del(`/admin/users/${id}`),
    },
    properties: {
        get: (qs:Query = {}) => api.get<Property[]>(`/admin/properties?${new URLSearchParams(qs).toString()}`),
        verify: (id:string, value:boolean) => api.get<Property>(`/admin/properties/${id}/verify?verify=${value}`),
        delete: (id:string) => api.del(`/admin/properties/${id}`),
    },
    swapRequests: {
        all: (qs:Query = {}) => api.get<SwapRequest[]>(`/admin/swaprequests?${new URLSearchParams(qs).toString()}`),
        get: (id:string, qs:Query = {}) => api.get<{request: SwapRequest, chat: Chat}>(`/admin/swaprequests/${id}?${new URLSearchParams(qs).toString()}`),
    },
    swaps: {
        all: (qs:Query = {}) => api.get<Swap[]>(`/admin/swaps?${new URLSearchParams(qs).toString()}`),
    },
    matches: {
        getUsersWithMatches: () => api.get<(User & {matchCount: number})[]>(`/admin/matches`),
        forUser: (userId:string, refresh=false, debug=false) => {
            const query:any = {userId,refresh}
            if(debug) query["debug"] = "true"
            const qs = new URLSearchParams(query).toString()
            return api.get<Api.Matches.Matches>(`/matches?${qs}`)
        },
    }
}