import React from 'react';
import {StyleSheet, Text, View, ViewStyle} from 'react-native';
import {Colors} from '../KIcon/KIcon';
import variables from '../../styles/variables';

type Props = {
  notificationCount?: number;
  style?: ViewStyle;
  color?: keyof Colors;
};

const NotificationBadge = ({
  notificationCount,
  style,
  color = 'yellow',
}: Props) => {
  if (!notificationCount) return null;
  return (
    <View
      style={[
        styles.container,
        {backgroundColor: variables.colors[color]},
        style,
      ]}>
      <Text style={styles.text}>{notificationCount}</Text>
    </View>
  );
};

export default NotificationBadge;

const styles = StyleSheet.create({
  container: {
    width: 15,
    height: 15,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 10,
  },
});
