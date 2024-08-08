import React, { CSSProperties } from 'react';
import {StyleSheet, Pressable, ViewStyle, Text, ActivityIndicator, View, TextStyle} from 'react-native';
import variables from '../../styles/variables';
import KText from '../KText';
import KIcon, { IconName, IconSize } from '../KIcon/KIcon';
import useIsMobile from '../../hooks/useIsMobile';

export type KButtonSize = keyof typeof variables.button.size;

export type KButtonProps = {
  color?: 'primary' | 'secondary' | 'tertiary' | 'light' | 'greenLight';
  size?: KButtonSize;
  disabled?: boolean;
  children?: React.ReactNode;
  text?: string;
  textStyle?: TextStyle;
  style?: ViewStyle;
  loading?:boolean;
  icon?:IconName;
  iconPosition?:'left' | 'right';
  iconSize?: IconSize;
  iconStyle?: CSSProperties;
  onPress: () => void;
};

const buttonSize = variables.button.size;

export default function KButton(props: KButtonProps) {
  const {
    color = 'primary',
    text,
    size = 'medium',
    children,
    style,
    icon,
    iconPosition = "left",
    iconSize = "large",
    textStyle = {},
    iconStyle = {},
    onPress,
    disabled = false,
    loading = false,
  } = props;

  const {isMobile} = useIsMobile()

  return (
    <Pressable
      style={[
        containerStyles.default,
        containerStyles[color],
        buttonSize[size],
        style,
      ]}
      onPress={!disabled ? onPress : () => {}}>
      {disabled && <View style={{
        position: "absolute",
        backgroundColor: color === "primary" ? "rgba(150,150,150,0.5)" : "rgba(0,0,0,0.3)",
        width: "100%",
        height: "100%",
        borderRadius: 50
      }}/>}
      {loading ? 
        <ActivityIndicator color={textStyles[color].color} /> :
      children ||
        <View style={{flexDirection: "row", alignItems: "center", marginLeft: 5, marginRight: 5}}>
          {icon && iconPosition === "left" && <KIcon name={icon} size={iconSize} style={{marginRight: 5, stroke: textStyles[color].color, ...iconStyle}} />}
          {text && <KText style={[textStyles[color], textStyle]}>{text}</KText>}
          {icon && iconPosition === "right" && <KIcon name={icon} size={iconSize} style={{marginLeft: 5, stroke: textStyles[color].color, ...iconStyle}} />}
        </View>}
    </Pressable>
  );
}

const {
  colors: {black, yellow, white, greenLight, blackLight},
} = variables;

const containerStyles = StyleSheet.create({
  default: {
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primary: {backgroundColor: black},
  secondary: {backgroundColor: yellow},
  tertiary: {backgroundColor: blackLight},
  light: {backgroundColor: white, borderWidth: 1, borderColor: black},
  greenLight: {backgroundColor: greenLight},
});

const textStyles = StyleSheet.create({
  primary: {color: yellow},
  secondary: {color: black},
  tertiary: {color: white},
  light: {color: black},
  greenLight: {color: black},
});
