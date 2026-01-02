import React, { useEffect, useMemo, useState } from "react";
import { FlatList, Modal, Pressable, StyleSheet, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Screen from "../../components/Screen";
import MobileHeader from "../../components/MobileHeader";
import AppText from "../../components/AppText";
import Loading from "../../components/Loading";
import AuthRequiredScreen from "../auth/AuthRequiredScreen";
import Button from "../../components/Button";
import { colors, spacing } from "../../theme";
import { organizerListEventsApi, organizerScannerAttendeeListApi, organizerScannerEventDetailsApi } from "../../services/api";
import { useAuth } from "../../store/AuthContext";

const STATUS_OPTIONS = ["Todos los estados", "Ingreso completo", "Ingreso parcial", "Sin ingresos"];

const OrganizerAttendanceScreen = () => {
  const { state } = useAuth();
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [eventStats, setEventStats] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos los estados");

  useEffect(() => {
    if (!state.isAuthenticated) return;
    (async () => {
      try {
        setIsLoading(true);
        const res = await organizerListEventsApi();
        setEvents(res?.data?.info || []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [state.isAuthenticated]);

  useEffect(() => {
    if (!events.length) return;
    if (selectedEventId) return;
    const firstWithId = events.find((item) => item?._id || item?.id);
    if (firstWithId) setSelectedEventId(String(firstWithId._id || firstWithId.id));
  }, [events, selectedEventId]);

  const loadAttendance = async (eventId) => {
    if (!eventId) return;
    try {
      setIsRefreshing(true);
      const [detailRes, listRes] = await Promise.all([
        organizerScannerEventDetailsApi(eventId),
        organizerScannerAttendeeListApi(eventId),
      ]);
      setEventStats(detailRes?.data?.info || detailRes?.data || null);
      setAttendees(listRes?.data?.info || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (!selectedEventId) {
      setEventStats(null);
      setAttendees([]);
      return;
    }
    setSearch("");
    loadAttendance(selectedEventId);
  }, [selectedEventId]);

  const selectedEvent = selectedEventId
    ? events.find((event) => String(event?._id || event?.id) === String(selectedEventId)) || null
    : null;
  const eventLabel = selectedEvent?.name || "Seleccionar evento";

  const totalSold = Number(eventStats?.bookedTicket || 0) || 0;
  const totalPresent = Number(eventStats?.attendee || 0) || 0;
  const totalPending = totalSold > totalPresent ? totalSold - totalPresent : 0;
  const attendancePercent = totalSold > 0 ? Math.round((totalPresent / totalSold) * 100) : 0;
  const clampedPercent = Math.min(Math.max(attendancePercent, 0), 100);

  const parseNumber = (value) => {
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
  };

  const getStatusBadge = (item) => {
    const total = parseNumber(item?.totalTickets);
    const redeemed = parseNumber(item?.redeemedCount);
    if (total !== null && redeemed !== null && total > 0) {
      if (redeemed >= total) return { variant: "success", label: "Ingreso completo" };
      if (redeemed > 0) return { variant: "warning", label: "Ingreso parcial" };
      return { variant: "secondary", label: "Sin ingresos" };
    }
    if (item?.is_present) return { variant: "success", label: "Ingreso completo" };
    return { variant: "secondary", label: "Sin ingresos" };
  };

  const filteredAttendees = useMemo(() => {
    const query = search.trim().toLowerCase();
    return attendees.filter((item) => {
      if (query) {
        const values = [
          item?.name,
          item?.email,
          item?.buyerName,
          item?.buyerEmail,
          item?.dni,
          item?.buyerDni,
          item?.orderid,
          item?.phone,
          item?.buyerPhone,
        ];
        const matchesQuery = values.some((value) => {
          if (value === undefined || value === null) return false;
          return String(value).toLowerCase().includes(query);
        });
        if (!matchesQuery) return false;
      }

      if (statusFilter === "Todos los estados") return true;
      const badge = getStatusBadge(item);
      if (!badge) return true;
      return badge.label === statusFilter;
    });
  }, [attendees, search, statusFilter]);

  const emptyMessage = search
    ? "No hay coincidencias para la busqueda."
    : "Aun no hay asistentes registrados para este evento.";

  if (!state.isAuthenticated) return <AuthRequiredScreen />;
  if (isLoading) return <Loading />;

  if (!events.length) {
    return (
      <Screen style={styles.screen} contentStyle={styles.emptyContainer} header={<MobileHeader />}>
        <AppText style={styles.emptyText}>
          Todavia no tienes eventos cargados. Crea uno para comenzar a seguir la asistencia.
        </AppText>
      </Screen>
    );
  }

  return (
    <Screen scroll={false} style={styles.screen} contentStyle={styles.flexContent} header={<MobileHeader />}>
      <FlatList
        data={selectedEventId ? filteredAttendees : []}
        keyExtractor={(item, index) => String(item?._id || item?.id || item?.orderid || index)}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.headerBlock}>
            <AppText style={styles.sectionLabel}>Selecciona un evento</AppText>
            <View style={styles.eventRow}>
              <Pressable style={styles.eventSelector} onPress={() => setModalType("event")}>
                <AppText weight="semiBold" numberOfLines={1} style={styles.selectorText}>
                  {eventLabel}
                </AppText>
                <Ionicons name="chevron-down" size={14} color={colors.muted} />
              </Pressable>
              <Pressable
                style={[styles.refreshButton, isRefreshing && styles.refreshButtonDisabled]}
                disabled={!selectedEventId || isRefreshing}
                onPress={() => loadAttendance(selectedEventId)}
              >
                <Ionicons name="refresh" size={18} color={colors.ink} />
              </Pressable>
            </View>

            {selectedEventId ? (
              <View style={styles.statsStack}>
                {[
                  { label: "PENDIENTES", value: totalPending, icon: "time-outline" },
                  { label: "PRESENTES", value: totalPresent, icon: "checkmark-circle-outline" },
                  { label: "VENDIDAS", value: totalSold, icon: "ticket-outline" },
                ].map((stat) => (
                  <View key={stat.label} style={styles.statCard}>
                    <View style={styles.statIcon}>
                      <Ionicons name={stat.icon} size={18} color={colors.ink} />
                    </View>
                    <View>
                      <AppText style={styles.statLabel}>{stat.label}</AppText>
                      <AppText weight="bold" style={styles.statValue}>
                        {stat.value}
                      </AppText>
                    </View>
                  </View>
                ))}
              </View>
            ) : null}

            {selectedEventId ? (
              <View style={styles.attendanceCard}>
                <View style={styles.attendanceHeader}>
                  <AppText style={styles.attendanceLabel}>ASISTENCIA ACTUAL</AppText>
                  <View style={styles.attendancePill}>
                    <Ionicons name="person-outline" size={12} color={colors.ink} />
                    <AppText style={styles.attendancePillText}>
                      {totalPresent} / {totalSold}
                    </AppText>
                  </View>
                </View>
                <View style={styles.progressRow}>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${clampedPercent}%` }]} />
                  </View>
                  <View style={styles.progressDot} />
                </View>
                <AppText style={styles.progressText}>{clampedPercent}%</AppText>
              </View>
            ) : null}

            <View style={styles.searchRow}>
              <Ionicons name="search-outline" size={16} color={colors.muted} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Buscar asistente por nombre, email, DNI"
                placeholderTextColor={colors.muted}
                style={styles.searchInput}
              />
            </View>

            <Pressable style={styles.filterPill} onPress={() => setModalType("status")}
            >
              <Ionicons name="funnel-outline" size={14} color={colors.ink} />
              <AppText style={styles.filterText} numberOfLines={1}>
                Filtrar por: {statusFilter}
              </AppText>
              <Ionicons name="chevron-down" size={14} color={colors.muted} />
            </Pressable>
          </View>
        }
        renderItem={({ item }) => {
          const badge = getStatusBadge(item);
          const name = item?.name || item?.buyerName || "Asistente";
          const email = item?.email || item?.buyerEmail || "";
          const ticketType = item?.ticketTypeName || "";
          return (
            <View style={styles.attendeeCard}>
              <View style={styles.attendeeHeader}>
                <View style={styles.attendeeInfo}>
                  <AppText weight="semiBold">{name}</AppText>
                  {email ? <AppText style={styles.metaText}>{email}</AppText> : null}
                  {ticketType ? <AppText style={styles.metaText}>{ticketType}</AppText> : null}
                </View>
                {badge ? (
                  <View style={[styles.statusBadge, styles[`status${badge.variant}`]]}>
                    <AppText style={styles.statusText}>{badge.label}</AppText>
                  </View>
                ) : null}
              </View>
            </View>
          );
        }}
        ListEmptyComponent={<AppText style={styles.emptyText}>{emptyMessage}</AppText>}
      />

      <Modal visible={modalType === "event"} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <AppText weight="bold" style={styles.modalTitle}>
              Elegir evento
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
                      setModalType(null);
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
            <Button title="Cerrar" variant="ghost" onPress={() => setModalType(null)} />
          </View>
        </View>
      </Modal>

      <Modal visible={modalType === "status"} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <AppText weight="bold" style={styles.modalTitle}>
              Filtrar estados
            </AppText>
            {STATUS_OPTIONS.map((option) => {
              const isActive = option === statusFilter;
              return (
                <Pressable
                  key={option}
                  style={[styles.modalItem, isActive && styles.modalItemActive]}
                  onPress={() => {
                    setStatusFilter(option);
                    setModalType(null);
                  }}
                >
                  <AppText weight={isActive ? "semiBold" : "regular"}>{option}</AppText>
                  {isActive ? <Ionicons name="checkmark" size={14} color={colors.brand} /> : null}
                </Pressable>
              );
            })}
            <Button title="Cerrar" variant="ghost" onPress={() => setModalType(null)} />
          </View>
        </View>
      </Modal>
    </Screen>
  );
};

const styles = StyleSheet.create({
  screen: {
    backgroundColor: "#fff",
  },
  flexContent: {
    flex: 0,
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  headerBlock: {
    gap: spacing.md,
  },
  sectionLabel: {
    fontSize: 12,
    color: colors.muted,
    letterSpacing: 1.2,
  },
  eventRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  eventSelector: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: "#ffffff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectorText: {
    fontSize: 13,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  refreshButtonDisabled: {
    opacity: 0.6,
  },
  statsStack: {
    gap: spacing.md,
  },
  statCard: {
    backgroundColor: "#2f343a",
    borderRadius: 18,
    padding: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  statLabel: {
    fontSize: 12,
    color: "#cfd6de",
    letterSpacing: 1.2,
  },
  statValue: {
    fontSize: 20,
    color: "#ffffff",
  },
  attendanceCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  attendanceHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  attendanceLabel: {
    fontSize: 12,
    color: colors.muted,
    letterSpacing: 1.4,
  },
  attendancePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: "#f0f3f7",
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 999,
  },
  attendancePillText: {
    fontSize: 12,
    color: colors.ink,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 4,
    backgroundColor: "#e6e9ee",
    overflow: "hidden",
  },
  progressFill: {
    height: 6,
    borderRadius: 4,
    backgroundColor: colors.brand,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.brand,
  },
  progressText: {
    fontSize: 12,
    color: colors.muted,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: "#ffffff",
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: colors.ink,
  },
  filterPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: "#ffffff",
  },
  filterText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    color: colors.ink,
  },
  attendeeCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  attendeeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  attendeeInfo: {
    flex: 1,
    gap: 2,
  },
  metaText: {
    color: colors.muted,
    fontSize: 12,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 11,
    color: "#ffffff",
  },
  statussuccess: {
    backgroundColor: colors.success,
  },
  statuswarning: {
    backgroundColor: colors.warning,
  },
  statussecondary: {
    backgroundColor: "#9aa4ad",
  },
  emptyContainer: {
    padding: spacing.lg,
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

export default OrganizerAttendanceScreen;
