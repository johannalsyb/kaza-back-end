import { Stream } from "stream"
import {WebSocket} from 'ws'
import User from "../../common/src/types/User"
export type BRequest = {
    method: BMethod,
    path: string,
    params: {[key: string]: string},
    query: {[key: string]: string},
    body: {[key: string]: any},
    headers: {[key: string]: string},
    middlewares: any[],
    cookies: {[key: string]: string},
    user?: User,
    extras: {[key: string]: any},
}

export type BResponse = {
    headers: {[key: string]: string},
    status: (code: number) => BResponse,
    send: <T>(data: T) => BResponse,
    redirect: (code: number, url: string) => BResponse,
    sendFile: (file: string, mime?:string) => BResponse,
    sendRaw: (data:Buffer, mime?:string) => BResponse,
    pipe: (code: number, stream: ReadableStream) => BResponse
}

type BMiddlewareResult = {code:number, message:any} | void
export type BMiddleware = (request:BRequest, response:BResponse) => BMiddlewareResult | Promise<BMiddlewareResult>
export type BRouteHandler = (request:BRequest, response:BResponse) => void
export type BRouteWebsocketHandler = (request:BRequest, socket:WebSocket) => void
export type BRouteHandlerWithMiddleware = [(request:BRequest, response:BResponse) => void, BMiddleware[]]

export type BRoute = {
    get?: BRouteHandler | BRouteHandlerWithMiddleware
    post?: BRouteHandler | BRouteHandlerWithMiddleware
    put?: BRouteHandler | BRouteHandlerWithMiddleware
    patch?: BRouteHandler | BRouteHandlerWithMiddleware
    option?: BRouteHandler | BRouteHandlerWithMiddleware
    delete?: BRouteHandler | BRouteHandlerWithMiddleware
    head?: BRouteHandler | BRouteHandlerWithMiddleware
    options?: BRouteHandler | BRouteHandlerWithMiddleware
    websocket?: BRouteWebsocketHandler
    routes?: {[key: string]: BRoute}
    middlewares?: BMiddleware[]
}

export type BMethod = "get" | "post" | "patch" | "put" | "delete" | "head" | "options"

export type BAdapter = {
    req:any,
    res:any,
    headers:(headers:{[key: string]: string}) => void,
    status:(code:number) => void,
    send:(data:any) => void,
    redirect:(code:number, url:string) => void,
    sendFile:(file:string) => void,
    sendRaw:(data:Buffer) => void,
    pipe:(stream:Stream) => void
}

export type BApp = {
    listen: (post:number, host?:string) => void,
    stop: () => void,
    app: any
}