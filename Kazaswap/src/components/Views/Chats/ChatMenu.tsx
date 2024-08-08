import { StyleSheet, View } from "react-native";
import { useCloseFromOutside } from "../../../hooks/useCloseFromOutside";
import KText from "../../KText";
import KIcon from "../../KIcon/KIcon";
import variables from "../../../styles/variables";

type Props = {
    show: boolean,
    setShow: (show: boolean) => void,
    onAccept: () => void,
    onDecline: () => void,
}

export default (props:Props) => {
    const menuRef = useCloseFromOutside(props.show, props.setShow);
    return <View
    ref={menuRef}
    style={[
      styles.popupmenu,
      {display: props.show ? undefined : 'none'},
    ]}>
    <View
      style={[
        styles.triangle,
        {right: 15, position: 'absolute'},
      ]}
    />

    <KText
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
        marginTop: 5,
      }}
      onPress={props.onAccept}>
      <KIcon
        name="tickCircle"
        size="medium"
        style={{
          marginRight: 5,
          stroke: variables.colors.blackLight,
          width: 24,
          marginLeft: -2.2
        }}
      />
      Accept
    </KText>

    <KText
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
        marginTop: 5,
      }}
      onPress={props.onDecline}>
      <KIcon
        name="crossCircle"
        size="medium"
        style={{
          marginRight: 5,
          stroke: variables.colors.blackLight,
          width: 20,
        }}
      />
      Decline
    </KText>
  </View>
}

const styles = StyleSheet.create({
    popupmenu: {
      backgroundColor: 'white',
      position: 'absolute',
      top: 55,
      padding: 10,
      borderTopLeftRadius: 10,
      borderTopRightRadius: 10,
      borderBottomLeftRadius: 10,
      borderBottomRightRadius: 10,
    //   width: 200,
      right: 0,
      boxShadow: '15px 15px 55px 0px rgba(77, 75, 63, 0.25)',
      zIndex: 100,
    },
    triangle: {
      width: 0,
      height: 0,
      backgroundColor: 'transparent',
      borderStyle: 'solid',
      borderLeftWidth: 5,
      borderRightWidth: 5,
      borderBottomWidth: 6,
      top: -6,
      borderLeftColor: 'transparent',
      borderRightColor: 'transparent',
      borderBottomColor: 'white',
    },
  });