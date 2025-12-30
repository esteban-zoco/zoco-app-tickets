import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Screen from "../../components/Screen";
import Input from "../../components/Input";
import Button from "../../components/Button";
import AppText from "../../components/AppText";
import Loading from "../../components/Loading";
import AuthRequiredScreen from "../auth/AuthRequiredScreen";
import { colors, spacing } from "../../theme";
import { organizerCreateScannerApi, organizerDeleteScannerApi, organizerListScannersApi } from "../../services/api";
import { useAuth } from "../../store/AuthContext";

const OrganizerScannersScreen = () => {
  const { state } = useAuth();
  const [scanners, setScanners] = useState([]);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const fetchScanners = async () => {
    try {
      setIsLoading(true);
      const res = await organizerListScannersApi();
      setScanners(res?.data?.info || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (state.isAuthenticated) fetchScanners();
  }, [state.isAuthenticated]);

  const onCreate = async () => {
    setStatus("");
    try {
      await organizerCreateScannerApi({ email });
      setEmail("");
      setStatus("Scanner creado.");
      fetchScanners();
    } catch (err) {
      setStatus("No se pudo crear.");
    }
  };

  const onDelete = async (id) => {
    try {
      await organizerDeleteScannerApi(id);
      fetchScanners();
    } catch {
      setStatus("No se pudo eliminar.");
    }
  };

  if (!state.isAuthenticated) return <AuthRequiredScreen />;
  if (isLoading) return <Loading />;

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.card}>
          <AppText weight="bold" style={styles.title}>
            Nuevo scanner
          </AppText>
          <Input placeholder="Email" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
          {status ? <AppText style={styles.status}>{status}</AppText> : null}
          <Button title="Agregar" onPress={onCreate} />
        </View>

        {scanners.map((scanner) => (
          <View key={scanner._id} style={styles.rowCard}>
            <AppText>{scanner.email}</AppText>
            <Pressable onPress={() => onDelete(scanner._id)}>
              <AppText style={styles.delete}>Eliminar</AppText>
            </Pressable>
          </View>
        ))}
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    gap: spacing.lg,
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
    fontSize: 16,
  },
  status: {
    color: colors.brand,
  },
  rowCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  delete: {
    color: colors.danger,
  },
});

export default OrganizerScannersScreen;
