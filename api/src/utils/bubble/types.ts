export type BubbleApiResponse<T> = {
    "response": {
        "cursor": number,
        "count": number,
        "remaining"?: number,
        "results": T[]
    }
}

export type BubbleLocation = {
    "address": string,
    "lat": number,
    "lng": number
}

export type BubbleUser = {
    "Modified Date": string,
    "Created Date": string,
    "Admin?": boolean,
    "Approved?": boolean,
    "Avatar"?: string,
    "Base Location": BubbleLocation,
    "Data Consent Check": string,
    "Equivalent Only": false,
    "Form 1 Valid?": "new",
    "Form 2 Valid?": "new",
    "Form 3 Valid?": "new",
    "Form 4 Valid?": "new",
    "Form 5 Valid?": "new",
    "Gender": "Male" | "Female" | string | undefined,
    "Hobbies": string[] | undefined,
    "Job": string,
    "Name: First"?: string,
    "Name: Last"?: string,
    "Profile": string,
    "Properties": [],
    "Phone"?: string,
    "Travel Destinations": BubbleLocation[],
    "Travel Destination Pref": string,
    "Travelling With": number,
    "Typed Email": string,
    "Typed Email Valid?": number,
    "user_signed_up": number,
    "authentication": {
        "email"?: {
            "email": string,
            "email_confirmed": boolean
        },
        "Google"?: {
            "email": string,
            "id": string
        },
    },
    "Reset Pass email is sent": boolean,
    "_id": string
}

export type BubbleProperty = {
    "Modified Date": string,
    "Created Date": string,
    "Created By": string,
    "Amenitites"?: string[],
    "Approved?": boolean,
    "Date Pref (new)": string,
    "Date Ranges (new)"?: [string,string][],
    "Geo Location": BubbleLocation,
    "Geo Location TEXT"?: string,
    "Descriptive Name"?: string,
    "Number of bathrooms"?: number,
    "Number of beds": number,
    "Owner Gender": string,
    "Owner": string,
    "Photos"?: string[],
    "Cover Image"?: string,
    "Square Metres"?: number,
    "Property Type"?: string,
    "Rooms"?: string[],
    "Private"?: boolean,
    "Attractiveness"?: number,
    "Flat mates"?: number,
    "Pets"?: "Yes" | "No",
    "_id": string
}

export type BubblePropertyRooms = {
    "Modified Date": string,
    "Created Date": string,
    "Created By": string,
    "Double Beds"?: number,
    "Single Beds"?: number,
    "_id": string
}

export type BubbleChat = {
    "Created Date": string,
    "Users": [string,string],
    "Created By": string,
    "Modified Date": string,
    "_id": string
}

export type BubbleMessage = {
    "Modified Date": string,
    "Created Date": string,
    "Created By": string,
    "Chat": string,
    "From": string,
    "isRead": boolean,
    "Message": string,
    "To": string,
    "_id": string
}