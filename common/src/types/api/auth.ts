export type OnboardingInfo = {step:number, data:any, completed?:boolean}

export type Me = {
    id: string
    email: string
    firstName: string
    createdAt: string
    updatedAt: string
    onboarding: string
}

export type Login = Me
export type Logout = string
export type Signup = Me
export type ResetPassword = {message: string}
export type Verify = {message: string}