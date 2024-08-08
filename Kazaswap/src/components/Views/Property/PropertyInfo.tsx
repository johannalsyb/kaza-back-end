import KText from '../../KText';
import {View, StyleSheet, ViewStyle} from 'react-native';
import {Property} from '@kazaswap/common/lib/types/api/properties';
import variables from '../../../styles/variables';
import {IconName} from '../../KIcon/KIcon';
import Gap from '../../Gap/Gap';
import {IconText} from '../../IconText/IconText';
import {amenities} from '../../../utils/amenities';
import useIsMobile from '../../../hooks/useIsMobile';

type Props = {
  property?: Property;
};

const columnCount = 3;
const columnWidth: ViewStyle['width'] = `${100 / columnCount}%`;

export default ({property}: Props) => {
  const {isMobile} = useIsMobile();

  if (!property?.owner) return <KText>Loading...</KText>;
  else {
    const mainInfo: {icon: IconName; text: string}[] = [
      {
        icon: 'bed',
        text: `${property.bedrooms} bed${property.bedrooms > 1 ? 's' : ''}`,
      },
      {
        icon: 'bath',
        text: `${property.bathrooms} bathroom${
          property.bathrooms > 1 ? 's' : ''
        }`,
      },
      {icon: 'placeSize', text: `${property.sizeM2} m2 place size`},
    ];

    // TODO: Complete rules once we have the data
    const rules: {icon: IconName; text: string}[] = [
      {
        icon: 'petsFriendly',
        text: !!property.pets ? 'Pets friendly' : 'No pets allowed',
      },
      {icon: 'noSmoking', text: 'No smoking'},
      {icon: 'baby', text: 'Suitable for children'},
    ];

    return (
      <View style={{width: '100%'}}>
        <View
          style={[
            styles.container,
            {backgroundColor: variables.colors.yellow},
            isMobile && {
              flexDirection: 'row',
              justifyContent: 'space-around',
              alignItems: 'center',
            },
          ]}>
          {mainInfo.map((info, i) => (
            <View
              key={`info-${i}`}
              style={[
                !isMobile && {
                  width: columnWidth,
                },
              ]}>
              <IconText
                size="medium"
                key={`info-${i}`}
                iconName={info.icon}
                text={isMobile ? info.text.split(' ')[0] : info.text}
              />
            </View>
          ))}
        </View>
        <View
          style={[styles.container, {backgroundColor: variables.colors.white}]}>
          <KText style={styles.lightText}>Amenities</KText>
          <Gap size="medium" vertical />
          {property.amenities.split(',').map((amenity, i) => {
            const am = amenity.replace(/\W+ /g, "");
            return amenities[am] ? <View
              key={`amenity-${i}`}
              style={{
                width: isMobile ? '50%' : columnWidth,
                paddingVertical: variables.spacing.xxsmall,
              }}>
              <IconText
                size="medium"
                iconName={amenities[am]}
                text={am}
              />
            </View> : null
          })}
        </View>
        <View
          style={[
            styles.container,
            {backgroundColor: variables.colors.yellow},
          ]}>
          <KText style={styles.lightText}>Rules of this place</KText>
          <Gap size="medium" vertical />
          {rules.map((rule, i) => (
            <View
              key={`rule-${i}`}
              style={{
                width: isMobile ? '100%' : columnWidth,
                paddingVertical: variables.spacing.xxsmall,
              }}>
              <IconText size="medium" iconName={rule.icon} text={rule.text} />
            </View>
          ))}
        </View>
      </View>
    );
  }
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 20,
    padding: variables.spacing.medium,
    maxWidth: 700,
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  lightText: {
    opacity: 0.5,
    width: '100%',
    textAlign: 'left',
  },
});
