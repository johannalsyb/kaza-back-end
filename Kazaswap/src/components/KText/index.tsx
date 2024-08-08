import React from "react";
import { Text, TextProps } from "react-native";
import variables from "../../styles/variables";

type KTextProps = TextProps & {
  children: React.ReactNode;
};

const KText: React.FC<KTextProps> = ({ children, ...props }) => {
  return (
    <Text {...props} style={[props.style, { fontFamily: variables.font.family.regular }]}>
      {children}
    </Text>
  );
};

export default KText;