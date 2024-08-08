import Stripe from "stripe"
import { STRIPE_SECRET_KEY } from "../../config"

let stripe: Stripe | null = null
export default () => {
    if(!stripe) stripe = new Stripe(STRIPE_SECRET_KEY)
    return stripe
}