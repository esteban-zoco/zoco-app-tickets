import React, { useEffect, useState } from "react";
import { FlatList, Modal, Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Screen from "../../components/Screen";
import MobileHeader from "../../components/MobileHeader";
import Input from "../../components/Input";
import Button from "../../components/Button";
import AppText from "../../components/AppText";
import Loading from "../../components/Loading";
import AuthRequiredScreen from "../auth/AuthRequiredScreen";
import { colors, spacing } from "../../theme";
import {
  organizerAssignSellerWithTypesApi,
  organizerCreateSellerApi,
  organizerDeleteSellerApi,
  organizerListEventsApi,
  organizerListSellersApi,
} from "../../services/api";
import { useAuth } from "../../store/AuthContext";

const OrganizerSellersScreen = ({ navigation }) => {
  const { state } = useAuth();
  const [sellers, setSellers] = useState([]);
  const [events, setEvents] = useState([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedEventId, setSelectedEventId] = useState("");
  const [canValidateAll, setCanValidateAll] = useState(true);
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [sellersRes, eventsRes] = await Promise.all([
        organizerListSellersApi(),
        organizerListEventsApi(),
      ]);
      setSellers(sellersRes?.data?.info || []);
      setEvents(eventsRes?.data?.info || []);
      setExpandedId(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (state.isAuthenticated) fetchData();
  }, [state.isAuthenticated]);

  const onCreate = async () => {
    setStatus("");
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    if (!trimmedName || !trimmedEmail || !password) {
      setStatus("Completa nombre, email y contrasena.");
      return;
    }
    try {
      setIsLoading(true);
      const res = await organizerCreateSellerApi({ name: trimmedName, email: trimmedEmail, password });
      const created = res?.data?.info || res?.data;
      const createdId = created?._id || created?.id;
      if (selectedEventId && createdId) {
        if (canValidateAll) {
          await organizerAssignSellerWithTypesApi({
            eventId: selectedEventId,
            sellerId: createdId,
            allowAll: true,
          });
          setStatus("Vendedor creado y asignado.");
        } else {
          setStatus("Vendedor creado. Asignacion pendiente.");
        }
      } else {
        setStatus("Vendedor creado.");
      }
      setName("");
      setEmail("");
      setPassword("");
      setSelectedEventId("");
      setCanValidateAll(true);
      await fetchData();
    } catch (err) {
      console.error(err);
      setStatus("No se pudo crear.");
    } finally {
      setIsLoading(false);
    }
  };

  const onDelete = async (id) => {
    try {
      await organizerDeleteSellerApi(id);
      fetchData();
    } catch {
      setStatus("No se pudo eliminar.");
    }
  };

  if (!state.isAuthenticated) return <AuthRequiredScreen />;
  if (isLoading) return <Loading />;

  const selectedEvent = selectedEventId
    ? events.find((event) => String(event?._id || event?.id) === String(selectedEventId))
    : null;
  const eventLabel = selectedEvent?.name || "Asignar un evento";
  const resolveSellerId = (seller) =>
    String(seller?._id || seller?.id || seller?.email || seller?.name || "");
  const resolveEventName = (seller) => {
    const direct =
      seller?.event?.name ||
      seller?.eventName ||
      seller?.eventid?.name ||
      seller?.evento ||
      "";
    if (direct) return direct;
    const eventId = seller?.eventId || seller?.eventid || seller?.assignedEventId;
    if (!eventId) return "Sin evento";
    const match = events.find((event) => String(event?._id || event?.id) === String(eventId));
    return match?.name || "Sin evento";
  };
  const resolveStatus = (seller) => {
    const raw = seller?.status ?? seller?.state ?? seller?.isActive ?? seller?.active;
    if (typeof raw === "boolean") return raw ? "ACTIVO" : "INACTIVO";
    if (typeof raw === "number") return raw ? "ACTIVO" : "INACTIVO";
    if (typeof raw === "string") {
      const normalized = raw.trim().toLowerCase();
      if (["active", "activo", "online", "conectado"].includes(normalized)) return "ACTIVO";
      if (normalized) return normalized.toUpperCase();
    }
    return "ACTIVO";
  };
  const resolveStatusVariant = (label) => (label === "ACTIVO" ? "success" : "muted");
  const toggleExpanded = (sellerId) => {
    setExpandedId((prev) => (prev === sellerId ? null : sellerId));
  };

  return (
    <Screen style={styles.screen} contentStyle={styles.container} header={<MobileHeader />}>
      <View style={styles.tabsRow}>
        <Pressable style={styles.tabButton} onPress={() => navigation.navigate("OrganizerScanners")}>
          <AppText style={styles.tabText}>Escaneres</AppText>
        </Pressable>
        <Pressable style={[styles.tabButton, styles.tabActive]}>
          <AppText style={[styles.tabText, styles.tabTextActive]}>Vendedores</AppText>
        </Pressable>
      </View>

      <View style={styles.card}>
        <AppText weight="bold" style={styles.title}>
          Crear nuevo vendedor
        </AppText>
        <Input placeholder="Nombre" value={name} onChangeText={setName} />
        <Input
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <Input placeholder="Contrasena" secureTextEntry value={password} onChangeText={setPassword} />
        <Pressable style={styles.eventSelect} onPress={() => setEventModalOpen(true)}>
          <AppText style={styles.eventSelectText}>{eventLabel}</AppText>
          <Ionicons name="chevron-down" size={14} color={colors.muted} />
        </Pressable>
        <Pressable style={styles.toggleRow} onPress={() => setCanValidateAll((prev) => !prev)}>
          <View style={[styles.toggleTrack, canValidateAll && styles.toggleTrackActive]}>
            <View style={[styles.toggleThumb, canValidateAll && styles.toggleThumbActive]} />
          </View>
          <AppText style={styles.toggleText}>Permitir validar todas las entradas</AppText>
        </Pressable>
        {status ? <AppText style={styles.status}>{status}</AppText> : null}
        <Button title="Crear" variant="dark" onPress={onCreate} />
      </View>

      <View style={styles.listCard}>
        <View style={styles.listHeader}>
          <AppText weight="bold" style={styles.listTitle}>
            Mis vendedores
          </AppText>
          <View style={styles.countChip}>
            <AppText style={styles.countText}>{sellers.length} vendedores</AppText>
          </View>
        </View>
        {sellers.length === 0 ? (
          <AppText style={styles.emptyText}>Sin vendedores.</AppText>
        ) : (
          sellers.map((seller, index) => {
            const sellerId = resolveSellerId(seller) || String(index);
            const isExpanded = expandedId === sellerId;
            const statusLabel = resolveStatus(seller);
            const statusVariant = resolveStatusVariant(statusLabel);
            return (
              <View key={sellerId} style={styles.scannerCard}>
                <Pressable style={styles.scannerRow} onPress={() => toggleExpanded(sellerId)}>
                  <View style={styles.scannerInfo}>
                    <View style={styles.scannerIcon}>
                      <Ionicons
                        name={isExpanded ? "chevron-up" : "chevron-down"}
                        size={14}
                        color={colors.ink}
                      />
                    </View>
                    <View>
                      <AppText weight="semiBold">{seller.email || "Vendedor"}</AppText>
                      <AppText style={styles.metaText}>{seller.name || "-"}</AppText>
                    </View>
                  </View>
                  <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={14} color={colors.muted} />
                </Pressable>
                {isExpanded ? (
                  <View style={styles.scannerDetails}>
                    {[
                      { label: "NOMBRE", value: seller.name || "-" },
                      { label: "CONTRASENA", value: seller.password || "-" },
                      { label: "EVENTO", value: resolveEventName(seller) },
                      { label: "ESTADO", value: statusLabel, variant: statusVariant },
                    ].map((row) => (
                      <View key={row.label} style={styles.detailRow}>
                        <AppText style={styles.detailLabel}>{row.label}</AppText>
                        <AppText
                          style={[
                            styles.detailValue,
                            row.variant === "success" && styles.detailValueSuccess,
                          ]}
                        >
                          {row.value}
                        </AppText>
                      </View>
                    ))}
                    <View style={styles.detailDivider} />
                    <View style={styles.detailActions}>
                      <Pressable
                        style={styles.iconButton}
                        onPress={() => setStatus("Edicion pendiente.")}
                      >
                        <Ionicons name="create-outline" size={16} color={colors.ink} />
                      </Pressable>
                      <Pressable style={styles.iconButton} onPress={() => onDelete(seller._id)}>
                        <Ionicons name="trash-outline" size={16} color={colors.danger} />
                      </Pressable>
                    </View>
                  </View>
                ) : null}
              </View>
            );
          })
        )}
      </View>

      <Modal visible={eventModalOpen} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <AppText weight="bold" style={styles.modalTitle}>
              Asignar evento
            </AppText>
            <FlatList
              data={events}
              keyExtractor={(item) => String(item._id || item.id)}
              renderItem={({ item }) => {
                const itemId = String(item._id || item.id);
                const isActive = String(selectedEventId) === itemId;
                return (
                  <Pressable
                    style={[styles.modalItem, isActive && styles.modalItemActive]}
                    onPress={() => {
                      setSelectedEventId(itemId);
                      setEventModalOpen(false);
                    }}
                  >
                    <AppText weight={isActive ? "semiBold" : "regular"}>
                      {item.name || "Evento"}
                    </AppText>
                    {isActive ? <Ionicons name="checkmark" size={14} color={colors.brand} /> : null}
                  </Pressable>
                );
              }}
            />
            <Button title="Cerrar" variant="ghost" onPress={() => setEventModalOpen(false)} />
          </View>
        </View>
      </Modal>
    </Screen>
  );
};

const styles = StyleSheet.create({
  screen: {
    backgroundColor: "#fff",
    flex: 0,
  },
  container: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  tabsRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.ink,
  },
  tabText: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    color: colors.muted,
  },
  tabTextActive: {
    color: colors.ink,
    fontWeight: "700",
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
  eventSelect: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#ffffff",
  },
  eventSelectText: {
    color: colors.ink,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  toggleTrack: {
    width: 42,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#d0d5dd",
    padding: 2,
    justifyContent: "center",
  },
  toggleTrackActive: {
    backgroundColor: colors.brand,
  },
  toggleThumb: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#ffffff",
    transform: [{ translateX: 0 }],
  },
  toggleThumbActive: {
    transform: [{ translateX: 20 }],
  },
  toggleText: {
    color: colors.ink,
    fontSize: 12,
  },
  status: {
    color: colors.brand,
  },
  listCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  listHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  listTitle: {
    fontSize: 16,
  },
  countChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#f0f3f7",
  },
  countText: {
    fontSize: 11,
    color: colors.muted,
  },
  scannerCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#ffffff",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  scannerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
  },
  scannerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  scannerIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#eef1f6",
    alignItems: "center",
    justifyContent: "center",
  },
  metaText: {
    color: colors.muted,
    fontSize: 12,
  },
  scannerDetails: {
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 11,
    color: colors.muted,
    letterSpacing: 1.2,
  },
  detailValue: {
    fontSize: 13,
    color: colors.ink,
  },
  detailValueSuccess: {
    color: colors.success,
  },
  detailDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginTop: spacing.sm,
  },
  detailActions: {
    flexDirection: "row",
    gap: spacing.md,
    paddingTop: spacing.sm,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
  },
  delete: {
    color: colors.danger,
  },
  emptyText: {
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
  modalTitle: {
    fontSize: 16,
  },
  modalItem: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalItemActive: {
    backgroundColor: "#f5f7fb",
    paddingHorizontal: spacing.sm,
    borderRadius: 12,
  },
});

export default OrganizerSellersScreen;
