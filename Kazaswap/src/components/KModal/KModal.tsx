import React, {CSSProperties, forwardRef, useEffect, useRef} from 'react';
import {
  StyleSheet,
  Modal,
  useWindowDimensions,
  TouchableOpacity,
  Animated,
  Pressable,
  Text,
  ViewStyle,
} from 'react-native';
import variables from '../../styles/variables';
import KIcon from '../KIcon/KIcon';

type Props = {
  visible: boolean;
  setVisibility: (visible: boolean) => void;
  children: React.ReactNode;
  showCross?: boolean;
  crossStyle?: CSSProperties
  style?: ViewStyle
  onLayout?: (event: any) => void
};

const KModal = ({
  visible,
  setVisibility,
  children,
  showCross = true,
  style={},
  crossStyle={},
  onLayout
}: Props, ref: any) => {
  const {height} = useWindowDimensions();

  const translateY = useRef(new Animated.Value(height)).current;
  useEffect(() => {
    Animated.timing(translateY, {
      toValue: visible ? 0 : height,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [visible, height]);

  if (!visible) return null;
  return (
    <Modal
      ref={ref}
      animationType="none"
      transparent={true}
      visible={visible}
      onLayout={onLayout}
      onRequestClose={() => setVisibility(false)}>
      <>
        <TouchableOpacity
          style={[styles.modalOverlay]}
          onPress={() => setVisibility(false)}></TouchableOpacity>
        <Animated.View
          // ref={ref}
          style={[
            styles.modalView,
            {
              maxHeight: height - 80,
              transform: [{translateY}],
            },
            style
          ]}>
          {children && children}
          {showCross && <Pressable style={styles.close} onPress={() => setVisibility(false)}>
            <KIcon name="crossCircle" size="medium" style={{stroke: variables.colors.grey, ...crossStyle}} />
          </Pressable>}
        </Animated.View>
      </>
    </Modal>
  );
};

export default forwardRef(KModal);

const {
  colors: {closeButton, yellow},
} = variables;

const styles = StyleSheet.create({
  modalOverlay: {
    height: '100%',
    backgroundColor: 'black',
    opacity: 0.5,
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    left: 0,
  },
  modalView: {
    backgroundColor: yellow,
    borderRadius: 30,
    alignItems: 'center',
    margin: 'auto',
    width: '90%',
    maxWidth: 480,
  },
  close: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingVertical: 5,
    paddingHorizontal: 8,
    // borderWidth: 1,
    borderRadius: 50,
    borderColor: closeButton,
  },
  xButton: {
    color: closeButton,
  },
});
