import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, ViewStyle } from 'react-native';
import { set } from '../../utils/Storage/storage';
import KText from '../KText';

const ProgressBar = ({
    pcent,
    width = 100,
    style = {}
}:{
    style?: ViewStyle,
    width?: number,
    pcent: number
}) => {
  const [progress, setProgress] = useState(new Animated.Value(pcent));

  const computedStyles = {...styles.container, ...style, width: width}

  useEffect(() => {
    Animated.timing(progress, {
        toValue: pcent*computedStyles.width/100,
        duration: 1000,
        useNativeDriver: false,
    }).start();
  }, [pcent])

  return (
    <View style={computedStyles}>
      <Animated.View style={[styles.bar, { width: progress }]} />
      <KText style={{paddingLeft: 5}}>{`${pcent}%`}</KText>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 20,
    backgroundColor: '#ccc',
    borderRadius: 10,
    margin: 10,
    width: 100,
    display: "flex",
    flexDirection: "row",
  },
  bar: {
    height: 20,
    backgroundColor: '#333',
    borderRadius: 10,
  },
});

export default ProgressBar;