import {useAtom, useSetAtom} from 'jotai';
import {showSignInAtom} from '../atoms';
import useAuthentication from './useAuthentication';
import swaps from '../api/swaps';

import {PublicUser} from '@kazaswap/common/lib/types/User';
import {useEffect, useState} from 'react';
import {SwapRequest} from '@kazaswap/common/lib/types/api/swap';
import {toastError} from '../components/Toast/Toast';
import VerifyAccount from '../components/Views/SwapRequest/VerifyAccount';
import {Property} from '@kazaswap/common/lib/types/api/properties';
import users from '../api/users';
import Decline from '../components/Views/SwapRequest/Decline';
import {useNavigation, useRoute} from '@react-navigation/native';
import Properties from '../api/properties';
import { set } from '../utils/Storage/storage';
import useConfig from './useConfig';
import KText from '../components/KText';
import { View } from 'react-native';
import KButton from '../components/KButton/KButton';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { NavStackParamList } from '../navigation/screens';
import variables from '../styles/variables';

export type SwapRequestStatus =
  | 'unknown'
  | 'ownproperty'
  | 'sent'
  | 'received'
  | 'none'
  | 'accepted'
  | 'declined';

const useSwapRequest = (propertyId: string) => {
  const auth = useAuthentication();
  const user = auth.user;
  const [swapRequestStatus, setSwapRequestStatus] =
    useState<SwapRequestStatus>('unknown');
  const {config} = useConfig()
  const setShowSignIn = useSetAtom(showSignInAtom);
  const [swapRequest, setSwapRequest] = useState<
    {sr: SwapRequest; from: PublicUser} | undefined | null
  >(undefined);
  const [showModal, setShowModal] = useState<React.ReactNode | undefined>();
  const [loading, setLoading] = useState(false);

  const navigation = useNavigation<NativeStackNavigationProp<NavStackParamList, 'Property', undefined>>();

  useEffect(() => {
    if(!user) return
    Promise.all([auth.properties.get(), auth.requests.get()])
    .then(([properties, requests]) => {
      if(!properties.length) return setSwapRequestStatus('none')
      const property = properties.find(p => p.id === propertyId)
      if(property) return setSwapRequestStatus('ownproperty')
      let status: SwapRequestStatus = 'none';
      const sr = requests.find(
        req => req.status !== "declined" &&
          (req.fromProperty.id === propertyId ||
          req.toProperty.id === propertyId)
      );
      if (sr) {
        setSwapRequest({sr, from: sr.fromProperty.owner}); 
        if(sr.status === "accepted") status = "accepted"
        else if(sr.status === "declined") status = "declined"
        else {
          if(sr.fromProperty.id === propertyId) status = "received"
          else if(sr.toProperty.id === propertyId) status = "sent"
        }
      }
      setSwapRequestStatus(status)
    })
    .catch(e => {
      // toastError(e)
      console.error(e);
    });
  }, [propertyId]);

  const sendSwapRequest = (to?:string) => {  
    if(!config) return
    const prevValue = swapRequestStatus;
    setSwapRequestStatus('unknown')
    const promise = (!user || (config.features.swapRequest === false && !user?.role.includes("admin"))) ? Promise.resolve([]) : auth.properties.get()
    promise
      .then(r => {
        if (!r.length) {
          if(!user) setShowSignIn(true)
          if(config.features.swapRequest === false) {
            throw new Error("Swap requests are coming soon !")
          }
          else throw new Error("You need to have a verified property to send a swap request")
        }
        else return swaps.requests.new(r[0].id, propertyId);
      })
      .then(r => {
        if (r?.data) {
          setSwapRequestStatus('sent');
          setShowModal(<>
            <KText style={{textAlign: 'center', padding: 10, fontSize: 24, fontWeight: "600", marginTop: 10, marginBottom: 10}}>Swap Request sent</KText>
            <KText style={{textAlign: 'center', fontSize: 16, color: variables.colors.blackLight}}>You have sent a swap request{to ? ` to ${to}` : ""}.</KText>
            <KText style={{textAlign: 'center', fontSize: 16, color: variables.colors.blackLight}}>Open the chat now to discuss further.</KText>
            <View style={{display: "flex", flexDirection: "row", width: "100%", justifyContent: "center", alignItems: "center", marginTop: 30, marginBottom: 20}}>
              <KButton text="Close" color="light" onPress={() => setShowModal(undefined)} style={{marginRight: 5, borderColor: "white"}}/>
              <KButton text="Chat now" color="primary" onPress={() => {
                setShowModal(undefined)
                navigation.navigate('Chat', {id: r.data.id})
              }} style={{marginLeft: 5}}/>
            </View>
          </>);
        }
        else setSwapRequest(null);
      })
      .catch(e => {
        console.error(e);
        const message =
          e.json?.data?.error ||
          e.statusText ||
          e.message ||
          'An error occured';
        toastError(message);
        if (message === 'User not verified') {
          setShowModal(
            <VerifyAccount onClicked={() => setShowModal(undefined)} />,
          );
        } else if (message === 'Swap requests are coming soon !') {
          setShowModal(
            <KText style={{textAlign: 'center', padding: 10, fontSize: 20}}>
              Swap requests are coming soon 🙌!
            </KText>
          );
        }
        setSwapRequestStatus(prevValue);
      })
      .finally(() => {
        // DO NOTHING
      });
  };

  const declineSwapRequest = () => {
    if (!swapRequest) return;
    setShowModal(
      <Decline
        swapRequest={swapRequest.sr}
        onCancel={() => setShowModal(undefined)}
        onDeclined={() => {
          setSwapRequestStatus('declined');
          setShowModal(undefined);
        }}
        onError={() => {
          // setShowModal(undefined)
        }}
      />,
    );
  };

  const acceptSwapRequest = () => {
    if (!swapRequest) return;
    setLoading(true);
    swaps.requests
      .accept(swapRequest.sr.id)
      .then(r => {
        setSwapRequestStatus('accepted');
      })
      .catch(e => {
        console.error(e);
        const message =
          e.json?.data?.error ||
          e.statusText ||
          e.message ||
          'An error occured';
        toastError(message);
        if (message === 'User not verified') {
          setShowModal(
            <VerifyAccount onClicked={() => setShowModal(undefined)} />,
          );
        }
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return {
    swapRequest,
    loading,
    showModal,
    swapRequestStatus,
    sendSwapRequest,
    declineSwapRequest,
    acceptSwapRequest,
    setShowSignIn,
    setShowModal,
  };
};

export default useSwapRequest;
