import { CLICKSEND_APIKEY, CLICKSEND_USERNAME, SMSAPI_APIKEY, SMS_ENABLED } from "../config"
import { request } from "../utils"

const smsapi = async (params:{
    message: string,
    to: string,
    from?: string
}) => {
    if(!SMS_ENABLED) return
    return request(`https://api.smsapi.com/sms.do?${new URLSearchParams({...params, format: "json"}).toString()}`,{
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${SMSAPI_APIKEY}`
        }
    })
    .then(r => r.json() as Promise<{
        "count":number,
        "list":
        {
            "id":string, //message id
            "points":number, //price of delivery
            "number":string, //recipient number with country prefix
            "date_sent":number, //send date (sec)
            "submitted_number":string, //phone number in request
            "status": string//message status
        }[]
    }>)
}

const clicksend = async (params:{
    message: string,
    to: string,
    from?: string
}) => {
    if(!SMS_ENABLED) return
    return request(`https://rest.clicksend.com/v3/sms/send`,{
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${Buffer.from(`${CLICKSEND_USERNAME}:${CLICKSEND_APIKEY}`).toString("base64")}`
        },
        body: JSON.stringify({
            messages: [{
                source: "backend",
                body: params.message,
                to: params.to
            }]
        })
    })
    .then(r => r.json() as Promise<{
        "http_code": number,
        "response_code": string,
        "response_msg": string,
        "data": {
          "total_price": number,
          "total_count": number,
          "queued_count": number,
          "messages": {
              "direction": string,
              "date": number,
              "to": string,
              "body": string,
              "from": string,
              "schedule": number,
              "message_id": string,
              "message_parts": number,
              "message_price": number,
              "custom_string": string,
              "user_id": number,
              "subaccount_id": number,
              "country": string,
              "carrier": string,
              "status": string
          }[],
          "_currency": {
            "currency_name_short": string,
            "currency_prefix_d": string
            "currency_prefix_c": string,
            "currency_name_long": string
          }
        }
      }>)
}

export default clicksend