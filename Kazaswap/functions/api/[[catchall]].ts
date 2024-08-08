/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npx wrangler dev src/index.ts` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npx wrangler publish src/index.ts --name my-worker` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

// These initial Types are based on bindings that don't exist in the project yet,
// you can follow the links to learn how to implement them.

export interface Env {
	// Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
	// MY_KV_NAMESPACE: KVNamespace
	//
	// Example binding to Durable Object. Learn more at https://developers.cloudflare.com/workers/runtime-apis/durable-objects/
	// MY_DURABLE_OBJECT: DurableObjectNamespace
	//
	// Example binding to R2. Learn more at https://developers.cloudflare.com/workers/runtime-apis/r2/
	// MY_BUCKET: R2Bucket
}

const prodDomains = ["kazaswap.co", "www.kazaswap.co", "app.kazaswap.co", "prod.kazaswap.pages.dev"]

const backends = {
	"staging": ["http://be-s.kazaswap.co"],
	"production": ["http://be-p.kazaswap.co"]
}

const basicAuth = {
	"staging": "ZnJvbnRlbmQ6T0tPSjR3bFJ6WHVGcUtRYm5NQ1hGRDg4aGZ0ZzBSSVZReG9OdkZSSndL",
	"production": "ZnJvbnRlbmQ6Q0NqRmwzZG5obHZSV3Jka3JQTW9zeEJ2NjJKaWlpREtHcUkxaXBONWQ="
}

export const onRequest: PagesFunction<Env> = async (
	context
): Promise<Response> => {
	const [_protocol, rest] = context.request.url.split("://")
	const [domain, ...path] = rest.split("/");

	const env = prodDomains.includes(domain) ? "production" : "staging";
	// Get a random backend from the list
	const backend = backends[env][Math.floor(Math.random() * backends[env].length)];
	const url = `${backend}/${path.slice(1).join("/")}`;
	const init = {
		method: context.request.method,
		headers: {
			...Object.fromEntries(context.request.headers.entries()),
			Authorization: `Basic ${basicAuth[env]}`,
		},
		body: context.request.body
	}
	console.log(`REQUESTING ${context.request.url} => ${url}`, init)
	const response = await fetch(url, init);
	console.log("RESPONSE", response.status)
	return response;
}

export default onRequest