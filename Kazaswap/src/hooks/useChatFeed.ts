import React, {useEffect, useState} from 'react';
import auth from '../api/auth';
import {configAtom} from '../atoms';
import {useAtomValue, useSetAtom} from 'jotai';
import {Api, User} from '@kazaswap/common';
import {toastError, toastSuccess} from '../components/Toast/Toast';
import apiConfig from '../api/config';
import swaps from '../api/swaps';
import { ChatMessage } from '@kazaswap/common/lib/types/SwapRequest';
import { set } from '../utils/Storage/storage';

type Config = {
  connected:boolean,
  ws?:WebSocket,
};

export default ({
    swapRequestId,
    onMessage,
    status
}:{
    swapRequestId:string,
    onMessage: (message:ChatMessage) => void,
    status: "pending" | "accepted" | "declined"
}):Config => {
    const [urlFeed, setUrlFeed] = useState<string>()
    const [connected, setConnected] = useState(false);
    const [websocket, setWs] = useState<WebSocket>()

    useEffect(() => {
        if(status === "declined") return
        if(!urlFeed) {
            swaps.requests.chat.getWSUrl(swapRequestId)
            .then(res => {
                if(!res.data.url) throw new Error("No url")
                // console.log("Chat feed url", res.data.url)
                setUrlFeed(res.data.url)
            })
            .catch(err => {
                toastError("Failed to connect to chat feed")
            })
        } else {
            if(websocket) websocket.close()
            const ws = new WebSocket(urlFeed)
            ws.onopen = () => {
                setConnected(true)
            }
            ws.onmessage = (e) => {
                const message = JSON.parse(e.data) as ChatMessage
                onMessage(message)
            }
            ws.onclose = () => {
                setConnected(false)
                setUrlFeed(undefined)
            }
            setWs(ws)
        }
        return () => {
            websocket?.close()
        }
    }, [urlFeed])

    useEffect(() => {
        return () => {
            websocket?.close()
        }
    }, [websocket])

    return {connected, ws:websocket};
};

