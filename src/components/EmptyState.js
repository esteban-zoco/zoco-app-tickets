import React from "react";
import { StyleSheet, View } from "react-native";
import AppText from "./AppText";
import { colors, spacing } from "../theme";

const EmptyState = ({ title = "Sin resultados", subtitle = "Probá con otros filtros" }) => {
  return (
    <View style={styles.container}>
      <AppText weight="bold" style={styles.title}>
        {title}
      </AppText>
      <AppText style={styles.subtitle}>{subtitle}</AppText>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.xl,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: "#ffffff",
  },
  title: {
    fontSize: 16,
  },
  subtitle: {
    color: colors.muted,
    textAlign: "center",
  },
});

export default EmptyState;
