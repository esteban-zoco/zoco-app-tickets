import React, { useEffect, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import Screen from "../../components/Screen";
import AppText from "../../components/AppText";
import Button from "../../components/Button";
import { colors, spacing } from "../../theme";

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
    }, 1200);
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
    <Screen>
      <View style={styles.container}>
        <AppText weight="bold" style={styles.title}>
          {isSuccess ? "Pago confirmado" : "Pago no confirmado"}
        </AppText>
        <AppText style={styles.subtitle}>
          {isSuccess
            ? "Gracias. Estamos preparando tus entradas."
            : "No pudimos confirmar el pago. Podes intentarlo de nuevo."}
        </AppText>
        {orderId ? <AppText style={styles.orderId}>Orden: {orderId}</AppText> : null}
        <Button
          title={isSuccess ? "Ver mis eventos" : "Volver al inicio"}
          onPress={handlePrimary}
        />
        {!isSuccess ? (
          <Button title="Mis eventos" variant="ghost" onPress={handleSecondary} />
        ) : null}
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  title: {
    fontSize: 18,
  },
  subtitle: {
    color: colors.muted,
  },
  orderId: {
    color: colors.ink,
  },
});

export default PaymentReturnScreen;
