import React from "react";
import { StyleSheet, View } from "react-native";
import Screen from "../../components/Screen";
import MobileHeader from "../../components/MobileHeader";
import AppText from "../../components/AppText";
import Button from "../../components/Button";
import { colors, spacing } from "../../theme";

const OrganizerRequiredScreen = ({ onBack }) => {
  return (
    <Screen scroll={false} contentStyle={styles.container} header={<MobileHeader />}>
      <View style={styles.card}>
        <AppText weight="bold" style={styles.title}>
          Acceso solo para organizadores
        </AppText>
        <AppText style={styles.subtitle}>
          Esta sección requiere una cuenta con rol Organizador.
        </AppText>
        {onBack ? <Button title="Volver" variant="ghost" onPress={onBack} /> : null}
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

export default OrganizerRequiredScreen;
