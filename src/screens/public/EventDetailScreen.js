import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Image, Linking, Modal, Pressable, ScrollView, Share, StyleSheet, TextInput, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import dayjs from "dayjs";
import CalendarIcon from "../../assets/image/calendario 1.svg";
import ClockIcon from "../../assets/image/reloj-de-pared 1.svg";
import LocationIcon from "../../assets/image/ubicacion 1.svg";
import ShareIcon from "../../assets/image/arrow-up-from-bracket-solid-full (1).svg";
import InstagramIcon from "../../assets/image/instagram-brands-solid-full.svg";
import TicketIcon from "../../assets/image/boleto-2 1.svg";
import QrIcon from "../../assets/image/codigo-qr 1.svg";
import TransferIcon from "../../assets/image/transferencia-de-datos 1.svg";
import TrashIcon from "../../assets/image/eliminar 1.svg";
import ChevronDownIcon from "../../assets/image/flecha-hacia-abajo-para-navegarBlanca.svg";
import SadIcon from "../../assets/image/triste 1.svg";
import Screen from "../../components/Screen";
import AppText from "../../components/AppText";
import Button from "../../components/Button";
import Loading from "../../components/Loading";
import { colors, fontFamilies, spacing } from "../../theme";
import { createOrderApi, getEventById } from "../../services/api";
import { PAYMENT_BASE_URL } from "../../services/config";
import { formatCurrency, formatDate } from "../../utils/format";
import { useAuth } from "../../store/AuthContext";
import { FISERV_CARD_OPTIONS, calculateInstallmentTotal } from "../../constants/fiservPaymentOptions";
import { TAB_BAR_STYLE } from "../../navigation/tabBarStyle";

const MAX_PER_USER = 4;

const EventDetailScreen = ({ navigation, route }) => {
  const { state } = useAuth();
  const insets = useSafeAreaInsets();
  const [event, setEvent] = useState(null);
  const [ticketTypes, setTicketTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showInfo, setShowInfo] = useState(false);
  const [ticketModal, setTicketModal] = useState(false);
  const [paymentModal, setPaymentModal] = useState(false);
  const [selectedCard, setSelectedCard] = useState("");
  const [selectedInstallment, setSelectedInstallment] = useState("");
  const [showCostDetail, setShowCostDetail] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [geoCoords, setGeoCoords] = useState(null);
  const [cardOpen, setCardOpen] = useState(false);
  const [installmentOpen, setInstallmentOpen] = useState(false);
  const [quantities, setQuantities] = useState({});
  const [waitEmail, setWaitEmail] = useState("");
  const [waitSaved, setWaitSaved] = useState(false);
  const eventId = route?.params?.id;

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const res = await getEventById(eventId);
        const info = res?.data?.info;
        const eventData = info?.event || info || null;
        setEvent(eventData);
        const types = Array.isArray(info?.ticketTypes)
          ? info.ticketTypes
          : Array.isArray(info?.tickettypes)
          ? info.tickettypes
          : Array.isArray(eventData?.ticketTypes)
          ? eventData.ticketTypes
          : Array.isArray(eventData?.tickettypes)
          ? eventData.tickettypes
          : [];
        const normalized = types.map((t, index) => ({
          ...t,
          id: t.id || t._id || t.ticketTypeId || t.tickettypeid || t.tickettypeId || `type-${index}`,
        }));
        setTicketTypes(normalized);
        setQuantities({});
      } catch (err) {
        setError("No se pudo cargar el evento.");
      } finally {
        setIsLoading(false);
      }
    };
    if (eventId) load();
  }, [eventId]);

  const uiTicketTypes = useMemo(() => {
    if (ticketTypes.length) return ticketTypes;
    if (event?.isFree) {
      return [
        {
          id: "FREE_DEFAULT",
          name: "Entrada general",
          price: 0,
          remaining: null,
          status: true,
        },
      ];
    }
    const priceNum = Number(event?.price || 0);
    if (Number.isFinite(priceNum) && priceNum > 0) {
      return [
        {
          id: "PAID_DEFAULT",
          name: "Entrada general",
          price: priceNum,
          remaining: null,
          status: true,
        },
      ];
    }
    return [];
  }, [event, ticketTypes]);

  const hasRealTypes = ticketTypes.length > 0;
  const selectedEntries = useMemo(() => {
    return Object.entries(quantities || {}).filter(([, qty]) => Number(qty || 0) > 0);
  }, [quantities]);

  const cardOptions = useMemo(() => FISERV_CARD_OPTIONS, []);
  const selectedCardOption = useMemo(
    () => cardOptions.find((option) => option.id === selectedCard),
    [cardOptions, selectedCard]
  );
  const installmentOptions = selectedCardOption?.installments || [];

  useEffect(() => {
    if (!paymentModal) return;
    if (!selectedCard && cardOptions.length) {
      setSelectedCard(cardOptions[0].id);
      return;
    }
    if (!selectedInstallment && installmentOptions.length) {
      setSelectedInstallment(String(installmentOptions[0].value));
    }
  }, [paymentModal, selectedCard, selectedInstallment, cardOptions, installmentOptions]);

  useEffect(() => {
    if (paymentModal) {
      setCardOpen(false);
      setInstallmentOpen(false);
    }
  }, [paymentModal]);

  const total = useMemo(() => {
    return uiTicketTypes.reduce((sum, t) => {
      const qty = Number(quantities[t.id] || 0);
      return sum + qty * Number(t.price || 0);
    }, 0);
  }, [quantities, uiTicketTypes]);

  const totalQty = useMemo(() => {
    if (!selectedEntries.length) return 0;
    return selectedEntries.reduce((sum, [, qty]) => sum + Number(qty || 0), 0);
  }, [selectedEntries]);

  const isOrderEmpty = useMemo(() => {
    if (!Array.isArray(uiTicketTypes) || uiTicketTypes.length === 0) return false;
    return uiTicketTypes.every((tt) => Number(quantities[tt.id] || 0) <= 0);
  }, [uiTicketTypes, quantities]);
  const serviceFee = Math.round(total * 0.1);
  const totalWithService = total;
  const isFreeOrder = useMemo(() => {
    if (Boolean(event?.isFree)) return true;
    return total <= 0 && !isOrderEmpty;
  }, [event?.isFree, total, isOrderEmpty]);
  const selectedInstallmentOption = installmentOptions.find(
    (option) => String(option.value) === String(selectedInstallment)
  );
  const installmentRate = Number(selectedInstallmentOption?.rate || 0) || 0;
  const chargeTotal = calculateInstallmentTotal(totalWithService, installmentRate);
  const surcharge = Math.max(0, chargeTotal - totalWithService);
  const installmentCount = Number(selectedInstallmentOption?.value || 0) || 0;
  const perInstallment =
    installmentCount > 0 ? calculateInstallmentTotal(totalWithService, installmentRate) / installmentCount : 0;
  const selectedInstallmentLabel = selectedInstallmentOption
    ? `${selectedInstallmentOption.label} de ${formatCurrency(perInstallment)}`
    : "Selecciona cuotas";

  const formatTime = (value) => {
    if (!value) return "";
    const text = String(value);
    const parsed = dayjs(`2025-01-01 ${text}`, "YYYY-MM-DD HH:mm", true);
    return parsed.isValid() ? parsed.format("HH:mm") : text;
  };

  const getCoords = (ev) => {
    const latRaw = ev?.venueid?.latitude ?? ev?.latitude ?? ev?.venue?.latitude;
    const lngRaw = ev?.venueid?.longitude ?? ev?.longitude ?? ev?.venue?.longitude;
    const lat = Number(latRaw);
    const lng = Number(lngRaw);
    if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
    return null;
  };

  const address = useMemo(() => {
    if (!event) return "";
    if (event.fulladdress) return String(event.fulladdress);
    const addr = event?.venueid?.address || event?.venue?.address || event?.address;
    const city = event?.venueid?.city?.name || event?.city?.name || event?.city;
    const stateName = event?.venueid?.state?.name || event?.state?.name || event?.state;
    return [addr, city, stateName].filter(Boolean).join(", ");
  }, [event]);

  const mapQuery = useMemo(() => {
    if (!event) return "";
    const coords = getCoords(event);
    if (coords) return `${coords.lat},${coords.lng}`;
    return address ? encodeURIComponent(address) : "";
  }, [event, address]);

  const mapCoords = useMemo(() => (event ? getCoords(event) : null), [event]);

  useEffect(() => {
    let isActive = true;
    const controller = new AbortController();

    const loadCoords = async () => {
      if (!address || mapCoords) {
        if (isActive) setGeoCoords(null);
        return;
      }
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`;
        const res = await fetch(url, {
          signal: controller.signal,
          headers: { "User-Agent": "zoco-tickets" },
        });
        const data = await res.json();
        const first = Array.isArray(data) ? data[0] : null;
        if (!isActive || !first) return;
        const lat = Number(first.lat);
        const lng = Number(first.lon);
        if (Number.isFinite(lat) && Number.isFinite(lng)) {
          setGeoCoords({ lat, lng });
        }
      } catch {}
    };

    loadCoords();
    return () => {
      isActive = false;
      controller.abort();
    };
  }, [address, mapCoords]);

  const previewCoords = mapCoords || geoCoords;
  const mapPreviewUrl = useMemo(() => {
    if (!previewCoords) return "";
    const { lat, lng } = previewCoords;
    const zoom = 15;
    const size = "640,320";
    return `https://static-maps.yandex.ru/1.x/?ll=${lng},${lat}&z=${zoom}&l=map&size=${size}&pt=${lng},${lat},pm2rdm`;
  }, [previewCoords]);

  const cover = useMemo(() => {
    const list = Array.isArray(event?.multipleImage) ? event.multipleImage : [];
    const firstImage = list.find((u) => typeof u === "string" && u.length > 4);
    return firstImage || event?.image || event?.banner || event?.headerimage || null;
  }, [event]);

  const metaDate = formatDate(event?.startDate, "DD MMM YYYY");
  const metaTime = formatTime(event?.timeFrom || event?.startTime || event?.time);
  const doorsOpen = formatTime(event?.doorsOpenTime);
  const metaDuration =
    event?.timeFrom && event?.timeTo
      ? Math.max(
          0,
          dayjs(`2025-01-01 ${event.timeTo}`, "YYYY-MM-DD HH:mm").diff(
            dayjs(`2025-01-01 ${event.timeFrom}`, "YYYY-MM-DD HH:mm"),
            "minute"
          )
        )
      : event?.duration;
  const durationLabel = metaDuration
    ? String(metaDuration).includes("'")
      ? String(metaDuration)
      : `${metaDuration}'`
    : "";

  const updateQty = (id, delta) => {
    setQuantities((prev) => {
      const current = Number(prev[id] || 0);
      const next = Math.max(0, Math.min(MAX_PER_USER, current + delta));
      return { ...prev, [id]: next };
    });
  };

  const setQty = (id, value) => {
    const next = Math.max(0, Math.min(MAX_PER_USER, Number(value || 0)));
    setQuantities((prev) => ({ ...prev, [id]: next }));
  };

  const goTab = (tabName, params) => {
    const parent = navigation.getParent();
    const root = parent?.getParent?.();
    const parentRoutes = parent?.getState?.()?.routeNames || [];
    const rootRoutes = root?.getState?.()?.routeNames || [];
    if (parentRoutes.includes(tabName)) {
      parent.navigate(tabName, params);
      return;
    }
    if (rootRoutes.includes(tabName)) {
      root.navigate(tabName, params);
      return;
    }
    if (rootRoutes.includes("Main")) {
      root.navigate("Main", { screen: tabName, params });
      return;
    }
    navigation.navigate(tabName, params);
  };

  const goAuth = () => {
    const root = navigation.getParent()?.getParent()?.getParent();
    if (root) {
      root.navigate("Auth");
    } else {
      navigation.navigate("Auth");
    }
  };

  const handleShare = async () => {
    try {
      const url = event?.shareUrl || event?.url;
      const message = url ? `Mira este evento en Zoco: ${url}` : `Mira este evento en Zoco: ${event?.name || ""}`;
      await Share.share({ message });
    } catch {}
  };

  const openInstagram = async () => {
    const candidates = [
      event?.instagram,
      event?.instagramUrl,
      event?.instagramLink,
      event?.social?.instagram,
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

  const openMap = async () => {
    if (!mapQuery) return;
    try {
      await Linking.openURL(`https://www.google.com/maps?q=${mapQuery}&z=15`);
    } catch {}
  };

  const canWaitSubmit = useMemo(() => {
    if (!waitEmail) return false;
    return /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(waitEmail);
  }, [waitEmail]);

  const handleWaitSubmit = () => {
    if (!canWaitSubmit) return;
    setWaitSaved(true);
    setWaitEmail("");
    setTimeout(() => setWaitSaved(false), 3500);
  };

  const buildCheckoutPayload = () => {
    const entries = selectedEntries;
    const totalQty = entries.reduce((sum, [, qty]) => sum + Number(qty || 0), 0) || 1;
    if (hasRealTypes && entries.length === 0 && !event?.isFree) {
      setError("Selecciona al menos una entrada.");
      return null;
    }

    const items = (() => {
      if (!hasRealTypes) return [{ ticketTypeId: null, quantity: totalQty }];
      if (entries.length > 0) {
        return entries.map(([typeId, qty]) => {
          const normalizedId = ["default", "FREE_DEFAULT", "PAID_DEFAULT"].includes(String(typeId))
            ? null
            : typeId;
          return {
            ticketTypeId: normalizedId,
            quantity: Number(qty || 0),
          };
        });
      }
      if (event?.isFree) {
        const first = ticketTypes.find((t) => t?.status !== false) || ticketTypes[0];
        const firstId = first?.id || null;
        return firstId ? [{ ticketTypeId: firstId, quantity: totalQty }] : [];
      }
      return [];
    })();

    return { items, totalQty };
  };

  const openPaymentModal = () => {
    if (isOrderEmpty) return;
    setError("");
    if (isFreeOrder) {
      setTicketModal(false);
      handlePaymentContinue();
      return;
    }
    setShowCostDetail(false);
    setTicketModal(false);
    setPaymentModal(true);
  };

  const handlePaymentContinue = async () => {
    setError("");
    if (!state.isAuthenticated) {
      setPaymentModal(false);
      goAuth();
      return;
    }
    const context = buildCheckoutPayload();
    if (!context || !context.items.length) {
      setError("Selecciona al menos una entrada.");
      return;
    }
    const itemsQty = context.totalQty || totalQty || 1;
    if (totalWithService <= 0 || event?.isFree) {
      try {
        setIsPaying(true);
        const payload = {
          eventid: eventId,
          quantity: itemsQty,
          name: state.user?.name || "",
          email: state.user?.email || "",
          phone: state.user?.phone || "",
          additionalInfo: "",
          state: "",
          items: context.items,
        };
        const res = await createOrderApi(payload, state.accessToken);
        if (res?.status === 200 && res?.data?.isSuccess) {
          setPaymentModal(false);
          setTicketModal(false);
          goTab("MyEventsTab");
          return;
        }
        throw new Error(res?.data?.message || "No se pudo crear la orden gratuita.");
      } catch (err) {
        const apiMessage =
          err?.response?.data?.message ||
          err?.response?.data?.info ||
          err?.message;
        setError(apiMessage || "No se pudo completar la orden.");
      } finally {
        setIsPaying(false);
      }
      return;
    }
    if (!selectedCardOption || !installmentCount) {
      setError("Elegi la tarjeta y la cantidad de cuotas para continuar.");
      return;
    }
    try {
      setIsPaying(true);
      const baseAmount = totalWithService;
      const body = {
        eventid: eventId,
        userId: state.user?.id || state.user?._id || "",
        name: state.user?.name || "",
        email: state.user?.email || "",
        phone: state.user?.phone || "",
        checkoutOrigin: "app",
        items: context.items,
        storeId: selectedCardOption.storeId,
        numberOfInstallments: installmentCount,
        installmentRate: installmentRate,
        installmentSurcharge: surcharge,
        chargeTotal: chargeTotal,
        baseAmount: baseAmount,
        installmentAmount: installmentCount > 0 ? chargeTotal / installmentCount : 0,
      };
      const res = await fetch(`${PAYMENT_BASE_URL}/api/payment/fiserv/connect/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${state.accessToken}`,
        },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Error al iniciar el checkout.");
      const href = json?.info?.href || json?.info?.checkoutUrl;
      if (!href) throw new Error("Checkout URL no recibido.");
      const targetUrl = /^https?:\/\//i.test(href) ? href : `${PAYMENT_BASE_URL}${href}`;
      setPaymentModal(false);
      await Linking.openURL(targetUrl);
    } catch (err) {
      setError(err?.message || "No se pudo iniciar el pago.");
    } finally {
      setIsPaying(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      const parent = navigation.getParent();
      if (parent) {
        parent.setOptions({ tabBarStyle: { display: "none" } });
      }
      return () => {
        if (parent) {
          parent.setOptions({ tabBarStyle: TAB_BAR_STYLE });
        }
      };
    }, [navigation])
  );

  if (isLoading) return <Loading />;
  if (!event) {
    return (
      <Screen>
        <View style={styles.center}>
          <AppText>{error || "Evento no encontrado"}</AppText>
        </View>
      </Screen>
    );
  }

  const buyBarHeight = 48 + Math.max(insets.bottom, 10);

  return (
    <Screen scroll={false} style={{ backgroundColor: "#fff" }}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: buyBarHeight }]}
        showsVerticalScrollIndicator={false}
        style={{ marginTop: -insets.top }}
      >
        <View style={styles.card}>
          <View style={styles.hero}>
            <View style={styles.heroMedia}>
              <Image
                source={cover ? { uri: cover } : require("../../assets/image/homepagemob.png")}
                style={styles.cover}
              />
              <Pressable style={styles.shareBtn} onPress={handleShare}>
                <ShareIcon width={16} height={16} color="#ffffff" />
              </Pressable>
              <Pressable style={styles.igBtn} onPress={openInstagram}>
                <InstagramIcon width={16} height={16} color="#ffffff" />
              </Pressable>
            </View>
          </View>

          <View style={styles.body}>
            <AppText weight="bold" style={styles.title}>
              {event.name}
            </AppText>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.metaRow}>
              {metaDate ? (
                <View style={styles.metaChip}>
                  <CalendarIcon width={12} height={12} />
                  <AppText style={styles.metaText}>{metaDate}</AppText>
                </View>
              ) : null}
              {metaTime ? (
                <View style={styles.metaChip}>
                  <ClockIcon width={12} height={12} />
                  <AppText style={styles.metaText}>{metaTime} hs</AppText>
                </View>
              ) : null}
              {address ? (
                <Pressable style={styles.metaChip} onPress={openMap} disabled={!mapQuery}>
                  <LocationIcon width={12} height={12} />
                  <AppText style={styles.metaText} numberOfLines={1}>
                    {address}
                  </AppText>
                </Pressable>
              ) : null}
              {event?.minAge >= 18 ? (
                <View style={styles.metaChip}>
                  <AppText style={styles.metaText}>+{event.minAge}</AppText>
                </View>
              ) : null}
            </ScrollView>

            <View style={styles.section}>
              <AppText weight="bold" style={styles.sectionTitle}>
                Acerca del evento
              </AppText>
              <View style={styles.descriptionWrap}>
                <AppText style={styles.description} numberOfLines={showInfo ? undefined : 4}>
                  {event.description || "Informacion del evento."}
                </AppText>
                {!showInfo ? (
                  <LinearGradient
                    colors={["rgba(255,255,255,0)", "#ffffff"]}
                    style={styles.descriptionFade}
                    pointerEvents="none"
                  />
                ) : null}
              </View>
              <Pressable style={styles.moreInfoBtn} onPress={() => setShowInfo((v) => !v)}>
                <ChevronDownIcon width={12} height={12} />
                <AppText weight="semiBold" style={styles.moreInfoText}>
                  {showInfo ? "Ver menos" : "Mas info"}
                </AppText>
              </Pressable>
            </View>

            <View style={styles.section}>
              <AppText weight="bold" style={styles.sectionTitle}>
                Informacion util
              </AppText>
              <View style={styles.infoList}>
                {doorsOpen ? <AppText style={styles.infoText}>Horario de apertura de puertas {doorsOpen}hs</AppText> : null}
                {metaTime ? <AppText style={styles.infoText}>Horario de comienzo del show {metaTime}hs</AppText> : null}
                {durationLabel ? <AppText style={styles.infoText}>Duracion del show {durationLabel}</AppText> : null}
              </View>

              <View style={styles.mapCard}>
                <Pressable style={styles.mapPlaceholder} onPress={openMap} disabled={!mapQuery}>
                  {mapPreviewUrl ? <Image source={{ uri: mapPreviewUrl }} style={styles.mapImage} /> : null}
                  {mapPreviewUrl ? <View style={styles.mapOverlay} /> : null}
                  <AppText style={[styles.mapText, mapPreviewUrl && styles.mapTextOnImage]}>
                    {mapQuery ? "Abrir mapa" : "Mapa no disponible"}
                  </AppText>
                </Pressable>
                {address ? (
                  <View style={styles.addressRow}>
                    <LocationIcon width={14} height={14} />
                    <AppText style={styles.addressText}>{address}</AppText>
                  </View>
                ) : null}
              </View>

              <View style={styles.featuresCard}>
                <View style={styles.featureItem}>
                  <TicketIcon width={16} height={16} />
                  <AppText style={styles.featureText}>Max. {MAX_PER_USER} tickets por persona</AppText>
                </View>
                <View style={styles.featureItem}>
                  <QrIcon width={16} height={16} />
                  <AppText style={styles.featureText}>QR dinamico anti-fraude</AppText>
                </View>
                <View style={styles.featureItem}>
                  <TransferIcon width={16} height={16} />
                  <AppText style={styles.featureText}>
                    Transferencias de tickets habilitadas 12hs antes del evento
                  </AppText>
                </View>
              </View>
            </View>

            <View style={styles.waitlistCard}>
              <SadIcon width={42} height={42} />
              <AppText weight="bold" style={styles.waitlistTitle}>
                Sin tickets? Unite a la lista de espera
              </AppText>
              <AppText style={styles.waitlistText}>
                Si se agotaron los tickets que querias no te preocupes, cuando se liberen te avisamos por orden de llegada
              </AppText>
              <View style={styles.waitlistForm}>
                <TextInput
                  value={waitEmail}
                  onChangeText={setWaitEmail}
                  placeholder="Email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={styles.waitlistInput}
                />
                <Pressable
                  style={[styles.waitlistButton, !canWaitSubmit && styles.waitlistButtonDisabled]}
                  onPress={handleWaitSubmit}
                  disabled={!canWaitSubmit}
                >
                  <AppText weight="semiBold" style={styles.waitlistButtonText}>
                    Anotarme
                  </AppText>
                </Pressable>
              </View>
              {waitSaved ? <AppText style={styles.waitlistSaved}>Listo, te avisamos si hay cupos</AppText> : null}
            </View>
          </View>
        </View>
      </ScrollView>

      {error ? <AppText style={styles.error}>{error}</AppText> : null}

      <View style={[styles.buyBar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        <Pressable style={styles.buyButton} onPress={() => setTicketModal(true)}>
          <AppText weight="bold" style={styles.buyText}>
            Comprar entradas
          </AppText>
        </Pressable>
      </View>

      <Modal visible={ticketModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.ticketCard}>
            <View style={styles.ticketHeader}>
              <AppText weight="bold" style={styles.ticketTitle}>
                Entradas
              </AppText>
              <Pressable onPress={() => setTicketModal(false)}>
                <Ionicons name="close" size={18} color={colors.ink} />
              </Pressable>
            </View>

            {uiTicketTypes.map((ticket) => {
              const qty = Number(quantities[ticket.id] || 0);
              const hasRemaining =
                ticket.remaining !== null &&
                typeof ticket.remaining !== "undefined" &&
                ticket.remaining !== "";
              const remainingValue = hasRemaining ? Number(ticket.remaining) : null;
              const endDate = String(event?.endDate || "").slice(0, 10);
              const isEnded = endDate ? endDate <= dayjs().format("YYYY-MM-DD") : false;
              const soldOut =
                (hasRemaining && Number.isFinite(remainingValue) && remainingValue <= 0) ||
                ticket.status === false ||
                isEnded;
              return (
                <View key={ticket.id} style={[styles.ticketLine, soldOut && styles.ticketLineDisabled]}>
                  <View style={styles.ticketRowTop}>
                    <AppText weight="semiBold" style={styles.ticketName}>
                      {ticket.name}
                    </AppText>
                    <AppText style={styles.ticketPrice}>
                      {Number(ticket.price || 0) === 0 ? "Gratis" : formatCurrency(ticket.price)}
                    </AppText>
                  </View>
                  {soldOut ? (
                    <AppText style={styles.soldOut}>Agotado</AppText>
                  ) : (
                    <View style={styles.ticketRowBottom}>
                      <AppText style={styles.qtyLabel}>Cant.</AppText>
                      <View style={styles.qtyRight}>
                        <View style={styles.stepper}>
                          <Pressable style={styles.stepBtn} onPress={() => updateQty(ticket.id, -1)}>
                            <AppText>-</AppText>
                          </Pressable>
                          <View style={styles.stepValue}>
                            <AppText>{qty}</AppText>
                          </View>
                          <Pressable style={styles.stepBtn} onPress={() => updateQty(ticket.id, 1)}>
                            <AppText>+</AppText>
                          </Pressable>
                        </View>
                        <Pressable style={styles.trashBtn} onPress={() => setQty(ticket.id, 0)}>
                          <TrashIcon width={16} height={16} />
                        </Pressable>
                      </View>
                    </View>
                  )}
                </View>
              );
            })}

            <View style={styles.ticketDivider} />
            <View style={styles.ticketServiceRow}>
              <AppText style={styles.serviceStrike}>Servicio</AppText>
              <AppText style={styles.serviceStrike}>{formatCurrency(serviceFee)}</AppText>
            </View>
            <View style={styles.ticketTotalRow}>
              <AppText weight="bold">TOTAL</AppText>
              <AppText weight="bold">{formatCurrency(totalWithService)}</AppText>
            </View>
            <View style={styles.ticketActions}>
              <Button title="Modo" variant="ghost" style={styles.ticketAction} disabled={isOrderEmpty || isFreeOrder} />
              <Button
                title={isFreeOrder ? "Canjear" : "Pagar"}
                variant="dark"
                style={styles.ticketAction}
                onPress={openPaymentModal}
                disabled={isOrderEmpty}
              />
            </View>
            <AppText style={styles.ticketNote}>
              ZOCO te muestra el costo final con todo incluido. El precio que ves es el que pagas
            </AppText>
            {error ? <AppText style={styles.modalError}>{error}</AppText> : null}
          </View>
        </View>
      </Modal>

      <Modal visible={paymentModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.paymentCard}>
            <View style={styles.paymentHeader}>
              <AppText weight="bold" style={styles.paymentTitle}>
                Elegi como pagar
              </AppText>
              <Pressable onPress={() => setPaymentModal(false)}>
                <Ionicons name="close" size={18} color={colors.ink} />
              </Pressable>
            </View>

            <View style={styles.paymentField}>
              <AppText style={styles.paymentLabel}>Tarjeta</AppText>
              <Pressable style={styles.selectRow} onPress={() => setCardOpen((prev) => !prev)}>
                <AppText>{selectedCardOption?.label || "Selecciona tarjeta"}</AppText>
                <Ionicons name={cardOpen ? "chevron-up" : "chevron-down"} size={16} color={colors.muted} />
              </Pressable>
              {cardOpen ? (
                <View style={styles.selectList}>
                  {cardOptions.map((option) => (
                    <Pressable
                      key={option.id}
                      style={styles.selectOption}
                      onPress={() => {
                        setSelectedCard(option.id);
                        setSelectedInstallment("");
                        setCardOpen(false);
                      }}
                    >
                      <AppText>{option.label}</AppText>
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </View>

            <View style={styles.paymentField}>
              <AppText style={styles.paymentLabel}>Cuotas</AppText>
              <Pressable
                style={styles.selectRow}
                onPress={() => setInstallmentOpen((prev) => !prev)}
                disabled={!installmentOptions.length}
              >
                <AppText>{selectedInstallmentLabel}</AppText>
                <Ionicons name={installmentOpen ? "chevron-up" : "chevron-down"} size={16} color={colors.muted} />
              </Pressable>
              {installmentOpen ? (
                <View style={styles.selectList}>
                  {installmentOptions.map((option) => {
                    const count = Number(option.value || 0);
                    const totalWithInterest = calculateInstallmentTotal(totalWithService, option.rate || 0);
                    const perCount = count > 0 ? totalWithInterest / count : totalWithInterest;
                    const label = `${option.label} de ${formatCurrency(perCount)}`;
                    return (
                      <Pressable
                        key={option.value}
                        style={styles.selectOption}
                        onPress={() => {
                          setSelectedInstallment(String(option.value));
                          setInstallmentOpen(false);
                        }}
                      >
                        <AppText>{label}</AppText>
                      </Pressable>
                    );
                  })}
                </View>
              ) : null}
            </View>

            <Pressable style={styles.costToggle} onPress={() => setShowCostDetail((prev) => !prev)}>
              <AppText style={styles.costToggleText}>Ver detalle de costos</AppText>
            </Pressable>
            {showCostDetail ? (
              <View style={styles.costDetail}>
                <View style={styles.costRow}>
                  <AppText style={styles.costLabel}>Sub total</AppText>
                  <AppText style={styles.costValue}>{formatCurrency(totalWithService)}</AppText>
                </View>
                <View style={styles.costRow}>
                  <AppText style={styles.costLabel}>Interes</AppText>
                  <AppText style={styles.costValue}>{formatCurrency(surcharge)}</AppText>
                </View>
                <View style={styles.costRow}>
                  <AppText weight="semiBold" style={styles.costLabel}>
                    TOTAL
                  </AppText>
                  <AppText weight="semiBold" style={styles.costValue}>
                    {formatCurrency(chargeTotal)}
                  </AppText>
                </View>
              </View>
            ) : null}

            <View style={styles.paymentActions}>
              <Button title="Cancelar" variant="ghost" style={styles.paymentAction} onPress={() => setPaymentModal(false)} />
              <Button
                title={isPaying ? "Procesando..." : "Continuar"}
                variant="dark"
                style={styles.paymentAction}
                onPress={handlePaymentContinue}
                disabled={isPaying || isOrderEmpty}
              />
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
};

const styles = StyleSheet.create({
  scroll: {
    paddingTop: 0,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    overflow: "hidden",
    borderWidth: 0,
    borderColor: "#E7EDF3",
  },
  hero: {
    position: "relative",
  },
  cover: {
    
    height: 210,
    borderRadius: 16,
    marginLeft: 16,
    marginRight: 16,
  },
  shareBtn: {
    position: "absolute",
    top: 10,
    right: 20,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  igBtn: {
    position: "absolute",
    top: 48,
    right: 20,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  title: {
    fontSize: 18,
  },
  metaRow: {
    gap: 6,
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingHorizontal: 10,
    height: 22,
  },
  metaText: {
    fontSize: 12,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: 14,
  },
  description: {
    color: colors.ink,
    fontSize: 13,
    lineHeight: 18,
  },
  descriptionWrap: {
    position: "relative",
  },
  descriptionFade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 22,
  },
  moreInfoBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.ink,
    borderRadius: 8,
    paddingVertical: 8,
    width: 120,
    alignSelf: "center",
  },
  moreInfoText: {
    color: "#ffffff",
    fontSize: 13,
  },
  infoList: {
    gap: 6,
  },
  infoText: {
    color: colors.muted,
    fontSize: 13,
  },
  mapCard: {
    gap: spacing.sm,
  },
  mapPlaceholder: {
    height: 136,
    backgroundColor: "#EAEFF4",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  mapImage: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 12,
  },
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.12)",
  },
  mapText: {
    color: colors.muted,
  },
  mapTextOnImage: {
    color: "#ffffff",
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  addressText: {
    color: colors.ink,
    fontSize: 12,
    flex: 1,
  },
  featureList: {
    gap: 8,
  },
  featuresCard: {
    marginTop: spacing.md,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#E6E9EF",
    borderRadius: 12,
    padding: spacing.md,
    gap: 8,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  featureText: {
    color: colors.ink,
    fontSize: 12,
    flex: 1,
  },
  waitlistCard: {
    marginTop: spacing.xl,
    borderWidth: 2,
    borderColor: "#C7D5E1",
    backgroundColor: "#EAEDF3",
    borderRadius: 18,
    padding: spacing.lg,
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: 60,
  },
  waitlistTitle: {
    fontSize: 14,
    textAlign: "center",
  },
  waitlistText: {
    fontSize: 12,
    textAlign: "center",
    color: colors.ink,
  },
  waitlistForm: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  waitlistInput: {
    flex: 1,
    height: 36,
    borderWidth: 1,
    borderColor: "#C7D5E1",
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: "#ffffff",
    fontSize: 12,
    fontFamily: fontFamilies.regular,
  },
  waitlistButton: {
    height: 36,
    minWidth: 88,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  waitlistButtonDisabled: {
    opacity: 0.6,
  },
  waitlistButtonText: {
    color: "#ffffff",
    fontSize: 12,
  },
  waitlistSaved: {
    color: colors.success,
    fontSize: 12,
  },
  buyBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#E6E9EF",
    paddingHorizontal: spacing.lg,
    paddingTop: 10,
  },
  buyButton: {
    backgroundColor: colors.ink,
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: "center",
    marginBottom: 0,
  },
  buyText: {
    color: colors.brand,
    fontSize: 16,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  ticketCard: {
    backgroundColor: "#ffffff",
    borderRadius: 10,
    padding: spacing.lg,
    width: "100%",
    maxWidth: 325,
    gap: spacing.md,
  },
  ticketHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#B2B2B2",
    paddingBottom: spacing.sm,
  },
  ticketTitle: {
    fontSize: 16,
  },
  ticketLine: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#ECEFF4",
    gap: 8,
  },
  ticketLineDisabled: {
    opacity: 0.6,
  },
  ticketRowTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  ticketRowBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  ticketName: {
    fontSize: 14,
    color: colors.ink,
  },
  ticketPrice: {
    fontSize: 14,
    color: colors.ink,
  },
  soldOut: {
    color: colors.muted,
    fontSize: 12,
  },
  qtyLabel: {
    fontSize: 12,
    color: colors.muted,
  },
  qtyRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D0D5DD",
    borderRadius: 8,
    overflow: "hidden",
  },
  stepBtn: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  stepValue: {
    width: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  trashBtn: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  ticketDivider: {
    height: 1,
    backgroundColor: "#E5E7EB",
  },
  ticketServiceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  serviceStrike: {
    textDecorationLine: "line-through",
    color: colors.muted,
  },
  ticketTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  ticketActions: {
    flexDirection: "row",
    gap: spacing.md,
  },
  ticketAction: {
    flex: 1,
  },
  ticketNote: {
    color: colors.brand,
    fontSize: 11,
    textAlign: "center",
  },
  modalError: {
    color: colors.danger,
    fontSize: 12,
    textAlign: "center",
  },
  paymentCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: spacing.lg,
    width: "100%",
    maxWidth: 320,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  paymentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  paymentTitle: {
    fontSize: 16,
  },
  paymentField: {
    gap: spacing.sm,
  },
  paymentLabel: {
    fontSize: 12,
    color: colors.ink,
  },
  selectRow: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#ffffff",
  },
  selectList: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#ffffff",
  },
  selectOption: {
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F3F5",
  },
  costToggle: {
    alignSelf: "flex-start",
  },
  costToggleText: {
    color: colors.ink,
    textDecorationLine: "underline",
    fontSize: 12,
  },
  costDetail: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: spacing.md,
    gap: 6,
  },
  costRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  costLabel: {
    fontSize: 12,
    color: colors.muted,
  },
  costValue: {
    fontSize: 12,
    color: colors.ink,
  },
  paymentActions: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  paymentAction: {
    flex: 1,
  },
  error: {
    color: colors.danger,
    textAlign: "center",
  },
  center: {
    padding: spacing.xl,
    alignItems: "center",
  },
});

export default EventDetailScreen;
