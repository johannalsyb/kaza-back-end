import { Share } from "react-native";
import { toastError } from "../../components/Toast/Toast";

export const isAvailable = navigator.share !== undefined;

export default {
    isAvailable,
}