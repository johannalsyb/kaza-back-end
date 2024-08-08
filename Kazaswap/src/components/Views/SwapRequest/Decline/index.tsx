import { View } from "react-native";
import KText from "../../../KText";
import KTextInput from "../../../Form/KTextInput/KTextInput";
import KButton from "../../../KButton/KButton";
import { useState } from "react";
import { SwapRequest } from "@kazaswap/common/lib/types/api/swap";
import swaps from "../../../../api/swaps";
import { toastError } from "../../../Toast/Toast";

type Props = {
    swapRequest: SwapRequest
    onCancel: () => void
    onDeclined: (sr: SwapRequest) => void
    onError: (e:any) => void
}

export default (props:Props) => {
    const [loading, setLoading] = useState(false)
    const [note, setNote] = useState<string>("")

    return <View style={{padding: 20, alignItems: "center"}}>
          <KText style={{fontSize: 30, fontWeight: "bold"}}>Decline swap request</KText>
          <KText style={{marginTop: 20, marginBottom: 20}}>Please explain in a few sentences why you are declining this request</KText>
          <KTextInput onChangeText={setNote} multiline={true} topStyle={{width: "100%",marginBottom: 20 }} value={note}/>
          <KButton text="Decline" color="primary" disabled={!note.length} loading={loading} onPress={() => {
            if(!props.swapRequest) return;
            setLoading(true)
            swaps.requests.decline(props.swapRequest.id, note)
            .then(r => {
            //   setSwapRequestStatus("declined")
                props.onDeclined(r.data)
            })
            .catch(e => {
              console.error(e)
              const message = e.json?.data?.error || e.statusText || e.message || 'An error occured'
              toastError(message)
              props.onError(e)
            })
            .finally(() => {
              setLoading(false)
            //   setShowModal(undefined)
            })}
          } />
          <KButton text="Cancel" color="greenLight" loading={loading} onPress={props.onCancel} />
    </View>
}