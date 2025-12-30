import React from "react";
import { StyleSheet, View } from "react-native";
import AppText from "./AppText";
import { colors, spacing } from "../theme";

const SectionHeader = ({ title, action }) => {
  return (
    <View style={styles.row}>
      <AppText weight="bold" style={styles.title}>
        {title}
      </AppText>
      {action}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 18,
    color: colors.ink,
  },
});

export default SectionHeader;
