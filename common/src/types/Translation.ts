export type Translation = {
    id: string,
    english: string,
    french: string | null,
    spanish: string | null,
    portuguese: string | null,
    italian: string | null,
    createdAt: string,
    updatedAt: string,
    enabled: boolean,
}

export default Translation