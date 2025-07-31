import { SENDGRID_APIKEY } from "../../config"
import { request } from "../../utils"
import { EmailParams, defaultFrom } from "../email"

export default async (params: EmailParams) => {
    const body: any = {
        personalizations: [
            {
                to: params.to,
                cc: params.cc,
                bcc: params.bcc,
                dynamic_template_data: params.dynamic_template_data,
            },
        ],
        from: params.from || defaultFrom,
    };

    if (params.template_id) {
        body.template_id = params.template_id;
    } else {
        body.subject = params.subject;
        body.content = [
            {
                type: params.contentType || "text/plain",
                value: params.content,
            },
        ];
    }
    if (params.attachments && Array.isArray(params.attachments)) {
        body.attachments = params.attachments;
    }

    return request("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${SENDGRID_APIKEY}`,
        },
        body: JSON.stringify(body),
    }).then((r) => r.json());
};
