import KText from '../../KText';
import {View, StyleSheet, ActivityIndicator} from 'react-native';
import {Property} from '@kazaswap/common/lib/types/api/properties';
import variables from '../../../styles/variables';
import Gap from '../../Gap/Gap';
import {IconText} from '../../IconText/IconText';
import {formatFriendlyDate} from '../../../utils/date';
import KButton from '../../KButton/KButton';
import useAuthentication from '../../../hooks/useAuthentication';
import { showSignInAtom, showSwapNowAtom } from '../../../atoms';
import { useAtomValue, useSetAtom } from 'jotai';

type Props = {
  property?: Property;
};

export default ({property}: Props) => {

  const user = useAuthentication()
  const [showSwapNow, setShowSwapNow] = [useAtomValue(showSwapNowAtom), useSetAtom(showSwapNowAtom)];

  if (!property?.owner) return <ActivityIndicator color={variables.colors.yellow}/>;
  else {
    const {
      owner: {firstName, dateFrom, dateTo, swapLocations},
      city,
      country,
    } = property;
    const availableDateText =
      dateFrom && dateTo
        ? `${formatFriendlyDate(new Date(dateFrom))} - ${formatFriendlyDate(
            new Date(dateTo),
          )}`
        : 'Flexible';
    const swapForText = swapLocations?.split('\n') || ['Flexible'];
    return (
      <View style={styles.container}>
        <View style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <KText
            style={
              styles.lightText
            }>{`Swap availabilities for ${firstName}`}</KText>
            <KButton
              style={{display: property.owner.id === user.user?.id ? "flex" : "none"}}
              color="tertiary"
              text="Edit Availability"
              icon="calendarEdit"
              iconStyle={{
                stroke: variables.colors.yellow,
                width: 25,
              }}
              onPress={() => setShowSwapNow(true)} />
        </View>
        <View style={styles.infoTopContainer}>
          <IconText
            size="medium"
            iconName="calendar"
            text={availableDateText}
          />
          {/* <Gap size="small" /> */}
          {/* <IconText
            size="medium"
            iconName="location"
            text={`${city}, ${country}`}
          /> */}
        </View>
        <View style={styles.infoBottomContainer}>
          <KText style={{...styles.lightText, }}>Swap for</KText>
          <KText numberOfLines={1}>
            {swapForText?.map((s, i) => (
              <KText
                style={{marginRight: variables.spacing.xsmall}}
                key={`swap-for-${i}`}>
                {s.split(',')[0]}
              </KText>
            ))}
          </KText>
        </View>
      </View>
    );
  }
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: variables.colors.white,
    width: '100%',
    // aspectRatio: 620 / 155,
    borderRadius: 20,
    justifyContent: 'space-around',
    padding: variables.spacing.medium,
    maxWidth: 700,
  },
  infoTopContainer: {
    display: 'flex',
    flexDirection: 'row',
  },
  infoBottomContainer: {
    display: 'flex',
    flexDirection: 'column',
    marginTop: variables.spacing.small,
  },
  lightText: {
    opacity: 0.4,
    marginBottom: variables.spacing.xsmall,
  },
});
