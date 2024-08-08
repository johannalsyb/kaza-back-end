import { SENDGRID_APIKEY } from "../../config"
import { request } from "../../utils"
import { EmailParams, defaultFrom } from "../email"

export default async (params: EmailParams) => request("https://api.sendgrid.com/v3/mail/send",{
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SENDGRID_APIKEY}`
    },
    body: JSON.stringify({
        personalizations: [{
            to: params.to,
            cc: params.cc,
            bcc: params.bcc
        }],
        from: params.from || defaultFrom,
        to: params.to,
        cc: params.cc,
        bcc: params.bcc,
        subject: params.subject,
        content: [{
            type: params.contentType || "text/plain",
            value: params.content
        }],
    })
})
.then(r => r.json())