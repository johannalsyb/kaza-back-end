export type SwapRequest = {
    id: string,
    from: string,
    to: string,
    fromProperty: string,
    toProperty: string,
    fromAccepted: string | null,
    toAccepted: string | null,
    createdAt: string,
    updatedAt: string,
    status: "pending" | "accepted" | "declined",
    notes: string | null,
    lastMessage: string | null,
}

export type ChatMessageInput = {
    from: string,
    to: string,
    message: string,
    attachments?: string[],
    type?: "accepted" | "declined",
}

export type ChatMessage = ChatMessageInput & {
    at: string | number,
}

export type Chat = ChatMessage[]