import Property from "../../../../common/src/types/Property";
import User from "../../../../common/src/types/User";
import { dal } from "../../dal";
import { BubbleApiResponse, BubbleChat, BubbleMessage, BubbleProperty, BubblePropertyRooms, BubbleUser } from "./types";
import { requestApi } from "./utils";

const BUBBLE_BASE_URL = process.env.BUBBLE_BASE_URL || "https://app.kazaswap.co/version-test/api/1.1/obj/"
const TOKEN = process.env.BUBBLE_TOKEN
const headers = {
    "Authorization": `Bearer ${TOKEN}`
}
const API_BASE_URL = process.env.API_BASE_URL

const propertyTypes = ["flat", "house", "room", "studio"]

type BubbleType = "user" | "property" | "propertyrooms" | "chat" | "message"
type BubbleObject = BubbleUser | BubbleProperty | BubbleChat | BubblePropertyRooms | BubbleMessage
type BedsArrangements = {single: number, double: number}[]

const availableAmenities = [
    // Place
    "Garden",
    "Balcony",
    "Terrace",
    "Ground floor",
    "Rooftop",
    // Temp control
    "Heating",
    "A/C",
    //Kitchen
    "Refrigerator",
    "Coffee machine",
    "Microwave",
    "Oven",
    "Barbecue",
    "Dishwasher",
    // Clothes
    "Iron",
    "Washing machine",
    "Dryer",
    "Closet space",
    // Stuff
    "Crib",
    "Hair dryer",
    "TV",
    "Fireplace",
    "Desk",
    "Wi-fi",
    // Outside
    "Parking spot",
    "Jacuzzi",
    "Swimming pool",
    "Wheelchair accessible",
]

// const existingAmenities = {
// 'Garden': "Garden",
// 'Ground floor': 'Ground floor',
// 'Terrace': 'Terrace',
// 'Balcony': "Balcony",
// 'Double bed': null,
// ' ✨ Bright light': null,
// 'Oven': 'Oven',
// 'Microwave': "Microwave",
// '? Parking spot',
// '? Garden',
// '? TV',
// '? AC',
// ' ☕️ Coffee machine',
// '? Ground floor',
// '? Hair dryer',
// '? Desk',
// ' Double bed',
// '? Balcony',
// '? Heater',
// '? Terrace',
// '? Dishwasher',
// ' Single bed',
// '?? Rooftop',
// '✨ Bright light',
// '? Jacuzzi',
// 'Single bed',
// '☕️ Coffee machine',
// '? Swimming pool',
// '? Fireplace',
// '♨️ Barbecue',
// '❄️ Refrigerator',
// '? Closet space',
// '? Iron',
// ' ᯤ Wi-Fi',
// 'A/C',
// 'Refrigerator',
// 'Coffee machine',
// 'Parking spot',
// 'TV',
// 'Rooftop',
// 'Washing machine',
// 'Fireplace',
// 'Wi-fi',
// 'Heating',
// 'Dryer'
// }

export const fetchBubble = async <Type extends BubbleObject>(type: BubbleType, results:BubbleObject[]=[], startFrom=0):Promise<Type[]> => {
    const url = BUBBLE_BASE_URL + type +`?cursor=${startFrom}`
    console.log("Fetching", url)
    const res = await fetch(url, {headers}).then(res => res.json() as unknown as Promise<BubbleApiResponse<Type>>)
    .catch(e => {
        console.error("Error fetching", url, e)
        return {
            response: {
                cursor: 0,
                count: 0,
                remaining: 0,
                results: []
            }
        }
    })

    // if(!res.response) {
    //     console.error("Error fetching", url, res)
    //     return results as Type[]
    // }
    if(res.response.remaining && res.response.remaining > 0) {
        return fetchBubble(type, [...results, ...res.response.results], res.response.count+startFrom)
    } else {
        return [...results, ...res.response.results] as Type[]
    }
}

const getUsers = (bUsers:BubbleUser[], bProperties:BubbleProperty[]) => bUsers.map(async bUser => {
    const image = bUser.Avatar ? (bUser.Avatar.startsWith("http") ? bUser.Avatar : `https://${bUser.Avatar}`.replace("////", "//")) : ""
    // TODO: upload image
    try {
        const swapLocations = bUser["Travel Destinations"]?.length ? bUser["Travel Destinations"].map(l => l.address).join("\n") : null
        const property = bProperties.find(p => p.Owner === bUser._id)
        let dateFrom=0, dateTo=0
        if(property && property["Date Ranges (new)"] && property["Date Ranges (new)"].length) {
            dateFrom = new Date(property["Date Ranges (new)"][0][0]).getTime()
            dateTo = new Date(property["Date Ranges (new)"][0][1]).getTime()
        }
        const u:User = {
            id: bUser._id,
            firstName: bUser["Name: First"] || "", // Handle this case
            lastName: bUser["Name: Last"] || "",
            role: "user",
            orgs: "",
            ambassadorCode: "",
            createdAt: bUser["Created Date"],
            updatedAt: bUser["Modified Date"],
            languagePref: "en",
            favourites: null,
            password: "",
            email: bUser["Typed Email"] || bUser.authentication.email?.email || bUser.authentication.Google?.email || "",
            emailVerified: !!bUser["Approved?"] || (bUser.authentication.email ? !!bUser.authentication.email.email_confirmed : (!!bUser.authentication.Google)),
            phone: bUser.Phone?.replace(/ /g, "") || "",
            phoneVerified: false, // TODO
            about: bUser.Profile,
            job: bUser.Job,
            hobby: (bUser.Hobbies || []).join(", "),
            socialMedia: "",
            gender: bUser.Gender?.toLowerCase() || "other",
            dateFrom,
            dateTo,
            swapLocations,
            verified: !!bUser["Approved?"],
            images: image,
            primaryImage: image,
            onboarding: JSON.stringify({step: 2, data: {
                location: '',
                type: '',
                amenities: [],
                petFriendly: undefined,
                size: 25,
                bedrooms: 1,
                beds: 1,
                bathrooms: 1,
                bedroomsBeds: [
                  {single: 0, double: 1},
                ],
                pics: [],
            }, completed: false})
        }
        return u
    } catch(err) {
        console.error("Error creating user", bUser, err)
        return null
    }
})

const getProperties = (bProperties:BubbleProperty[], bPropertyRooms: BubblePropertyRooms[], bUsers: BubbleUser[]) => bProperties.map(async bProperty => {

    if(!bProperty["Geo Location TEXT"] || !bProperty.Owner || !bUsers.find(u => u._id === bProperty.Owner)) {
        // console.log(bProperty)
        return
    }
    const [country, city] = bProperty["Geo Location TEXT"].split(", ").reverse()
    const rooms = bPropertyRooms.filter(r => (bProperty.Rooms || []).includes(r._id))
    const bedArrangements:BedsArrangements = rooms.map(r => {
        const single = r["Single Beds"] || 0
        const double = r["Double Beds"] || 0
        return {single, double}
    })
    const type = bProperty["Property Type"] && propertyTypes.includes(bProperty["Property Type"].toLowerCase()) ? bProperty["Property Type"].toLowerCase() : "flat"
    const nimages = [bProperty["Cover Image"]].concat(bProperty.Photos || []).filter(f => !!f).map(i => ((i as string).startsWith("http") ? i : `https://${i}`)?.replace("////", "//"))
    const images = [...new Set(nimages)]
    const amenities = (bProperty.Amenitites || []).map(a => a.replace(/\W+ /g, "").trim()).join(",")
    
    const p:Property = {
        id: bProperty._id,
        name: bProperty["Descriptive Name"] || (bProperty["Property Type"]? `My ${bProperty["Property Type"]}` : `Property in ${bProperty["Geo Location TEXT"]}`),
        type,
        description: "",
        owner: bProperty.Owner,
        createdAt: bProperty["Created Date"],
        updatedAt: bProperty["Modified Date"],
        images: images.join(","),
        primaryImage: images[0] || "",
        verified: !!bProperty["Approved?"],
        amenities,
        attractiveness: bProperty.Attractiveness || 0,
        flatmates: bProperty["Flat mates"] || 0,
        country,
        city: city || country,
        region: "",
        address: bProperty["Geo Location TEXT"],
        lat: bProperty["Geo Location"].lat,
        lon: bProperty["Geo Location"].lng,
        sizeM2: bProperty["Square Metres"] || 0,
        private: !!bProperty.Private,
        bathrooms: bProperty["Number of bathrooms"] || 1,
        bedrooms: bProperty["Number of beds"] || 1,
        beds: bProperty["Number of beds"] || bedArrangements.reduce((acc, r) => acc + r.single + r.double, 0),
        pets: bProperty.Pets ? bProperty.Pets === "Yes" : true,
        approxLat: bProperty["Geo Location"].lat,
        approxLon: bProperty["Geo Location"].lng,
        smokingAllowed: false, // False by default
        childrenAllowed: true, // True by default
        bedArrangements: JSON.stringify(bedArrangements),
        dateDuration: "",
        datePreference: "",
        dateRanges: "",
    }
    return p
})

export default () => Promise.all([
        fetchBubble<BubbleUser>("user"),
        fetchBubble<BubbleProperty>("property"),
        fetchBubble<BubblePropertyRooms>("propertyrooms"),
        fetchBubble<BubbleChat>("chat"),
        fetchBubble<BubbleMessage>("message")
    ]).then(([
        bUsers,
        bProperties,
        bPropertyRooms,
        bChats,
        bMessages
    ]) => {
        const users = Promise.all(getUsers(bUsers, bProperties))
        const properties = Promise.all(getProperties(bProperties, bPropertyRooms, bUsers))
        
        return Promise.all([
            users,
            properties
        ])
    }).then(async ([users, properties]) => {
        const allProps = properties.filter(p => !!p) as Property[]
        let nbUsers = 0, nbProps = 0
        for(var i=0; i<users.length; i++) {
            console.log(`User ${i+1}/${users.length}`)
            const u = users[i]
            if(!u) continue
            if(!u.email || !u.email.length) continue
            // console.log(u.email)
            const uu = await dal.get<User>(`/items/users/${u.id}`).catch(err => null)
            await (uu ?
                dal.update<User>(`/items/users/${u.id}`, u).then(uuu => console.log(`User ${uuu.id} updated`))
                : dal.create<User>(`/items/users`, u).then(uuu => console.log(`User ${u!.id} created`)))
            nbUsers++
            if(u.primaryImage.length) {
                await requestApi(`${API_BASE_URL}/users/${u.id}/pictures`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({files: [u.primaryImage]})
                })
                .catch(err => {
                    console.error("Error uploading image for user", u?.id, err)
                    // return {data: {images: []}}
                })
            }

            const userProps = allProps.filter((p) => p.owner === u!.id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            if(userProps.length) {
                const p = userProps[0]
                const pp = await dal.get<Property>(`/items/properties/${p.id}`).catch(err => null)
                await (pp ?
                    dal.update<Property>(`/items/properties/${p.id}`, p).then(ppp => console.log(`Property ${ppp.id} updated`))
                    : dal.create<Property>(`/items/properties`, p).then(ppp => console.log(`Property ${p!.id} created`)))
                    .then(() => {
                        return dal.update<User>(`/items/users/${u!.id}`, {onboarding: JSON.stringify({step: 2, data: {}, completed: true})})
                    })
                nbProps++
                if(p.images.length) {
                    const files = [...new Set((p.primaryImage && p.primaryImage.length ? [p.primaryImage] : []).concat(p.images.split(",")))]
                    const res = await requestApi(`${API_BASE_URL}/properties/${p.id}/pictures`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({files})
                    }).then(r => {
                        console.log(`  ${files.length} uploaded images for property ${p.id}`)
                        return r.json() as unknown as {data: {images: string[]}}
                    })
                    .catch(err => {
                        console.error("Error uploading images for property", p.id, err)
                        // return {data: {images: []}}
                    })
                    if(res?.data.images.length)  await dal.update<Property>(`/items/properties/${p.id}`, {primaryImage: res.data.images[0], images: res.data.images.join(",")})
                }
            }
        }
        console.log("FINISHED")
        return {
            nbUsers,
            nbProps
        }
    })