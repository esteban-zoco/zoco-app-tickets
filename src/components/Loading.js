import React from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { colors } from "../theme";

const Loading = () => (
  <View style={styles.container}>
    <ActivityIndicator size="large" color={colors.brand} />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
});

export default Loading;
