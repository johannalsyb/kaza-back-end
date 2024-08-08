import { Api } from '../../../common/src'
import { DEFAULT_EMAIL, GMAPS_WEB_APIKEY, IMAGE_SERVER, SUPPORT_EMAIL } from '../config'
import { dal } from '../dal'
import { BRoute } from '../types'

const route:BRoute = {
    get: async (request, response) => {
        const articles = await dal.find<Api.Blog.Article>(`/items/blog`)
        response.status(200).send(articles)
    },
    routes: {
        "/:slug": {
            get: async (request, response) => {
                const article = await dal.get<Api.Blog.Article>(`/items/blog/${request.params.slug}`).catch(() => null)
                if (!article) {
                    response.status(404).send({error: "Not found"})
                    return
                }
                response.status(200).send(article)
            }
        }
    }
}

export default route