import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import Screen from "../../components/Screen";
import MobileHeader from "../../components/MobileHeader";
import Input from "../../components/Input";
import Button from "../../components/Button";
import AppText from "../../components/AppText";
import AuthRequiredScreen from "../auth/AuthRequiredScreen";
import { colors, spacing } from "../../theme";
import { organizerAddEventApi, organizerUpdateEventApi } from "../../services/api";
import { useAuth } from "../../store/AuthContext";

const OrganizerEventFormScreen = ({ navigation, route }) => {
  const { state } = useAuth();
  const editingEvent = route?.params?.event;
  const [name, setName] = useState(editingEvent?.name || "");
  const [startDate, setStartDate] = useState(editingEvent?.startDate?.slice(0, 10) || "");
  const [fulladdress, setFulladdress] = useState(editingEvent?.fulladdress || "");
  const [price, setPrice] = useState(String(editingEvent?.price || ""));
  const [description, setDescription] = useState(editingEvent?.description || "");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  if (!state.isAuthenticated) return <AuthRequiredScreen />;

  const onSubmit = async () => {
    setStatus("");
    setLoading(true);
    try {
      const formData = new FormData();
      if (editingEvent?._id) formData.append("id", editingEvent._id);
      formData.append("name", name);
      formData.append("startDate", startDate);
      formData.append("fulladdress", fulladdress);
      if (price) formData.append("price", price);
      if (description) formData.append("description", description);

      if (editingEvent?._id) {
        await organizerUpdateEventApi(formData);
      } else {
        await organizerAddEventApi(formData);
      }
      setStatus("Evento guardado.");
      navigation.goBack();
    } catch (err) {
      console.error(err);
      setStatus("No se pudo guardar el evento.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen contentStyle={styles.container} header={<MobileHeader />}>
      <View style={styles.card}>
        <AppText weight="bold" style={styles.title}>
          {editingEvent ? "Editar evento" : "Nuevo evento"}
        </AppText>
        <Input placeholder="Nombre" value={name} onChangeText={setName} />
        <Input placeholder="Fecha (YYYY-MM-DD)" value={startDate} onChangeText={setStartDate} />
        <Input placeholder="Dirección" value={fulladdress} onChangeText={setFulladdress} />
        <Input placeholder="Precio" value={price} onChangeText={setPrice} keyboardType="numeric" />
        <Input placeholder="Descripción" value={description} onChangeText={setDescription} multiline style={styles.textArea} />
        {status ? <AppText style={styles.status}>{status}</AppText> : null}
        <Button title={loading ? "Guardando..." : "Guardar"} onPress={onSubmit} disabled={loading} />
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
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
    fontSize: 18,
  },
  textArea: {
    minHeight: 120,
  },
  status: {
    color: colors.brand,
  },
});

export default OrganizerEventFormScreen;
