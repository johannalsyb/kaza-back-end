// import React from 'react';
import variables from '../../styles/variables';
import {NestedKeyOf} from '../../../utility';
import * as IconList from './icons';
import { CSSProperties } from 'react';
import { Pressable } from 'react-native';

// TODO: make it work with webpack expo config

export type IconSize = keyof typeof variables.icon.size;
export type IconName = keyof typeof IconList;
export type Colors = typeof variables.colors;
export type IconFill = NestedKeyOf<Colors>;

type Props = {
  name: IconName;
  size?: IconSize | number;
  width?: IconSize | number;
  height?: IconSize | number;
  style?: CSSProperties
  onPress?: () => void;
};

export default function Icon({name, size = 'small', ...rest}: Props) {
  const IconComponent = IconList[name];
  if (!IconComponent) return null;

  let sWidth = rest.width ? typeof rest.width === "number" ? rest.width : variables.icon.size[rest.width] : undefined;
  let sHeight = rest.height ? typeof rest.height === "number" ? rest.height : variables.icon.size[rest.height] : undefined;
  let sSize = size ? typeof size === "number" ? size : variables.icon.size[size] : undefined;
  if(sSize) {
    if(!sWidth) sWidth = sSize;
    if(!sHeight) sHeight = sSize;
  }

  if(!rest.onPress) {
    return <IconComponent
      height={sHeight}
      width={sWidth}
      {...rest}
    />
  } else {
    const onPress = rest.onPress;
    delete rest.onPress;
    return <Pressable onPress={onPress}>
      <IconComponent
        height={sHeight}
        width={sWidth}
        {...rest}
      />
    </Pressable>
  }
}
