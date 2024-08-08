import type { Api } from "@kazaswap/common/lib/types/api/index"
import api from "."
import { User } from "@kazaswap/common/lib/types/User"

export const get = <T>(userId:string | "me") => api.get<T>(`/users/${userId}`)
export const update = (user:Partial<User>) => api.patch<Api.Users.Update>(`/users/${user.id || "me"}`, user)
export const postPictures = (userId:string, files:string[]) => api.post<Api.Users.Pictures>(`/users/${userId}/pictures`, {files})
export const rotatePicture = (userId:string, degrees:number) => api.patch<Api.Users.Pictures>(`/users/${userId}/pictures?rotation=${degrees}`, {})
// export const getChats = (userId:string) => api.get<Api.Users.Chats>(`/users/${userId}/chats`)
// export const newChat = (userId:string, withUserId:string) => api.post<Api.Users.NewChat>(`/users/${userId}/chats`, {userId: withUserId})

export const getProfilePictureUrl = (userId:string, thumbnail=true) => api.getUrl(`/images/profile?userId=${userId}${thumbnail ? "&thumbnail=1" : ""}`)

const users = {
    get: (uid:string) => get<Api.Users.User>(uid),
    update,
    postPictures,
    rotatePicture,
    // getChats,
    // newChat,
    getProfilePictureUrl
}

export default {
    me: {
        get: () => get<Api.Users.Me>("me"),
        update: (u:Partial<User>) => users.update({...u, id: "me"}),
        postPictures: (files:string[]) => users.postPictures("me", files),
        rotatePicture: (degrees:number) => users.rotatePicture("me", degrees),
        requestVerify: (type: "email" | "phone") => api.get<string>(`/users/me/requestVerify?type=${type}`),
        notifications: {
            all: () => api.get<Api.Users.Notifications>(`/users/me/notifications`),
            read: (notificationId:string) => api.patch<string>(`/users/me/notifications/${notificationId}`, {}),
            delete: (notificationId:string) => api.del<string>(`/users/me/notifications/${notificationId}`),
            readAll: () => api.patch<string[]>(`/users/me/notifications`, {}),
        }
    },
    ...users
}