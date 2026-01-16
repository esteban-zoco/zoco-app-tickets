import React, { useEffect, useMemo } from "react";
import { Image, ScrollView, StyleSheet, View } from "react-native";
import Screen from "../../components/Screen";
import AppText from "../../components/AppText";
import Button from "../../components/Button";
import { colors, spacing } from "../../theme";
import SuccessIcon from "../../assets/image/las-compras-en-linea 1.svg";
import ErrorIcon from "../../assets/image/xmarca 1.svg";

const logo = require("../../assets/image/logo.e3c0b2196cc23f84f67a.png");

const PaymentReturnScreen = ({ navigation, route }) => {
  const statusRaw = String(route?.params?.status || "").toLowerCase();
  const orderId = route?.params?.orderId || "";

  const isSuccess = useMemo(() => {
    if (!statusRaw) return true;
    return ["success", "paid", "approved", "ok"].some((token) => statusRaw.includes(token));
  }, [statusRaw]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isSuccess) {
        navigation.navigate("Main", { screen: "MyEventsTab" });
        return;
      }
      navigation.navigate("Main", { screen: "HomeTab" });
    }, 10000);
    return () => clearTimeout(timer);
  }, [isSuccess, navigation]);

  const handlePrimary = () => {
    if (isSuccess) {
      navigation.navigate("Main", { screen: "MyEventsTab" });
      return;
    }
    navigation.navigate("Main", { screen: "HomeTab" });
  };

  const handleSecondary = () => {
    navigation.navigate("Main", { screen: "MyEventsTab" });
  };

  return (
    <Screen scroll={false} style={styles.screen}>
      <View style={styles.header}>
        <Image source={logo} style={styles.logo} resizeMode="contain" />
      </View>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            {isSuccess ? (
              <SuccessIcon width={90} height={90} />
            ) : (
              <ErrorIcon width={90} height={90} />
            )}
          </View>
          <AppText weight="bold" style={[styles.title, isSuccess ? styles.titleSuccess : styles.titleError]}>
            {isSuccess ? "Listo! Tu compra fue exitosa" : "Ups! Algo salio mal"}
          </AppText>
          <AppText style={[styles.subtitle, isSuccess ? styles.subtitleSuccess : styles.subtitleError]}>
            {isSuccess
              ? "En unos segundos te vamos a redirigir a Mis eventos donde vas a poder ver tus tickets."
              : "El pago no fue aprobado. Podes intentarlo nuevamente."}
          </AppText>
          <View style={styles.actions}>
            <Button
              title={isSuccess ? "Ir ahora" : "Volver al inicio"}
              variant="dark"
              onPress={handlePrimary}
            />
            {!isSuccess ? (
              <Button title="Mis eventos" variant="ghost" onPress={handleSecondary} />
            ) : null}
          </View>
          <View style={styles.note}>
            <View style={styles.noteIcon}>
              <AppText weight="bold" style={styles.noteIconText}>i</AppText>
            </View>
            <AppText style={styles.noteText}>
              {isSuccess
                ? "Recorda que tu QR es dinamico y se actualiza automaticamente. Podras transferir tickets 12hs antes del evento."
                : "Si el problema persiste, contacta a nuestro soporte."}
            </AppText>
          </View>
          {orderId ? <AppText style={styles.orderId}>Orden: {orderId}</AppText> : null}
        </View>
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  screen: {
    backgroundColor: "#ffffff",
  },
  header: {
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
    alignItems: "center",
  },
  logo: {
    width: 120,
    height: 30,
  },
  container: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 100,
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    width: "100%",
    maxWidth: 560,
    alignItems: "center",
    gap: spacing.md,
  },
  iconWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 24,
    textAlign: "center",
  },
  titleSuccess: {
    color: "#BAC819",
  },
  titleError: {
    color: colors.danger,
  },
  subtitle: {
    textAlign: "center",
    maxWidth: 520,
  },
  subtitleSuccess: {
    color: colors.ink,
    fontSize: 16,
  },
  subtitleError: {
    color: colors.ink,
    fontSize: 16,
  },
  orderId: {
    color: colors.ink,
    marginTop: spacing.sm,
  },
  actions: {
    width: "100%",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  note: {
    marginTop: spacing.lg,
    width: "100%",
    backgroundColor: "#f3f4f6",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  noteIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
  },
  noteIconText: {
    fontSize: 12,
    color: "#6b7280",
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    color: colors.ink,
    lineHeight: 18,
  },
});

export default PaymentReturnScreen;
