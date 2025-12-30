import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import Screen from "../../components/Screen";
import AppText from "../../components/AppText";
import Loading from "../../components/Loading";
import AuthRequiredScreen from "../auth/AuthRequiredScreen";
import Button from "../../components/Button";
import { colors, spacing } from "../../theme";
import { organizerListEventsApi, organizerOrdersIncomeApi, organizerReportsTotalsApi } from "../../services/api";
import { formatCurrency, formatDate } from "../../utils/format";
import { useAuth } from "../../store/AuthContext";

const OrganizerDashboardScreen = ({ navigation }) => {
  const { state, signOut } = useAuth();
  const [totals, setTotals] = useState(null);
  const [income, setIncome] = useState(null);
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!state.isAuthenticated) return;
    (async () => {
      try {
        setIsLoading(true);
        const [totalsRes, incomeRes, eventsRes] = await Promise.all([
          organizerReportsTotalsApi(),
          organizerOrdersIncomeApi(),
          organizerListEventsApi(),
        ]);
        setTotals(totalsRes?.data?.info || {});
        setIncome(incomeRes?.data?.info || {});
        setEvents(eventsRes?.data?.info || []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [state.isAuthenticated]);

  if (!state.isAuthenticated) return <AuthRequiredScreen />;
  if (isLoading) return <Loading />;

  const nextEvent = events?.[0];

  return (
    <Screen>
      <View style={styles.container}>
        <AppText weight="bold" style={styles.title}>
          Bienvenido, {state.user?.name || "Organizador"}
        </AppText>
        <Button title="Cerrar sesion" variant="ghost" onPress={signOut} />

        <View style={styles.statsGrid}>
          {[
            { label: "Ingresos", value: formatCurrency(income?.total || 0) },
            { label: "Ordenes", value: totals?.orders || 0 },
            { label: "Tickets", value: totals?.tickets || 0 },
            { label: "Eventos", value: totals?.events || 0 },
          ].map((stat) => (
            <View key={stat.label} style={styles.statCard}>
              <AppText style={styles.statLabel}>{stat.label}</AppText>
              <AppText weight="bold" style={styles.statValue}>
                {stat.value}
              </AppText>
            </View>
          ))}
        </View>

        <View style={styles.nextCard}>
          <AppText weight="bold" style={styles.sectionTitle}>
            Próximo evento
          </AppText>
          {nextEvent ? (
            <>
              <AppText weight="semiBold">{nextEvent.name}</AppText>
              <AppText style={styles.meta}>{formatDate(nextEvent.startDate)}</AppText>
              <AppText style={styles.meta}>{nextEvent.fulladdress}</AppText>
              <Button title="Ver eventos" variant="dark" onPress={() => navigation.navigate("OrganizerEvents")} />
            </>
          ) : (
            <AppText style={styles.meta}>No hay eventos cargados.</AppText>
          )}
        </View>
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  title: {
    fontSize: 20,
    color: colors.ink,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  statCard: {
    width: "48%",
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statLabel: {
    color: colors.muted,
    fontSize: 12,
  },
  statValue: {
    fontSize: 16,
  },
  nextCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: 16,
  },
  meta: {
    color: colors.muted,
  },
});

export default OrganizerDashboardScreen;
