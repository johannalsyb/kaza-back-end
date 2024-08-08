import React, {ReactNode} from 'react';
import {StyleSheet, View, ViewStyle} from 'react-native';
import variables from '../../styles/variables';
import useIsMobile from '../../hooks/useIsMobile';

type Props = {
  style?: ViewStyle;
  children?: ReactNode;
};

const SubHeader = ({style, children = null}: Props) => {
  const {isMobile} = useIsMobile();
  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isMobile
            ? variables.colors.greenLight
            : variables.colors.white,
          padding: isMobile ? 5 : 20,
          borderTopRightRadius: isMobile ? 0 : 20,
          borderTopLeftRadius: isMobile ? 0 : 20,
        },
        style,
      ]}>
      {children}
    </View>
  );
};

export default SubHeader;

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
});
