import { ActivityIndicator, ScrollView, View, StyleSheet, ViewStyle } from "react-native"
import {Property} from '@kazaswap/common/lib/types/api/properties';
import variables from "../../../styles/variables"
import useIsMobile from "../../../hooks/useIsMobile"
import useAuthentication from "../../../hooks/useAuthentication"
import useSwapRequest from "../../../hooks/useSwapRequest"
import KText from "../../KText"
import Gap from "../../Gap/Gap"
import KButton from "../../KButton/KButton"
import {PropertyCard} from "../../PropertyCard/PropertyCard"
import { useEffect, useState } from "react"
import properties from "../../../api/properties";
import GalleryPhoto from "./GalleryPhoto";
import PlaceOwner from "./PlaceOwner";
import SwapAvailabilities from "./SwapAvailabilities";
import PropertyInfo from "./PropertyInfo";
import MapView from "../../MapView";
import SwapRequestButton from "../../SwapRequestButton/SwapRequestButton";
import KIcon from "../../KIcon/KIcon";

type Props = {
    id: string,
    property?: Property,
    style?: ViewStyle,
    contentContainerStyle?: ViewStyle,
}

export const leftColumnWidth = 700;
export const rightColumnWidth = 550;

export default (props: Props) => {
    const [property, setProperty] = useState<Property | undefined>(props.property);
    const {isMobile} = useIsMobile()
    const {user} = useAuthentication();
    const {
        loading,
        swapRequest,
        swapRequestStatus,
        showModal,
        declineSwapRequest,
        acceptSwapRequest,
        setShowModal,
    } = useSwapRequest(props.id);
    const [ploading, setPloading] = useState(false);

    useEffect(() => {
      if (!props.property || property?.id !== props.id) {
        setPloading(true);
        properties.get(props.id)
          .then(res => {
            if (!res.data) return;
            // console.log(res.data);
            //@ts-ignore
            setProperty(res.data);
          })
          .catch(err => {
            console.log(err);
          })
          .finally(() => {
            setPloading(false);
          });
      }
    }, [props.id]);

    if (!property?.owner) return <ActivityIndicator color={variables.colors.yellow} />;

    let {images, owner, city, country, approxLat, approxLon} = property;
    images = Array.isArray(images) ? images.join(',') : images;

    if(ploading) return <ActivityIndicator color={variables.colors.yellow} />

    return <>
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={{
            backgroundColor: variables.colors.greenLight,
            borderTopLeftRadius: isMobile ? 0 : 20,
            borderTopRightRadius: isMobile ? 0 : 20,
            ...(props.style || {})
          }}
          contentContainerStyle={{
            flex: 1,
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'space-around',
            padding: isMobile
              ? variables.spacing.xsmall
              : variables.spacing.large,
            ...(props.contentContainerStyle || {})
          }}>
          {isMobile && swapRequest && swapRequestStatus === 'received' && (
            <View
              style={{
                width: '100%',
                aspectRatio: 373 / 133,
                backgroundColor: variables.colors.yellow,
                borderRadius: 20,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 10,
              }}>
              <KText style={{color: variables.colors.grey}}>
                {swapRequest.from.firstName} has sent you a
                <KText style={{color: 'black', marginLeft: 5}}>
                  Swap Request
                </KText>
              </KText>
              <Gap size="small" vertical />
              <View
                style={{
                  flexDirection: 'row',
                }}>
                <KButton
                  text="Decline"
                  color="greenLight"
                  icon="close"
                  iconSize="large"
                  loading={loading}
                  onPress={declineSwapRequest}
                />
                <Gap size="small" />
                <KButton
                  text="Accept"
                  color="tertiary"
                  icon="tick"
                  iconSize="small"
                  loading={loading}
                  onPress={acceptSwapRequest}
                />
              </View>
            </View>
          )}
          {isMobile && (
            <>
            <View style={{
              width: '100%',
              backgroundColor: variables.colors.white,
              padding: 10,
              borderRadius: 20,
              marginBottom: 10,
              display: property.owner.id === user?.id || (swapRequest && swapRequestStatus === 'received') ? "none" : 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
            }}>
              <KIcon name="chat" style={{stroke: variables.colors.black, height: "100%", width:30}} />
              <SwapRequestButton property={property} hideIcon={true} />
            </View>
            <PropertyCard
              key="property"
              property={property}
              favourite={
                user &&
                user.favourites &&
                property &&
                user.favourites.includes(property.id)
                  ? true
                  : false
              }
              photo={`${props.id}/${images.split(',')[0]}`}
              avatar={`${owner.id}/${owner.primaryImage}`}
              location={`${city}`}
              swapFor={owner.swapLocations || 'Flexible'}
              availableDate={{
                from: owner.dateFrom ? new Date(owner.dateFrom) : null,
                to: owner.dateTo ? new Date(owner.dateTo) : null,
              }}
              style={{
                marginBottom: isMobile ? 10 : 0,
              }}
            />
            </>
          )}
          <View key="leftView" style={{width: '100%', maxWidth: leftColumnWidth}}>
            <GalleryPhoto key="gallery" property={property} />
            <Gap size="medium" vertical />
            {!isMobile && (
              <>
                <PlaceOwner key="owner" property={property} />
                <Gap size="medium" vertical />
              </>
            )}
          </View>
          <View key="rightView" style={{width: '100%', maxWidth: rightColumnWidth, marginLeft: isMobile ? 0 : 20}}>
            {!isMobile && (
              <SwapAvailabilities key="property" property={property} />
            )}
            {!isMobile && <Gap size="medium" vertical />}
            <PropertyInfo key="info" property={property} />
            <Gap size="medium" vertical />
            <View
              key="map"
              style={{
                width: '100%',
                aspectRatio: 620 / 380,
                borderRadius: 20,
              }}>
              <View
                style={{
                  aspectRatio: 620 / 60,
                  width: '100%',
                  backgroundColor: 'white',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  padding: 30,
                  borderTopLeftRadius: 20,
                  borderTopRightRadius: 20,
                  justifyContent: 'center',
                  zIndex: 1,
                }}>
                <KText style={styles.lightText}>Neighborhood</KText>
              </View>
              <MapView
                lat={approxLat}
                lng={approxLon}
                points={[{lat: approxLat, lng: approxLon}]}
                zoom={14}
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: 20,
                  marginBottom: 20,
                }}
                circles={[{lat: approxLat, lng: approxLon, radius: 1000}]}
              />
            </View>
            {isMobile && <PlaceOwner key="owner" property={property} hideSwapRequestButton={true}/>}
          </View>
          {isMobile && <View style={{height: 100, width: '100%'}} />}
        </ScrollView>
        {/* <Menu navigate={navigation.navigate} />
        <KModal
          visible={!!showModal}
          setVisibility={() => setShowModal(undefined)}>
          {showModal}
        </KModal> */}
    </>
}


const styles = StyleSheet.create({
    lightText: {
      opacity: 0.5,
      width: '100%',
      textAlign: 'left',
    },
    lightCircle: {
      borderWidth: 1,
      borderRadius: 50,
      padding: 10,
      height: 40,
      width: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
});