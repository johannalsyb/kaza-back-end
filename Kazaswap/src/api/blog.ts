import Api from "@kazaswap/common/lib/types/api";
import api from ".";

export default {
    all: () => api.get<Api.Blog.Article[]>(`/blog`),
    get: (slug: string) => api.get<Api.Blog.Article>(`/blog/${slug}`)
}