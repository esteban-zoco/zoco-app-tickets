import React, { useEffect, useMemo, useState } from "react";
import { Linking, StyleSheet, View } from "react-native";
import Screen from "../../components/Screen";
import AppText from "../../components/AppText";
import Button from "../../components/Button";
import Loading from "../../components/Loading";
import AuthRequiredScreen from "../auth/AuthRequiredScreen";
import { colors, spacing } from "../../theme";
import { createOrderApi, getCartApi } from "../../services/api";
import { formatCurrency } from "../../utils/format";
import { useAuth } from "../../store/AuthContext";

const CheckoutScreen = ({ navigation }) => {
  const { state } = useAuth();
  const [cart, setCart] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchCart = async () => {
    try {
      setIsLoading(true);
      const res = await getCartApi();
      setCart(res?.data?.info || []);
    } catch (err) {
      setError("No se pudo cargar el carrito.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (state.isAuthenticated) fetchCart();
  }, [state.isAuthenticated]);

  const total = useMemo(() => {
    return cart.reduce((sum, item) => sum + Number(item.unitprice || item?.eventid?.price || 0) * Number(item.quantity || 1), 0);
  }, [cart]);

  const onCheckout = async () => {
    if (!cart.length) return;
    setIsLoading(true);
    setError("");
    try {
      const items = cart.map((item) => ({
        cartItemId: item?._id,
        eventid: item?.eventid?._id,
        ticketTypeId: item?.ticketTypeId || item?.tickettypeid || item?.typeid || undefined,
        quantity: item?.quantity || 1,
        unitprice: Number(item.unitprice || item?.eventid?.price || 0),
      }));

      const payload = {
        eventid: cart?.[0]?.eventid?._id,
        quantity: items.reduce((sum, it) => sum + (it.quantity || 1), 0),
        items,
        name: state.user?.name || "",
        email: state.user?.email || "",
        phone: state.user?.phone || "",
      };

      const res = await createOrderApi(payload);
      if (res?.data?.isSuccess) {
        navigation.navigate("MyEvents");
        return;
      }

      const redirectUrl = res?.data?.info?.redirectUrl || res?.data?.redirectUrl;
      if (redirectUrl) {
        await Linking.openURL(redirectUrl);
        return;
      }

      setError(res?.data?.message || "No se pudo completar el pago.");
    } catch (err) {
      setError(err?.response?.data?.message || "Error en el checkout.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!state.isAuthenticated) return <AuthRequiredScreen />;
  if (isLoading) return <Loading />;

  return (
    <Screen>
      <View style={styles.container}>
        <AppText weight="bold" style={styles.title}>
          Resumen de compra
        </AppText>
        <View style={styles.card}>
          {cart.map((item) => (
            <View key={item._id} style={styles.row}>
              <AppText>{item?.eventid?.name || "Evento"}</AppText>
              <AppText weight="semiBold">
                {formatCurrency(Number(item.unitprice || item?.eventid?.price || 0) * Number(item.quantity || 1))}
              </AppText>
            </View>
          ))}
          <View style={styles.totalRow}>
            <AppText style={styles.totalLabel}>Total</AppText>
            <AppText weight="bold">{formatCurrency(total)}</AppText>
          </View>
        </View>
        {error ? <AppText style={styles.error}>{error}</AppText> : null}
        <Button title={isLoading ? "Procesando..." : "Confirmar compra"} onPress={onCheckout} disabled={isLoading} />
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
    fontSize: 18,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  totalLabel: {
    color: colors.muted,
  },
  error: {
    color: colors.danger,
  },
});

export default CheckoutScreen;
