import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Screen from "../../components/Screen";
import AppText from "../../components/AppText";
import Button from "../../components/Button";
import Loading from "../../components/Loading";
import AuthRequiredScreen from "../auth/AuthRequiredScreen";
import { colors, spacing } from "../../theme";
import { organizerDeleteEventApi, organizerListEventsApi } from "../../services/api";
import { formatDate } from "../../utils/format";
import { useAuth } from "../../store/AuthContext";

const OrganizerEventsScreen = ({ navigation }) => {
  const { state } = useAuth();
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      const res = await organizerListEventsApi();
      setEvents(res?.data?.info || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (state.isAuthenticated) fetchEvents();
  }, [state.isAuthenticated]);

  const onDelete = async (id) => {
    try {
      setIsLoading(true);
      await organizerDeleteEventApi({ id });
      await fetchEvents();
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
        <Button title="Crear evento" onPress={() => navigation.navigate("OrganizerEventForm")} />
        {events.map((event) => (
          <View key={event._id} style={styles.card}>
            <AppText weight="bold" style={styles.title}>
              {event.name}
            </AppText>
            <AppText style={styles.meta}>{formatDate(event.startDate)}</AppText>
            <View style={styles.actions}>
              <Pressable onPress={() => navigation.navigate("OrganizerEventForm", { event })}>
                <AppText style={styles.actionText}>Editar</AppText>
              </Pressable>
              <Pressable onPress={() => onDelete(event._id)}>
                <AppText style={[styles.actionText, styles.delete]}>Eliminar</AppText>
              </Pressable>
            </View>
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
    borderRadius: 18,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  title: {
    fontSize: 16,
  },
  meta: {
    color: colors.muted,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.lg,
  },
  actionText: {
    color: colors.brand,
  },
  delete: {
    color: colors.danger,
  },
});

export default OrganizerEventsScreen;
