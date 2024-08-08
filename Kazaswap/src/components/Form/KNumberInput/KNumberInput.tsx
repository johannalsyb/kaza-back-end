import React, { useEffect, useState } from 'react';
import {
  View, ViewStyle,
} from 'react-native';
import KIcon from '../../KIcon/KIcon';
import KTextInput, { KInputProps } from '../KTextInput/KTextInput';
import variables from '../../../styles/variables';
import { clamp } from '../../../utils/math';

export default (props:KInputProps & {
  onChange: (value: number) => void,
  min: number,
  max: number,
  decimal?: boolean,
}) => {
  const acceptDecimal = props.decimal || false 
  const [value, setValue] = useState<string>(props.value || "1")

  useEffect(() => {
    if(value === "") return props.onChange(0)
    props.onChange(parseInt(value))
  }, [value])

  const up = () => setValue(clamp(parseInt(value)+1, props.min, props.max)+"")
  const down = () => setValue(clamp(parseInt(value)-1, props.min, props.max)+"")
  
  const topStyles = (props.topStyle || {})
  return <View style={{
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    ...topStyles
  }}>
    <KIcon
      name="minusCircle"
      size='medium'
      onPress={down}
      style={{
        backgroundColor: variables.colors.greenLight,
        padding: 8,
        borderRadius: 50,
        marginRight: 10,
      }}/>
    <KTextInput
      value={value+""}
      topStyle={{...props.topStyle, flex: 1}}
      onChangeText={text => {
        if(text === "") return setValue("")
        else if(acceptDecimal && text.match(/[^0-9.]+/)) return;
        else if(!acceptDecimal && text.match(/[^0-9]+/)) return;
        else if(text.includes("..")) return;
        const nb = parseInt(text);
        if(isNaN(nb)) return;
        if(nb < props.min) return;
        if(nb > props.max) return;
        setValue(text)
      }}
      />
    <KIcon
      name="plusCircle"
      size='medium'
      onPress={up}
      style={{
        backgroundColor: variables.colors.black,
        padding: 8,
        borderRadius: 50,
        marginLeft: 10,
      }}/>
  </View>
}