import { BMiddleware } from "../types";

const admin:BMiddleware = async (req, res) => {
    try {
        if(!req.user) return {code: 404, message: "Not Found"}
        const role = (req.user.role || "").toLowerCase()
        // Accept any role string that contains "admin" (admin, superadmin, administrator, etc.)
        if(!role.includes("admin")) return {code: 404, message: "Not Found"}
    } catch(err:any) {
        return {code: 400, message: err.message}
    }
}

export default admin