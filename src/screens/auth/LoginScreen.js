import React, { useState } from "react";
import { Image, Pressable, StyleSheet, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Screen from "../../components/Screen";
import AppText from "../../components/AppText";
import Button from "../../components/Button";
import { colors, fontFamilies, spacing } from "../../theme";
import { loginApi } from "../../services/api";
import { useAuth } from "../../store/AuthContext";

const brandLogo = require("../../assets/image/logo.e3c0b2196cc23f84f67a.png");

const LoginScreen = ({ navigation }) => {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const goAfterLogin = () => {
    const root = navigation.getParent()?.getParent();
    if (root) {
      root.navigate("Main", { screen: "HomeTab" });
    } else {
      navigation.goBack();
    }
  };

  const onSubmit = async () => {
    if (!email || !password) {
      setError("Completá email y contraseña.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await loginApi({ email, password });
      if (response.status === 200) {
        const userInfo = response.data.info.user || {};
        await signIn({
          accessToken: response.data.info.token,
          refreshToken: response.data.info.refreshToken,
          user: {
            id: userInfo._id || userInfo.id,
            email: userInfo.email,
            name: userInfo.name,
            role: userInfo.role,
            dni: userInfo.dni,
          },
        });
        goAfterLogin();
      }
    } catch (err) {
      setError(err?.response?.data?.message || "No se pudo iniciar sesión.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("Login con Google deshabilitado temporalmente.");
    return;
  };

  return (
    <Screen style={{ backgroundColor: "#ffffff" }} contentStyle={styles.container}>
      <Image source={brandLogo} style={styles.logo} resizeMode="contain" />
      <View style={styles.card}>
        <AppText weight="bold" style={styles.title}>
          Inicia sesión en tu cuenta
        </AppText>
        {error ? <AppText style={styles.error}>{error}</AppText> : null}
        <TextInput
          placeholder="medinaOrganizer@test.com"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input}
        />
        <View style={styles.passwordRow}>
          <TextInput
            placeholder="••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            style={[styles.input, styles.passwordInput]}
          />
          <Pressable onPress={() => setShowPassword((v) => !v)} style={styles.eyeBtn}>
            <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={colors.ink} />
          </Pressable>
        </View>
        <Pressable style={styles.rememberRow} onPress={() => setRemember((v) => !v)}>
          <View style={[styles.checkbox, remember && styles.checkboxChecked]}>
            {remember ? <Ionicons name="checkmark" size={14} color="#fff" /> : null}
          </View>
          <AppText>Recordarme</AppText>
        </Pressable>
        <Button title={loading ? "Ingresando..." : "Ingresar"} variant="dark" onPress={onSubmit} disabled={loading} />
        <AppText style={styles.link} onPress={() => navigation.navigate("Forgot")}>
          Olvidé mi contraseña
        </AppText>
        <View style={styles.inlineRow}>
          <AppText>¿No tenés cuenta?</AppText>
          <AppText style={styles.link} onPress={() => navigation.navigate("Register")}>
            Registrate
          </AppText>
        </View>
        <AppText style={styles.orText}>O continúa con</AppText>
        <Pressable style={styles.socialButton} onPress={handleGoogleLogin} disabled={true}>
          <View style={styles.socialRow}>
            <Ionicons name="logo-google" size={16} color={colors.ink} />
            <AppText weight="semiBold">Google (proximamente)</AppText>
          </View>
        </Pressable>
        <Pressable style={styles.socialButton}>
          <View style={styles.socialRow}>
            <Ionicons name="logo-facebook" size={16} color={colors.ink} />
            <AppText weight="semiBold">Facebook</AppText>
          </View>
        </Pressable>
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.lg,
  },
  logo: {
    width: 120,
    height: 36,
    marginTop: spacing.lg,
  },
  card: {
    width: "100%",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E7E7E7",
    padding: spacing.xl,
    gap: spacing.md,
  },
  title: {
    textAlign: "center",
    fontSize: 16,
  },
  input: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2D3035",
    paddingHorizontal: spacing.md,
    fontSize: 13,
    fontFamily: fontFamilies.regular,
  },
  passwordRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  passwordInput: {
    flex: 1,
  },
  eyeBtn: {
    position: "absolute",
    right: 12,
  },
  rememberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#2D3035",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
  },
  checkboxChecked: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  link: {
    color: colors.ink,
    textAlign: "center",
    fontWeight: "600",
  },
  inlineRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  orText: {
    textAlign: "center",
    color: colors.muted,
    marginTop: spacing.sm,
  },
  socialButton: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E7E7E7",
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: "#f7f7f7",
  },
  socialRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  error: {
    color: colors.danger,
    textAlign: "center",
  },
});

export default LoginScreen;
