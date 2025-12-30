import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Screen from "../../components/Screen";
import AppText from "../../components/AppText";
import AuthRequiredScreen from "../auth/AuthRequiredScreen";
import { colors, spacing } from "../../theme";
import { changePasswordApi } from "../../services/api";
import { useAuth } from "../../store/AuthContext";

const ChangePasswordScreen = ({ navigation }) => {
  const { state } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  if (!state.isAuthenticated) return <AuthRequiredScreen />;

  const goHome = () => {
    const parent = navigation.getParent();
    if (parent) {
      parent.navigate("HomeTab");
    } else {
      navigation.navigate("Home");
    }
  };

  const onSave = async () => {
    setStatus("");
    setError("");
    if (!currentPassword || !newPassword) {
      setError("Completa todos los campos.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Las contrasenas no coinciden.");
      return;
    }
    try {
      setSaving(true);
      await changePasswordApi(null, { oldPassword: currentPassword, password: newPassword });
      setStatus("Contrasena actualizada.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError("No se pudo actualizar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen scroll={false} style={{ backgroundColor: "#ffffff" }}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.titleWrap}>
            <AppText weight="bold" style={styles.title}>
              Cambiar contrasena
            </AppText>
          </View>

          <View style={styles.field}>
            <AppText style={styles.label}>Contrasena actual</AppText>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.input}
                secureTextEntry={!showCurrent}
                value={currentPassword}
                onChangeText={setCurrentPassword}
              />
              <Pressable style={styles.eyeBtn} onPress={() => setShowCurrent((prev) => !prev)}>
                <Ionicons name={showCurrent ? "eye-off-outline" : "eye-outline"} size={18} color={colors.ink} />
              </Pressable>
            </View>
          </View>

          <View style={styles.field}>
            <AppText style={styles.label}>Nueva contrasena</AppText>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.input}
                secureTextEntry={!showNew}
                value={newPassword}
                onChangeText={setNewPassword}
              />
              <Pressable style={styles.eyeBtn} onPress={() => setShowNew((prev) => !prev)}>
                <Ionicons name={showNew ? "eye-off-outline" : "eye-outline"} size={18} color={colors.ink} />
              </Pressable>
            </View>
          </View>

          <View style={styles.field}>
            <AppText style={styles.label}>Repetir contrasena</AppText>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.input}
                secureTextEntry={!showConfirm}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
              <Pressable style={styles.eyeBtn} onPress={() => setShowConfirm((prev) => !prev)}>
                <Ionicons name={showConfirm ? "eye-off-outline" : "eye-outline"} size={18} color={colors.ink} />
              </Pressable>
            </View>
          </View>

          {error ? <AppText style={styles.error}>{error}</AppText> : null}
          {status ? <AppText style={styles.status}>{status}</AppText> : null}

          <Pressable style={styles.saveButton} onPress={onSave} disabled={saving}>
            <AppText weight="bold" style={styles.saveText}>
              {saving ? "Guardando..." : "Guardar cambios"}
            </AppText>
          </Pressable>

          <Pressable style={styles.backRow} onPress={goHome}>
            <AppText style={styles.backText}>
              <AppText style={styles.backArrow}>{"<"}</AppText> Volver a{" "}
              <AppText style={styles.backLink}>Eventos</AppText>
            </AppText>
          </Pressable>
        </View>
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 80,
    alignItems: "center",
  },
  card: {
    width: "100%",
    maxWidth: 280,
    gap: spacing.md,
  },
  titleWrap: {
    backgroundColor: "#F3F3F3",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    color: colors.ink,
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.ink,
  },
  inputWrap: {
    position: "relative",
    justifyContent: "center",
  },
  input: {
    height: 40,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: colors.ink,
    paddingHorizontal: 12,
    paddingRight: 42,
    fontSize: 14,
    color: colors.ink,
    backgroundColor: "#ffffff",
  },
  eyeBtn: {
    position: "absolute",
    right: 8,
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButton: {
    backgroundColor: colors.brand,
    borderRadius: 5,
    height: 35,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
  },
  saveText: {
    color: "#ffffff",
    fontSize: 16,
  },
  status: {
    color: "#4CAF50",
    fontSize: 12,
    textAlign: "center",
  },
  error: {
    color: colors.danger,
    fontSize: 12,
    textAlign: "center",
  },
  backRow: {
    marginTop: 30,
    alignItems: "center",
  },
  backText: {
    color: colors.muted,
    fontSize: 12,
  },
  backArrow: {
    color: colors.muted,
  },
  backLink: {
    color: colors.brand,
  },
});

export default ChangePasswordScreen;
