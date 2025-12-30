import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import Screen from "../../components/Screen";
import AppText from "../../components/AppText";
import Button from "../../components/Button";
import Loading from "../../components/Loading";
import AuthRequiredScreen from "../auth/AuthRequiredScreen";
import { colors, spacing } from "../../theme";
import { acceptTicketTransferApi } from "../../services/api";
import { useAuth } from "../../store/AuthContext";

const TransferAcceptScreen = ({ navigation, route }) => {
  const { state } = useAuth();
  const token = route?.params?.token;
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token || !state.isAuthenticated) return;
    (async () => {
      try {
        setStatus("loading");
        await acceptTicketTransferApi(state.accessToken, token);
        setStatus("success");
        setMessage("Listo! El ticket ya es tuyo.");
      } catch (err) {
        setStatus("error");
        setMessage(err?.response?.data?.message || "No se pudo completar la transferencia.");
      }
    })();
  }, [token, state.isAuthenticated, state.accessToken]);

  if (!state.isAuthenticated) return <AuthRequiredScreen />;
  if (status === "loading") return <Loading />;

  return (
    <Screen contentStyle={styles.container}>
      <View style={styles.card}>
        <AppText weight="bold" style={styles.title}>
          Transferencia de tickets
        </AppText>
        <AppText style={styles.message}>{message || "Procesando transferencia..."}</AppText>
        {status === "success" ? (
          <Button title="Ver mis eventos" onPress={() => navigation.navigate("MyEvents")} />
        ) : (
          <Button title="Volver al inicio" variant="ghost" onPress={() => navigation.navigate("HomeTab")} />
        )}
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.xl,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  title: {
    fontSize: 18,
  },
  message: {
    color: colors.muted,
  },
});

export default TransferAcceptScreen;
