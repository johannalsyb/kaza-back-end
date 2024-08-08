import { ActivityIndicator, Pressable, View } from "react-native"
import { CSSProperties, RefObject, createRef, forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react"
import KFileUpload, {Handle as KFileUploadHandle} from "../Form/KFileUpload"
import variables from "../../styles/variables"
import KImage from "../KImage/KImage"
import KIcon from "../KIcon/KIcon"
import { toastError } from "../Toast/Toast"
import useConfig from "../../hooks/useConfig"
import useResizeImage, { resizeImage } from "../../hooks/useResizeImage"

type Props = {
    src?: string | null,
    imageId?: string | null,
    thumbnail?: boolean,
    type?: "properties" | "users",
    loading?: boolean,
    multiple?: boolean,
    imageStyle?: CSSProperties,
    pressable?: boolean,
    resizeMaxSize?: number,
    onDeleted: () => void,
    onLoaded: (imageId: (string | null)[]) => void,
    onLoading?: (loading: boolean) => void,
    uploadFn?: (b64: string[]) => Promise<string[] | undefined>,
    deleteFn?: (imageId: string) => Promise<void>,
}

export type Handle = {
    onFiles: (b64s: string[]) => void,
    open: () => void,
}

export const KImageUploadWidth = 155

export default forwardRef<Handle, Props>(({
    src,
    imageId,
    thumbnail = false,
    type = "properties",
    multiple = false,
    imageStyle = {},
    pressable = true,
    resizeMaxSize = 800,
    onDeleted,
    onLoading,
    onLoaded,
    uploadFn,
    deleteFn
}:Props, ref) => {
    const furef = useRef<KFileUploadHandle>(null)
    const [loading, setLoading] = useState(false)
    const {config} = useConfig()

    let source = src
    if(imageId && config) {
        const cfg = config.images[type]
        source = `${cfg.url}${imageId}${thumbnail ? cfg.thumbnailSuffix : cfg.suffix}`
    }

    const onFiles = (b64s: string[]) => {
        if(!b64s.length) return;
        // if(!img) return;
        if(!uploadFn) return onLoaded(b64s)

        console.log("resizing", b64s.length)
        setLoading(true)
        Promise.all(b64s.map(b64 => resizeImage(b64, resizeMaxSize)))
        .then(resizedB64s => {
            console.log("uploading", b64s.length)
            return uploadFn(resizedB64s)
        })
        .then(ids => {
            ids && ids.length && onLoaded(ids)
        })
        .catch(e => {
            console.error(e)
            toastError("Error uploading image(s)")
        })
        .finally(() => {
            setLoading(false)
        })
    }

    useImperativeHandle(ref, () => ({
        onFiles,
        open: () => furef.current?.open()
    }))

    useEffect(() => {
        onLoading && onLoading(loading)
    }, [loading])

    const view = <View
    style={{
        width: KImageUploadWidth,
        height: KImageUploadWidth,
        borderWidth: 1,
        borderColor: variables.colors.borderGray,
        borderRadius: 20, 
        marginTop: 10,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
    }}>
        {loading ?
            <View style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                backgroundColor: variables.colors.white,
                opacity: 0.5,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
            }}>
                <ActivityIndicator size="large" color={variables.colors.grey} />
            </View> :
            source ?
                <>
                    <KImage
                        source={source}
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            borderRadius: 20,
                            ...imageStyle
                        }}/>
                    <View style={{
                        position: "absolute",
                        top: -5,
                        right: -5,
                    }}>
                        <KIcon
                            name="crossCircle"
                            size="medium"
                            style={{
                                backgroundColor: variables.colors.closeButton,
                                borderRadius: 100,
                                padding: 5,
                            }}
                            onPress={() => {
                                setLoading(true)
                                if(!imageId || !deleteFn) return onDeleted()
                                deleteFn(imageId)
                                .then(() => {
                                    onDeleted && onDeleted()
                                })
                                .catch(e => {
                                    console.error(e)
                                    toastError("Error deleting image")
                                })
                                .finally(() => {
                                    setLoading(false)
                                })
                            
                            }}
                            />
                    </View>
                </>
            :
            <KIcon name="addPicture" size="large" />}
        <KFileUpload
            onFiles={f => {
                // console.log(f)
                onFiles(f)
            }}
            multiple={multiple}
            ref={furef}/>
    </View>

    return pressable ? <Pressable onPress={e => {
        // console.log("fuRef", index, ref.current)
        // console.log(e, ref)
        furef.current?.open()
        // (picsRefs.current[index] as KFileUploadHandle)?.open()
    }}>
        {view}
    </Pressable> : view
})