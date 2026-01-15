import React, { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import Screen from "../../components/Screen";
import AppText from "../../components/AppText";
import Button from "../../components/Button";
import Loading from "../../components/Loading";
import EmptyState from "../../components/EmptyState";
import AuthRequiredScreen from "../auth/AuthRequiredScreen";
import { colors, fontFamilies, spacing } from "../../theme";
import { getCartApi, removeCartApi, updateCartApi } from "../../services/api";
import { formatCurrency } from "../../utils/format";
import { useAuth } from "../../store/AuthContext";

const CartScreen = ({ navigation }) => {
  const { state } = useAuth();
  const [cart, setCart] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCart = async () => {
    try {
      setIsLoading(true);
      const res = await getCartApi();
      setCart(res?.data?.info || []);
    } catch (err) {
      console.error(err);
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

  const updateQuantity = (index, value) => {
    const qty = Math.max(1, Number(value || 1));
    setCart((prev) => prev.map((item, i) => (i === index ? { ...item, quantity: qty } : item)));
  };

  const onUpdateCart = async () => {
    try {
      setIsLoading(true);
      await updateCartApi(cart);
      await fetchCart();
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const onRemove = async (id) => {
    try {
      setIsLoading(true);
      await removeCartApi({ id });
      await fetchCart();
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!state.isAuthenticated) return <AuthRequiredScreen />;
  if (isLoading) return <Loading />;

  if (!cart.length) {
    return (
      <Screen>
        <View style={styles.emptyWrap}>
          <EmptyState title="Carrito vacío" subtitle="Agregá tickets para continuar" />
          <Button title="Ir al inicio" onPress={() => navigation.navigate("HomeTab")} style={styles.emptyButton} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.card}>
          {cart.map((item, index) => {
            const price = Number(item.unitprice || item?.eventid?.price || 0);
            const subtotal = price * Number(item.quantity || 1);
            const name = item?.eventid?.name || "Evento";
            const typeName = item?.ticketTypeName || item?.tickettype?.name || item?.type?.name || item?.typename;
            return (
              <View key={item._id || index} style={styles.item}>
                <View style={styles.itemHeader}>
                  <AppText weight="semiBold" style={styles.itemName}>
                    {name}
                  </AppText>
                  <Pressable onPress={() => onRemove(item._id)}>
                    <AppText style={styles.remove}>Quitar</AppText>
                  </Pressable>
                </View>
                {typeName ? <AppText style={styles.type}>{typeName}</AppText> : null}
                <View style={styles.row}>
                  <AppText style={styles.price}>{formatCurrency(price)}</AppText>
                  <TextInput
                    value={String(item.quantity || 1)}
                    onChangeText={(value) => updateQuantity(index, value)}
                    keyboardType="number-pad"
                    style={styles.qtyInput}
                  />
                  <AppText weight="semiBold" style={styles.subtotal}>
                    {formatCurrency(subtotal)}
                  </AppText>
                </View>
              </View>
            );
          })}
          <Button title="Actualizar carrito" variant="ghost" onPress={onUpdateCart} />
        </View>

        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <AppText style={styles.summaryLabel}>Total</AppText>
            <AppText weight="bold">{formatCurrency(total)}</AppText>
          </View>
          <Button title="Continuar al checkout" onPress={() => navigation.navigate("Checkout")} />
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
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.lg,
  },
  item: {
    gap: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.md,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  itemName: {
    fontSize: 14,
  },
  type: {
    color: colors.muted,
    fontSize: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  price: {
    color: colors.muted,
  },
  qtyInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    minWidth: 48,
    textAlign: "center",
    fontFamily: fontFamilies.regular,
  },
  subtotal: {
    fontSize: 14,
  },
  remove: {
    color: colors.danger,
    fontSize: 12,
  },
  summary: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  summaryLabel: {
    color: colors.muted,
  },
  emptyWrap: {
    padding: spacing.xl,
    gap: spacing.lg,
  },
  emptyButton: {
    alignSelf: "center",
  },
});

export default CartScreen;
