// This is your publishable API key.
let stripe_pub_apikey = "pk_test_51NtCJjCdvZbuHRnNsIaqszLFrLA3mk7TXxhvGf5K9c1Xeyg20MrSZkjEryQJabAYHdWyXwQdqXTrcxyIlMA2zUBp00HHKUpQ79"
if(window.location.hostname == "app.kazaswap.co") {
  stripe_pub_apikey = "pk_live_51NtCJjCdvZbuHRnNbxFRbK8n8EfkJ3GinFSb5XoZUi2e55KilpFkQ4QM8X7OTMk0zAI2OMClkBU2zde2eFEeDHEk00uv9G4RnK"
}
const stripe = Stripe(stripe_pub_apikey);

initialize();

// Create a Checkout Session
async function initialize() {
  const fetchClientSecret = async () => {
    const response = await fetch(`/api/auth/checkout`, {
      method: "POST",
    });
    const { data: {clientSecret} } = await response.json();
    return clientSecret;
  };

  const checkout = await stripe.initEmbeddedCheckout({
    fetchClientSecret,
  });

  // Mount Checkout
  checkout.mount('#checkout');
}