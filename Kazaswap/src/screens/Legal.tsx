import { useEffect, useState } from "react"
import Markdown from "../components/Markdown"
import { ActivityIndicator, ScrollView, View } from "react-native"
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { NavStackParamList } from "../navigation/screens";
import variables from "../styles/variables";

type Props = NativeStackScreenProps<NavStackParamList, 'Legal'>;

export default (props:Props) => {
    const [loading, setLoading] = useState(true)
    const [content, setContent] = useState("")

    useEffect(() => {
        if(!content) {
            
            fetch(`/documents/${props.route.path}.md`)
            .then(res => res.text())
            .then(text => {
                setContent(text)
            })
            .catch(() => {
                setContent("Error loading content, please try again later")
            })
            .finally(() => {
                setLoading(false)
            })
        }
    }, [])
    if(loading) return <ActivityIndicator size="large" color="black" />
    return <ScrollView style={{
        padding: 20,
        backgroundColor: variables.colors.greenLight,
    }}>
        <Markdown>{content}</Markdown>
    </ScrollView>
}
    