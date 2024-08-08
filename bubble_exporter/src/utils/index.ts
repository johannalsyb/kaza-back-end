import {createHash} from "crypto"
import {HTTPError} from "@kazaswap/common"

export const request = async (url:string, options:RequestInit) => {
    const res = await fetch(url, options)
    if(res.status >= 400) {
        const data = await res.json()
        throw new HTTPError(data.errors ? data.errors.map((e:any) => e.message).join(", ") : (data.error?.message || "Unknown error"), res.status, data)
    }
    return res
}

export const md5 = (data:string) => {
    return createHash('md5').update(data).digest("hex")
}

export const getBase64String = (arrayBuffer: ArrayBuffer): string => {
    return btoa(
        new Uint8Array(arrayBuffer)
          .reduce((data, byte) => data + String.fromCharCode(byte), '')
      );
}

/**
 * Formats a date into a friendly string representation.
 * @param {Date} date - The date to format.
 * @returns {string} The formatted date string in the format "Mmm dd".
 */
export const formatFriendlyDate = (date: Date | undefined): string => {
  if (!date) {
    return '';
  }
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: '2-digit',
  });
};


let cookie:string | null = null
const loginApi = async () => {
  const email=process.env.API_ADMIN_EMAIL!
  const password=process.env.API_ADMIN_PASSWORD!
  console.log(`Connecting to API with ${email}/${password}...`)

  const url = process.env.API_BASE_URL + "/auth/login"
  const res = await request(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({email, password})
  })
  console.log("Connected to API")
  return res.headers.getSetCookie()[0].split(";")[0]+";"
}

export const requestApi = async (input: string, init?: RequestInit | undefined) => {
  if(!cookie) cookie = await loginApi()
  if(!init) init = {}
  if(!init.headers) (init as any).headers = {};
  (init.headers as any)["Cookie"] = cookie
  return request(input, init)
}