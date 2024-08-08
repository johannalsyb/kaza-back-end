export const API_URL = process.env.REACT_APP_API_URL || "/api"
export const WS_URL = process.env.REACT_APP_WS_URL ||
    `${document.location.protocol === "https:" ? "wss" : "ws"}://${document.location.host}${API_URL}`