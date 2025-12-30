import React, { useEffect, useState } from "react";
import { FlatList, Modal, Pressable, StyleSheet, View } from "react-native";
import Screen from "../../components/Screen";
import AppText from "../../components/AppText";
import Loading from "../../components/Loading";
import AuthRequiredScreen from "../auth/AuthRequiredScreen";
import Button from "../../components/Button";
import { colors, spacing } from "../../theme";
import { organizerListEventsApi, organizerScannerAttendeeListApi } from "../../services/api";
import { useAuth } from "../../store/AuthContext";

const OrganizerAttendanceScreen = () => {
  const { state } = useAuth();
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [attendees, setAttendees] = useState([]);
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

  const loadAttendees = async (event) => {
    try {
      setIsLoading(true);
      const res = await organizerScannerAttendeeListApi(event._id);
      setAttendees(res?.data?.info || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!state.isAuthenticated) return <AuthRequiredScreen />;
  if (isLoading) return <Loading />;

  return (
    <Screen>
      <View style={styles.container}>
        <Pressable style={styles.eventSelector} onPress={() => setModalOpen(true)}>
          <AppText weight="semiBold">{selectedEvent?.name || "Seleccionar evento"}</AppText>
        </Pressable>
        {selectedEvent ? (
          <FlatList
            data={attendees}
            keyExtractor={(item, index) => item._id || `${index}`}
            renderItem={({ item }) => (
              <View style={styles.rowCard}>
                <AppText weight="semiBold">{item?.name || item?.email || "Asistente"}</AppText>
                <AppText style={styles.meta}>{item?.ticketTypeName || ""}</AppText>
              </View>
            )}
          />
        ) : (
          <AppText style={styles.meta}>Elegí un evento para ver asistentes.</AppText>
        )}
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
                    loadAttendees(item);
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
  rowCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  meta: {
    color: colors.muted,
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

export default OrganizerAttendanceScreen;
