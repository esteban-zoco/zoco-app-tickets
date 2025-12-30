import React from "react";
import { StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import Screen from "../../components/Screen";
import AppText from "../../components/AppText";
import Button from "../../components/Button";
import { colors, spacing } from "../../theme";

const AuthRequiredScreen = () => {
  const navigation = useNavigation();

  return (
    <Screen scroll={false} contentStyle={styles.container}>
      <View style={styles.card}>
        <AppText weight="bold" style={styles.title}>
          Necesitás iniciar sesión
        </AppText>
        <AppText style={styles.subtitle}>
          Para ver esta sección, ingresá con tu cuenta de Zoco.
        </AppText>
        <Button title="Ingresar" onPress={() => navigation.navigate("Auth")} />
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.xl,
    justifyContent: "center",
    flex: 1,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 22,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  title: {
    fontSize: 18,
    color: colors.ink,
  },
  subtitle: {
    color: colors.muted,
  },
});

export default AuthRequiredScreen;
