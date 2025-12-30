import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import Screen from "../../components/Screen";
import AppText from "../../components/AppText";
import Loading from "../../components/Loading";
import EmptyState from "../../components/EmptyState";
import AuthRequiredScreen from "../auth/AuthRequiredScreen";
import { colors, spacing } from "../../theme";
import { getOrderApi } from "../../services/api";
import { formatCurrency, formatDate } from "../../utils/format";
import { useAuth } from "../../store/AuthContext";

const OrdersScreen = () => {
  const { state } = useAuth();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!state.isAuthenticated) return;
    (async () => {
      try {
        setIsLoading(true);
        const res = await getOrderApi();
        setOrders(res?.data?.info || []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [state.isAuthenticated]);

  if (!state.isAuthenticated) return <AuthRequiredScreen />;
  if (isLoading) return <Loading />;

  if (!orders.length) {
    return (
      <Screen>
        <EmptyState title="Sin pedidos" subtitle="Todavía no hiciste compras" />
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.container}>
        {orders.map((order) => (
          <View key={order._id} style={styles.card}>
            <AppText weight="bold">{order?.eventid?.name || "Evento"}</AppText>
            <AppText style={styles.meta}>{formatDate(order?.createdAt)}</AppText>
            <AppText style={styles.meta}>Cantidad: {order?.quantity || 1}</AppText>
            <AppText weight="semiBold">{formatCurrency(order?.amount || order?.total || 0)}</AppText>
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

export default OrdersScreen;
