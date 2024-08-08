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
import useIsMobile from '../../hooks/useIsMobile';

type Props = {
  visible: boolean;
  onClose: (visible: boolean) => void;
  children: React.ReactNode;
  showCross?: boolean;
  style?: ViewStyle;
  position?: 'left' | 'right';
};

const KModal = ({
  visible,
  onClose,
  children,
  showCross = true,
  style = {},
  position = 'right',
}: Props, ref: any) => {
  const {width} = useWindowDimensions();
  const {isMobile} = useIsMobile()

  const isLeft = position === 'left';

  const translateX = useRef(new Animated.Value(isLeft ? -width/2 : width)).current;
  useEffect(() => {
    Animated.timing(translateX, {
      toValue: !isLeft ? (visible ? 0 : width) : (visible ? 0 : -width),
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [visible, width]);

  if (!visible) return null;

  const posStyle:ViewStyle = {}
  if(isLeft) {
    posStyle.left = 0
    posStyle.transform = [{translateX}]
    posStyle.borderTopRightRadius = isMobile ? 0 : 20
    posStyle.borderBottomRightRadius = isMobile ? 0 : 20
  } else {
    posStyle.left = isMobile ? 0 : "50%"
    posStyle.transform = [{translateX}]
    posStyle.borderTopLeftRadius = isMobile ? 0 : 20
    posStyle.borderBottomLeftRadius = isMobile ? 0 : 20
  }
  posStyle.width = isMobile ? "100%" : "90%"
  posStyle.maxWidth = isMobile ? "100%" : "50%"

  return (
    <Modal
      ref={ref}
      animationType="none"
      transparent={true}
      visible={visible}
      onRequestClose={() => onClose(false)}>
      <>
        <TouchableOpacity
          style={[styles.modalOverlay]}
          onPress={() => onClose(false)}></TouchableOpacity>
        <Animated.View
          style={[
            styles.modalView,
            posStyle,
            style
          ]}>
          {children && children}
          {showCross && <Pressable style={styles.close} onPress={() => onClose(false)}>
            <KIcon name="crossCircle" size="medium" style={{stroke: variables.colors.grey}} />
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
    backgroundColor: "white",
    alignItems: 'center',
    // margin: 'auto',
    // left: "50%",
    // width: '90%',
    // maxWidth: "50%",
    height: "100%",
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
