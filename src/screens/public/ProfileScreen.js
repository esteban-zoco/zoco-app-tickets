import React, { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Screen from "../../components/Screen";
import AppText from "../../components/AppText";
import AuthRequiredScreen from "../auth/AuthRequiredScreen";
import { colors, fontFamilies, spacing } from "../../theme";
import { changePasswordApi, deleteAccountApi, updateUserProfileApi } from "../../services/api";
import { useAuth } from "../../store/AuthContext";

const ProfileScreen = () => {
  const { state, updateUser, signOut } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", dni: "" });
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    setForm({
      name: state.user?.name || "",
      email: state.user?.email || "",
      dni: state.user?.dni || "",
    });
  }, [state.user?.name, state.user?.email, state.user?.dni]);

  if (!state.isAuthenticated) return <AuthRequiredScreen />;

  const onSave = async () => {
    setStatus("");
    setError("");
    const dniClean = String(form.dni || "").replace(/\D+/g, "").slice(0, 8);
    if (dniClean && !/^\d{8}$/.test(dniClean)) {
      setError("El DNI debe tener 8 digitos (solo numeros).");
      return;
    }
    const wantsPasswordChange = Boolean(currentPassword || newPassword || confirmPassword);
    if (wantsPasswordChange) {
      if (!currentPassword || !newPassword || !confirmPassword) {
        setError("Completa todos los campos de contraseña.");
        return;
      }
      if (newPassword.length < 8) {
        setError("La contraseña nueva debe tener al menos 8 caracteres.");
        return;
      }
      const pwHasUpper = /[A-Z]/.test(newPassword);
      const pwHasLower = /[a-z]/.test(newPassword);
      const pwHasNumber = /\d/.test(newPassword);
      const pwHasSpecial = /[^A-Za-z0-9]/.test(newPassword);
      if (!(pwHasUpper && pwHasLower && pwHasNumber && pwHasSpecial)) {
        setError("La contraseña debe contener mayúscula, minúscula, número y carácter especial.");
        return;
      }
      if (newPassword !== confirmPassword) {
        setError("Las contraseñas no coinciden.");
        return;
      }
    }
    try {
      setSaving(true);
      let profileOk = false;
      let passwordOk = false;
      const errors = [];
      const payload = { ...form, dni: dniClean };
      try {
        const res = await updateUserProfileApi(null, payload);
        if (res?.status === 200) {
          const updated = res?.data?.info?.user || payload;
          await updateUser(updated);
          profileOk = true;
        } else {
          errors.push("No se pudo actualizar el perfil.");
        }
      } catch (err) {
        errors.push("No se pudo actualizar el perfil.");
      }

      if (wantsPasswordChange) {
        try {
          await changePasswordApi(null, {
            currentPassword,
            newPassword,
            oldPassword: currentPassword,
            password: newPassword,
          });
          passwordOk = true;
          setCurrentPassword("");
          setNewPassword("");
          setConfirmPassword("");
        } catch (err) {
          errors.push(err?.response?.data?.message || "No se pudo actualizar la contraseña.");
        }
      }

      if (errors.length) {
        setError(errors.join(" "));
      }
      if (!(wantsPasswordChange && !passwordOk)) {
        if (profileOk && passwordOk) {
          setStatus("Listo! Actualizamos tus datos y contraseña.");
        } else if (profileOk) {
          setStatus("Listo! Actualizamos tus datos personales.");
        } else if (passwordOk) {
          setStatus("Contraseña actualizada.");
        }
      }
    } catch (err) {
      setError("No se pudo actualizar.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setStatus("");
    setError("");
    try {
      setDeleting(true);
      const res = await deleteAccountApi(null);
      if (res?.status === 200) {
        await signOut();
        return;
      }
      setError(res?.data?.message || "No se pudo eliminar la cuenta.");
    } catch (err) {
      setError(err?.response?.data?.message || "No se pudo eliminar la cuenta.");
    } finally {
      setDeleting(false);
    }
  };

  const onDeleteAccount = () => {
    if (deleting) return;
    Alert.alert("Eliminar cuenta", "Esta accion es permanente. Se eliminaran tus datos y acceso.", [
      { text: "Cancelar", style: "cancel" },
      { text: "Eliminar", style: "destructive", onPress: handleDeleteAccount },
    ]);
  };

  return (
    <Screen scroll={false} style={{ backgroundColor: "#ffffff" }}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.titleWrap}>
            <AppText weight="bold" style={styles.title}>
              Datos personales
            </AppText>
          </View>

          <View style={styles.field}>
            <AppText style={styles.label}>Usuario</AppText>
            <TextInput
              style={styles.input}
              placeholder="Nombre y apellido"
              value={form.name}
              onChangeText={(value) => setForm((prev) => ({ ...prev, name: value }))}
            />
          </View>

          <View style={styles.field}>
            <AppText style={styles.label}>Email</AppText>
            <TextInput
              style={styles.input}
              placeholder="tu@email.com"
              value={form.email}
              keyboardType="email-address"
              autoCapitalize="none"
              onChangeText={(value) => setForm((prev) => ({ ...prev, email: value }))}
            />
          </View>

          <View style={styles.field}>
            <AppText style={styles.label}>DNI</AppText>
            <TextInput
              style={styles.input}
              placeholder="Tu DNI"
              value={form.dni}
              keyboardType="number-pad"
              onChangeText={(value) =>
                setForm((prev) => ({ ...prev, dni: String(value).replace(/\D+/g, "").slice(0, 8) }))
              }
            />
          </View>

          <Pressable style={styles.toggleRow} onPress={() => setPasswordOpen((prev) => !prev)}>
            <Ionicons
              name={passwordOpen ? "chevron-down" : "chevron-forward"}
              size={16}
              color={colors.muted}
            />
            <AppText style={styles.toggleText}>Cambiar contraseña</AppText>
          </Pressable>

          {passwordOpen ? (
            <>
              <View style={styles.field}>
                <AppText style={styles.label}>Contraseña actual</AppText>
                <TextInput
                  style={styles.input}
                  secureTextEntry
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                />
              </View>
              <View style={styles.field}>
                <AppText style={styles.label}>Contraseña nueva</AppText>
                <TextInput style={styles.input} secureTextEntry value={newPassword} onChangeText={setNewPassword} />
              </View>
              <View style={styles.field}>
                <AppText style={styles.label}>Repetir contraseña</AppText>
                <TextInput
                  style={styles.input}
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
              </View>
            </>
          ) : null}

          {error ? <AppText style={styles.error}>{error}</AppText> : null}
          {status ? <AppText style={styles.status}>{status}</AppText> : null}

          <Pressable style={styles.saveButton} onPress={onSave} disabled={saving}>
            <AppText weight="bold" style={styles.saveText}>
              {saving ? "Guardando..." : "Guardar cambios"}
            </AppText>
          </Pressable>

          <Pressable style={styles.linkButton} onPress={signOut}>
            <AppText style={[styles.linkText, styles.logoutText]}>Cerrar sesion</AppText>
          </Pressable>

          <Pressable
            style={[styles.deleteButton, deleting && styles.deleteButtonDisabled]}
            onPress={onDeleteAccount}
            disabled={deleting}
          >
            <AppText style={styles.deleteText}>{deleting ? "Eliminando..." : "Eliminar cuenta"}</AppText>
          </Pressable>
        </View>
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 32,
    paddingHorizontal: 16,
    paddingBottom: 60,
    alignItems: "center",
  },
  card: {
    width: "100%",
    maxWidth: 300,
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
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  toggleText: {
    color: "#2D3035",
    fontSize: 14,
    fontFamily: fontFamilies.semiBold,
  },
  input: {
    height: 40,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: colors.ink,
    paddingHorizontal: 12,
    fontSize: 14,
    color: colors.ink,
    backgroundColor: "#ffffff",
    fontFamily: fontFamilies.regular,
  },
  saveButton: {
    backgroundColor: "#2D3035",
    borderRadius: 5,
    height: 35,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
  },
  saveText: {
    color: "#ffffff",
    fontSize: 14,
  },
  linkButton: {
    alignItems: "center",
    marginTop: 6,
  },
  linkText: {
    color: colors.danger,
    fontSize: 12,
  },
  logoutText: {
    color: colors.danger,
  },
  deleteButton: {
    marginTop: 12,
    height: 35,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: colors.danger,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteButtonDisabled: {
    opacity: 0.6,
  },
  deleteText: {
    color: colors.danger,
    fontSize: 12,
    fontFamily: fontFamilies.semiBold,
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
});

export default ProfileScreen;

