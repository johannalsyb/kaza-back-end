import KText from '../../KText';
import {Pressable, View, StyleSheet} from 'react-native';
import {Property} from '@kazaswap/common/lib/types/api/properties';
import variables from '../../../styles/variables';
import KIcon from '../../KIcon/KIcon';
import {CircleImage} from '../../CircleImage/CircleImage';
import useAuthentication from '../../../hooks/useAuthentication';
import {useEffect, useState} from 'react';
import properties from '../../../api/properties';
import share, { shareProperty } from '../../../utils/Share';
import {useSetAtom} from 'jotai';
import {showSignInAtom} from '../../../atoms';
import Gap from '../../Gap/Gap';
import useIsMobile from '../../../hooks/useIsMobile';
import SwapRequestButton from '../../SwapRequestButton/SwapRequestButton';

type Props = {
  property?: Property;
  onBackPress?: () => void;
};

export default ({property, onBackPress}: Props) => {
  const auth = useAuthentication();
  const user = auth.user;
  const [isFav, setIsFav] = useState(
    property &&
      user &&
      user.favourites &&
      user.favourites.includes(property.id),
  );
  const setShowSignIn = useSetAtom(showSignInAtom);
  const {isMobile} = useIsMobile();

  if (!property?.owner) return <KText>Loading...</KText>;

  const toggleFav = () => {
    if (!property) return;
    properties.favourites
      .toggle(property.id)
      .then(r => setIsFav(r.data.includes(property.id)))
      .catch(e => console.log(e));
  };

  useEffect(() => {
    setIsFav(
      property &&
        user &&
        user.favourites &&
        user.favourites.includes(property.id),
    );
  }, [property]);

  return (
    <>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
        }}>
        <Pressable style={[
          styles.lightCircle,
          {
            backgroundColor: 'white',
            borderColor: isMobile ? 'white' : "black",
            marginLeft: isMobile ? 5 : 0
          }
        ]} onPress={onBackPress}>
          <KIcon name="back" size="large" />
        </Pressable>
        {!isMobile && (
          <>
            <Gap size="large" />
            <CircleImage
              size="xxsmall"
              imageId={`${property.owner.id}/${property.owner.primaryImage}`}
              thumbnail
              type="users"
            />
            <Gap size="small" />
            {/* <KText>{property.owner.firstName}</KText> */}
            {/* <Gap size="small" /> */}
            <KIcon name="pin" size="medium" style={{
                opacity: 0.4,
            }}/>
            <KText
              style={{
              }}>
              {`${property.city}, ${property.country}`}
            </KText>
          </>
        )}
        {/* <KIcon name="star" size="medium" />
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            padding: 15,
            backgroundColor: variables.colors.greenLight,
            borderRadius: 30,
            height: 40,
          }}>
          <KIcon size="medium" name="review" />
          <Gap size="xsmall" />
          <KText>{` Review(s)`}</KText>
        </View> */}
      </View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: isMobile ? 'flex-end' : 'center',
        }}>
        <Pressable
          style={[
            styles.lightCircle,
            {
              backgroundColor: 'white',
              borderColor: isMobile ? 'white' : "black",
            }
          ]}
          onPress={() => shareProperty()}>
          <KIcon
            name="share"
            size="large"
            style={{
              stroke: 'black',
            }}
          />
        </Pressable>
        <Gap size="small" />
        <Pressable
          style={[
            styles.lightCircle,
            {
              backgroundColor: variables.colors.yellow,
              borderColor: variables.colors.yellow,
              marginRight: isMobile ? 5 : 0
            },
          ]}
          onPress={() => (user ? toggleFav() : setShowSignIn(true))}>
          <KIcon
            name="fav"
            size="large"
            style={{
              stroke: 'black',
              fill: isFav ? 'black' : 'none',
            }}
          />
        </Pressable>
        {!isMobile && <Gap size="small" />}
        {!isMobile && <SwapRequestButton property={property} />}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
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
