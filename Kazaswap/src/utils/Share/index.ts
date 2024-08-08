import { Share } from "react-native";
import {isAvailable} from "./share";
import { toastError, toastSuccess } from "../../components/Toast/Toast";

export const share = (message:string) => {
    if(!isAvailable) return Promise.reject(new Error("Share is not available"));
    return new Promise((resolve, reject) => {
        Share.share({message})
        .then(result => {
            if (result.action === Share.sharedAction) {
                if (result.activityType) {
                    // shared with activity type of result.activityType
                } else {
                    // shared
                }
            } else if (result.action === Share.dismissedAction) {
                // dismissed
            }
            resolve(result)
        })
        .catch((error: any) => {
            // toastError(error.message);
            resolve(null)
        })
    })
}

export const shareProperty = (url = window.location.href) => {
    const text = `Hi, have a look at this property on Kazaswap: ${url}`
    if(isAvailable)  share(text)
    else {
        // Copy text to clipboard
        navigator.clipboard.writeText(text)
        toastSuccess("You can now paste it to your friends !", "Link copied to clipboard", {
            placement: "top",
            // style: {
            //   backgroundColor: variables.colors.greenLight,
            // }
        })
    }
}

export default share
