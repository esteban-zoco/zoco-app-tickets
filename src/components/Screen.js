import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../theme";

const Screen = ({ children, scroll = true, style, contentStyle, header }) => {
  if (scroll) {
    return (
      <SafeAreaView style={[styles.safe, style]}>
        {header || null}
        <ScrollView contentContainerStyle={[styles.scroll, contentStyle]} showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView style={[styles.safe, style]}>
      {header || null}
      <View style={[styles.flex, contentStyle]}>{children}</View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  scroll: {
    paddingBottom: 32,
  },
  flex: {
    flex: 0,
  },
});

export default Screen;
