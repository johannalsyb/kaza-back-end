import {HTTPError} from "@kazaswap/common/lib/index"
import type {Api} from "@kazaswap/common/lib/types/api/"
import { API_URL } from "./config"

export type ApiResponseError = {
    error: boolean,
    code: number,
    statusText: string,
    response: Response,
    json: any
}

export const getUrl = (url:string) => `${API_URL}${url.startsWith("/") ? url : `/${url}`}`

export const request = async <T>(url:string, options?:RequestInit):Promise<Api.ApiResponse<T>> => {
    const path = getUrl(url)
    const res = await fetch(path, options)
    if(res.status >= 400) {
        // const e = new HTTPError(res.statusText, res.status, json)
        // console.log(e.getBody())
        throw {
            error: true,
            code: res.status,
            statusText: res.statusText,
            response: res,
            json: await res.json()
        }
    }
    return res.json() as unknown as Api.ApiResponse<T>
}

export const get = <T>(url:string, options?:RequestInit) => request<T>(url, {
    method: "GET",
    ...options
})

export const post = <T>(url:string, body:any, options?:RequestInit) => request<T>(url, {
    method: "POST",
    headers: {
        "Content-Type": "application/json"
    },
    body: JSON.stringify(body),
    ...options
})

export const patch = <T>(url:string, body:any, options?:RequestInit) => request<T>(url, {
    method: "PATCH",
    headers: {
        "Content-Type": "application/json"
    },
    body: JSON.stringify(body),
    ...options
})

export const del = <T>(url:string, options?:RequestInit) => request<T>(url, {
    method: "DELETE",
    ...options
})

export const put = <T>(url:string, body:any, options?:RequestInit) => request<T>(url, {
    method: "PUT",
    headers: {
        "Content-Type": "application/json"
    },
    body: JSON.stringify(body),
    ...options
})

export default {
    request,
    get,
    post,
    patch,
    del,
    put,
    getUrl
}