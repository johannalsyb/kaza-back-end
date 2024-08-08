import type Api from "./types/api/"
import type User from "./types/User"
export type {
    Api,
    User
}

export class HTTPError extends Error {
    private code:number
    private body:any
    constructor(message:string, code:number, body:any) {
        super(message)
        this.code = code
        this.body = body
    }

    public getCode() {
        return this.code
    }

    public getBody() {
        return this.body
    }

    public getError() {
        if(typeof this.body === "string") {
            try {
                const json = JSON.parse(this.body)
                return json.error
            } catch(e) {
                return this.body
            }
        } else {
            return this.body.error || this.body
        }
    }
}