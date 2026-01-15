import React, { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import Screen from "../../components/Screen";
import AppText from "../../components/AppText";
import AuthRequiredScreen from "../auth/AuthRequiredScreen";
import { colors, fontFamilies, spacing } from "../../theme";
import { updateUserProfileApi } from "../../services/api";
import { useAuth } from "../../store/AuthContext";

const ProfileScreen = ({ navigation }) => {
  const { state, updateUser, signOut } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", dni: "" });
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({
      name: state.user?.name || "",
      email: state.user?.email || "",
      dni: state.user?.dni || "",
    });
  }, [state.user?.name, state.user?.email, state.user?.dni]);

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
    const dniClean = String(form.dni || "").replace(/\D+/g, "").slice(0, 8);
    if (dniClean && !/^\d{8}$/.test(dniClean)) {
      setError("El DNI debe tener 8 digitos (solo numeros).");
      return;
    }
    try {
      setSaving(true);
      const payload = { ...form, dni: dniClean };
      const res = await updateUserProfileApi(null, payload);
      if (res?.status === 200) {
        const updated = res?.data?.info?.user || payload;
        await updateUser(updated);
        setStatus("Listo! Actualizamos tus datos personales.");
      }
    } catch (err) {
      setError("No se pudo actualizar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen scroll={false} style={{ backgroundColor: "#ffffff" }}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <AppText weight="bold" style={styles.title1}>
            Mi perfil
          </AppText>
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

          {error ? <AppText style={styles.error}>{error}</AppText> : null}
          {status ? <AppText style={styles.status}>{status}</AppText> : null}

          <Pressable style={styles.saveButton} onPress={onSave} disabled={saving}>
            <AppText weight="bold" style={styles.saveText}>
              {saving ? "Guardando..." : "Guardar cambios"}
            </AppText>
          </Pressable>

          <Pressable style={styles.linkButton} onPress={() => navigation.navigate("ChangePassword")}>
            <AppText style={styles.linkText}>Cambiar contrasena</AppText>
          </Pressable>
          <Pressable style={styles.linkButton} onPress={signOut}>
            <AppText style={[styles.linkText, styles.logoutText]}>Cerrar sesion</AppText>
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
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 80,
    alignItems: "center",
  },
  title1: {
    fontSize: 24,
    color: colors.ink,
    paddingBottom: 64,
    alignSelf: "flex-start",
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
  linkButton: {
    alignItems: "center",
  },
  linkText: {
    color: colors.ink,
    fontSize: 13,
  },
  logoutText: {
    color: colors.danger,
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

export default ProfileScreen;
