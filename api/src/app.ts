import routes from "./routes";
import adapter from "./adapters/fastify"
const app = adapter(routes)


export default app
