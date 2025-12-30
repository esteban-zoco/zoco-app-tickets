import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Screen from "../../components/Screen";
import Input from "../../components/Input";
import Button from "../../components/Button";
import AppText from "../../components/AppText";
import Loading from "../../components/Loading";
import AuthRequiredScreen from "../auth/AuthRequiredScreen";
import { colors, spacing } from "../../theme";
import { organizerCreateCouponApi, organizerListCouponsApi, organizerUpdateCouponApi } from "../../services/api";
import { useAuth } from "../../store/AuthContext";

const OrganizerCouponsScreen = () => {
  const { state } = useAuth();
  const [coupons, setCoupons] = useState([]);
  const [code, setCode] = useState("");
  const [discount, setDiscount] = useState("");
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const fetchCoupons = async () => {
    try {
      setIsLoading(true);
      const res = await organizerListCouponsApi();
      setCoupons(res?.data?.info || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (state.isAuthenticated) fetchCoupons();
  }, [state.isAuthenticated]);

  const onCreate = async () => {
    setStatus("");
    try {
      await organizerCreateCouponApi({ code, discount });
      setCode("");
      setDiscount("");
      setStatus("Cupón creado.");
      fetchCoupons();
    } catch (err) {
      setStatus("No se pudo crear el cupón.");
    }
  };

  const onToggle = async (coupon) => {
    try {
      await organizerUpdateCouponApi({ ...coupon, isActive: !coupon?.isActive });
      fetchCoupons();
    } catch {}
  };

  if (!state.isAuthenticated) return <AuthRequiredScreen />;
  if (isLoading) return <Loading />;

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.card}>
          <AppText weight="bold" style={styles.title}>
            Crear cupón
          </AppText>
          <Input placeholder="Código" value={code} onChangeText={setCode} />
          <Input placeholder="Descuento" value={discount} onChangeText={setDiscount} keyboardType="numeric" />
          {status ? <AppText style={styles.status}>{status}</AppText> : null}
          <Button title="Guardar" onPress={onCreate} />
        </View>

        {coupons.map((coupon) => (
          <View key={coupon._id} style={styles.rowCard}>
            <View>
              <AppText weight="semiBold">{coupon.code}</AppText>
              <AppText style={styles.meta}>Descuento: {coupon.discount}</AppText>
            </View>
            <Pressable onPress={() => onToggle(coupon)}>
              <AppText style={styles.toggle}>{coupon.isActive ? "Desactivar" : "Activar"}</AppText>
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
    alignItems: "center",
  },
  meta: {
    color: colors.muted,
  },
  toggle: {
    color: colors.brand,
  },
});

export default OrganizerCouponsScreen;
