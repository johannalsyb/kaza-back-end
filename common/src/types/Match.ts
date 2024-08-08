export type Match = {
    id: string,
    user: string,
    property: string,
    notes: string | null,
    seen: boolean,
    expired: boolean,
    deleted: boolean,
    lastNotification: string | null, 
    createdAt: string,
    updatedAt: string,
}

export default Match