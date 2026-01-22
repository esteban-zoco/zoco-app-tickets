import React, { useEffect, useState } from "react";
import { Image, Platform, Pressable, StyleSheet, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import * as Google from "expo-auth-session/providers/google";
import Screen from "../../components/Screen";
import AppText from "../../components/AppText";
import Button from "../../components/Button";
import { colors, fontFamilies, spacing } from "../../theme";
import { googleUserInfoApi, loginApi, socialLoginApi } from "../../services/api";
import { useAuth } from "../../store/AuthContext";

const brandLogo = require("../../assets/image/logo.e3c0b2196cc23f84f67a.png");

WebBrowser.maybeCompleteAuthSession();

const LoginScreen = ({ navigation }) => {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const googleAndroidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
  const googleIosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  const googleWebClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  const googleFallbackClientId = googleIosClientId || googleWebClientId || googleAndroidClientId || "";
  const googleAndroidScheme = googleAndroidClientId
    ? `com.googleusercontent.apps.${googleAndroidClientId.replace(".apps.googleusercontent.com", "")}`
    : null;
  const googleIosScheme = googleIosClientId
    ? `com.googleusercontent.apps.${googleIosClientId.replace(".apps.googleusercontent.com", "")}`
    : null;
  const googleRedirectUri =
    Platform.OS === "android" && googleAndroidScheme
      ? `${googleAndroidScheme}:/oauth2redirect`
      : Platform.OS === "ios" && googleIosScheme
        ? `${googleIosScheme}:/oauth2redirect`
        : AuthSession.makeRedirectUri({ scheme: "zoco-tickets", path: "oauthredirect" });
  const [googleRequest, googleResponse, promptGoogleLogin] = Google.useAuthRequest({
    androidClientId: googleAndroidClientId,
    iosClientId: googleIosClientId,
    webClientId: googleWebClientId,
    clientId: googleFallbackClientId,
    scopes: ["profile", "email"],
    extraParams: { prompt: "select_account" },
    redirectUri: googleRedirectUri,
  });

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
      setError("Completa email y contrasena.");
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
      setError(err?.response?.data?.message || "No se pudo iniciar sesion.");
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async (accessToken) => {
    setGoogleLoading(true);
    setError("");
    try {
      const profileRes = await googleUserInfoApi(accessToken);
      const profile = profileRes?.data || {};
      const socialId = profile.sub || profile.id;
      const name =
        profile.name || [profile.given_name, profile.family_name].filter(Boolean).join(" ") || profile.email || "";
      if (!profile.email || !socialId) {
        setError("No se pudo obtener los datos de Google.");
        return;
      }
      const response = await socialLoginApi({
        email: profile.email,
        name,
        social_id: socialId,
        social_type: "google",
      });
      if (response.status === 200) {
        const info = response.data.info || {};
        const userInfo = info.user || {};
        await signIn({
          accessToken: info.token,
          refreshToken: info.refreshToken,
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
      setError(err?.response?.data?.message || "No se pudo iniciar sesion con Google.");
    } finally {
      setGoogleLoading(false);
    }
  };

  useEffect(() => {
    if (!googleResponse) return;
    if (googleResponse.type === "success") {
      const accessToken = googleResponse.authentication?.accessToken;
      if (!accessToken) {
        setError("No se pudo obtener el token de Google.");
        setGoogleLoading(false);
        return;
      }
      signInWithGoogle(accessToken);
      return;
    }
    if (googleResponse.type === "error") {
      setError("No se pudo iniciar sesion con Google.");
    }
    if (googleResponse.type !== "success") {
      setGoogleLoading(false);
    }
  }, [googleResponse]);

  const handleGoogleLogin = async () => {
    if (!googleRequest) return;
    const missingClientId =
      Platform.OS === "ios"
        ? !googleIosClientId
        : Platform.OS === "android"
          ? !googleAndroidClientId
          : !googleWebClientId;
    if (missingClientId) {
      setError("Falta configurar Google Client ID para esta plataforma.");
      return;
    }
    setError("");
    setGoogleLoading(true);
    const result = await promptGoogleLogin({ useProxy: false, showInRecents: true });
    if (result.type !== "success") {
      setGoogleLoading(false);
    }
  };

  return (
    <Screen style={{ backgroundColor: "#ffffff" }} contentStyle={styles.container}>
      <Image source={brandLogo} style={styles.logo} resizeMode="contain" />
      <View style={styles.card}>
        <AppText weight="bold" style={styles.title}>
          Inicia sesion en tu cuenta
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
            placeholder="********"
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
          Olvide mi contrasena
        </AppText>
        <View style={styles.inlineRow}>
          <AppText>No tenes cuenta?</AppText>
          <AppText style={styles.link2} onPress={() => navigation.navigate("Register")}>
            Registrate
          </AppText>
        </View>
        <AppText style={styles.orText}>O continua con</AppText>
        <Pressable style={styles.socialButton} onPress={handleGoogleLogin} disabled={!googleRequest || googleLoading}>
          <View style={styles.socialRow}>
            <Ionicons name="logo-google" size={16} color={colors.ink} />
            <AppText weight="semiBold">{googleLoading ? "Conectando..." : "Google"}</AppText>
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
    flex: 1,
    padding: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.lg,
  },
  logo: {
    width: 120,
    height: 36,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
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
    marginTop: spacing.xl,
    color: colors.ink,
    textAlign: "center",
    fontWeight: "600",
    fontFamily: fontFamilies.semiBold,
  },
    link2: {
    color: colors.ink,
    textAlign: "center",
    fontWeight: "600",
    fontFamily: fontFamilies.semiBold,
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
