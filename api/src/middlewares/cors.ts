import {
    CORS_ALLOWED_ORIGINS,
    CORS_ALLOWED_HEADERS,
    CORS_ALLOWED_METHODS,
} from "../config";
import { BMiddleware } from "../types";

export const corsHeaders = {
    "Access-Control-Allow-Origin": CORS_ALLOWED_ORIGINS.join(", "),
    "Access-Control-Allow-Methods": CORS_ALLOWED_METHODS.join(", "),
    "Access-Control-Allow-Headers": CORS_ALLOWED_HEADERS.join(", ")
    // "Access-Control-Max-Age": "86400",
}

const cors:BMiddleware = (req, res) => {
    res.headers = {
        ...res.headers,
        ...corsHeaders
    }
}

export default cors