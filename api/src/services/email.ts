import { DEFAULT_EMAIL, DEFAULT_EMAIL_NAME, SENDGRID_APIKEY } from "../config"
import brevo from "./emails/brevo"
import sendgrid from "./emails/sendgrid"

export type EmailRecipient = {
    email: string
    name?: string
}
export type EmailContentType = "text/plain" | "text/html"

export const defaultFrom: EmailRecipient = {
    email: DEFAULT_EMAIL,
    name: DEFAULT_EMAIL_NAME
}

export type EmailParams = {
    to: EmailRecipient[],
    content?: string,
    subject?: string,
    contentType?: EmailContentType
    from?: EmailRecipient,
    cc?: EmailRecipient[],
    bcc?: EmailRecipient[]
    template_id?: string,
    dynamic_template_data?: Record<string, any>,
    attachments?: {
    content: string; // base64-encoded PDF
    filename: string;
    type: string; // MIME type, e.g. "application/pdf"
    disposition?: "attachment" | "inline";
  }[];
}

// Sendgrid has 100emails/day free
// Brevo has 300emails/day free
// TOTAL = 400emails/day free
// 100/400 = 0.25
// 300/400 = 0.75

const servicePercent: {[key:string]: [(p:EmailParams) => Promise<any>, number]} = {
    "sendgrid": [sendgrid, 100],
    // "brevo": [brevo, 300]
}

const total = Object.values(servicePercent).reduce((acc, [_, p]) => acc + p, 0)

const send = async (params: EmailParams) => {
    // const serviceName = Math.random()*total < servicePercent.sendgrid[1] ? "sendgrid" : "brevo"
    const serviceName = "sendgrid"
    const service = servicePercent[serviceName]
    return service[0](params)
    // .catch(e => {
    //     console.error("ERROR: Failed to send email with", serviceName)
    //     const otherServiceName = serviceName === "sendgrid" ? "brevo" : "sendgrid"
    //     const otherService = servicePercent[otherServiceName]
    //     console.error("ERROR: Failed to send email with", serviceName, ", trying with", otherServiceName)
    //     return otherService[0](params)
    // })
    .catch(e => {
        console.error("ERROR: Failed to send email", e)
    })
}

export default send