export type Notification = {
    id: string,
    time: number,
    title?: string,
    text: string,
    readAt?: number,
    url: string,
    from?: string,
}

export default Notification