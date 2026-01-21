import React, { useEffect, useMemo, useRef, useState } from "react";
import { FlatList, Modal, Pressable, StyleSheet, View, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Circle } from "react-native-svg";
import Screen from "../../components/Screen";
import MobileHeader from "../../components/MobileHeader";
import AppText from "../../components/AppText";
import Loading from "../../components/Loading";
import AuthRequiredScreen from "../auth/AuthRequiredScreen";
import Button from "../../components/Button";
import { colors, spacing } from "../../theme";
import {
  organizerListEventsApi,
  organizerListOrdersApi,
  organizerListScannersApi,
  organizerListSellersApi,
  organizerReportsTotalsApi,
  organizerScannerEventDetailsApi,
} from "../../services/api";
import { formatCurrency, formatDate } from "../../utils/format";
import { useAuth } from "../../store/AuthContext";

const OrganizerDashboardScreen = ({ navigation }) => {
  const { state } = useAuth();
  const [totals, setTotals] = useState(null);
  const [events, setEvents] = useState([]);
  const [orders, setOrders] = useState([]);
  const [eventDetails, setEventDetails] = useState({});
  const [scannersCount, setScannersCount] = useState(0);
  const [sellersCount, setSellersCount] = useState(0);
  const [activeScanners, setActiveScanners] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [eventFilterOpen, setEventFilterOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState("all");
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [highlightSlide, setHighlightSlide] = useState(0);
  const { width: screenWidth } = useWindowDimensions();
  const sliderRef = useRef(null);

  const safeNumber = (value, fallback = 0) => {
    const num = Number(value);
    return Number.isFinite(num) ? num : fallback;
  };

  const firstValidNumber = (...values) => {
    for (const value of values) {
      const num = Number(value);
      if (Number.isFinite(num)) return num;
    }
    return null;
  };

  const extractEventId = (event) =>
    String(event?.id ?? event?._id ?? event?.eventid ?? event?.eventId ?? "");

  const normalizeDetail = (detail) => {
    if (!detail) return { booked: 0, attendees: 0 };
    const booked =
      safeNumber(
        detail.bookedTicket ??
          detail.bookedticket ??
          detail.booked ??
          detail.totalTickets ??
          detail.totalBookings ??
          detail.totalBooked
      ) || 0;
    const attendees =
      safeNumber(
        detail.attendee ??
          detail.attendees ??
          detail.totalAttendee ??
          detail.totalAttendees ??
          detail.checkedIn ??
          detail.present
      ) || 0;
    return { booked, attendees };
  };

  const parseActiveFlag = (value) => {
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value !== 0;
    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();
      if (!normalized) return false;
      return [
        "true",
        "1",
        "active",
        "activo",
        "online",
        "connected",
        "conectado",
        "en linea",
        "en lnea",
      ].includes(normalized);
    }
    return false;
  };

  const computeScannerActivity = (scanners) => {
    if (!Array.isArray(scanners) || scanners.length === 0) {
      return { count: 0, hasInsight: false };
    }
    const statusKeywords = ["active", "online", "connected", "activo", "conectado", "en linea", "en lnea"];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const hasActivityHint = scanners.some(
      (scanner) =>
        scanner?.lastActive ||
        scanner?.lastLogin ||
        scanner?.lastSeen ||
        scanner?.lastActivity ||
        parseActiveFlag(scanner?.isActive ?? scanner?.active ?? scanner?.status ?? scanner?.state) ||
        scanner?.status
    );
    if (!hasActivityHint) return { count: 0, hasInsight: false };
    const isSameDay = (value) => {
      if (!value) return false;
      const parsed = parseDate(value);
      if (!parsed) return false;
      parsed.setHours(0, 0, 0, 0);
      return parsed.getTime() === today.getTime();
    };
    const count = scanners.filter((scanner) => {
      if (parseActiveFlag(scanner?.isActive ?? scanner?.active ?? scanner?.status ?? scanner?.state)) return true;
      if (scanner?.status) {
        const status = String(scanner.status).toLowerCase();
        if (statusKeywords.some((keyword) => status.includes(keyword))) return true;
      }
      return (
        isSameDay(scanner?.lastActive) ||
        isSameDay(scanner?.lastLogin) ||
        isSameDay(scanner?.lastSeen) ||
        isSameDay(scanner?.lastActivity)
      );
    }).length;
    return { count, hasInsight: true };
  };

  const resolveEventCapacity = (event) => {
    if (!event) return null;
    const direct = firstValidNumber(
      event.capacity,
      event.totalCapacity,
      event.ticketCapacity,
      event.totalTickets,
      event.total_tickets,
      event.maxbooking,
      event.maxBooking,
      event.max_booking,
      event.quantity,
      event.limitTickets,
      event.ticketLimit,
      event.maxAttendees,
      event.maxAttendee,
      event.maxTickets,
      event.inventory,
      event.ticket_qty
    );
    if (direct !== null) return direct;
    const ticketArrays = [event.tickets, event.ticket_types, event.ticketTypes, event.ticketOptions];
    for (const list of ticketArrays) {
      if (!Array.isArray(list) || list.length === 0) continue;
      const sum = list.reduce(
        (acc, ticket) =>
          acc +
          safeNumber(
            ticket.quantity ??
              ticket.capacity ??
              ticket.stock ??
              ticket.available ??
              ticket.totalTickets ??
              ticket.limit ??
              ticket.max,
            0
          ),
        0
      );
      if (sum > 0) return sum;
    }
    if (event.ticket) {
      const quantity = safeNumber(
        event.ticket.quantity ?? event.ticket.stock ?? event.ticket.available ?? event.ticket.totalTickets,
        null
      );
      if (quantity !== null) return quantity;
    }
    return null;
  };

  const loadEventDetails = async (eventList) => {
    const ids = eventList.map(extractEventId).filter(Boolean);
    if (!ids.length) return {};
    const responses = await Promise.allSettled(
      ids.map((eventId) =>
        organizerScannerEventDetailsApi(eventId).then((res) => ({
          eventId,
          detail: res?.data?.info ?? res?.data ?? {},
        }))
      )
    );
    return responses.reduce((acc, result, index) => {
      const eventId = ids[index];
      if (result.status === "fulfilled") {
        acc[eventId] = normalizeDetail(result.value?.detail);
      } else {
        acc[eventId] = { booked: 0, attendees: 0 };
      }
      return acc;
    }, {});
  };

  const normalizeList = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.events)) return payload.events;
    if (Array.isArray(payload?.orders)) return payload.orders;
    if (Array.isArray(payload?.data)) return payload.data;
    return [];
  };

  const loadDashboard = async ({ showLoader = false } = {}) => {
    try {
      if (showLoader) setIsLoading(true);
      const [totalsRes, eventsRes, ordersRes, scannersRes, sellersRes] = await Promise.allSettled([
        organizerReportsTotalsApi(),
        organizerListEventsApi(),
        organizerListOrdersApi(),
        organizerListScannersApi(),
        organizerListSellersApi(),
      ]);
      const totalsInfo =
        totalsRes.status === "fulfilled" ? totalsRes.value?.data?.info || {} : {};
      setTotals(totalsInfo);
      const eventsList =
        eventsRes.status === "fulfilled"
          ? normalizeList(eventsRes.value?.data?.info ?? eventsRes.value?.data)
          : [];
      const ordersList =
        ordersRes.status === "fulfilled"
          ? normalizeList(ordersRes.value?.data?.info ?? ordersRes.value?.data)
          : [];
      setEvents(eventsList);
      setOrders(ordersList);
      const scannersList =
        scannersRes.status === "fulfilled"
          ? normalizeList(scannersRes.value?.data?.info ?? scannersRes.value?.data)
          : [];
      const sellersList =
        sellersRes.status === "fulfilled"
          ? normalizeList(sellersRes.value?.data?.info ?? sellersRes.value?.data)
          : [];
      const scannerActivity = computeScannerActivity(scannersList);
      setScannersCount(scannersList.length);
      setSellersCount(sellersList.length);
      setActiveScanners(scannerActivity.count);
      const detailsMap = await loadEventDetails(eventsList);
      setEventDetails(detailsMap);
    } catch (err) {
      console.error(err);
    } finally {
      if (showLoader) setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!state.isAuthenticated) return;
    loadDashboard({ showLoader: true });
  }, [state.isAuthenticated]);

  const formatCount = (value) => {
    const num = Number(value || 0);
    return Number.isFinite(num) ? num.toLocaleString() : "0";
  };

  const getOrderNumber = (order) => {
    const raw =
      order?.orderid ||
      order?.orderId ||
      order?.orderNumber ||
      order?.order ||
      order?._id ||
      order?.id;
    if (!raw) return "-";
    const str = String(raw).replace(/^#/, "").trim();
    return str || "-";
  };

  const getOrderBuyerName = (order) =>
    order?.buyer?.name || order?.buyerName || order?.name || order?.buyer?.email || "-";

  const getOrderQuantity = (order) => {
    const raw =
      order?.quantity ||
      order?.totalbooking ||
      order?.totalBooking ||
      order?.ticketQuantity ||
      order?.totalTickets ||
      order?.tickets;
    if (Array.isArray(raw)) return raw.length;
    const num = firstValidNumber(raw, order?.tickets?.length);
    return Number.isFinite(num) ? num : 0;
  };

  const getOrderAmount = (order) =>
    firstValidNumber(
      order?.paidamount,
      order?.paidAmount,
      order?.amountPaid,
      order?.totalamount,
      order?.totalAmount,
      order?.amount,
      order?.total
    );

  const resolveEventId = (event) =>
    String(event?._id || event?.id || event?.eventid || event?.eventId || event?.code || "");

  const resolveOrderEventId = (order) =>
    String(
      order?.eventid?._id ||
        order?.eventid?.id ||
        order?.eventid ||
        order?.event?.id ||
        order?.event?._id ||
        order?.eventId ||
        ""
    );

  const scopedEvents = useMemo(() => {
    if (!selectedEventId || selectedEventId === "all") return events;
    return events.filter((event) => resolveEventId(event) === String(selectedEventId));
  }, [events, selectedEventId]);

  const scopedOrders = useMemo(() => {
    if (!selectedEventId || selectedEventId === "all") return orders;
    return orders.filter((order) => resolveOrderEventId(order) === String(selectedEventId));
  }, [orders, selectedEventId]);

  const scopedAttendance = useMemo(() => {
    return scopedEvents.reduce(
      (acc, event) => {
        const detail = eventDetails[extractEventId(event)] || { booked: 0, attendees: 0 };
        acc.booked += safeNumber(detail.booked, 0);
        acc.attendees += safeNumber(detail.attendees, 0);
        return acc;
      },
      { booked: 0, attendees: 0 }
    );
  }, [scopedEvents, eventDetails]);

  const ticketSummary = useMemo(() => {
    const soldTickets = scopedAttendance.booked;

    const availableFromTotals =
      selectedEventId === "all"
        ? firstValidNumber(
            totals?.availableTickets,
            totals?.ticketsAvailable,
            totals?.available,
            totals?.ticketsRemaining
          )
        : null;

    const availableFromEvents = Array.isArray(scopedEvents)
      ? scopedEvents.reduce(
          (sum, event) =>
            sum +
            (firstValidNumber(
              event?.availableTickets,
              event?.ticketsAvailable,
              event?.available,
              event?.remainingTickets,
              event?.remaining
            ) || 0),
          0
        )
      : 0;

    const capacityFromEvents = Array.isArray(scopedEvents)
      ? scopedEvents.reduce((sum, event) => sum + (resolveEventCapacity(event) || 0), 0)
      : 0;

    let availableTickets = availableFromTotals ?? null;
    if (availableTickets === null) {
      if (capacityFromEvents > 0) {
        availableTickets = Math.max(capacityFromEvents - soldTickets, 0);
      } else if (availableFromEvents > 0) {
        availableTickets = availableFromEvents;
      } else {
        availableTickets = 0;
      }
    }

    const totalTickets = Math.max(soldTickets + availableTickets, 0);
    const soldPercent = totalTickets > 0 ? Math.round((soldTickets / totalTickets) * 100) : 0;
    const availablePercent = totalTickets > 0 ? Math.max(0, 100 - soldPercent) : 0;

    return {
      soldTickets,
      availableTickets,
      totalTickets,
      soldPercent,
      availablePercent,
    };
  }, [scopedAttendance, scopedEvents, totals, selectedEventId]);

  const recentOrders = useMemo(() => {
    const list = Array.isArray(scopedOrders) ? scopedOrders : [];
    return [...list]
      .sort((a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0))
      .slice(0, 5);
  }, [scopedOrders]);

  const selectedEvent = useMemo(() => {
    if (!selectedEventId || selectedEventId === "all") return null;
    return (
      events.find((event) => String(event?._id || event?.id) === String(selectedEventId)) || null
    );
  }, [events, selectedEventId]);

  const parseDate = (value) => {
    if (!value) return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const resolveEventName = (event) =>
    event?.name || event?.eventName || event?.eventname || event?.title || event?.eventTitle || "Evento";

  const resolveEventStartValue = (event) => {
    if (!event) return null;
    return (
      event.startDate ||
      event.startDatee ||
      event.startdate ||
      event.start_date ||
      event.date ||
      event.eventDate ||
      event.event_date ||
      null
    );
  };

  const resolveEventLocation = (event) =>
    event?.fulladdress ||
    event?.address ||
    event?.location ||
    event?.venue ||
    event?.place ||
    event?.site ||
    event?.city ||
    event?.province ||
    "-";

  const resolveEventStartDate = (event) => {
    const startValue = resolveEventStartValue(event);
    const parsed = parseDate(startValue);
    if (parsed) return parsed;
    return null;
  };

  const highlightedEvent = useMemo(() => {
    if (selectedEventId && selectedEventId !== "all") {
      return selectedEvent || scopedEvents[0] || null;
    }
    const list = Array.isArray(scopedEvents) ? scopedEvents : [];
    if (!list.length) return null;
    const now = Date.now();
    const upcoming = list
      .map((event) => ({ event, start: resolveEventStartDate(event) }))
      .filter((entry) => entry.start && entry.start.getTime() >= now)
      .sort((a, b) => a.start.getTime() - b.start.getTime());
    if (upcoming.length) return upcoming[0].event;
    const sorted = list
      .map((event) => ({ event, start: resolveEventStartDate(event) }))
      .sort((a, b) => (a.start?.getTime() ?? 0) - (b.start?.getTime() ?? 0));
    return sorted[0]?.event ?? list[0] ?? null;
  }, [selectedEventId, selectedEvent, scopedEvents]);

  const totalEventsRaw = firstValidNumber(totals?.events, totals?.totalEvent, totals?.totalEvents);
  const totalEvents = selectedEventId === "all" ? totalEventsRaw ?? scopedEvents.length : scopedEvents.length;
  const totalOrders = scopedAttendance.attendees;
  const totalTickets = ticketSummary.soldTickets;
  const filterLabel = selectedEvent ? resolveEventName(selectedEvent) : "Todos los eventos";
  const highlightLabel = highlightSlide === 0 ? "PROXIMO EVENTO" : "ROLES ASIGNADOS";
  const stats = [
    { label: "EVENTOS ACTIVOS", value: totalEvents, icon: "calendar-outline" },
    { label: "ASISTENTES REGISTRADOS", value: totalOrders, icon: "people-outline" },
    { label: "ENTRADAS VENDIDAS", value: totalTickets, icon: "ticket-outline" },
  ];
  const filterOptions = useMemo(
    () => [{ _id: "all", name: "Todos los eventos" }, ...events],
    [events]
  );

  const sliderWidth = Math.max(screenWidth - spacing.lg * 2, 0);
  const highlightSlides = useMemo(() => ["next", "roles"], []);

  const donutSize = 140;
  const donutCenter = donutSize / 2;
  const donutRadius = 50;
  const donutStrokeWidth = 8;
  const donutCircumference = 2 * Math.PI * donutRadius;
  const donutDashOffset =
    donutCircumference - (donutCircumference * (ticketSummary.soldPercent / 100));

  if (!state.isAuthenticated) return <AuthRequiredScreen />;
  if (isLoading) return <Loading />;

  return (
    <Screen style={styles.screen} contentStyle={styles.container} header={<MobileHeader />}>
      <View style={styles.headerRow}>
        <AppText weight="bold" style={styles.headerTitle}>
          Panel del organizador
        </AppText>
      </View>

      <View style={styles.filterRow}>
        <Pressable style={styles.filterPill} onPress={() => setEventFilterOpen(true)}>
          <Ionicons name="filter-outline" size={14} color={colors.ink} />
          <AppText style={styles.filterText} numberOfLines={1}>
            Filtrar por: {filterLabel}
          </AppText>
          <Ionicons name="chevron-down" size={14} color={colors.muted} />
        </Pressable>
        <Pressable
          style={[styles.refreshButton, isRefreshing && styles.refreshButtonDisabled]}
          disabled={isRefreshing}
          onPress={async () => {
            setIsRefreshing(true);
            await loadDashboard();
            setIsRefreshing(false);
          }}
        >
          <Ionicons name="refresh" size={18} color={colors.ink} />
        </Pressable>
      </View>

      <View style={styles.statsStack}>
        {stats.map((stat) => (
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

      <View style={styles.sectionHeader}>
        <View style={styles.sectionDots}>
          {highlightSlides.map((slide, index) => (
            <Pressable
              key={slide}
              onPress={() => {
                setHighlightSlide(index);
                sliderRef.current?.scrollToOffset({
                  offset: index * (sliderWidth + spacing.md),
                  animated: true,
                });
              }}
            >
              <View style={[styles.dotInactive, index === highlightSlide && styles.dotActive]} />
            </Pressable>
          ))}
          <Ionicons name="chevron-forward" size={12} color={colors.muted} />
        </View>
        <AppText style={styles.sectionLabel}>{highlightLabel}</AppText>
      </View>

      <FlatList
        ref={sliderRef}
        data={highlightSlides}
        keyExtractor={(item) => item}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={sliderWidth + spacing.md}
        decelerationRate="fast"
        contentContainerStyle={styles.sliderContent}
        onMomentumScrollEnd={(event) => {
          const offsetX = event.nativeEvent.contentOffset.x;
          const nextIndex = sliderWidth ? Math.round(offsetX / (sliderWidth + spacing.md)) : 0;
          setHighlightSlide(nextIndex);
        }}
        renderItem={({ item }) => {
          if (item === "roles") {
            const inactiveScanners = Math.max(scannersCount - activeScanners, 0);
            const sellerLabel = sellersCount ? `${formatCount(sellersCount)} REGISTRO` : "SIN VENDEDORES";
            return (
              <View style={[styles.nextCard, styles.rolesCard, { width: sliderWidth }]}>
                <View style={styles.rolesRow}>
                  <AppText weight="semiBold" style={styles.rolesName}>
                    Escaner
                  </AppText>
                  <View style={styles.rolesPills}>
                    <View style={[styles.rolePill, styles.rolePillSuccess]}>
                      <View style={[styles.roleDot, styles.roleDotSuccess]} />
                      <AppText style={styles.rolePillText}>
                        {formatCount(activeScanners)} ACTIVOS
                      </AppText>
                    </View>
                    <View style={[styles.rolePill, styles.rolePillDanger]}>
                      <View style={[styles.roleDot, styles.roleDotDanger]} />
                      <AppText style={styles.rolePillText}>
                        {formatCount(inactiveScanners)} INACTIVOS
                      </AppText>
                    </View>
                  </View>
                </View>
                <View style={styles.rolesRow}>
                  <AppText weight="semiBold" style={styles.rolesName}>
                    Vendedor
                  </AppText>
                  <View style={styles.rolesPills}>
                    <View
                      style={[
                        styles.rolePill,
                        sellersCount ? styles.rolePillSecondary : styles.rolePillMuted,
                      ]}
                    >
                      {sellersCount ? (
                        <View style={[styles.roleDot, styles.roleDotSecondary]} />
                      ) : null}
                      <AppText style={styles.rolePillText}>{sellerLabel}</AppText>
                    </View>
                  </View>
                </View>
                <View style={styles.rolesRow}>
                  <AppText weight="semiBold" style={styles.rolesName}>
                    Organizador
                  </AppText>
                  <View style={styles.rolesPills}>
                    <View style={[styles.rolePill, styles.rolePillMuted]}>
                      <AppText style={styles.rolePillText}>PRONTO</AppText>
                    </View>
                  </View>
                </View>
              </View>
            );
          }

          if (!highlightedEvent) {
            return (
              <View style={[styles.nextCard, { width: sliderWidth }]}>
                <AppText style={styles.metaText}>
                  Crea un evento para ver la proxima fecha destacada.
                </AppText>
              </View>
            );
          }

          const startValue = resolveEventStartValue(highlightedEvent);

          return (
            <View style={[styles.nextCard, { width: sliderWidth }]}>
              <AppText weight="bold" style={styles.eventTitle}>
                {resolveEventName(highlightedEvent)}
              </AppText>
              <View style={styles.metaRow}>
                <Ionicons name="calendar-outline" size={14} color={colors.muted} />
                <AppText style={styles.metaText}>
                  {formatDate(startValue || highlightedEvent.startDate || highlightedEvent.date)}
                </AppText>
              </View>
              <View style={styles.metaRow}>
                <Ionicons name="location-outline" size={14} color={colors.muted} />
                <AppText style={styles.metaText}>{resolveEventLocation(highlightedEvent)}</AppText>
              </View>
              <Button
                title="Editar evento"
                variant="dark"
                style={styles.editButton}
                onPress={() => navigation.navigate("OrganizerEventForm", { event: highlightedEvent })}
              />
            </View>
          );
        }}
        ItemSeparatorComponent={() => <View style={{ width: spacing.md }} />}
      />

      <View style={styles.donutCard}>
        <View style={styles.donutChart}>
          <Svg width={donutSize} height={donutSize} viewBox={`0 0 ${donutSize} ${donutSize}`}>
            <Circle
              cx={donutCenter}
              cy={donutCenter}
              r={donutRadius}
              stroke="#E9EDF3"
              strokeWidth={donutStrokeWidth}
              fill="none"
            />
            <Circle
              cx={donutCenter}
              cy={donutCenter}
              r={donutRadius}
              stroke={colors.brand}
              strokeWidth={donutStrokeWidth}
              strokeLinecap="round"
              strokeDasharray={donutCircumference}
              strokeDashoffset={donutDashOffset}
              transform={`rotate(-90 ${donutCenter} ${donutCenter})`}
              fill="none"
            />
            <Circle cx={donutCenter} cy={donutCenter - donutRadius} r={4} fill={colors.brand} />
          </Svg>
          <View style={styles.donutCenter}>
            <AppText style={styles.donutLabel}>ENTRADAS</AppText>
            <AppText weight="bold" style={styles.donutValue}>
              {formatCount(ticketSummary.totalTickets)}
            </AppText>
          </View>
        </View>
        <View style={styles.donutLegend}>
          {[
            {
              key: "sold",
              label: "VENDIDAS",
              value: ticketSummary.soldTickets,
              percent: ticketSummary.soldPercent,
              color: colors.brand,
            },
            {
              key: "available",
              label: "DISPONIBLES",
              value: ticketSummary.availableTickets,
              percent: ticketSummary.availablePercent,
              color: "#E5E7EB",
            },
          ].map((entry, index, list) => (
            <View
              key={entry.key}
              style={[styles.donutRow, index < list.length - 1 && styles.donutRowDivider]}
            >
              <View style={styles.donutRowLeft}>
                <View style={[styles.donutDot, { backgroundColor: entry.color }]} />
                <AppText style={styles.donutRowLabel}>{entry.label}</AppText>
              </View>
              <View style={styles.donutRowRight}>
                <AppText weight="semiBold" style={styles.donutRowValue}>
                  {formatCount(entry.value)}
                </AppText>
                <Ionicons name="chevron-forward" size={12} color={colors.muted} />
                <AppText style={styles.donutPercentText}>{entry.percent}%</AppText>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.activityListCard}>
        <AppText style={styles.activityEyebrow}>ACTIVIDAD RECIENTE DE VENTA</AppText>
        {recentOrders.length ? (
          recentOrders.map((order, index) => {
            const key = order?._id || order?.id || `${index}`;
            const orderKey = String(key);
            const isExpanded = expandedOrderId === orderKey;
            const eventLabel =
              order?.eventid?.name ||
              order?.event?.name ||
              order?.eventName ||
              "Evento";
            const amount = getOrderAmount(order);
            const amountLabel = amount !== null ? formatCurrency(amount) : "--";
            return (
              <View key={key} style={styles.activityBlock}>
                <Pressable
                  style={styles.activityRow}
                  onPress={() => setExpandedOrderId(isExpanded ? null : orderKey)}
                >
                  <View style={styles.activityIcon}>
                    <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={14} color="#ffffff" />
                  </View>
                  <AppText style={styles.activityName} numberOfLines={1}>
                    {eventLabel}
                  </AppText>
                  <AppText weight="semiBold" style={styles.activityAmount}>
                    {amountLabel}
                  </AppText>
                </Pressable>
                {isExpanded ? (
                  <View style={styles.activityDetails}>
                    {[
                      { label: "NRO ORDEN", value: getOrderNumber(order) },
                      { label: "NOMBRE", value: getOrderBuyerName(order) },
                      { label: "CANT.", value: `x${getOrderQuantity(order)}` },
                      {
                        label: "FECHA",
                        value: order?.createdAt ? formatDate(order.createdAt) : "-",
                      },
                    ].map((row) => (
                      <View key={row.label} style={styles.activityDetailRow}>
                        <AppText style={styles.activityDetailLabel}>{row.label}</AppText>
                        <AppText weight="semiBold" style={styles.activityDetailValue}>
                          {row.value}
                        </AppText>
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>
            );
          })
        ) : (
          <AppText style={styles.metaText}>Sin actividad reciente.</AppText>
        )}
      </View>

      <Modal visible={eventFilterOpen} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <AppText weight="bold" style={styles.modalTitle}>
              Filtrar eventos
            </AppText>
            <FlatList
              data={filterOptions}
              keyExtractor={(item) => String(item._id || item.id || item.name)}
              renderItem={({ item }) => {
                const itemId = String(item._id || item.id || "all");
                const isActive = String(selectedEventId) === itemId;
                return (
                  <Pressable
                    style={[styles.modalItem, isActive && styles.modalItemActive]}
                    onPress={() => {
                      setSelectedEventId(itemId);
                      setEventFilterOpen(false);
                    }}
                  >
                    <AppText weight={isActive ? "semiBold" : "regular"}>
                      {resolveEventName(item)}
                    </AppText>
                    {isActive ? <Ionicons name="checkmark" size={14} color={colors.brand} /> : null}
                  </Pressable>
                );
              }}
            />
            <Button title="Cerrar" variant="ghost" onPress={() => setEventFilterOpen(false)} />
          </View>
        </View>
      </Modal>
    </Screen>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 0,
    backgroundColor: "#fff",
  },
  container: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: 180,
    gap: spacing.lg,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: 16,
    color: colors.ink,
  },
  signOut: {
    fontSize: 12,
    color: colors.muted,
  },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  filterPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#ffffff",
  },
  filterText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    color: colors.ink,
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
  statLabel: {
    color: "#cfd6de",
    fontSize: 12,
    letterSpacing: 1.2,
  },
  statValue: {
    fontSize: 20,
    color: "#ffffff",
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  sectionDots: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dotActive: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.ink,
  },
  dotInactive: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#cbd2d9",
  },
  sliderContent: {
    paddingRight: spacing.lg,
  },
  nextCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  rolesCard: {
    gap: spacing.md,
  },
  rolesRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  rolesName: {
    color: colors.ink,
  },
  rolesPills: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  rolePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: spacing.sm,
    borderRadius: 12,
  },
  rolePillText: {
    fontSize: 11,
    color: colors.ink,
  },
  roleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  rolePillSuccess: {
    backgroundColor: "#E7F2C7",
  },
  rolePillDanger: {
    backgroundColor: "#FCE4E2",
  },
  rolePillSecondary: {
    backgroundColor: "#FFF1D6",
  },
  rolePillMuted: {
    backgroundColor: "#F1F3F6",
  },
  roleDotSuccess: {
    backgroundColor: "#8CBF00",
  },
  roleDotDanger: {
    backgroundColor: "#E14E4E",
  },
  roleDotSecondary: {
    backgroundColor: "#E7A200",
  },
  sectionLabel: {
    fontSize: 12,
    color: colors.muted,
    letterSpacing: 2,
  },
  eventTitle: {
    fontSize: 18,
    color: colors.ink,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  metaText: {
    color: colors.muted,
  },
  editButton: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.xl,
  },
  donutCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.lg,
  },
  donutChart: {
    alignItems: "center",
    justifyContent: "center",
  },
  donutCenter: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  donutLabel: {
    fontSize: 11,
    color: colors.muted,
    letterSpacing: 1.2,
  },
  donutValue: {
    fontSize: 18,
    color: colors.ink,
  },
  donutLegend: {
    gap: spacing.sm,
  },
  donutRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  donutRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: "#B8C0CC",
    borderStyle: "dashed",
    paddingBottom: spacing.sm,
  },
  donutRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  donutDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  donutRowLabel: {
    fontSize: 12,
    color: colors.ink,
    letterSpacing: 1.2,
  },
  donutRowValue: {
    fontSize: 14,
    color: colors.ink,
  },
  donutRowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  donutPercentText: {
    fontSize: 12,
    color: colors.ink,
  },
  activityListCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  activityEyebrow: {
    fontSize: 11,
    color: colors.muted,
    letterSpacing: 1.2,
    textAlign: "center",
  },
  activityBlock: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  activityRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  activityIcon: {
    width: 30,
    height: 30,
    borderRadius: 13,
    backgroundColor: "#2f343a",
    alignItems: "center",
    justifyContent: "center",
  },
  activityName: {
    flex: 1,
    color: colors.ink,
  },
  activityAmount: {
    color: colors.ink,
  },
  activityDetails: {
    paddingBottom: spacing.sm,
    gap: spacing.xs,
  },
  activityDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  activityDetailLabel: {
    fontSize: 11,
    color: colors.muted,
    letterSpacing: 1.2,
  },
  activityDetailValue: {
    fontSize: 12,
    color: colors.ink,
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

export default OrganizerDashboardScreen;
