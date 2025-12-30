import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import Screen from "../../components/Screen";
import Input from "../../components/Input";
import Button from "../../components/Button";
import AppText from "../../components/AppText";
import { colors, spacing } from "../../theme";
import { registerApi } from "../../services/api";

const RegisterScreen = ({ navigation }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!name || !email || !password) {
      setError("Completá todos los campos.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await registerApi({ name, email, password });
      if (response.status === 200) {
        navigation.replace("Login");
      }
    } catch (err) {
      setError(err?.response?.data?.message || "No se pudo registrar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen contentStyle={styles.container}>
      <View style={styles.card}>
        <AppText weight="bold" style={styles.title}>
          Creá tu cuenta
        </AppText>
        {error ? <AppText style={styles.error}>{error}</AppText> : null}
        <Input placeholder="Nombre" value={name} onChangeText={setName} />
        <Input placeholder="Email" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
        <Input placeholder="Contraseña" secureTextEntry value={password} onChangeText={setPassword} />
        <Button title={loading ? "Creando..." : "Crear cuenta"} onPress={onSubmit} disabled={loading} />
        <AppText style={styles.link} onPress={() => navigation.navigate("Login")}>
          Ya tengo cuenta
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
  link: {
    color: colors.brand,
    textAlign: "center",
    marginTop: spacing.sm,
  },
});

export default RegisterScreen;
