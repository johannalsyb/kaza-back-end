import {Pressable, StyleSheet, View, ViewStyle} from 'react-native';
import {IconText} from '../IconText/IconText';
import {CircleImage} from '../CircleImage/CircleImage';
import Gap from '../Gap/Gap';
import variables from '../../styles/variables';
import {formatFriendlyDate} from '../../utils/date';
import KImage from '../KImage/KImage';
import KText from '../KText';
import useIsMobile from '../../hooks/useIsMobile';
import {CSSProperties, useState} from 'react';
import useAuthentication from '../../hooks/useAuthentication';
import KButton from '../KButton/KButton';
import KIcon from '../KIcon/KIcon';
import SwapRequestButton from '../SwapRequestButton/SwapRequestButton';
import {Property} from '@kazaswap/common/lib/types/api/properties';

type PropertyCardProps = {
  favourite?: boolean;
  avatar?: string;
  photo?: string;
  availableDate?: {
    from: Date | null;
    to: Date | null;
  };
  location?: string;
  swapFor?: string | null;
  userId?: string;
  style?: ViewStyle;
  property?: Property;
  swapButton?: boolean;
  onPress?: () => void;
  onEditPressed?: () => void;
  hoverable?: boolean;
  bottomComponent?: React.ReactNode;
};

const photoStyle: CSSProperties = {
  height: '100%',
  objectFit: 'cover',
};

const cardWidth = 466;
const cardHeight = 440;
const imageHeight = 300;
const avatarHeight = 50;

export const PropertyCard = ({
  avatar = '',
  photo = '',
  favourite,
  userId,
  availableDate,
  swapFor,
  location,
  style,
  property,
  swapButton,
  onPress,
  onEditPressed,
  hoverable = true,
  bottomComponent,
}: PropertyCardProps) => {
  const {isMobile} = useIsMobile();
  const {user} = useAuthentication();
  const [isHovered, setIsHovered] = useState(false);
  const swapForText = swapFor?.split('\n');
  const availableDateText =
    availableDate?.from && availableDate?.to
      ? `${formatFriendlyDate(availableDate?.from)} - ${formatFriendlyDate(
          availableDate?.to,
        )}`
      : 'Flexible';

  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => hoverable && setIsHovered(true)}
      onHoverOut={() => hoverable && setIsHovered(false)}
      style={[
        styles.container,
        {
          width: isMobile ? '100%' : variables.propertyCardWidth,
          aspectRatio: bottomComponent ? 'auto' : 1,
        },
        // @ts-ignore
        isHovered && {boxShadow: '10px 15px 20px 0px #8D835180'},
        style,
      ]}>
      <View style={styles.imageContainer}>
        {photo.startsWith('http') ? (
          <KImage source={photo} style={photoStyle} />
        ) : (
          <KImage imageId={photo} type="properties" style={photoStyle} />
        )}
      </View>

      {swapButton && property && (
        <View style={{position: 'absolute', top: 10, left: 10}}>
          <SwapRequestButton
            property={property}
            buttonStyle="primary"
            iconStyle={{color: variables.colors.yellow}}
          />
        </View>
      )}
      <View style={[styles.infoContainer]}>
        <View style={styles.infoTopContainer}>
          <IconText
            iconName="calendar"
            text={availableDateText}
            style={[styles.iconText, !isMobile && {paddingVertical: 5}]}
            textStyle={{fontSize: 12}}
          />
          <Gap size="xsmall" />
          <View style={[styles.avatarContainer]}>
            <CircleImage
              imageId={avatar}
              thumbnail={true}
              type="users"
              size="xsmall"
            />
          </View>
          <Gap size="xsmall" />
          <IconText
            iconName="location"
            text={location || ''}
            style={[styles.iconText, !isMobile && {paddingVertical: 5}]}
            textStyle={{fontSize: 12}}
          />
        </View>
        <View style={styles.infoBottomContainer}>
          <KText
            style={{
              textAlign: 'center',
              paddingVertical: isMobile ? 10 : 4,
              paddingHorizontal: 10,
              borderRadius: 20,
              fontSize: 13,
              backgroundColor: 'white',
            }}
            numberOfLines={1}>
            <KText style={styles.swapForText}>Swap for</KText>
            {swapFor ? (
              swapForText?.map((s, i) => (
                <KText
                  style={{
                    paddingHorizontal: variables.spacing.xxsmall,
                    fontSize: 13,
                  }}
                  key={`swap-for-${i}`}>
                  {s.split(',')[0]}
                </KText>
              ))
            ) : (
              <KText
                style={{
                  paddingHorizontal: variables.spacing.xxsmall,
                  fontSize: 13,
                }}>
                Anywhere
              </KText>
            )}
          </KText>
        </View>
      </View>

      {user && user?.id === userId && (
        <KButton
          size="medium"
          text="Edit"
          icon={'edit'}
          color="secondary"
          onPress={() => onEditPressed && onEditPressed()}
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            zIndex: 1,
          }}
        />
      )}

      {favourite && (
        <KIcon
          size="large"
          name="fav"
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            zIndex: 1,
            backgroundColor: variables.colors.yellow,
            borderRadius: 100,
            stroke: 'black',
            fill: 'black',
            padding: 7,
          }}
        />
      )}
      {bottomComponent || null}
    </Pressable>
  );
};

const {white, greenLight, yellow} = variables.colors;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: white,
    borderRadius: 20,
    display: 'flex',
  },
  imageContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    height: '100%',
  },
  infoContainer: {
    borderBottomStartRadius: 20,
    borderBottomEndRadius: 20,
    paddingHorizontal: 10,
    position: 'absolute',
    bottom: 0,
    overflow: 'hidden',
    backgroundColor: 'transparent',
    width: '100%',
    height: '37%',
  },
  infoTopContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flex: 2,
  },
  infoBottomContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    flex: 1,
    paddingTop: 10,
  },
  avatarContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: white,
    borderRadius: 100,
  },
  swapForText: {
    opacity: 0.4,
  },
  iconText: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: yellow,
    borderRadius: 20,
    padding: 8,
  },
});
