import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {NavStackParamList} from '../../navigation/screens';
import KText from '../../components/KText';
import {ScrollView, View, StyleSheet} from 'react-native';
import Menu from '../../components/Menu';
import {useEffect, useState} from 'react';
import {Property as PropertyT} from '@kazaswap/common/lib/types/api/properties';
import Properties from '../../api/properties';
import useIsMobile from '../../hooks/useIsMobile';
import variables from '../../styles/variables';
import SubHeader from '../../components/SubHeader/SubHeader';
import PropertyHead from '../../components/Views/Property/PropertyHead';
import {PropertyCard} from '../../components/PropertyCard/PropertyCard';
import SwapAvailabilities from '../../components/Views/Property/SwapAvailabilities';
import PropertyInfo from '../../components/Views/Property/PropertyInfo';
import PlaceOwner from '../../components/Views/Property/PlaceOwner';
import MapView from '../../components/MapView';
import Gap from '../../components/Gap/Gap';
import GalleryPhoto from '../../components/Views/Property/GalleryPhoto';
import useAuthentication from '../../hooks/useAuthentication';
import useSwapRequest from '../../hooks/useSwapRequest';
import KButton from '../../components/KButton/KButton';
import KModal from '../../components/KModal/KModal';
import Property from '../../components/Views/Property';

type Props = NativeStackScreenProps<NavStackParamList, 'Property'>;

export default ({route, navigation}: Props) => {
  const [property, setProperty] = useState<PropertyT | undefined>();
  const {id} = route.params;
  const {
    showModal,
    setShowModal,
  } = useSwapRequest(id);

  useEffect(() => {
    if (route.params.property) setProperty(route.params.property);
    else
      Properties.get(id)
        .then(res => {
          if (!res.data) return;
          // console.log(res.data);
          //@ts-ignore
          setProperty(res.data);
        })
        .catch(err => {
          console.log(err);
        });
  }, [id]);

  if (!property?.owner) return <KText>Loading...</KText>;
  else {
    let {images, owner, city, country, approxLat, approxLon} = property;
    images = Array.isArray(images) ? images.join(',') : images;
    return (
      <>
        <View style={{backgroundColor: 'black', zIndex: 1}}>
          <SubHeader>
            <PropertyHead
              property={property}
              onBackPress={() =>
                navigation.canGoBack()
                  ? navigation.goBack()
                  : navigation.navigate('Home')
              }
            />
          </SubHeader>
        </View>
        <Property property={property} id={property.id} />
        <Menu navigate={navigation.navigate} />
        <KModal
          visible={!!showModal}
          setVisibility={() => setShowModal(undefined)}>
          {showModal}
        </KModal>
      </>
    );
  }
};

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
