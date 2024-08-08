import React from 'react';
import {StyleSheet, Text, View, ViewStyle} from 'react-native';
import Gap from '../../Gap/Gap';

type Props = {
  style?: ViewStyle;
  label: string | React.ReactNode;
  labelAlign?: 'left' | 'center' | 'right';
  children: React.ReactNode;
};

const FormField = ({style, label, labelAlign = 'left', children}: Props) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.labelContainer}>
        {typeof label === "string" ? <Text style={[styles.label, {textAlign: labelAlign}]}>{label}</Text> : label}
      </View>
      <Gap vertical size="xsmall" />
      {children}
      <Gap vertical size="xsmall" />
    </View>
  );
};

export default FormField;

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    width: '100%',
  },
  labelContainer: {
    width: '100%',
  },
  label: {
    opacity: 0.5,
  },
});
