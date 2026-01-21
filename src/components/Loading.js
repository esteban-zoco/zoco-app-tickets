import React from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import ZocoLogo from "../../assets/ZocoLogo 1.svg";
import { colors } from "../theme";

const Loading = ({ variant = "default" }) => {
  const isSplash = variant === "splash";

  return (
    <View style={[styles.container, isSplash && styles.splashContainer]}>
      {isSplash ? (
        <ZocoLogo width={180} height={180} accessible accessibilityLabel="Zoco" />
      ) : (
        <ActivityIndicator size="large" color={colors.brand} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  splashContainer: {
    backgroundColor: "#ffffff",
  },
});

export default Loading;
