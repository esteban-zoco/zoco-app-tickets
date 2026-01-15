import React, { useEffect, useState } from "react";
import { Image, Linking, Modal, Pressable, ScrollView, Share, StyleSheet, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import dayjs from "dayjs";
import Screen from "../../components/Screen";
import MobileHeader from "../../components/MobileHeader";
import AppText from "../../components/AppText";
import Button from "../../components/Button";
import Loading from "../../components/Loading";
import RollingQr from "../../components/qr/RollingQr";
import AuthRequiredScreen from "../auth/AuthRequiredScreen";
import { colors, fontFamilies, spacing } from "../../theme";
import { getMyEventDetailApi, initiateTicketTransferApi } from "../../services/api";
import { API_BASE_URL } from "../../services/config";
import { useAuth } from "../../store/AuthContext";
import CalendarIcon from "../../assets/image/calendario 1.svg";
import LocationIcon from "../../assets/image/ubicacion 1.svg";
import TicketIcon from "../../assets/image/boleto-2 1.svg";
import ShareIcon from "../../assets/image/arrow-up-from-bracket-solid-full (1).svg";
import InstagramIcon from "../../assets/image/instagram-brands-solid-full.svg";
import QrIcon from "../../assets/image/codigo-qr 1.svg";
import TransferIcon from "../../assets/image/transferencia-de-datos 1.svg";
import RulesCalendarIcon from "../../assets/image/calendario-3 1.svg";

const MyEventDetailScreen = ({ navigation, route }) => {
  const { state } = useAuth();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const [detail, setDetail] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [transferModal, setTransferModal] = useState(false);
  const [transferTicket, setTransferTicket] = useState(null);
  const [transferEmail, setTransferEmail] = useState("");
  const [transferError, setTransferError] = useState("");
  const [transferLoading, setTransferLoading] = useState(false);
  const [qrModalTicket, setQrModalTicket] = useState(null);
  const id = route?.params?.id;

  const refreshDetail = async () => {
    try {
      setIsLoading(true);
      const res = await getMyEventDetailApi(null, id);
      setDetail(res?.data?.info || null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!state.isAuthenticated || !id) return;
    refreshDetail();
  }, [state.isAuthenticated, id]);

  if (!state.isAuthenticated) return <AuthRequiredScreen />;
  if (isLoading) return <Loading />;
  if (!detail) {
    return (
      <Screen>
        <View style={styles.center}>
          <AppText>No se encontró el evento.</AppText>
        </View>
      </Screen>
    );
  }

  const eventId =
    detail?.eventid?._id ||
    detail?.eventid ||
    detail?.eventId ||
    detail?.event?._id ||
    detail?.event?.id ||
    "";
  const eventName = detail?.name || detail?.eventName || detail?.event?.name || "Evento";
  const apiBase = String(API_BASE_URL || "https://findevent.ddnsfree.com").replace(/\/$/, "");
  const eventImage =
    detail?.image ||
    detail?.banner ||
    detail?.cover ||
    detail?.event?.image ||
    detail?.event?.banner ||
    null;
  const eventAddress =
    detail?.fulladdress ||
    detail?.venueaddress ||
    detail?.venue ||
    detail?.location ||
    detail?.event?.fulladdress ||
    "";
  const eventStartRaw = detail?.startDate || detail?.event?.startDate || "";
  const eventTimeRaw = detail?.timeFrom || detail?.event?.timeFrom || "";
  const tickets = Array.isArray(detail?.tickets) ? detail.tickets : [];
  const ticketsCount = Number(
    detail?.ticketsPurchased ||
      detail?.totalTickets ||
      detail?.count ||
      (Array.isArray(detail?.tickets) ? detail.tickets.length : 0)
  );
  const startDate = dayjs(String(eventStartRaw).slice(0, 10));
  const dateLabel = startDate.isValid() ? startDate.format("D MMM. - YYYY") : "";
  const timeLabel = eventTimeRaw ? `${String(eventTimeRaw).slice(0, 5)} hs` : "";
  const metaDate = dateLabel && timeLabel ? `${dateLabel} // ${timeLabel}` : dateLabel || timeLabel;
  const currentUserId =
    state?.user?._id ||
    state?.user?.id ||
    state?.user?.userid ||
    "";

  const mapQuery = (() => {
    const latRaw = detail?.latitude ?? detail?.lat ?? detail?.event?.latitude;
    const lngRaw = detail?.longitude ?? detail?.lng ?? detail?.event?.longitude;
    const lat = Number(latRaw);
    const lng = Number(lngRaw);
    if (Number.isFinite(lat) && Number.isFinite(lng)) return `${lat},${lng}`;
    return eventAddress ? encodeURIComponent(eventAddress) : "";
  })();

  const openMap = async () => {
    if (!mapQuery) return;
    try {
      await Linking.openURL(`https://www.google.com/maps?q=${mapQuery}&z=15`);
    } catch {}
  };

  const openEventPage = () => {
    if (!eventId) return;
    const parent = navigation.getParent();
    if (parent) {
      parent.navigate("HomeTab", { screen: "EventDetail", params: { id: eventId } });
      return;
    }
    navigation.navigate("EventDetail", { id: eventId });
  };

  const openInstagram = async () => {
    const candidates = [
      detail?.instagram,
      detail?.instagramUrl,
      detail?.instagramLink,
      detail?.event?.instagram,
      detail?.event?.instagramUrl,
      detail?.event?.instagramLink,
    ];
    const raw = candidates.find((value) => typeof value === "string" && value.trim().length > 0);
    const url = raw
      ? raw.startsWith("http")
        ? raw
        : `https://www.instagram.com/${raw.replace(/^@/, "")}`
      : "https://www.instagram.com/";
    try {
      await Linking.openURL(url);
    } catch {}
  };

  const handleShare = async () => {
    try {
      const url = detail?.shareUrl || detail?.url || (eventId ? `${apiBase}/event/${eventId}` : "");
      const message = url ? `Mira este evento en Zoco: ${url}` : `Mira este evento en Zoco: ${eventName}`;
      await Share.share({ message });
    } catch {}
  };

  const getOrderLabel = (ticket) => {
    const raw = detail?.orderId || detail?.orderid || ticket?.orderId || ticket?.order || ticket?.id;
    if (!raw) return "-";
    const str = String(raw);
    if (/^\d+$/.test(str)) return `#${str}`;
    return `#${str.slice(-6)}`;
  };

  const normalizeStatus = (value) => String(value || "").toLowerCase();

  const getTransferMeta = (ticket) => {
    const statusStrs = [ticket?.status, ticket?.state, ticket?.transferStatus]
      .map(normalizeStatus)
      .filter(Boolean);
    const transferStatusRaw = normalizeStatus(ticket?.transferStatus);
    const idFrom = (value) => {
      if (!value) return "";
      if (typeof value === "object") return String(value._id || value.id || value.userid || "");
      return String(value);
    };
    const ownerCandidates = [
      ticket?.ownerId,
      ticket?.ownerid,
      ticket?.userId,
      ticket?.userid,
      ticket?.owner,
      ticket?.user,
      ticket?.beneficiary,
      ticket?.toUser,
      ticket?.receiver,
      ticket?.recipient,
    ];
    const ownerIds = ownerCandidates.map(idFrom).filter(Boolean);
    const knownOwnerDifferent =
      ownerIds.length > 0 && currentUserId && ownerIds.every((id) => id !== String(currentUserId));
    const legacyPending =
      ticket?.pendingTransfer === true ||
      ticket?.transferPending === true ||
      statusStrs.some((value) => value.includes("pending"));
    const legacyTransferred =
      ticket?.transferred === true ||
      ticket?.isTransferred === true ||
      ticket?.transfered === true ||
      ticket?.transfer === true ||
      statusStrs.some((value) => value.includes("transferred") || value.includes("transfer")) ||
      knownOwnerDifferent;
    const fallbackStatus = legacyTransferred ? "transferred" : legacyPending ? "pending" : "";
    const resolvedStatus = transferStatusRaw || fallbackStatus || "owned";
    const isTransferred = resolvedStatus === "transferred";
    const isPending = resolvedStatus === "pending" || resolvedStatus === "incoming";
    return { resolvedStatus, isTransferred, isPending };
  };

  const eventStart = (() => {
    if (!startDate.isValid()) return null;
    const [hh = "00", mm = "00"] = String(eventTimeRaw || "00:00").split(":");
    return startDate.hour(Number(hh)).minute(Number(mm));
  })();

  const withinDynamicWindow = (() => {
    if (!eventStart) return false;
    const hoursLeft = eventStart.diff(dayjs(), "hour", true);
    const within12h = hoursLeft <= 12 && hoursLeft >= 0;
    const isActive = dayjs().isAfter(eventStart);
    return within12h || isActive;
  })();

  const isTicketRedeemed = (ticket) => {
    const rawStatus = normalizeStatus(ticket?.status || ticket?.state);
    return rawStatus === "redeemed" || rawStatus === "used" || rawStatus === "consumed";
  };

  const canTransferTicket = (ticket) => {
    const transferMeta = getTransferMeta(ticket);
    const isRedeemed = isTicketRedeemed(ticket);
    return withinDynamicWindow && !isRedeemed && !transferMeta.isTransferred && !transferMeta.isPending;
  };

  const getTicketState = (ticket) => {
    const rawStatus = normalizeStatus(ticket?.status || ticket?.state);
    const transferMeta = getTransferMeta(ticket);
    if (rawStatus === "redeemed" || rawStatus === "used" || rawStatus === "consumed") return "Usada";
    if (transferMeta.isTransferred) return "Transferida";
    if (transferMeta.isPending) return "Pendiente";
    return "Vigente";
  };

  const openTransfer = (ticket) => {
    setTransferTicket(ticket);
    setTransferEmail("");
    setTransferError("");
    setTransferModal(true);
  };

  const openQrModal = (ticket, seq, meta) => {
    setQrModalTicket({ ticket, seq, meta, within: withinDynamicWindow });
  };

  const submitTransfer = async () => {
    const ticketId = transferTicket?.id || transferTicket?._id;
    if (!ticketId) return;
    const email = transferEmail.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setTransferError("Ingresa un email valido");
      return;
    }
    try {
      setTransferLoading(true);
      await initiateTicketTransferApi(state.accessToken, ticketId, email);
      setTransferModal(false);
      setTransferTicket(null);
      setTransferEmail("");
      setTransferError("");
      refreshDetail();
    } catch (err) {
      setTransferError(err?.response?.data?.message || "No se pudo transferir la entrada.");
    } finally {
      setTransferLoading(false);
    }
  };

  const openPrint = async (ticket) => {
    const ticketId = ticket?.id || ticket?._id;
    if (!ticketId) return;
    const url = `${apiBase}/api/ticket/qr/ticket/${ticketId}/static?format=png&ts=${Date.now()}`;
    try {
      await Linking.openURL(url);
    } catch {}
  };

  const modalTicket = qrModalTicket?.ticket || null;
  const modalTicketId = modalTicket?.id || modalTicket?._id || "";
  const modalSeq = qrModalTicket?.seq || modalTicket?.seq || modalTicket?.sequence || "";
  const modalMeta = modalTicket ? qrModalTicket?.meta || getTransferMeta(modalTicket) : null;
  const modalIsRedeemed = modalTicket ? isTicketRedeemed(modalTicket) : false;
  const modalWithin = qrModalTicket?.within ?? withinDynamicWindow;
  const modalShowDynamic =
    Boolean(modalTicketId) &&
    modalWithin &&
    modalMeta &&
    !modalMeta.isTransferred &&
    !modalMeta.isPending &&
    !modalIsRedeemed;
  const modalQrUrl =
    modalTicketId && !modalShowDynamic && !(modalMeta && modalMeta.isTransferred)
      ? `${apiBase}/api/ticket/qr/ticket/${modalTicketId}.png`
      : "";
  const modalStateLabel = modalTicket ? getTicketState(modalTicket) : "";
  const modalOrderLabel = modalTicket ? getOrderLabel(modalTicket) : "-";
  const modalDateLabel = startDate.isValid() ? startDate.format("D MMM. - YYYY") : "";
  const modalTimeLabel = eventTimeRaw ? `${String(eventTimeRaw).slice(0, 5)} hs` : "";
  const modalMetaLine = [modalDateLabel, modalTimeLabel].filter(Boolean).join(" // ");

  return (
    <Screen scroll={false} style={{ backgroundColor: "#ffff"  }}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: spacing.xl + tabBarHeight }]}
        style={{ marginTop: -insets.top }}
      >
        <AppText weight="bold" style={styles.pageTitle}>
          Detalles de mi evento
        </AppText>
        <View style={styles.detailCard}>
          <View style={styles.hero}>
            <Image
              source={eventImage ? { uri: eventImage } : require("../../assets/image/descarga.png")}
              style={styles.heroImage}
            />
            <Pressable style={styles.shareBtn} onPress={handleShare}>
              <ShareIcon width={16} height={16} color="#ffffff" />
            </Pressable>
            <Pressable style={styles.igBtn} onPress={openInstagram}>
              <InstagramIcon width={16} height={16} color="#ffffff" />
            </Pressable>
          </View>

          <View style={styles.detailBody}>
            <AppText weight="bold" style={styles.eventTitle}>
              {eventName}
            </AppText>
            {metaDate ? (
              <View style={styles.metaRow}>
                <CalendarIcon width={14} height={14} />
                <AppText style={styles.metaText}>{metaDate}</AppText>
              </View>
            ) : null}
            {eventAddress ? (
              <View style={styles.metaRow}>
                <LocationIcon width={14} height={14} />
                <AppText style={styles.metaText}>{eventAddress}</AppText>
              </View>
            ) : null}
            <View style={styles.metaRow}>
              <TicketIcon width={14} height={14} />
              <AppText style={styles.metaText}>
                {ticketsCount} {ticketsCount === 1 ? "entrada comprada" : "entradas compradas"}
              </AppText>
            </View>

          <View style={styles.actionRow}>
            <Pressable style={[styles.actionButton, styles.actionButtonWide]} onPress={openEventPage}>
              <AppText weight="semiBold" style={styles.actionButtonText}>
                Ver pagina del evento
              </AppText>
            </Pressable>
            <Pressable style={[styles.actionButton, styles.actionButtonNarrow]} onPress={openMap}>
              <AppText weight="semiBold" style={styles.actionButtonText}>
                Ver mapa
              </AppText>
            </Pressable>
            </View>
          </View>
        </View>

        {tickets.length ? (
          <View style={styles.ticketsSection}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.ticketsRow}>
              {tickets.map((ticket, index) => {
                const ticketId = ticket?.id || ticket?._id;
                const seq = ticket?.seq || ticket?.sequence || index + 1;
                const transferMeta = getTransferMeta(ticket);
                const isRedeemed = isTicketRedeemed(ticket);
                const showDynamicQr = withinDynamicWindow && !transferMeta.isTransferred;
                const qrUrl = ticketId ? `${apiBase}/api/ticket/qr/ticket/${ticketId}.png` : "";
                const stateLabel = getTicketState(ticket);
                const canTransfer = canTransferTicket(ticket);
                const isPrintDisabled = transferMeta.isTransferred;
                return (
                  <View key={ticket?.id || index} style={styles.ticketItem}>
                    <View style={styles.ticketCard}>
                      <Pressable
                        style={styles.ticketQrBox}
                        onPress={() => openQrModal(ticket, seq, { ...transferMeta, isRedeemed })}
                      >
                        {transferMeta.isTransferred ? (
                          <View style={styles.ticketQrPlaceholder}>
                            <AppText style={styles.ticketQrPlaceholderText}>Transferido</AppText>
                          </View>
                        ) : showDynamicQr && ticketId ? (
                          <RollingQr ticketId={ticketId} apiBase={apiBase} size={170} style={styles.ticketQrCanvas} />
                        ) : ticketId ? (
                          <Image source={{ uri: qrUrl }} style={styles.ticketQr} />
                        ) : (
                          <View style={styles.ticketQrPlaceholder} />
                        )}
                      </Pressable>
                      <View style={styles.ticketDivider} />
                      <View style={styles.ticketHeaderRow}>
                        <AppText weight="bold" style={styles.ticketTitle}>
                          ENTRADA {seq}
                        </AppText>
                        <AppText style={styles.ticketState}>{stateLabel}</AppText>
                      </View>
                      <View style={styles.ticketMeta}>
                        <View style={styles.ticketMetaItem}>
                          <AppText style={styles.ticketMetaLabel}>Orden</AppText>
                          <AppText style={styles.ticketMetaValue}>{getOrderLabel(ticket)}</AppText>
                        </View>
                        <View style={styles.ticketMetaItem}>
                          <AppText style={styles.ticketMetaLabel}>Fecha</AppText>
                          <AppText style={styles.ticketMetaValue}>
                            {startDate.isValid() ? startDate.format("D MMM").toUpperCase() : "-"}
                          </AppText>
                        </View>
                        <View style={styles.ticketMetaItem}>
                          <AppText style={styles.ticketMetaLabel}>Hora</AppText>
                          <AppText style={styles.ticketMetaValue}>
                            {eventTimeRaw ? String(eventTimeRaw).slice(0, 5) : "-"}
                          </AppText>
                        </View>
                      </View>
                    </View>
                    <Pressable
                      style={[styles.ticketAction, !canTransfer && styles.ticketActionDisabled]}
                      onPress={() => canTransfer && openTransfer(ticket)}
                    >
                      <AppText style={styles.ticketActionText}>
                        {canTransfer ? "Transferir entrada" : "Entrada no transferible"}
                      </AppText>
                    </Pressable>
                    <Pressable
                      style={[styles.ticketActionSecondary, isPrintDisabled && styles.ticketActionDisabled]}
                      onPress={() => !isPrintDisabled && openPrint(ticket)}
                      disabled={isPrintDisabled}
                    >
                      <AppText style={styles.ticketActionSecondaryText}>Imprimir entrada</AppText>
                    </Pressable>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        ) : null}

        <View style={styles.rules}>
          <AppText weight="bold" style={styles.rulesTitle}>
            Como funcionan las entradas?
          </AppText>
          <View style={styles.rulesItem}>
            <QrIcon width={18} height={18} />
            <AppText style={styles.rulesText}>
              Cada entrada tiene un QR dinamico y unico, generado automaticamente para evitar duplicaciones o fraudes.
            </AppText>
          </View>
          <View style={styles.rulesItem}>
            <TransferIcon width={18} height={18} />
            <AppText style={styles.rulesText}>
              La opcion "Transferir entrada" se habilita 12 horas antes del evento. Una vez transferida, el nuevo
              titular es el unico autorizado.
            </AppText>
          </View>
          <View style={styles.rulesItem}>
            <RulesCalendarIcon width={18} height={18} />
            <AppText style={styles.rulesText}>
              En el control de acceso se escanea el QR y se valida en tiempo real. Cada codigo se usa una sola vez.
            </AppText>
          </View>
        </View>
      </ScrollView>

      <Modal visible={transferModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.transferCard}>
            <AppText weight="bold" style={styles.transferTitle}>
              Transferir entrada
            </AppText>
            <AppText style={styles.transferText}>
              Ingresar el email del destinatario para la entrada {transferTicket?.seq || ""}
            </AppText>
            <TextInput
              value={transferEmail}
              onChangeText={(value) => {
                setTransferEmail(value);
                if (transferError) setTransferError("");
              }}
              placeholder="destinatario@dominio.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.transferInput}
            />
            {transferError ? <AppText style={styles.transferError}>{transferError}</AppText> : null}
            <View style={styles.transferActions}>
              <Button title="Cancelar" variant="ghost" onPress={() => setTransferModal(false)} />
              <Button
                title={transferLoading ? "Enviando..." : "Enviar"}
                variant="dark"
                onPress={submitTransfer}
                disabled={transferLoading}
              />
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={Boolean(qrModalTicket)} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.qrCard}>
            <View style={styles.qrHeader}>
              <AppText weight="bold" style={styles.qrTitle}>
                ENTRADA {modalSeq || 1}
              </AppText>
              <Pressable style={styles.qrCloseBtn} onPress={() => setQrModalTicket(null)}>
                <Ionicons name="close" size={18} color={colors.ink} />
              </Pressable>
            </View>
            <View style={styles.qrBox}>
              {modalMeta?.isTransferred ? (
                <View style={styles.qrPlaceholder}>
                  <AppText style={styles.qrPlaceholderText}>Transferido</AppText>
                </View>
              ) : modalShowDynamic ? (
                <RollingQr ticketId={modalTicketId} apiBase={apiBase} size={230} style={styles.qrCanvas} />
              ) : modalQrUrl ? (
                <Image source={{ uri: modalQrUrl }} style={styles.qrImage} />
              ) : (
                <View style={styles.qrPlaceholder} />
              )}
            </View>
            <AppText style={styles.qrHint}>
              Subi el brillo de tu pantalla y mostra este codigo al personal de acceso. Recorda tener tu DNI a mano.
            </AppText>
            <AppText weight="bold" style={styles.qrEventName}>
              {eventName}
            </AppText>
            {modalMetaLine ? <AppText style={styles.qrEventMeta}>{modalMetaLine}</AppText> : null}
            {eventAddress ? <AppText style={styles.qrEventMeta}>{eventAddress}</AppText> : null}
            <View style={styles.qrMetaRow}>
              <View style={styles.qrMetaItem}>
                <AppText style={styles.qrMetaLabel}>Estado</AppText>
                <AppText weight="bold" style={styles.qrMetaValue}>
                  {modalStateLabel}
                </AppText>
              </View>
              <View style={styles.qrMetaItem}>
                <AppText style={styles.qrMetaLabel}>Orden</AppText>
                <AppText weight="bold" style={styles.qrMetaValue}>
                  {modalOrderLabel}
                </AppText>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
};

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    paddingTop: 0,
    gap: spacing.lg,
  },
  pageTitle: {
    fontSize: 18,
    color: colors.ink,
  },
  detailCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E6E9EF",
    overflow: "hidden",
  },
  hero: {
    position: "relative",
  },
  heroImage: {
    width: "100%",
    height: 170,
    resizeMode: "cover",
  },
  shareBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  igBtn: {
    position: "absolute",
    top: 46,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  detailBody: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  eventTitle: {
    fontSize: 18,
    color: colors.ink,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  metaText: {
    fontSize: 13,
    color: colors.ink,
    flex: 1,
  },
  actionRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  actionButton: {
    minHeight: 36,
    borderRadius: 8,
    backgroundColor: colors.ink,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  actionButtonWide: {
    flex: 1.3,
  },
  actionButtonNarrow: {
    flex: 0.7,
  },
  actionButtonText: {
    color: "#ffffff",
    fontSize: 11,
    lineHeight: 14,
    textAlign: "center",
    flexShrink: 1,
  },
  ticketsSection: {
    marginTop: spacing.xl,
  },
  ticketsRow: {
    gap: 12,
    paddingVertical: 4,
    paddingRight: spacing.lg,
  },
  ticketItem: {
    width: 210,
    gap: 8,
  },
  ticketCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E8EBF0",
    padding: spacing.md,
    gap: spacing.md,
  },
  ticketQrBox: {
    alignItems: "center",
  },
  ticketQr: {
    width: 170,
    height: 170,
    resizeMode: "contain",
    borderRadius: 12,
    backgroundColor: "#F6F8FA",
  },
  ticketQrCanvas: {
    width: 170,
    height: 170,
    borderRadius: 12,
    backgroundColor: "#F6F8FA",
    alignItems: "center",
    justifyContent: "center",
  },
  ticketQrPlaceholder: {
    width: 170,
    height: 170,
    borderRadius: 12,
    backgroundColor: "#F0F3F6",
    alignItems: "center",
    justifyContent: "center",
  },
  ticketQrPlaceholderText: {
    fontSize: 12,
    color: colors.muted,
  },
  ticketDivider: {
    height: 1,
    backgroundColor: "#E6E9EF",
  },
  ticketHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  ticketTitle: {
    fontSize: 13,
  },
  ticketState: {
    fontSize: 12,
    color: colors.muted,
  },
  ticketMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  ticketMetaItem: {
    alignItems: "center",
    flex: 1,
  },
  ticketMetaLabel: {
    fontSize: 10,
    color: colors.muted,
  },
  ticketMetaValue: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.ink,
  },
  ticketAction: {
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D9DDE3",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
  },
  ticketActionDisabled: {
    opacity: 0.6,
  },
  ticketActionText: {
    fontSize: 12,
    color: colors.ink,
  },
  ticketActionSecondary: {
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D9DDE3",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F4F6",
  },
  ticketActionSecondaryText: {
    fontSize: 12,
    color: colors.ink,
  },
  rules: {
    marginTop: spacing.xl,
    backgroundColor: "#EAEDF3",
    borderRadius: 14,
    padding: spacing.lg,
    gap: spacing.md,
  },
  rulesTitle: {
    fontSize: 14,
    color: colors.ink,
  },
  rulesItem: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
  },
  rulesText: {
    fontSize: 12,
    color: colors.ink,
    flex: 1,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  transferCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: spacing.lg,
    width: "100%",
    maxWidth: 320,
    gap: spacing.md,
  },
  transferTitle: {
    fontSize: 16,
  },
  transferText: {
    fontSize: 12,
    color: colors.muted,
  },
  transferInput: {
    height: 36,
    borderWidth: 1,
    borderColor: "#2D3035",
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 12,
    color: colors.ink,
    fontFamily: fontFamilies.regular,
  },
  transferError: {
    fontSize: 12,
    color: colors.danger,
  },
  transferActions: {
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
  },
  qrCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: spacing.lg,
    width: "100%",
    maxWidth: 340,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: "#E6E9EF",
  },
  qrHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  qrTitle: {
    fontSize: 16,
    color: colors.ink,
  },
  qrCloseBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E1E4EA",
  },
  qrBox: {
    alignItems: "center",
    justifyContent: "center",
  },
  qrImage: {
    width: 230,
    height: 230,
    resizeMode: "contain",
    borderRadius: 12,
    backgroundColor: "#F6F8FA",
  },
  qrCanvas: {
    width: 230,
    height: 230,
    borderRadius: 12,
    backgroundColor: "#F6F8FA",
    alignItems: "center",
    justifyContent: "center",
  },
  qrPlaceholder: {
    width: 230,
    height: 230,
    borderRadius: 12,
    backgroundColor: "#F0F3F6",
    alignItems: "center",
    justifyContent: "center",
  },
  qrPlaceholderText: {
    fontSize: 12,
    color: colors.muted,
  },
  qrHint: {
    fontSize: 12,
    color: colors.muted,
    textAlign: "center",
  },
  qrEventName: {
    fontSize: 15,
    color: colors.ink,
    textAlign: "center",
  },
  qrEventMeta: {
    fontSize: 12,
    color: colors.muted,
    textAlign: "center",
  },
  qrMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.sm,
  },
  qrMetaItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  qrMetaLabel: {
    fontSize: 11,
    color: colors.muted,
    textTransform: "uppercase",
  },
  qrMetaValue: {
    fontSize: 13,
    color: colors.ink,
  },
  center: {
    padding: spacing.xl,
    alignItems: "center",
  },
});

export default MyEventDetailScreen;
