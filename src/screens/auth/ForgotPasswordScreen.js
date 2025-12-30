import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import Screen from "../../components/Screen";
import Input from "../../components/Input";
import Button from "../../components/Button";
import AppText from "../../components/AppText";
import { colors, spacing } from "../../theme";
import { forgotPasswordApi } from "../../services/api";

const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!email) {
      setError("Ingresá tu email.");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const response = await forgotPasswordApi({ email });
      if (response.status === 200) {
        setSuccess("Te enviamos un correo con los pasos para recuperar la contraseña.");
      }
    } catch (err) {
      setError(err?.response?.data?.message || "No se pudo enviar el correo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen contentStyle={styles.container}>
      <View style={styles.card}>
        <AppText weight="bold" style={styles.title}>
          Recuperar contraseña
        </AppText>
        {error ? <AppText style={styles.error}>{error}</AppText> : null}
        {success ? <AppText style={styles.success}>{success}</AppText> : null}
        <Input placeholder="Email" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
        <Button title={loading ? "Enviando..." : "Enviar"} onPress={onSubmit} disabled={loading} />
        <AppText style={styles.link} onPress={() => navigation.goBack()}>
          Volver
        </AppText>
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
    borderRadius: 24,
    padding: spacing.xl,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    fontSize: 18,
  },
  error: {
    color: colors.danger,
  },
  success: {
    color: colors.success,
  },
  link: {
    color: colors.brand,
    textAlign: "center",
  },
});

export default ForgotPasswordScreen;
