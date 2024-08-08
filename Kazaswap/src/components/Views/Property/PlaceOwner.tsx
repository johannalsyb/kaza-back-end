import KText from '../../KText';
import {View, StyleSheet} from 'react-native';
import {Property} from '@kazaswap/common/lib/types/api/properties';
import variables from '../../../styles/variables';
import KIcon from '../../KIcon/KIcon';
import {CircleImage} from '../../CircleImage/CircleImage';
import Gap from '../../Gap/Gap';
import {IconText} from '../../IconText/IconText';
import SwapRequestButton, { SwapRequestButtonHandle } from '../../SwapRequestButton/SwapRequestButton';
import useIsMobile from '../../../hooks/useIsMobile';
import useAuthentication from '../../../hooks/useAuthentication';
import { useRef } from 'react';

type Props = {
  property?: Property;
  hideSwapRequestButton?: boolean;
};

export default ({
  property,
  hideSwapRequestButton
}: Props) => {
  const {isMobile} = useIsMobile();
  const {user} = useAuthentication();

  const swpReqButtonRef = useRef<SwapRequestButtonHandle>(null);

  if (!property?.owner) return <KText>Loading...</KText>;
  else return <View style={styles.container}>
    <KText style={styles.lightText}>{swpReqButtonRef.current?.hasActiveSwapRequest() ? "" : "Place Owner"}</KText>
    <Gap size="small" vertical />
    <View style={styles.avatar}>
      <CircleImage
        size="small"
        imageId={`${property.owner.id}/${property.owner.primaryImage}`}
        type="users"
      />
      {/* <KIcon
        name="instagram"
        size="large"
        style={{
          position: 'absolute',
          top: 80,
          right: 0,
          left: 0,
          margin: 'auto',
          borderRadius: 100,
        }}
      /> */}
    </View>
    <Gap size="medium" vertical />
    <KText style={{fontSize: 24}}>{property.owner.firstName}</KText>
    <Gap size="xsmall" vertical />
    <IconText
      size="medium"
      iconName="location"
      text={`${property.city}, ${property.country}`}
    />
    <Gap size="xsmall" vertical />
    {!!property.owner.hobby && (
      <>
        <KText style={{textAlign: "center"}}>{property.owner.hobby}</KText>
        <Gap size="xsmall" vertical />
      </>
    )}
    {!!property.owner.job && (
      <IconText size="medium" iconName="job" text={property.owner.job} />
    )}
    {isMobile && <Gap size="xsmall" vertical />}
    <View style={{
        position: isMobile ? undefined : "absolute",
        top: isMobile ? "auto" : 20,
        right: isMobile ? "auto" : 20,
        display: (!user || user.id !== property.owner.id) && !hideSwapRequestButton ? "flex" : "none"
    }}>
      <SwapRequestButton
        ref={swpReqButtonRef}
        property={property}
        buttonStyle="primary"
        iconStyle={{color: variables.colors.yellow}}
        hideIcon={true}
      />
    </View>
  </View>
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 20,
    padding: variables.spacing.medium,
    maxWidth: 700,
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    backgroundColor: variables.colors.yellow,
  },
  lightText: {
    opacity: 0.5,
    width: '100%',
    textAlign: 'left',
  },
  avatar: {},
});
