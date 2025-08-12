export type Role = 'user' | 'admin' | 'superadmin'

export type PublicUser = {
    id: string,
    firstName: string,
    images: string,
    primaryImage: string,
    about: string,
    job: string,
    hobby: string,
    socialMedia: string,
    gender: string,
    dateFrom: number,
    dateTo: number,
    swapLocations: string | null,
}

export type User = PublicUser & {
    email: string,
    emailVerified: boolean,
    phone: string,
    phoneVerified: boolean,
    password: string,
    lastName: string,
    verified: boolean,
    role: Role,
    orgs: string,
    ambassadorCode: string,
    createdAt: string,
    updatedAt: string,
    commsPref?: string,
    languagePref: string,
    pushToken?: string,
    favourites: string | null,
    unreadNotifications?: number,
    onboarding: string | null,
    newMatches?: number
    payment: string | null
    registrationProvider?: string,
    credits: number
    
}

export default User
