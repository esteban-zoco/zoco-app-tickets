import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import Screen from "../../components/Screen";
import AppText from "../../components/AppText";
import Loading from "../../components/Loading";
import AuthRequiredScreen from "../auth/AuthRequiredScreen";
import { colors, spacing } from "../../theme";
import { organizerReportsDaywiseIncomeApi } from "../../services/api";
import { formatCurrency } from "../../utils/format";
import { useAuth } from "../../store/AuthContext";

const OrganizerReportsScreen = () => {
  const { state } = useAuth();
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!state.isAuthenticated) return;
    (async () => {
      try {
        setIsLoading(true);
        const res = await organizerReportsDaywiseIncomeApi();
        setReports(res?.data?.info || []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [state.isAuthenticated]);

  if (!state.isAuthenticated) return <AuthRequiredScreen />;
  if (isLoading) return <Loading />;

  return (
    <Screen>
      <View style={styles.container}>
        {reports.map((report, index) => (
          <View key={report?.date || index} style={styles.card}>
            <AppText weight="semiBold">{report?.date || "Fecha"}</AppText>
            <AppText style={styles.meta}>Tickets: {report?.tickets || 0}</AppText>
            <AppText weight="bold">{formatCurrency(report?.amount || 0)}</AppText>
          </View>
        ))}
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  meta: {
    color: colors.muted,
  },
});

export default OrganizerReportsScreen;
