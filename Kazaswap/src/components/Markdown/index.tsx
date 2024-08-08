import Markdown from "react-native-markdown-display"

type Props = {
    children: string
}

export default (props:Props) => {
    return <Markdown>{props.children}</Markdown>
}