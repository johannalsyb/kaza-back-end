import DAL from "./DAL";
const DIRECTUS_AUTH_BEARER=process.env.DIRECTUS_AUTH_BEARER
const DIRECTUS_URL=process.env.DIRECTUS_URL

export const dal = new DAL(DIRECTUS_URL!, {bearer: DIRECTUS_AUTH_BEARER})