import React from "react";
import { Pressable, StyleSheet } from "react-native";
import AppText from "./AppText";
import { colors, spacing } from "../theme";

const Button = ({ title, onPress, style, textStyle, disabled, variant = "primary", singleLine = true }) => {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      <AppText
        weight="semiBold"
        numberOfLines={singleLine ? 1 : undefined}
        ellipsizeMode="tail"
        style={[styles.text, styles[`${variant}Text`], textStyle]}
      >
        {title}
      </AppText>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  primary: {
    backgroundColor: colors.brand,
  },
  primaryText: {
    color: "#ffffff",
  },
  dark: {
    backgroundColor: colors.ink,
  },
  darkText: {
    color: "#ffffff",
  },
  ghost: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.border,
  },
  ghostText: {
    color: colors.ink,
  },
  disabled: {
    opacity: 0.6,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
  text: {
    fontSize: 14,
  },
});

export default Button;
