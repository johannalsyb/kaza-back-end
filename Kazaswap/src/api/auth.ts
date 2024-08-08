import type { Api } from "@kazaswap/common/lib/types/api/index"
import api from "."
import { User } from "@kazaswap/common/lib/types/User"

export const me = () => api.get<Api.Users.Me>(`/auth/me`)
export const login = (email:string, password:string) => api.post<Api.Auth.Login>(`/auth/login`, {email, password})
export const logout = () => api.get<Api.Auth.Logout>(`/auth/logout`)
export const signup = (user:Partial<User> & {
    email:string,
    password:string,
    firstName:string,
    gender:string,
    phone:string,
    onboarding:{step:number, data:any}
}) => api.post<Api.Auth.Signup>(`/auth/signup`, user)
export const resetPasswordRequest = (data:{email?:string, token?:string}) => api.get<Api.Auth.ResetPassword>(`/auth/reset?${new URLSearchParams(data).toString()}`)
export const resetPasswordUpdate = (data:{password:string, token:string}) => api.post<Api.Auth.ResetPassword>(`/auth/reset`, data)
export const verify = (params:{
    token?:string,
    code?:string
}) => api.get<Api.Auth.Verify>(`/auth/verify?${new URLSearchParams(params).toString()}`)

export default {
    me,
    login,
    logout,
    signup,
    verify,
    resetPassword: {
        request: (email:string) => resetPasswordRequest({email}),
        isValid: (token:string) => resetPasswordRequest({token}),
        update: resetPasswordUpdate
    }
}