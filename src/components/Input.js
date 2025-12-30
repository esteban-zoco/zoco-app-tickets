import React from "react";
import { StyleSheet, TextInput, View } from "react-native";
import { colors, spacing, typography } from "../theme";
import AppText from "./AppText";

const Input = ({ label, error, style, inputStyle, ...props }) => {
  return (
    <View style={[styles.wrapper, style]}>
      {label ? (
        <AppText weight="semiBold" style={styles.label}>
          {label}
        </AppText>
      ) : null}
      <TextInput
        placeholderTextColor={colors.muted}
        style={[styles.input, typography.regular, inputStyle]}
        {...props}
      />
      {error ? (
        <AppText style={styles.error} weight="medium">
          {error}
        </AppText>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.xs,
  },
  label: {
    fontSize: 12,
    color: colors.muted,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: 14,
    color: colors.text,
    backgroundColor: "#ffffff",
  },
  error: {
    color: colors.danger,
    fontSize: 12,
  },
});

export default Input;
