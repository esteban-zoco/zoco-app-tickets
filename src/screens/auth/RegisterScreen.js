import React, { useEffect, useMemo, useRef, useState } from "react";
import { Image, Pressable, StyleSheet, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Screen from "../../components/Screen";
import Button from "../../components/Button";
import AppText from "../../components/AppText";
import { colors, fontFamilies, spacing } from "../../theme";
import { registerApi, verifyEmailApi } from "../../services/api";

const brandLogo = require("../../assets/image/logo.e3c0b2196cc23f84f67a.png");
const OTP_LENGTH = 4;

const RegisterScreen = ({ navigation }) => {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    dni: "",
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [isOtp, setIsOtp] = useState(false);
  const [otpDigits, setOtpDigits] = useState(Array(OTP_LENGTH).fill(""));
  const [otpStatus, setOtpStatus] = useState("idle");
  const [otpError, setOtpError] = useState("");
  const [timeLeft, setTimeLeft] = useState(59);
  const [submittedForm, setSubmittedForm] = useState(null);
  const otpRefs = useRef([]);

  const pwHasUpper = useMemo(() => /[A-Z]/.test(form.password), [form.password]);
  const pwHasLower = useMemo(() => /[a-z]/.test(form.password), [form.password]);
  const pwHasNumber = useMemo(() => /\d/.test(form.password), [form.password]);
  const pwHasSpecial = useMemo(() => /[^A-Za-z0-9]/.test(form.password), [form.password]);

  useEffect(() => {
    if (!isOtp || timeLeft <= 0) return;
    const timerId = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timerId);
  }, [isOtp, timeLeft]);

  useEffect(() => {
    if (otpStatus !== "success") return;
    const timerId = setTimeout(() => navigation.replace("Login"), 3500);
    return () => clearTimeout(timerId);
  }, [otpStatus, navigation]);

  const updateForm = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
    if (formError) setFormError("");
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.username.trim()) nextErrors.username = "El nombre de usuario es obligatorio";

    if (!form.email.trim()) {
      nextErrors.email = "El correo es obligatorio";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      nextErrors.email = "Formato de correo invalido";
    }

    if (!form.password) {
      nextErrors.password = "La contrasena es obligatoria";
    } else {
      const missing = [];
      if (form.password.length < 8) missing.push("8 caracteres");
      if (!pwHasUpper) missing.push("1 mayuscula");
      if (!pwHasLower) missing.push("1 minuscula");
      if (!pwHasNumber) missing.push("1 numero");
      if (!pwHasSpecial) missing.push("1 caracter especial");
      if (missing.length) nextErrors.password = `La contrasena debe tener ${missing.join(", ")}.`;
    }

    if (!form.confirmPassword) {
      nextErrors.confirmPassword = "La confirmacion es obligatoria";
    } else if (form.confirmPassword !== form.password) {
      nextErrors.confirmPassword = "Las contrasenas no coinciden";
    }

    if (!form.dni.trim()) {
      nextErrors.dni = "El DNI es obligatorio";
    } else if (!/^\d{7,10}$/.test(form.dni.trim())) {
      nextErrors.dni = "El DNI debe ser numerico (7 a 10 digitos)";
    }

    return nextErrors;
  };

  const onSubmit = async () => {
    const validation = validate();
    setErrors(validation);
    if (Object.keys(validation).length) {
      setFormError("Campo obligatorio");
      return;
    }
    setLoading(true);
    setFormError("");
    try {
      const payload = {
        name: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        confpassword: form.confirmPassword,
        dni: form.dni.trim(),
      };
      const response = await registerApi(payload);
      if (response.status === 200) {
        setSubmittedForm(payload);
        setIsOtp(true);
        setOtpDigits(Array(OTP_LENGTH).fill(""));
        setOtpStatus("idle");
        setOtpError("");
        setTimeLeft(59);
      }
    } catch (err) {
      setFormError(err?.response?.data?.message || "No se pudo registrar.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (value, index) => {
    const clean = value.replace(/\D/g, "");
    const next = [...otpDigits];

    if (!clean) {
      next[index] = "";
      setOtpDigits(next);
      return;
    }

    for (let i = 0; i < clean.length && index + i < OTP_LENGTH; i += 1) {
      next[index + i] = clean[i];
    }
    setOtpDigits(next);

    const nextIndex = index + clean.length;
    if (nextIndex < OTP_LENGTH) {
      otpRefs.current[nextIndex]?.focus();
    } else {
      otpRefs.current[OTP_LENGTH - 1]?.blur();
    }

    if (otpStatus !== "success") {
      setOtpStatus("idle");
      setOtpError("");
    }
  };

  const handleOtpKeyPress = (event, index) => {
    if (event.nativeEvent.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const resendOtp = async () => {
    if (!submittedForm) return;
    setLoading(true);
    setOtpError("");
    try {
      const response = await registerApi(submittedForm);
      if (response.status === 200) {
        setTimeLeft(59);
        setOtpDigits(Array(OTP_LENGTH).fill(""));
        setOtpStatus("idle");
        setOtpError("");
      }
    } catch (err) {
      setOtpError("No se pudo reenviar el codigo.");
    } finally {
      setLoading(false);
    }
  };

  const submitOtp = async () => {
    const code = otpDigits.join("");
    if (!code) {
      setOtpError("El codigo OTP es obligatorio");
      return;
    }
    if (code.length !== OTP_LENGTH) {
      setOtpError("El codigo OTP debe tener 4 digitos");
      return;
    }
    if (timeLeft === 0) {
      setOtpStatus("expired");
      setOtpError("Este codigo expiro. Pedi uno nuevo");
      return;
    }
    setLoading(true);
    try {
      const response = await verifyEmailApi({ email: submittedForm?.email || form.email, otp: code });
      if (response.status === 200) {
        setOtpStatus("success");
        return;
      }
    } catch (err) {
      setOtpStatus("invalid");
      setOtpError(err?.response?.data?.message || "El codigo no es correcto. Intentalo de nuevo");
    } finally {
      setLoading(false);
    }
  };

  if (isOtp) {
    const otpTimer = timeLeft < 10 ? `0${timeLeft}` : `${timeLeft}`;
    return (
      <Screen style={styles.screen} contentStyle={styles.container}>
        <Image source={brandLogo} style={styles.logo} resizeMode="contain" />
        {otpStatus === "invalid" ? (
          <View style={styles.alert}>
            <View style={styles.alertIcon}>
              <AppText weight="bold" style={styles.alertIconText}>
                i
              </AppText>
            </View>
            <AppText style={styles.alertText}>El codigo no es correcto. Intentalo de nuevo</AppText>
          </View>
        ) : null}
        {otpStatus === "expired" ? (
          <View style={styles.alert}>
            <View style={styles.alertIcon}>
              <AppText weight="bold" style={styles.alertIconText}>
                i
              </AppText>
            </View>
            <AppText style={styles.alertText}>
              Este codigo expiro.{" "}
              <AppText style={styles.alertLink} onPress={resendOtp}>
                Pedi uno nuevo
              </AppText>
            </AppText>
          </View>
        ) : null}
        {otpStatus !== "success" ? (
          <View style={styles.card}>
            <AppText weight="bold" style={styles.title}>
              Verifica tu identidad
            </AppText>
            <AppText style={styles.subtext}>
              Ingresa el codigo de 4 digitos enviado a tu casilla de email para continuar
            </AppText>
            <View style={styles.otpRow}>
              {otpDigits.map((digit, index) => {
                const isError = otpStatus === "invalid";
                return (
                  <TextInput
                    key={`otp-${index}`}
                    ref={(ref) => {
                      otpRefs.current[index] = ref;
                    }}
                    value={digit}
                    onChangeText={(value) => handleOtpChange(value, index)}
                    onKeyPress={(event) => handleOtpKeyPress(event, index)}
                    keyboardType="number-pad"
                    maxLength={1}
                    textContentType={index === 0 ? "oneTimeCode" : "none"}
                    style={[styles.otpInput, isError && styles.otpInputError]}
                  />
                );
              })}
            </View>
            {otpError && otpStatus !== "expired" ? <AppText style={styles.fieldError}>{otpError}</AppText> : null}
            <AppText style={styles.otpTimer}>00:{otpTimer}</AppText>
            <Button
              title={loading ? "Verificando..." : "Verificar"}
              variant="primary"
              onPress={submitOtp}
              disabled={loading}
              style={styles.primaryButton}
            />
            <AppText style={styles.otpResend}>
              No recibiste el codigo?{" "}
              <AppText style={styles.linkHighlight} onPress={resendOtp}>
                Reenviar
              </AppText>
            </AppText>
          </View>
        ) : (
          <View style={styles.card}>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark" size={28} color={colors.brand} />
            </View>
            <AppText weight="bold" style={styles.successTitle}>
              Cuenta verificada con exito
            </AppText>
            <AppText style={styles.successText}>
              Ya podes iniciar sesion para seguir explorando eventos y comprar tus tickets de forma rapida y segura
            </AppText>
            <Button
              title="Ir a iniciar sesion"
              variant="primary"
              onPress={() => navigation.replace("Login")}
              style={styles.primaryButton}
            />
          </View>
        )}
      </Screen>
    );
  }

  return (
    <Screen style={styles.screen} contentStyle={styles.container}>
      <Image source={brandLogo} style={styles.logo} resizeMode="contain" />
      <View style={styles.card}>
        <AppText weight="bold" style={styles.title}>
          Registra tu cuenta
        </AppText>
        <AppText style={styles.subtext}>
          Y consegui entradas para tus eventos favoritos, sin cargos de servicio
        </AppText>
        {formError || Object.keys(errors).length ? (
          <View style={styles.alert}>
            <View style={styles.alertIcon}>
              <AppText weight="bold" style={styles.alertIconText}>
                i
              </AppText>
            </View>
            <AppText style={styles.alertText}>{formError || "Campo obligatorio"}</AppText>
          </View>
        ) : null}
        <View>
          <TextInput
            placeholder="Usuario *"
            value={form.username}
            onChangeText={(value) => updateForm("username", value)}
            style={[styles.input, errors.username && styles.inputError]}
            placeholderTextColor="#6b7280"
          />
          {errors.username ? <AppText style={styles.fieldError}>{errors.username}</AppText> : null}
        </View>
        <View>
          <TextInput
            placeholder="Email *"
            value={form.email}
            onChangeText={(value) => updateForm("email", value)}
            autoCapitalize="none"
            keyboardType="email-address"
            style={[styles.input, errors.email && styles.inputError]}
            placeholderTextColor="#6b7280"
          />
          {errors.email ? <AppText style={styles.fieldError}>{errors.email}</AppText> : null}
        </View>
        <View>
          <View style={[styles.inputGroup, errors.password && styles.inputError]}>
            <TextInput
              placeholder="Contrasena *"
              value={form.password}
              onChangeText={(value) => updateForm("password", value)}
              secureTextEntry={!showPassword}
              style={styles.passwordInput}
              placeholderTextColor="#6b7280"
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
            />
            <Pressable onPress={() => setShowPassword((v) => !v)} style={styles.eyeBtn}>
              <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={colors.ink} />
            </Pressable>
          </View>
          {passwordFocused ? (
            <View style={styles.passwordConditions}>
              <View style={styles.conditionItem}>
                <View style={[styles.conditionDot, pwHasUpper && styles.conditionDotOk]}>
                  {pwHasUpper ? <Ionicons name="checkmark" size={12} color={colors.brand} /> : null}
                </View>
                <AppText style={[styles.conditionText, pwHasUpper && styles.conditionTextOk]}>Mayuscula</AppText>
              </View>
              <View style={styles.conditionItem}>
                <View style={[styles.conditionDot, pwHasLower && styles.conditionDotOk]}>
                  {pwHasLower ? <Ionicons name="checkmark" size={12} color={colors.brand} /> : null}
                </View>
                <AppText style={[styles.conditionText, pwHasLower && styles.conditionTextOk]}>Minuscula</AppText>
              </View>
              <View style={styles.conditionItem}>
                <View style={[styles.conditionDot, pwHasNumber && styles.conditionDotOk]}>
                  {pwHasNumber ? <Ionicons name="checkmark" size={12} color={colors.brand} /> : null}
                </View>
                <AppText style={[styles.conditionText, pwHasNumber && styles.conditionTextOk]}>Numero</AppText>
              </View>
              <View style={styles.conditionItem}>
                <View style={[styles.conditionDot, pwHasSpecial && styles.conditionDotOk]}>
                  {pwHasSpecial ? <Ionicons name="checkmark" size={12} color={colors.brand} /> : null}
                </View>
                <AppText style={[styles.conditionText, pwHasSpecial && styles.conditionTextOk]}>
                  Caracter especial
                </AppText>
              </View>
            </View>
          ) : null}
          {errors.password ? <AppText style={styles.fieldError}>{errors.password}</AppText> : null}
        </View>
        <View>
          <View style={[styles.inputGroup, errors.confirmPassword && styles.inputError]}>
            <TextInput
              placeholder="Confirmar contrasena *"
              value={form.confirmPassword}
              onChangeText={(value) => updateForm("confirmPassword", value)}
              secureTextEntry={!showConfirmPassword}
              style={styles.passwordInput}
              placeholderTextColor="#6b7280"
            />
            <Pressable onPress={() => setShowConfirmPassword((v) => !v)} style={styles.eyeBtn}>
              <Ionicons name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} size={20} color={colors.ink} />
            </Pressable>
          </View>
          {errors.confirmPassword ? <AppText style={styles.fieldError}>{errors.confirmPassword}</AppText> : null}
        </View>
        <View>
          <TextInput
            placeholder="DNI *"
            value={form.dni}
            onChangeText={(value) => updateForm("dni", value)}
            keyboardType="number-pad"
            style={[styles.input, errors.dni && styles.inputError]}
            placeholderTextColor="#6b7280"
          />
          {errors.dni ? <AppText style={styles.fieldError}>{errors.dni}</AppText> : null}
        </View>
        <Button
          title={loading ? "Registrando..." : "Registrarse"}
          onPress={onSubmit}
          disabled={loading}
          style={styles.primaryButton}
        />
        <View style={styles.linksRow}>
          <AppText>Ya tenes cuenta?</AppText>
          <AppText style={styles.link} onPress={() => navigation.navigate("Login")}>
            Inicia sesion
          </AppText>
        </View>
        <AppText style={styles.legalText}>
          Al crear tu cuenta aceptas nuestros{" "}
          <AppText style={styles.linkHighlight}>Terminos de uso</AppText> y{" "}
          <AppText style={styles.linkHighlight}>Politica de privacidad</AppText>
        </AppText>
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  screen: {
    backgroundColor: "#ffffff",
  },
  container: {
    paddingHorizontal: spacing.xl,
    paddingTop: 80,
    paddingBottom: spacing.xl,
    alignItems: "center",
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
    maxWidth: 420,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E7E7E7",
    padding: spacing.xl,
    gap: spacing.md,
  },
  title: {
    textAlign: "center",
    fontSize: 16,
  },
  subtext: {
    textAlign: "center",
    fontSize: 15,
    color: "#2D3035",
  },
  alert: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "center",
    backgroundColor: "#F9E8E8",
    borderWidth: 1,
    borderColor: "#F3CACA",
    borderRadius: 12,
    padding: spacing.md,
  },
  alertIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#FDECEC",
    alignItems: "center",
    justifyContent: "center",
  },
  alertIconText: {
    color: colors.danger,
    fontSize: 12,
  },
  alertText: {
    flex: 1,
    fontSize: 12,
    color: colors.ink,
  },
  alertLink: {
    color: colors.danger,
    fontWeight: "600",
  },
  input: {
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#2D3035",
    paddingHorizontal: spacing.md,
    fontSize: 14,
    fontFamily: fontFamilies.regular,
    color: colors.ink,
  },
  inputGroup: {
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#2D3035",
    justifyContent: "center",
  },
  passwordInput: {
    height: 44,
    paddingHorizontal: spacing.md,
    paddingRight: 44,
    fontSize: 14,
    fontFamily: fontFamilies.regular,
    color: colors.ink,
  },
  eyeBtn: {
    position: "absolute",
    right: 12,
  },
  inputError: {
    borderColor: colors.danger,
  },
  fieldError: {
    color: colors.danger,
    fontSize: 12,
    marginTop: 6,
  },
  passwordConditions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  conditionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  conditionDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "#6b7280",
    alignItems: "center",
    justifyContent: "center",
  },
  conditionDotOk: {
    borderColor: colors.brand,
    backgroundColor: "rgba(177, 194, 14, 0.12)",
  },
  conditionText: {
    fontSize: 11,
    color: "#6b7280",
  },
  conditionTextOk: {
    color: colors.brand,
    fontWeight: "600",
  },
  primaryButton: {
    borderRadius: 8,
    paddingVertical: 12,
    backgroundColor: "#2D3035",
  },
  linksRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 4,
  },
  link: {
    color: colors.ink,
    fontWeight: "700",
    fontFamily: fontFamilies.semiBold,
  },
  legalText: {
    textAlign: "center",
    fontSize: 11,
    color: "#6C6C6C",
  },
  linkHighlight: {
    color: colors.brand,
    fontWeight: "700",
    fontFamily: fontFamilies.semiBold,
  },
  otpRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  otpInput: {
    width: 48,
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#C7D5E1",
    backgroundColor: "#EAF0F5",
    textAlign: "center",
    fontSize: 20,
    fontFamily: fontFamilies.bold,
    color: colors.ink,
  },
  otpInputError: {
    borderColor: "#F3CACA",
    backgroundColor: "#F9E8E8",
    color: colors.danger,
  },
  otpTimer: {
    textAlign: "center",
    color: colors.ink,
    fontSize: 12,
    marginTop: spacing.sm,
  },
  otpResend: {
    textAlign: "center",
    fontSize: 12,
    color: colors.ink,
  },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  successTitle: {
    textAlign: "center",
    fontSize: 20,
    color: colors.brand,
  },
  successText: {
    textAlign: "center",
    color: colors.ink,
    fontSize: 13,
  },
});

export default RegisterScreen;
