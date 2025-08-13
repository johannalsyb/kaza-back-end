import { BMiddleware } from "../types";

const admin:BMiddleware = async (req, res) => {
    try {
        if(!req.user) {
            console.log("Admin middleware: No user found")
            return {code: 404, message: "Not Found"}
        }
        const role = (req.user.role || "").toLowerCase()
        console.log(`Admin middleware: User ${req.user.id} has role "${req.user.role}" (normalized: "${role}")`)
        // Accept any role string that contains "admin" (admin, superadmin, administrator, etc.)
        if(!role.includes("admin")) {
            console.log(`Admin middleware: Access denied for role "${role}"`)
            return {code: 404, message: "Not Found"}
        }
        console.log(`Admin middleware: Access granted for role "${role}"`)
    } catch(err:any) {
        console.error("Admin middleware error:", err)
        return {code: 400, message: err.message}
    }
}

export default admin