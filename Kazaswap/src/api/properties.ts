import type { Api } from "@kazaswap/common/lib/types/api/index"
import api from "."
import Property from "@kazaswap/common/lib/types/Property"

export const find = (qs:{
    page?:number,
    search?:string
}) => api.get<Api.Properties.Property[]>(`/properties?${new URLSearchParams(Object.fromEntries(Object.entries(qs).filter(f => f[1] !== undefined).map(f => ([f[0], `${f[1]}`])))).toString()}`)
export const ofUser = (userId: "me" | string) => api.get<Api.Properties.PrivateProperty[]>(`/properties/user/${userId}`)
export const get = (id:string) => api.get<Api.Properties.PrivateProperty>(`/properties/${id}`)
export const create = (prop:Partial<Property>) => api.post<Api.Properties.Property>(`/properties`, prop)
export const update = (prop:Partial<Property>) => api.patch<Api.Properties.Update>(`/properties/${prop.id}`, prop)
export const postPictures = (id:string, files:string[]) => api.post<Api.Properties.Pictures>(`/properties/${id}/pictures`, {files})
export const deletePicture = (id:string, pictureId:string) => api.del<Api.Properties.Property>(`/properties/${id}/pictures/${pictureId}`)
export const rotatePicture = (id:string, pictureId:string, degrees:number) => api.patch<Api.Properties.Property>(`/properties/${id}/pictures/${pictureId}?rotation=${degrees}`, {})
export const favourites = () => api.get<Api.Properties.Property[]>(`/properties/favourites`)
export const toggleFavourite = (propId:string) => api.patch<string[]>(`/properties/favourites/${propId}`, {})
export const getCardPictureUrl = (propId:string, force=false) => api.getUrl(`/images/card?propertyId=${propId}${force ? "&force=1" : ""}`)

export const matches = () => api.get<Api.Matches.Matches>(`/matches`)

export default {
    find,
    get,
    ofUser,
    update,
    create,
    pictures: {
        post: postPictures,
        delete: deletePicture,
        rotate: rotatePicture,
        getCardPictureUrl
    },
    favourites: {
        get: favourites,
        toggle: toggleFavourite,
    },
    matches: {
        get: matches
    }
}