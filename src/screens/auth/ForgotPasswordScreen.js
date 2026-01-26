import React, { useEffect, useRef, useState } from "react";
import { Image, Pressable, StyleSheet, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Screen from "../../components/Screen";
import Button from "../../components/Button";
import AppText from "../../components/AppText";
import { colors, fontFamilies, spacing } from "../../theme";
import { checkEmailApi, forgotPasswordApi, verifyOtpApi } from "../../services/api";

const brandLogo = require("../../assets/image/logo.e3c0b2196cc23f84f67a.png");
const OTP_LENGTH = 4;

const ForgotPasswordScreen = ({ navigation }) => {
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(""));
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const otpRefs = useRef([]);

  useEffect(() => {
    if (step !== "otp" || timeLeft <= 0) return;
    const timerId = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timerId);
  }, [step, timeLeft]);

  const resetMessages = () => {
    setError("");
  };

  const startOtpFlow = () => {
    setOtp(Array(OTP_LENGTH).fill(""));
    setTimeLeft(60);
    setStep("otp");
    setTimeout(() => otpRefs.current?.[0]?.focus(), 50);
  };

  const onSubmitEmail = async () => {
    if (!email) {
      setError("Ingresa tu email.");
      return;
    }
    setLoading(true);
    resetMessages();
    try {
      const response = await checkEmailApi({ email });
      if (response.status === 200) {
        startOtpFlow();
      } else {
        setError(response?.data?.message || "No se pudo enviar el correo.");
      }
    } catch (err) {
      setError(err?.response?.data?.message || "No se pudo enviar el correo.");
    } finally {
      setLoading(false);
    }
  };

  const onVerifyOtp = async () => {
    const code = otp.join("");
    if (timeLeft === 0) {
      setError("El codigo OTP ha expirado.");
      return;
    }
    if (code.length !== OTP_LENGTH) {
      setError("El codigo OTP debe tener 4 digitos.");
      return;
    }
    setLoading(true);
    resetMessages();
    try {
      const response = await verifyOtpApi({ email, otp: code });
      if (response.status === 200) {
        setStep("reset");
      } else {
        setError(response?.data?.message || "OTP invalido.");
      }
    } catch (err) {
      setError(err?.response?.data?.message || "OTP invalido.");
    } finally {
      setLoading(false);
    }
  };

  const onResendOtp = async () => {
    setLoading(true);
    resetMessages();
    try {
      const response = await checkEmailApi({ email });
      if (response.status === 200) {
        setOtp(Array(OTP_LENGTH).fill(""));
        setTimeLeft(60);
        setTimeout(() => otpRefs.current?.[0]?.focus(), 50);
      } else {
        setError(response?.data?.message || "No se pudo reenviar el codigo.");
      }
    } catch (err) {
      setError(err?.response?.data?.message || "No se pudo reenviar el codigo.");
    } finally {
      setLoading(false);
    }
  };

  const onSubmitPassword = async () => {
    if (!password || !confirmPassword) {
      setError("Completa todos los campos.");
      return;
    }
    if (password.length < 8) {
      setError("La contrasena debe tener al menos 8 caracteres.");
      return;
    }
    const pwHasUpper = /[A-Z]/.test(password);
    const pwHasLower = /[a-z]/.test(password);
    const pwHasNumber = /\d/.test(password);
    const pwHasSpecial = /[^A-Za-z0-9]/.test(password);
    if (!(pwHasUpper && pwHasLower && pwHasNumber && pwHasSpecial)) {
      setError("La contrasena debe tener mayuscula, minuscula, numero y caracter especial.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Las contrasenas no coinciden.");
      return;
    }
    setLoading(true);
    resetMessages();
    try {
      const response = await forgotPasswordApi({
        email,
        password,
        confpassword: confirmPassword,
        otp: otp.join(""),
      });
      if (response.status === 200) {
        navigation.navigate("Login");
      } else {
        setError(response?.data?.message || "No se pudo restablecer la contrasena.");
      }
    } catch (err) {
      setError(err?.response?.data?.message || "No se pudo restablecer la contrasena.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    const digit = value.replace(/\D/g, "");
    const next = [...otp];
    if (!digit) {
      next[index] = "";
      setOtp(next);
      return;
    }
    next[index] = digit[digit.length - 1];
    setOtp(next);
    if (index < OTP_LENGTH - 1) {
      otpRefs.current?.[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (index, event) => {
    if (event.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current?.[index - 1]?.focus();
    }
  };

  const renderAlert = () => {
    if (!error) return null;
    return (
      <View style={styles.alert}>
        <View style={styles.alertIcon}>
          <AppText weight="bold" style={styles.alertIconText}>
            i
          </AppText>
        </View>
        <AppText style={styles.alertText}>{error}</AppText>
      </View>
    );
  };

  return (
    <Screen style={{ backgroundColor: "#ffffff" }} contentStyle={styles.container}>
      <Image source={brandLogo} style={styles.logo} resizeMode="contain" />
      <View style={styles.card}>
        {step === "email" ? (
          <>
            <AppText weight="bold" style={styles.title}>
              Olvidaste tu contrasena?
            </AppText>
            <AppText style={styles.subtitle}>Ingresa tu correo para restablecer tu contrasena.</AppText>
            {renderAlert()}
            <TextInput
              placeholder="Correo electronico*"
              placeholderTextColor={colors.muted}
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              underlineColorAndroid="transparent"
              style={styles.input}
            />
            <Button
              title={loading ? "Enviando..." : "Enviar correo"}
              onPress={onSubmitEmail}
              disabled={loading}
              style={styles.button}
              textStyle={styles.buttonText}
            />
            <Pressable onPress={() => navigation.goBack()}>
              <AppText style={styles.link}>Volver</AppText>
            </Pressable>
          </>
        ) : null}

        {step === "otp" ? (
          <>
            <AppText weight="bold" style={styles.title}>
              Verifica tu identidad
            </AppText>
            <AppText style={styles.subtitle}>Ingresa el codigo OTP de 4 digitos enviado a tu correo.</AppText>
            {timeLeft === 0 ? (
              <View style={styles.alert}>
                <View style={styles.alertIcon}>
                  <AppText weight="bold" style={styles.alertIconText}>
                    i
                  </AppText>
                </View>
                <AppText style={styles.alertText}>El codigo OTP ha expirado.</AppText>
              </View>
            ) : null}
            {renderAlert()}
            <View style={styles.otpRow}>
              {otp.map((digit, index) => (
                <TextInput
                  key={`otp-${index}`}
                  ref={(ref) => {
                    otpRefs.current[index] = ref;
                  }}
                  style={[
                    styles.otpInput,
                    timeLeft === 0 && styles.otpInputDisabled,
                    error && styles.otpInputError,
                  ]}
                  keyboardType="number-pad"
                  maxLength={1}
                  value={digit}
                  onChangeText={(value) => handleOtpChange(index, value)}
                  onKeyPress={(event) => handleOtpKeyPress(index, event)}
                  editable={timeLeft !== 0}
                  underlineColorAndroid="transparent"
                />
              ))}
            </View>
            {timeLeft !== 0 ? (
              <AppText style={styles.timer}>00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}</AppText>
            ) : null}
            <Button
              title={loading ? "Verificando..." : "Verificar"}
              onPress={onVerifyOtp}
              disabled={loading || timeLeft === 0}
              style={styles.button}
              textStyle={styles.buttonText}
            />
            <AppText style={styles.resendText}>
              No recibiste el codigo?{" "}
              <AppText style={styles.resendLink} onPress={onResendOtp}>
                Reenviar
              </AppText>
            </AppText>
          </>
        ) : null}

        {step === "reset" ? (
          <>
            <AppText weight="bold" style={styles.title}>
              Restablecer contrasena
            </AppText>
            <AppText style={styles.subtitle}>Crea una nueva contrasena segura para tu cuenta.</AppText>
            {renderAlert()}
            <View style={styles.passwordGroup}>
              <TextInput
                placeholder="Contrasena*"
                placeholderTextColor={colors.muted}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                underlineColorAndroid="transparent"
                style={styles.passwordInput}
              />
              <Pressable onPress={() => setShowPassword((prev) => !prev)} style={styles.eyeBtn}>
                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={colors.ink} />
              </Pressable>
            </View>
            <View style={styles.passwordGroup}>
              <TextInput
                placeholder="Confirmar contrasena*"
                placeholderTextColor={colors.muted}
                secureTextEntry={!showConfirmPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                underlineColorAndroid="transparent"
                style={styles.passwordInput}
              />
              <Pressable onPress={() => setShowConfirmPassword((prev) => !prev)} style={styles.eyeBtn}>
                <Ionicons name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} size={20} color={colors.ink} />
              </Pressable>
            </View>
            <Button
              title={loading ? "Guardando..." : "Restablecer contrasena"}
              onPress={onSubmitPassword}
              disabled={loading}
              style={styles.button}
              textStyle={styles.buttonText}
            />
          </>
        ) : null}
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    alignItems: "center",
  },
  logo: {
    width: 120,
    height: 36,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  card: {
    width: "100%",
    maxWidth: 342,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E7E7E7",
    backgroundColor: "#ffffff",
    paddingHorizontal: 26,
    paddingVertical: 24,
    gap: spacing.md,
    shadowColor: "#000000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  title: {
    textAlign: "center",
    fontSize: 16,
    color: colors.ink,
  },
  subtitle: {
    textAlign: "center",
    fontSize: 12,
    color: "#0D263C",
    fontFamily: fontFamilies.semiBold,
  },
  alert: {
    width: "100%",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "#F9E8E8",
    borderWidth: 1,
    borderColor: "#F3CACA",
  },
  alertIcon: {
    width: 17,
    height: 17,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "#D32F2F",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  alertIconText: {
    fontSize: 10,
    lineHeight: 12,
    color: "#D32F2F",
    fontFamily: fontFamilies.bold,
  },
  alertText: {
    flex: 1,
    color: "#D32F2F",
    fontSize: 12,
    fontFamily: fontFamilies.semiBold,
  },
  input: {
    height: 43,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: colors.ink,
    paddingHorizontal: 14,
    paddingVertical: 0,
    fontSize: 14,
    color: colors.ink,
    backgroundColor: "#ffffff",
    fontFamily: fontFamilies.regular,
    textAlignVertical: "center",
    includeFontPadding: false,
  },
  passwordGroup: {
    position: "relative",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.ink,
    justifyContent: "center",
    backgroundColor: "#ffffff",
    overflow: "hidden",
  },
  passwordInput: {
    height: 43,
    paddingHorizontal: 14,
    paddingRight: 44,
    paddingVertical: 0,
    fontSize: 14,
    color: colors.ink,
    backgroundColor: "#ffffff",
    fontFamily: fontFamilies.regular,
    textAlignVertical: "center",
    includeFontPadding: false,
  },
  eyeBtn: {
    position: "absolute",
    right: 10,
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  button: {
    width: "100%",
    height: 44,
    borderRadius: 8,
    paddingVertical: 0,
    paddingHorizontal: 16,
    backgroundColor: "#2D3035",
  },
  buttonText: {
    fontSize: 14,
    fontFamily: fontFamilies.bold,
  },
  link: {
    color: colors.ink,
    textAlign: "center",
    fontSize: 12,
    fontFamily: fontFamilies.semiBold,
    marginTop: spacing.sm,
  },
  otpRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
  },
  otpInput: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#C7D5E1",
    backgroundColor: "#EAF0F5",
    color: colors.ink,
    textAlign: "center",
    fontSize: 20,
    fontFamily: fontFamilies.bold,
    paddingVertical: 0,
    textAlignVertical: "center",
    includeFontPadding: false,
  },
  otpInputError: {
    borderColor: "#F3CACA",
    backgroundColor: "#F9E8E8",
    color: "#D32F2F",
  },
  otpInputDisabled: {
    opacity: 0.6,
  },
  timer: {
    textAlign: "center",
    color: colors.ink,
    fontSize: 14,
  },
  resendText: {
    textAlign: "center",
    fontSize: 12,
    fontFamily: fontFamilies.semiBold,
    color: "#0D263C",
  },
  resendLink: {
    color: colors.brand,
    fontSize: 12,
    fontFamily: fontFamilies.semiBold,
  },
});

export default ForgotPasswordScreen;
