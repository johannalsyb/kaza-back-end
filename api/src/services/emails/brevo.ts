import { BREVO_APIKEY } from "../../config";
import { request } from "../../utils";
import { EmailParams, defaultFrom } from "../email";

export default async (params: EmailParams) => request("https://api.brevo.com/v3/smtp/email",{
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        "api-key": BREVO_APIKEY
    },
    body: JSON.stringify({
        sender: params.from || defaultFrom,
        to: params.to,
        cc: params.cc,
        bcc: params.bcc,
        subject: params.subject,
        htmlContent: params.content,
    })
})
.then(r => r.json())