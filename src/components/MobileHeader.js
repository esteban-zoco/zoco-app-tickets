import React from "react";
import { Image, Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing } from "../theme";
import SearchIcon from "../assets/image/lupa 1.svg";
import ProfileIcon from "../assets/image/usuario-2 1.svg";
import MenuIcon from "../assets/image/menu-2 1.svg";

const logo = require("../assets/image/logo.e3c0b2196cc23f84f67a.png");

const MobileHeader = ({ onSearch, onProfile, onMenu, onBack }) => {
  const actions = [
    { key: "search", handler: onSearch, Icon: SearchIcon },
    { key: "profile", handler: onProfile, Icon: ProfileIcon },
    { key: "menu", handler: onMenu, Icon: MenuIcon },
  ].filter((item) => typeof item.handler === "function");
  const showBack = typeof onBack === "function";

  return (
    <View style={styles.container}>
      {showBack ? (
        <Pressable style={styles.backBtn} onPress={onBack}>
          <Ionicons name="chevron-back" size={24} color={colors.ink} />
        </Pressable>
      ) : (
        <Image source={logo} style={styles.logo} resizeMode="contain" />
      )}
      {actions.length ? (
        <View style={styles.actions}>
          {actions.map(({ key, handler, Icon }) => (
            <Pressable key={key} style={styles.iconBtn} onPress={handler}>
              <Icon width={20} height={20} />
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 64,
    backgroundColor: "#ffffff",
    paddingHorizontal: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#EAEAEA",
  },
  logo: {
    width: 110,
    height: 28,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "center",
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E7E7E7",
  },
  iconBtn: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default MobileHeader;
