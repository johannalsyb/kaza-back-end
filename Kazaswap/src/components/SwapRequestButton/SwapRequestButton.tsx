
import KText from '../../components/KText';
import {ActivityIndicator, TextStyle, View, ViewStyle} from 'react-native';
import {Property} from '@kazaswap/common/lib/types/api/properties';
import variables from '../../styles/variables';
import KButton, {KButtonProps} from '../../components/KButton/KButton';
import useAuthentication from '../../hooks/useAuthentication';
import {useAtom, useAtomValue, useSetAtom} from 'jotai';
import KModal from '../../components/KModal/KModal';
import Gap from '../../components/Gap/Gap';
import useIsMobile from '../../hooks/useIsMobile';
import useSwapRequest from '../../hooks/useSwapRequest';
import { forwardRef, useImperativeHandle } from 'react';
import { propertiesAtom } from '../../atoms';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { NavStackParamList } from '../../navigation/screens';

type Props = {
  property: Property;
  buttonStyle?: KButtonProps['color'];
  iconStyle?: KButtonProps['iconStyle'];
  hideIcon?: boolean;
};

export type SwapRequestButtonHandle = {
  hasActiveSwapRequest: () => undefined | "received" | "sent";
}

export default forwardRef<SwapRequestButtonHandle, Props>(({
    property,
    buttonStyle = 'secondary',
    iconStyle,
    hideIcon
}: Props, ref) => {
  const auth = useAuthentication();
  const {user} = auth;
  const {isMobile} = useIsMobile();
  const {
    showModal,
    loading,
    swapRequest,
    swapRequestStatus,
    sendSwapRequest,
    declineSwapRequest,
    acceptSwapRequest,
    setShowSignIn,
    setShowModal,
  } = useSwapRequest(property.id);

  const [properties] = [useAtomValue(propertiesAtom)]
  const navigation = useNavigation<NativeStackNavigationProp<NavStackParamList, "Myplace", undefined>>()

  if (!property.owner)
    return <ActivityIndicator color={variables.colors.yellow} />;

  let buttonText = 'Send Message';
  let buttonDisabled = false;
  if (swapRequestStatus === 'sent') {
    buttonText = 'Request sent';
    buttonDisabled = true;
  } else if (swapRequestStatus === "received") {
    // buttonDisabled = true;
    buttonText = 'Request received';
  } else if (swapRequestStatus === 'ownproperty') {
    buttonDisabled = true;
  } else if (swapRequestStatus === 'accepted') {
    buttonText = 'Request Accepted';
    buttonDisabled = true;
  } else if (swapRequestStatus === 'declined') {
    buttonText = 'Request Declined';
    buttonDisabled = true;
  }

  const renderButton = () => {
    if (swapRequest && swapRequestStatus === 'received') return null;
    return (
      <KButton
        text={buttonText}
        disabled={buttonDisabled}
        loading={user && swapRequestStatus === 'unknown'}
        size="small"
        color={buttonStyle}
        iconStyle={{
          ...{
            stroke: buttonText === "Send Message" ? variables.colors.yellow : "black"
          },
          ...iconStyle,
          // stroke: buttonDisabled ? variables.colors.grey : 'initial'
        }}
        style={{
          ...{
            backgroundColor: buttonText === "Send Message" ? "black" : "initial"
          },
          width: 150,
          // filter: buttonDisabled ? 'grayscale(100%)' : 'initial',
        }}
        textStyle={{
          ...{
            color: buttonText === "Send Message" ? "white" : "initial"
          },
          // : buttonDisabled ? 'grayscale(100%)' : 'initial',
          // color: buttonDisabled ? variables.colors.grey : 'initial',
        }}
        icon={hideIcon ? undefined : "swap"}
        iconSize="medium"
        onPress={() => {
          if(buttonDisabled) return

          if ((properties || []).some(p => p.private)) {
            setShowModal(<View style={{padding: 20, paddingTop: 50, display: "flex", flexDirection: "column", justifyContent:"center", alignItems: "center"}}>
              <KText style={{fontSize: 18, textAlign: "center"}}>Your property is currently hidden. Make it visible to contact others !</KText>
              <KButton onPress={() => {
                navigation.navigate("Myplace", {edit: true})
                setShowModal(undefined)
              }} text='Edit my place' style={{marginTop: 20}} icon="placeType" />
            </View>)
            return
          }

          (user ? sendSwapRequest() : setShowSignIn(true))
        }}
      />
    );
  };

  useImperativeHandle(ref, () => ({
    hasActiveSwapRequest: () => {
      if(swapRequestStatus === 'received') return "received"
      else if(swapRequestStatus === 'sent') return "sent"
      else return undefined
  }}));

  return (
    <>
      {!isMobile ? (
        <>
          {swapRequest &&
          swapRequest.sr.status === 'pending' &&
          swapRequestStatus === 'received' ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 30,
                height: 40,
              }}>
              <KText style={{color: variables.colors.grey}}>
                {swapRequest.from.firstName} has sent you a
                <KText style={{color: 'black', marginLeft: 5}}>
                  Swap Request
                </KText>
              </KText>
              <Gap size="small" />
              <KButton
                text="Decline"
                color="greenLight"
                icon="close"
                iconSize="large"
                loading={loading}
                onPress={declineSwapRequest}
                style={{
                  marginLeft: 10,
                  marginRight: 10,
                }}
              />
              <Gap size="small" />
              <KButton
                text="Accept"
                color={buttonStyle}
                iconStyle={iconStyle}
                icon="tick"
                iconSize="small"
                loading={loading}
                onPress={acceptSwapRequest}
              />
            </View>
          ) : (
            renderButton()
          )}
        </>
      ) : (
        renderButton()
      )}
      <KModal
        visible={!!showModal}
        setVisibility={() => setShowModal(undefined)}>
        {showModal}
      </KModal>
    </>
  );
})
