import {StyleSheet, TextProps, TextStyle, View, ViewStyle} from 'react-native';
import Gap from '../Gap/Gap';
import KIcon, {IconName, IconSize} from '../KIcon/KIcon';
import KText from '../KText';
import variables from '../../styles/variables';

type IconTextProps = TextProps & {
  iconName?: IconName;
  text?: string | React.ReactNode;
  size?: IconSize;
  textStyle?: TextStyle;
  numberOfLines?: number;
  style?: ViewStyle;
};

export const IconText = ({
  iconName,
  text,
  size = 'small',
  textStyle,
  numberOfLines = 1,
  style,
  ...props
}: IconTextProps) => {
  return (
    <View style={[styles.container, style]}>
      {/* <Gap size="xxsmall" /> */}
      <KText
        {...props}
        style={[styles.text, textStyle, {lineHeight: variables.icon.size[size] + 2}]}
        numberOfLines={numberOfLines}>
          <KIcon
            size={size}
            name={iconName ?? 'defaultIcon'}
            style={{minWidth: variables.icon.size[size]}}
          />
        {text || ''}
      </KText>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    overflow: 'hidden',
  },
  text: {
    display: "flex",
    // alignItems: "center"
  },
});
