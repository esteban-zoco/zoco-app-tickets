import React from "react";
import { Text, StyleSheet } from "react-native";
import { colors, typography } from "../theme";

const AppText = ({ style, weight = "regular", color = colors.text, ...props }) => {
  return <Text {...props} style={[styles.base, typography[weight], { color }, style]} />;
};

const styles = StyleSheet.create({
  base: {
    fontSize: 14,
    lineHeight: 20,
  },
});

export default AppText;
