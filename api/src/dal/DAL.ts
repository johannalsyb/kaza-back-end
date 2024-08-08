import { DIRECTUS_QUERY_LIMIT } from "../config"
import { request } from "../utils"
import { randomUUID } from "crypto"

const headers = (bearer?:string) => ({
    "Content-Type": "application/json",
    ...(bearer ? {Authorization: `Bearer ${bearer}`} : {})
})

export class DAL {
    baseURL:string
    bearer?:string

    constructor(baseURL:string, {
        bearer
    }:{
        bearer?:string
    } = {}) {
        this.baseURL = baseURL
        this.bearer = bearer
    }

    async get<T>(path:string) {
        return request(`${this.baseURL}${path}`, {
            headers: headers(this.bearer)
        })
        .then(ret => ret.json())
        .then(json => json.data as T)
    }

    async find<T>(path:string, options?:{
        limit?:number | string,
        page?:number | string
    }) {
        const url = new URL(`${this.baseURL}${path}`)
        if(options){
            Object.keys(options).forEach(k => {
                url.searchParams.set(k, `${(options as any)[k]}`)
            })
        }
        // console.log(url.toString())
        return request(url.toString(), {
            headers: headers(this.bearer)
        })
        .then(ret => ret.json())
        .then(json => json.data as T[])
    }

    async create<T>(path:string, body:Partial<T>) {
        return request(`${this.baseURL}${path}`, {
            method: "POST",
            headers: headers(this.bearer),
            body: JSON.stringify({...body, id: (body as any).id || randomUUID()})
        })
        .then(ret => ret.json())
        .then(json => json.data as T)
    }

    async update<T>(path:string, body:Partial<T>) {
        return request(`${this.baseURL}${path}`, {
            method: "PATCH",
            headers: headers(this.bearer),
            body: JSON.stringify(body)
        })
        .then(ret => ret.json())
        .then(json => json.data as T)
    }

    async updateMany<T>(path:string, body:Partial<T>, ...ids:string[]) {
        return request(`${this.baseURL}${path}`, {
            method: "PATCH",
            headers: headers(this.bearer),
            body: JSON.stringify({keys: ids, data: body})
        })
        .then(ret => ret.json())
        .then(json => json.data as T[])
    }

    async delete(path:string) {
        return request(`${this.baseURL}${path}`, {
            method: "DELETE",
            headers: headers(this.bearer),
        })
    }
}

export default DAL