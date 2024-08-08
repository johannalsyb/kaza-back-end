import Storage from "./Storage"

export type Countries = {[code: string]: string[]}

export const isPhoneValid = (code:string, phone:string) => {
    if(!code || !code.length) return false
    if(!phone || !phone.length) return false
    return `${code}${phone}`.match(/^\+[0-9]*$/);
}

const fetchCountries = ():Promise<Countries> => fetch("/countries.json")
    .then(res => res.json())

export const getCountries = async () => {
    const cc = Storage.get("countries")
    let list = null
    if(cc) {
        const dd = JSON.parse(cc) as {data: Countries, timestamp: number} | any[]
        if(Array.isArray(dd)) {
            // DO NOTHING
        } else if(dd.timestamp+(48*3600*1000) > Date.now()) {
            list = dd.data
        }
    }
    if(!list) {
        list = await fetchCountries()
        Storage.set("countries", JSON.stringify({data: list, timestamp: Date.now()}))
    }
    return list
}

export const parsePhone = async (phone:string) => {
    if(!phone) return null
    const countries = await getCountries()
    const ccode = Object.keys(countries).find(code => phone.startsWith(code))
    if(!ccode) return null
    return {
        code: ccode,
        number: phone.substring(ccode.length)
    }
}