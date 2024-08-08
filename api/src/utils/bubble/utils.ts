import { request } from ".."

let cookie:string | null = null
const loginApi = async () => {
  const email=process.env.API_ADMIN_EMAIL!
  const password=process.env.API_ADMIN_PASSWORD!
  console.log(`Connecting to Bubble API with ${email}/${password}...`)

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