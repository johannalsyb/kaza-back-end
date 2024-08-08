import type { Api } from "@kazaswap/common/lib/types/api/index"
import api from "."

export const zone = (text:string) => api.get<Api.Autocomplete.Response>(`/autocomplete/zone?search=${text}`)
export const address = (text:string) => api.get<Api.Autocomplete.Response>(`/autocomplete/address?search=${text}`)
export const verify = (text:string) => api.get<Api.Autocomplete.Response>(`/autocomplete/verify?address=${text}`)

export default {
    zone,
    address,
    verify
}