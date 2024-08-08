import { useEffect, useRef, useState } from "react"
import Markdown from "../components/Markdown"
import { ActivityIndicator, Image, Pressable, ScrollView, View } from "react-native"
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { NavStackParamList } from "../navigation/screens";
import variables from "../styles/variables";
import blog from "../api/blog";
import { Api } from "@kazaswap/common";
import { toastError } from "../components/Toast/Toast";
import KText from "../components/KText";
import useIsMobile from "../hooks/useIsMobile";

type Props = NativeStackScreenProps<NavStackParamList, 'Blog' | "Article">;

export default (props:Props) => {
    const {isMobile} = useIsMobile()
    const [loading, setLoading] = useState(true)
    const [article, setArticle] = useState<Api.Blog.Article>()
    const [list, setList] = useState<Api.Blog.Article[]>()

    const articleContentRef = useRef<any>(null)

    useEffect(() => {
        if(props.route.params?.slug && !article) {
                blog.get(props.route.params?.slug)
                .then(a => setArticle(a.data))
                .catch(() => {
                    toastError("Error loading article, please try again later")
                })
                .finally(() => {
                    setLoading(false)
                })
        } else {
            if(!list) {
                blog.all()
                .then(a => setList(a.data))
                .catch(() => {
                    toastError("Error loading articles, please try again later")
                })
                .finally(() => {
                    setLoading(false)
                })
            }
        }
    }, [])

    useEffect(() => {
        if(article && articleContentRef.current) {
            articleContentRef.current.innerHTML = article.content
        }
    }, [article])
    if(loading) return <ActivityIndicator size="large" color="black" />
    return <ScrollView style={{
        padding: 20,
        backgroundColor: variables.colors.greenLight,
    }}>
        {props.route.params?.slug ?
            (article ? 
                <View>
                    <KText>{article.title}</KText>
                    <View ref={articleContentRef}><ActivityIndicator color="black" /></View>
                </View>
            : <ActivityIndicator size="large" color="black" />)
        : <View style={{
            display: "flex",
            flexDirection: "row",
            flexWrap: "wrap",
            width: "100%",
        }}> {list?.map(a => <Pressable style={{
            width: isMobile ? "100%" : 300,
            margin: 5,

        }} onPress={() => {
            props.navigation.navigate("Article", {slug: a.slug})
        }}><View key={a.slug} style={{
            paddingBottom: 20,
            borderRadius: 20,
            width: "100%",
            aspectRatio: isMobile ? "auto" : 4/3,
            backgroundColor: variables.colors.borderGray+"44",
        }}>
            {a.image ? <Image source={{uri: a.image}} style={{
                width: "100%",
                aspectRatio: 16/9,
                objectFit: "cover",
                borderRadius: 20,
                top: 0
            }} /> : <View style={{
                width: "100%",
                aspectRatio: 16/9,
                backgroundColor: variables.colors.borderGray,
                borderRadius: 20,

            }} />}
            <KText style={{fontSize: 20, fontWeight: "bold", flex: 1, display: "flex", justifyContent: "flex-start", alignItems: "center", padding: 5}}>{a.title}</KText>
        </View></Pressable>)}</View>}
    </ScrollView>
}
    