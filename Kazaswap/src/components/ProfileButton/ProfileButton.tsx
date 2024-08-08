import React from 'react';
import {StyleSheet, TouchableOpacity, View, ViewStyle} from 'react-native';
import KIcon, {IconName} from '../KIcon/KIcon';
import Gap from '../Gap/Gap';
import {Text} from 'react-native-svg';
import NotificationBadge from '../NotificationBadge/NotificationBadge';
import variables from '../../styles/variables';
import KText from '../KText';

type Props = {
  style?: ViewStyle;
  label: string;
  icon?: IconName;
  navigateTo?: string;
  notificationCount?: number;
};

const ProfileButton = ({
  style,
  icon,
  label,
  navigateTo,
  notificationCount,
}: Props) => {
  return (
    <TouchableOpacity
      onPress={() => console.log('Navigate to a screen once navigation setup')}
      style={[styles.container, style]}>
      <View style={styles.leftContent}>
        {icon && (
          <>
            <KIcon name={icon} />
            <Gap size="xxsmall" />
          </>
        )}
        <KText>{label}</KText>
      </View>
      <View style={styles.rightContent}>
        <NotificationBadge notificationCount={notificationCount} />
        {navigateTo && (
          <>
            <Gap size="xxsmall" />
            <KIcon name="chevronRight" />
          </>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default ProfileButton;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    maxWidth: 400,
    backgroundColor: variables.colors.white,
    padding: variables.button.padding,
    borderRadius: variables.button.borderRadius,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
