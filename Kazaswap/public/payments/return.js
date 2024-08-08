initialize();

async function initialize() {
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  const sessionId = urlParams.get('session_id');
  const response = await fetch(`/api/auth/checkout?session_id=${sessionId}`);
  const {data} = await response.json();
  const session = data
  console.log(queryString, session)

  if (session.status == 'open') {
    window.replace('/payments/checkout.html')
  } else if (session.status == 'complete') {
    document.getElementById('success').classList.remove('hidden');
    const msg = "payment_successful"
    if(window.parent && window.parent.postMessage)  window.parent.postMessage(msg, "*");
    if(window.ReactNativeWebView && window.ReactNativeWebView.postMessage) window.ReactNativeWebView.postMessage(msg);
  }
}