import React, { useEffect, useState } from "react";
import { FlatList, Modal, Pressable, StyleSheet, View } from "react-native";
import Screen from "../../components/Screen";
import Input from "../../components/Input";
import Button from "../../components/Button";
import AppText from "../../components/AppText";
import Loading from "../../components/Loading";
import AuthRequiredScreen from "../auth/AuthRequiredScreen";
import { colors, spacing } from "../../theme";
import {
  organizerCreateTicketTypeApi,
  organizerListEventsApi,
  organizerTicketTypesByEventApi,
  organizerUpdateTicketTypeApi,
} from "../../services/api";
import { useAuth } from "../../store/AuthContext";

const OrganizerTicketsScreen = () => {
  const { state } = useAuth();
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [types, setTypes] = useState([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (!state.isAuthenticated) return;
    (async () => {
      try {
        setIsLoading(true);
        const res = await organizerListEventsApi();
        setEvents(res?.data?.info || []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [state.isAuthenticated]);

  useEffect(() => {
    if (!selectedEvent?._id) return;
    (async () => {
      try {
        const res = await organizerTicketTypesByEventApi({ eventId: selectedEvent._id });
        setTypes(res?.data?.info || []);
      } catch (err) {
        console.error(err);
      }
    })();
  }, [selectedEvent]);

  const onCreate = async () => {
    if (!selectedEvent?._id) return;
    setStatus("");
    try {
      await organizerCreateTicketTypeApi({
        eventId: selectedEvent._id,
        name,
        price,
        quantity,
      });
      setName("");
      setPrice("");
      setQuantity("");
      setStatus("Tipo creado.");
      const res = await organizerTicketTypesByEventApi({ eventId: selectedEvent._id });
      setTypes(res?.data?.info || []);
    } catch {
      setStatus("No se pudo crear.");
    }
  };

  const onToggle = async (type) => {
    try {
      await organizerUpdateTicketTypeApi({ ...type, status: !type.status });
      const res = await organizerTicketTypesByEventApi({ eventId: selectedEvent._id });
      setTypes(res?.data?.info || []);
    } catch {}
  };

  if (!state.isAuthenticated) return <AuthRequiredScreen />;
  if (isLoading) return <Loading />;

  return (
    <Screen>
      <View style={styles.container}>
        <Pressable style={styles.eventSelector} onPress={() => setModalOpen(true)}>
          <AppText weight="semiBold">{selectedEvent?.name || "Seleccionar evento"}</AppText>
        </Pressable>

        <View style={styles.card}>
          <AppText weight="bold" style={styles.title}>
            Nuevo tipo de ticket
          </AppText>
          <Input placeholder="Nombre" value={name} onChangeText={setName} />
          <Input placeholder="Precio" value={price} onChangeText={setPrice} keyboardType="numeric" />
          <Input placeholder="Cantidad" value={quantity} onChangeText={setQuantity} keyboardType="numeric" />
          {status ? <AppText style={styles.status}>{status}</AppText> : null}
          <Button title="Guardar" onPress={onCreate} />
        </View>

        {types.map((type) => (
          <View key={type.id || type._id} style={styles.rowCard}>
            <View>
              <AppText weight="semiBold">{type.name}</AppText>
              <AppText style={styles.meta}>Precio: {type.price}</AppText>
            </View>
            <Pressable onPress={() => onToggle(type)}>
              <AppText style={styles.toggle}>{type.status ? "Desactivar" : "Activar"}</AppText>
            </Pressable>
          </View>
        ))}
      </View>

      <Modal visible={modalOpen} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <AppText weight="bold">Elegir evento</AppText>
            <FlatList
              data={events}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.modalItem}
                  onPress={() => {
                    setSelectedEvent(item);
                    setModalOpen(false);
                  }}
                >
                  <AppText>{item.name}</AppText>
                </Pressable>
              )}
            />
            <Button title="Cerrar" variant="ghost" onPress={() => setModalOpen(false)} />
          </View>
        </View>
      </Modal>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  eventSelector: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: spacing.md,
    backgroundColor: "#ffffff",
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
    alignItems: "center",
  },
  meta: {
    color: colors.muted,
  },
  toggle: {
    color: colors.brand,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#ffffff",
    padding: spacing.xl,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "70%",
    gap: spacing.md,
  },
  modalItem: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
});

export default OrganizerTicketsScreen;
