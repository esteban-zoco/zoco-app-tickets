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
  organizerAssignScannerWithTypesApi,
  organizerAssignSellerWithTypesApi,
  organizerCreateScannerApi,
  organizerCreateSellerApi,
  organizerDeleteScannerApi,
  organizerDeleteSellerApi,
  organizerListEventsApi,
  organizerListScannersApi,
  organizerListSellersApi,
} from "../../services/api";
import { useAuth } from "../../store/AuthContext";

const ROLE_CONFIG = {
  scanners: {
    tabLabel: "Escaneres",
    createTitle: "Crear nuevo escaner",
    listTitle: "Mis escaneres",
    emptyText: "Sin escaneres.",
    countLabel: "escaneres",
    statusNoun: "Scanner",
    fallbackLabel: "Scanner",
    assignKey: "scannerId",
    listApi: organizerListScannersApi,
    createApi: organizerCreateScannerApi,
    deleteApi: organizerDeleteScannerApi,
    assignApi: organizerAssignScannerWithTypesApi,
  },
  sellers: {
    tabLabel: "Vendedores",
    createTitle: "Crear nuevo vendedor",
    listTitle: "Mis vendedores",
    emptyText: "Sin vendedores.",
    countLabel: "vendedores",
    statusNoun: "Vendedor",
    fallbackLabel: "Vendedor",
    assignKey: "sellerId",
    listApi: organizerListSellersApi,
    createApi: organizerCreateSellerApi,
    deleteApi: organizerDeleteSellerApi,
    assignApi: organizerAssignSellerWithTypesApi,
  },
};

const createEmptyForm = () => ({
  name: "",
  email: "",
  password: "",
  selectedEventId: "",
  canValidateAll: true,
  status: "",
});

const resolveInitialTab = (initialTab, route) => {
  if (initialTab === "scanners" || initialTab === "sellers") return initialTab;
  const routeTab = route?.params?.tab;
  if (routeTab === "scanners" || routeTab === "sellers") return routeTab;
  if (route?.name === "OrganizerSellers") return "sellers";
  return "scanners";
};

const OrganizerRolesScreen = ({ initialTab, route }) => {
  const { state } = useAuth();
  const [activeTab, setActiveTab] = useState(resolveInitialTab(initialTab, route));
  const [rolesData, setRolesData] = useState({ scanners: [], sellers: [] });
  const [events, setEvents] = useState([]);
  const [forms, setForms] = useState({
    scanners: createEmptyForm(),
    sellers: createEmptyForm(),
  });
  const [expandedIds, setExpandedIds] = useState({ scanners: null, sellers: null });
  const [statusLoading, setStatusLoading] = useState(true);
  const [eventModal, setEventModal] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editRoleKey, setEditRoleKey] = useState(null);
  const [editForm, setEditForm] = useState(createEmptyForm());
  const [editEventLabel, setEditEventLabel] = useState("");

  const updateForm = (roleKey, changes) => {
    setForms((prev) => ({
      ...prev,
      [roleKey]: {
        ...prev[roleKey],
        ...changes,
      },
    }));
  };

  const resetFormFields = (roleKey) => {
    setForms((prev) => ({
      ...prev,
      [roleKey]: {
        ...prev[roleKey],
        name: "",
        email: "",
        password: "",
        selectedEventId: "",
        canValidateAll: true,
      },
    }));
  };

  const fetchData = async () => {
    try {
      setStatusLoading(true);
      const scannersPromise = organizerListScannersApi().catch((err) => {
        console.error(err);
        return null;
      });
      const sellersPromise = organizerListSellersApi().catch((err) => {
        console.error(err);
        return null;
      });
      const eventsPromise = organizerListEventsApi().catch((err) => {
        console.error(err);
        return null;
      });
      const [scannersRes, sellersRes, eventsRes] = await Promise.all([
        scannersPromise,
        sellersPromise,
        eventsPromise,
      ]);
      setRolesData({
        scanners: scannersRes?.data?.info || [],
        sellers: sellersRes?.data?.info || [],
      });
      setEvents(eventsRes?.data?.info || []);
      setExpandedIds({ scanners: null, sellers: null });
    } catch (err) {
      console.error(err);
    } finally {
      setStatusLoading(false);
    }
  };

  useEffect(() => {
    if (state.isAuthenticated) fetchData();
  }, [state.isAuthenticated]);

  useEffect(() => {
    setActiveTab(resolveInitialTab(initialTab, route));
  }, [initialTab, route?.name, route?.params?.tab]);

  const onCreate = async (roleKey) => {
    const config = ROLE_CONFIG[roleKey];
    const form = forms[roleKey];
    updateForm(roleKey, { status: "" });
    const trimmedName = form.name.trim();
    const trimmedEmail = form.email.trim();
    if (!trimmedName || !trimmedEmail || !form.password) {
      updateForm(roleKey, { status: "Completa nombre, email y contrasena." });
      return;
    }
    try {
      setStatusLoading(true);
      const res = await config.createApi({
        name: trimmedName,
        email: trimmedEmail,
        password: form.password,
      });
      const created = res?.data?.info || res?.data;
      const createdId = created?._id || created?.id;
      if (form.selectedEventId && createdId) {
        if (form.canValidateAll) {
          await config.assignApi({
            eventId: form.selectedEventId,
            [config.assignKey]: createdId,
            allowAll: true,
          });
          updateForm(roleKey, { status: `${config.statusNoun} creado y asignado.` });
        } else {
          updateForm(roleKey, { status: `${config.statusNoun} creado. Asignacion pendiente.` });
        }
      } else {
        updateForm(roleKey, { status: `${config.statusNoun} creado.` });
      }
      resetFormFields(roleKey);
      await fetchData();
    } catch (err) {
      console.error(err);
      updateForm(roleKey, { status: "No se pudo crear." });
    } finally {
      setStatusLoading(false);
    }
  };

  const onDelete = async (roleKey, id) => {
    if (!id) return;
    const config = ROLE_CONFIG[roleKey];
    try {
      await config.deleteApi(id);
      await fetchData();
    } catch (err) {
      console.error(err);
      updateForm(roleKey, { status: "No se pudo eliminar." });
    }
  };

  const resolveRoleId = (item) => String(item?._id || item?.id || item?.email || item?.name || "");
  const resolveEventId = (item) =>
    String(
      item?.event?._id ||
        item?.event?.id ||
        item?.eventId ||
        item?.eventid ||
        item?.assignedEventId ||
        ""
    );
  const resolveEventName = (item) => {
    const direct =
      item?.event?.name || item?.eventName || item?.eventid?.name || item?.evento || "";
    if (direct) return direct;
    const eventId = item?.eventId || item?.eventid || item?.assignedEventId;
    if (!eventId) return "Sin evento";
    const match = events.find((event) => String(event?._id || event?.id) === String(eventId));
    return match?.name || "Sin evento";
  };
  const resolveAllowAll = (item) => {
    const raw =
      item?.allowAll ?? item?.allowall ?? item?.allow_all ?? item?.canValidateAll ?? item?.validateAll;
    if (typeof raw === "boolean") return raw;
    if (typeof raw === "number") return raw === 1;
    return true;
  };
  const resolveStatus = (item) => {
    const raw = item?.status ?? item?.state ?? item?.isActive ?? item?.active;
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
  const toggleExpanded = (roleKey, itemId) => {
    setExpandedIds((prev) => ({
      ...prev,
      [roleKey]: prev[roleKey] === itemId ? null : itemId,
    }));
  };
  const openEditModal = (roleKey, item) => {
    if (!item) return;
    const eventName = resolveEventName(item);
    setEditRoleKey(roleKey);
    setEditForm({
      ...createEmptyForm(),
      name: item?.name || "",
      email: item?.email || "",
      password: "",
      selectedEventId: resolveEventId(item),
      canValidateAll: resolveAllowAll(item),
    });
    setEditEventLabel(eventName !== "Sin evento" ? eventName : "");
    setEditModalOpen(true);
  };
  const closeEditModal = () => {
    setEditModalOpen(false);
    setEditRoleKey(null);
    setEditForm(createEmptyForm());
    setEditEventLabel("");
  };

  if (!state.isAuthenticated) return <AuthRequiredScreen />;
  if (statusLoading) return <Loading />;

  const renderRoleSection = (roleKey) => {
    const config = ROLE_CONFIG[roleKey];
    const form = forms[roleKey];
    const items = rolesData[roleKey] || [];
    const selectedEvent = form.selectedEventId
      ? events.find((event) => String(event?._id || event?.id) === String(form.selectedEventId))
      : null;
    const eventLabel = selectedEvent?.name || "Asignar un evento";

    return (
      <>
        <View style={styles.card}>
          <AppText weight="bold" style={styles.title}>
            {config.createTitle}
          </AppText>
          <Input
            placeholder="Nombre"
            value={form.name}
            onChangeText={(value) => updateForm(roleKey, { name: value })}
          />
          <Input
            placeholder="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            value={form.email}
            onChangeText={(value) => updateForm(roleKey, { email: value })}
          />
          <Input
            placeholder="Contrasena"
            secureTextEntry
            value={form.password}
            onChangeText={(value) => updateForm(roleKey, { password: value })}
          />
          <Pressable
            style={styles.eventSelect}
            onPress={() => setEventModal({ mode: "create", roleKey })}
          >
            <AppText style={styles.eventSelectText}>{eventLabel}</AppText>
            <Ionicons name="chevron-down" size={14} color={colors.muted} />
          </Pressable>
          <Pressable
            style={styles.toggleRow}
            onPress={() => updateForm(roleKey, { canValidateAll: !form.canValidateAll })}
          >
            <View style={[styles.toggleTrack, form.canValidateAll && styles.toggleTrackActive]}>
              <View style={[styles.toggleThumb, form.canValidateAll && styles.toggleThumbActive]} />
            </View>
            <AppText style={styles.toggleText}>Permitir validar todas las entradas</AppText>
          </Pressable>
          {form.status ? <AppText style={styles.status}>{form.status}</AppText> : null}
          <Button title="Crear" variant="dark" onPress={() => onCreate(roleKey)} />
        </View>

        <View style={styles.listCard}>
          <View style={styles.listHeader}>
            <AppText weight="bold" style={styles.listTitle}>
              {config.listTitle}
            </AppText>
            <View style={styles.countChip}>
              <AppText style={styles.countText}>
                {items.length} {config.countLabel}
              </AppText>
            </View>
          </View>
          {items.length === 0 ? (
            <AppText style={styles.emptyText}>{config.emptyText}</AppText>
          ) : (
            items.map((item, index) => {
              const itemId = resolveRoleId(item) || String(index);
              const isExpanded = expandedIds[roleKey] === itemId;
              const statusLabel = resolveStatus(item);
              const statusVariant = resolveStatusVariant(statusLabel);
              return (
                <View key={itemId} style={styles.scannerCard}>
                  <Pressable style={styles.scannerRow} onPress={() => toggleExpanded(roleKey, itemId)}>
                    <View style={styles.scannerInfo}>
                      <View style={styles.scannerIcon}>
                        <Ionicons
                          name={isExpanded ? "chevron-up" : "chevron-down"}
                          size={14}
                          color={colors.ink}
                        />
                      </View>
                      <View>
                        <AppText weight="semiBold">{item.email || config.fallbackLabel}</AppText>
                        <AppText style={styles.metaText}>{item.name || "-"}</AppText>
                      </View>
                    </View>
                    <Ionicons
                      name={isExpanded ? "chevron-up" : "chevron-down"}
                      size={14}
                      color={colors.muted}
                    />
                  </Pressable>
                  {isExpanded ? (
                    <View style={styles.scannerDetails}>
                      {[
                        { label: "NOMBRE", value: item.name || "-" },
                        { label: "CONTRASENA", value: item.password || "-" },
                        { label: "EVENTO", value: resolveEventName(item) },
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
                        <Pressable style={styles.iconButton} onPress={() => openEditModal(roleKey, item)}>
                          <Ionicons name="create-outline" size={16} color={colors.ink} />
                        </Pressable>
                        <Pressable
                          style={styles.iconButton}
                          onPress={() => onDelete(roleKey, item?._id || item?.id)}
                        >
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
      </>
    );
  };

  const modalRole = eventModal?.roleKey || activeTab;
  const modalSelectedEventId =
    eventModal?.mode === "edit"
      ? editForm.selectedEventId
      : modalRole
        ? forms[modalRole]?.selectedEventId
        : "";
  const editSelectedEvent = editForm.selectedEventId
    ? events.find((event) => String(event?._id || event?.id) === String(editForm.selectedEventId))
    : null;
  const editEventText = editSelectedEvent?.name || editEventLabel || "Asignar un evento";
  const editTitle = editRoleKey === "sellers" ? "Editar vendedor" : "Editar escaner";

  return (
    <Screen style={styles.screen} contentStyle={styles.container} header={<MobileHeader />}>
      <View style={styles.tabsRow}>
        {["scanners", "sellers"].map((roleKey) => {
          const config = ROLE_CONFIG[roleKey];
          const isActive = activeTab === roleKey;
          return (
            <Pressable
              key={roleKey}
              style={[styles.tabButton, isActive && styles.tabActive]}
              onPress={() => setActiveTab(roleKey)}
            >
              <AppText style={[styles.tabText, isActive && styles.tabTextActive]}>
                {config.tabLabel}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      {renderRoleSection(activeTab)}

      <Modal visible={editModalOpen} animationType="fade" transparent>
        <View style={styles.editBackdrop}>
          <View style={styles.editCard}>
            <View style={styles.editHeader}>
              <AppText weight="bold" style={styles.editTitle}>
                {editTitle}
              </AppText>
              <Pressable style={styles.editClose} onPress={closeEditModal}>
                <Ionicons name="close" size={18} color={colors.muted} />
              </Pressable>
            </View>
            <Input
              placeholder="Nombre"
              value={editForm.name}
              onChangeText={(value) => setEditForm((prev) => ({ ...prev, name: value }))}
            />
            <Input
              placeholder="Email"
              autoCapitalize="none"
              keyboardType="email-address"
              value={editForm.email}
              onChangeText={(value) => setEditForm((prev) => ({ ...prev, email: value }))}
            />
            <Input
              placeholder="Contrasena"
              secureTextEntry
              value={editForm.password}
              onChangeText={(value) => setEditForm((prev) => ({ ...prev, password: value }))}
            />
            <Pressable
              style={styles.eventSelect}
              onPress={() =>
                setEventModal({ mode: "edit", roleKey: editRoleKey || activeTab })
              }
            >
              <AppText style={styles.eventSelectText}>{editEventText}</AppText>
              <Ionicons name="chevron-down" size={14} color={colors.muted} />
            </Pressable>
            <Pressable
              style={styles.toggleRow}
              onPress={() =>
                setEditForm((prev) => ({ ...prev, canValidateAll: !prev.canValidateAll }))
              }
            >
              <View style={[styles.toggleTrack, editForm.canValidateAll && styles.toggleTrackActive]}>
                <View style={[styles.toggleThumb, editForm.canValidateAll && styles.toggleThumbActive]} />
              </View>
              <AppText style={styles.toggleText}>Permitir validar todas las entradas</AppText>
            </Pressable>
            <Button title="Guardar" variant="dark" onPress={closeEditModal} />
          </View>
        </View>
      </Modal>

      <Modal visible={Boolean(eventModal)} animationType="slide" transparent>
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
                const isActive = String(modalSelectedEventId) === itemId;
                return (
                  <Pressable
                    style={[styles.modalItem, isActive && styles.modalItemActive]}
                    onPress={() => {
                      if (eventModal?.mode === "edit") {
                        setEditForm((prev) => ({ ...prev, selectedEventId: itemId }));
                        setEditEventLabel(item?.name || "Evento");
                      } else if (modalRole) {
                        updateForm(modalRole, { selectedEventId: itemId });
                      }
                      setEventModal(null);
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
            <Button title="Cerrar" variant="ghost" onPress={() => setEventModal(null)} />
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
    paddingBottom: 180,
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
  editBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    padding: spacing.lg,
  },
  editCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
    alignSelf: "center",
    width: "100%",
    maxWidth: 380,
  },
  editHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  editTitle: {
    fontSize: 16,
  },
  editClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
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
    paddingBottom: 60,
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

export default OrganizerRolesScreen;
