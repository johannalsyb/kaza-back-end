import type { Api } from "@kazaswap/common/lib/types/api/index"
import api from "."

const requests = {
    all: () => api.get<Api.Swaps.SwapRequest[]>(`/swaps/requests`),
    new: (fromPropertyId:string, toPropertyId:string) => api.post<Api.Swaps.SwapRequest>(`/swaps/requests`, {
        fromPropertyId,
        toPropertyId
    }),
    history: () => api.get<Api.Swaps.SwapRequest[]>(`/swaps/requests/history`),
    get: (requestId:string) => api.get<Api.Swaps.SwapRequest>(`/swaps/requests/${requestId}`),
    accept: (requestId:string) => api.get<Api.Swaps.SwapRequest>(`/swaps/requests/${requestId}/accept`),
    decline: (requestId:string, note:string) => api.patch<Api.Swaps.SwapRequest>(`/swaps/requests/${requestId}/decline`, {note}),
    chat: {
        get: (requestId:string) => api.get<Api.Swaps.Chat>(`/swaps/requests/${requestId}/chat`),
        send: (requestId:string, message:string, attachments?:string[]) => api.post<Api.Swaps.ChatMessage>(`/swaps/requests/${requestId}/chat`, {message, attachments}),
        getWSUrl: (requestId:string) => api.get<Api.Swaps.WSURL>(`/swaps/requests/${requestId}/chat/ws`),
    },
    swap: (requestId:string) => api.get<Api.Swaps.Swap>(`/swaps/requests/${requestId}/swap`),
}

const swaps = {
    all: () => api.get<Api.Swaps.Swap[]>(`/swaps`),
    get: (swapId:string) => api.get<Api.Swaps.Swap>(`/swaps/${swapId}`),
}

export default {
    requests,
    swaps
}