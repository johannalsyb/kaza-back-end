import {createHash} from "crypto"
import {HTTPError} from "../../../common/src"
import { BRequest } from "../types"
import { BASE_URL, FE_APP_URL } from "../config"

export const request = async (url:string, options?:RequestInit) => {
  try {
    const res = await fetch(url, options)
    if(res.status >= 400) {
        const data = await res.json()
        throw new HTTPError(data.errors ? data.errors.map((e:any) => e.message).join(", ") : (data.error?.message || "Unknown error"), res.status, data)
    }
    return res
  } catch(err) {
    console.error("Request error", err)
    throw err
  }
}

export const md5 = (data:string) => {
    return createHash('md5').update(data).digest("hex")
}

export const getAppUrl = (request?:BRequest) => {
    return FE_APP_URL || request?.headers?.origin || (request?.headers?.referer ? request?.headers?.referer.substring(0, request?.headers?.referer.indexOf("/", 9)) : "http://localhost:7777")
}

export const getBase64String = (arrayBuffer: ArrayBuffer): string => {
    return btoa(
        new Uint8Array(arrayBuffer)
          .reduce((data, byte) => data + String.fromCharCode(byte), '')
      );
}

/**
 * Formats a date into a friendly string representation.
 * @param {Date} date - The date to format.
 * @returns {string} The formatted date string in the format "Mmm dd".
 */
export const formatFriendlyDate = (date: Date | undefined): string => {
    if (!date) {
      return '';
    }
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: '2-digit',
    });
  };