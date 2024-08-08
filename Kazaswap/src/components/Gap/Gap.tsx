import React from 'react';
import {StyleSheet, View} from 'react-native';
import variables from '../../styles/variables';

export type GapSize = keyof (typeof variables)['spacing'];
type Props = {vertical?: boolean; size?: GapSize; style?: any};

const Gap: React.FC<Props> = ({vertical, size = 'small', style}) => (
  <View
    style={[
      styles.gap,
      vertical
        ? {height: variables['spacing'][size]}
        : {width: variables['spacing'][size]},
      style,
    ]}
  />
);

const styles = StyleSheet.create({
  gap: {backgroundColor: 'transparent'},
});

export default Gap;
