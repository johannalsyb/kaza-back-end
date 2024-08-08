import { DIRECTUS_AUTH_BEARER, DIRECTUS_URL } from "../config";
import DAL from "./DAL";

export const dal = new DAL(DIRECTUS_URL, {bearer: DIRECTUS_AUTH_BEARER})