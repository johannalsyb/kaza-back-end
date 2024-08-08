import React, { CSSProperties } from 'react';
import {Pressable, StyleSheet, Text, View, ViewStyle} from 'react-native';
import variables from '../../styles/variables';
import Gap from '../Gap/Gap';
import KIcon from '../KIcon/KIcon';
import KText from '../KText';

type CheckBoxProps = {
  checked?: boolean;
  name?: string;
  onPress?: () => void;
  style?: ViewStyle
  disabled?: boolean
};

const CheckBox: React.FC<CheckBoxProps> = ({checked, name = '', onPress, style, disabled=false}) => (
  <Pressable style={[styles.container, style || {}]} onPress={onPress} disabled={disabled}>
    <View
      style={[
        styles.checkBox,
        {
          backgroundColor: checked ? (variables.colors.yellow+(disabled ? "55" : "")) : 'transparent',
        }
      ]}>
      {checked && <KIcon name="tick" />}
    </View>
    <Gap size="xxsmall" />
    <KText selectable={false} style={{color: "#000000"+(disabled ? "55" : "")}}>{name}</KText>
  </Pressable>
);

const {borderGray} = variables.colors;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkBox: {
    height: 25,
    width: 25,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: borderGray,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CheckBox;
