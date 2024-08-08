import { BMiddleware } from "../types";

const admin:BMiddleware = async (req, res) => {
    try {
        if(!req.user) return {code: 404, message: "Not Found"}
        if(req.user.role !== "admin" &&
            req.user.role !== "superadmin") return {code: 404, message: "Not Found"}
    } catch(err:any) {
        return {code: 500, message: err.message}
    }
}

export default admin