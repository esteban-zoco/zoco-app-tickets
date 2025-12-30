import React, { useEffect, useState } from "react";
import { Image, Pressable, StyleSheet, View } from "react-native";
import Screen from "../../components/Screen";
import Input from "../../components/Input";
import Button from "../../components/Button";
import AppText from "../../components/AppText";
import Loading from "../../components/Loading";
import AuthRequiredScreen from "../auth/AuthRequiredScreen";
import { colors, spacing } from "../../theme";
import { organizerDeleteSponsorApi, organizerListSponsorsApi } from "../../services/api";
import { useAuth } from "../../store/AuthContext";

const OrganizerSponsorsScreen = () => {
  const { state } = useAuth();
  const [sponsors, setSponsors] = useState([]);
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const fetchSponsors = async () => {
    try {
      setIsLoading(true);
      const res = await organizerListSponsorsApi();
      setSponsors(res?.data?.info || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (state.isAuthenticated) fetchSponsors();
  }, [state.isAuthenticated]);

  const onDelete = async (id) => {
    try {
      await organizerDeleteSponsorApi({ id });
      fetchSponsors();
    } catch {
      setStatus("No se pudo eliminar.");
    }
  };

  if (!state.isAuthenticated) return <AuthRequiredScreen />;
  if (isLoading) return <Loading />;

  return (
    <Screen>
      <View style={styles.container}>
        {status ? <AppText style={styles.status}>{status}</AppText> : null}
        {sponsors.map((sponsor) => (
          <View key={sponsor._id} style={styles.card}>
            <Image source={{ uri: sponsor.image }} style={styles.logo} resizeMode="contain" />
            <View style={styles.info}>
              <AppText weight="semiBold">{sponsor.name || "Sponsor"}</AppText>
              <Pressable onPress={() => onDelete(sponsor._id)}>
                <AppText style={styles.delete}>Eliminar</AppText>
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
    gap: spacing.md,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "center",
  },
  logo: {
    width: 60,
    height: 60,
  },
  info: {
    flex: 1,
    gap: spacing.xs,
  },
  delete: {
    color: colors.danger,
  },
  status: {
    color: colors.brand,
  },
});

export default OrganizerSponsorsScreen;
