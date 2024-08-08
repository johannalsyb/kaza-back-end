// import { launchImageLibrary } from "react-native-image-picker"

import { Config } from "../hooks/useConfig"

export const upload = async () => {
    // const res = await launchImageLibrary({
    //     mediaType: 'photo',
    //     selectionLimit: 1
    // })
    // if(!res.assets) return null
    // const photo = res.assets[0]
    // if(!photo) return null
    // console.log(photo)
}

export const getPictureUrl = (config:Config, userOrPropId:string, imageId:string, type: "users" | "properties", thumbnail = false) => {
    if(!config) return null
    if(!imageId) return null
    const cc = config.config?.images[type]
    if(!cc) return null
    return `${cc.url}${userOrPropId}/${imageId}${thumbnail ? cc.thumbnailSuffix : cc.suffix}`
}

export const isImageExtension = (ext:string) => {
    return ["png", "jpg", "jpeg", "gif", "webp"].includes(ext)
}

export const isVideoExtension = (ext:string) => {
    return ["mp4", "mov", "avi", "mkv"].includes(ext)
}