import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Image, ImageBackground, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useFocusEffect } from "@react-navigation/native";
import dayjs from "dayjs";
import Screen from "../../components/Screen";
import AppText from "../../components/AppText";
import Loading from "../../components/Loading";
import AuthRequiredScreen from "../auth/AuthRequiredScreen";
import { colors, spacing } from "../../theme";
import { getMyEventsApi } from "../../services/api";
import { useAuth } from "../../store/AuthContext";
import CalendarIcon from "../../assets/image/calendario 1-white.svg";
import LocationIcon from "../../assets/image/ubicacion 1-white.svg";
import TicketIcon from "../../assets/image/boleto-2 1-white.svg";
import EmptyIcon from "../../assets/image/cancelacion 1.svg";
import FacebookIcon from "../../assets/facebook.svg";
import InstagramIcon from "../../assets/instagram.svg";
import YoutubeIcon from "../../assets/youtube.svg";

const brandLogo = require("../../assets/image/logo.e3c0b2196cc23f84f67a.png");

const MyEventsScreen = ({ navigation }) => {
  const { state } = useAuth();
  const tabBarHeight = useBottomTabBarHeight();
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tab, setTab] = useState("todos");
  const footerLinks = ["Eventos", "Politica de Privacidad", "Terminos y Condiciones", "Necesitas soporte?"];
  const hasLoadedRef = useRef(false);
  const isFetchingRef = useRef(false);

  const goTab = (tabName) => {
    const parent = navigation.getParent();
    const tabParent = parent?.getParent?.() || parent;
    if (tabParent) {
      tabParent.navigate(tabName);
      return;
    }
    navigation.navigate(tabName);
  };

  const loadEvents = useCallback(
    async ({ showLoader = false } = {}) => {
      if (!state.isAuthenticated || isFetchingRef.current) return;
      isFetchingRef.current = true;
      if (showLoader) setIsLoading(true);
      try {
        const res = await getMyEventsApi();
        setEvents(res?.data?.info || []);
      } catch (err) {
        console.error(err);
      } finally {
        if (showLoader) setIsLoading(false);
        isFetchingRef.current = false;
      }
    },
    [state.isAuthenticated]
  );

  useEffect(() => {
    if (state.isAuthenticated) return;
    hasLoadedRef.current = false;
    setEvents([]);
    setIsLoading(true);
  }, [state.isAuthenticated]);

  useFocusEffect(
    useCallback(() => {
      if (!state.isAuthenticated) return;
      const showLoader = !hasLoadedRef.current;
      loadEvents({ showLoader });
      hasLoadedRef.current = true;
    }, [state.isAuthenticated, loadEvents])
  );

  const withStatus = useMemo(() => {
    const now = dayjs();
    const nextWeek = now.add(7, "day");
    return (events || []).map((ev) => {
      const start = dayjs(String(ev.startDate || ev.date || ev.start || "").slice(0, 10));
      const isPast = start.isValid() ? start.isBefore(now, "day") : false;

      const ticketsPurchased = Number(ev.ticketsPurchased || ev.totalTickets || ev.count || 0);
      const redeemedCandidates = [ev.redeemedTickets, ev.ticketsRedeemed, ev.ticketsUsed, ev.redeemed].filter(
        (value) => typeof value !== "undefined"
      );
      let redeemed = 0;
      if (redeemedCandidates.length) redeemed = Number(redeemedCandidates[0] || 0);
      if (Array.isArray(ev.tickets)) {
        try {
          redeemed = ev.tickets.filter((t) => (t.status || t.state) === "redeemed" || t.redeemed === true).length;
        } catch {}
      }

      let status = "vigente";
      if (isPast) status = "expirado";
      if (ticketsPurchased > 0 && redeemed >= ticketsPurchased) status = "canjeado";
      const isSoon = start.isValid() && start.isAfter(now) && start.isBefore(nextWeek);

      return { ...ev, _status: status, _start: start, _purchased: ticketsPurchased, _redeemed: redeemed, _isSoon: isSoon };
    });
  }, [events]);

  const filtered = useMemo(() => {
    if (tab === "todos") return withStatus;
    return withStatus.filter((item) => item._status === tab);
  }, [withStatus, tab]);

  if (!state.isAuthenticated) return <AuthRequiredScreen />;
  if (isLoading) return <Loading />;

  return (
    <Screen scroll={false} style={{ backgroundColor: "#ffffff" }}>
      <ScrollView contentContainerStyle={[styles.container, { paddingBottom: spacing.xl + tabBarHeight }]} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <AppText weight="bold" style={styles.title}>
            Mis eventos
          </AppText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
            {[
              { id: "todos", label: "Todos" },
              { id: "vigente", label: "Vigentes" },
              { id: "canjeado", label: "Canjeados" },
              { id: "expirado", label: "Expirados" },
            ].map((item) => {
              const active = tab === item.id;
              return (
                <Pressable
                  key={item.id}
                  style={[styles.tab, active && styles.tabActive]}
                  onPress={() => setTab(item.id)}
                >
                  <AppText style={[styles.tabText, active && styles.tabTextActive]}>{item.label}</AppText>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Image source={EmptyIcon} style={styles.emptyIcon} />
            <AppText style={styles.emptyText}>Todavia no compraste entradas</AppText>
          </View>
        ) : (
          <View style={styles.grid}>
            {filtered.map((item, idx) => {
              const id = item.eventid || item.id || item._id || idx;
              const dateStr = (() => {
                const d = dayjs(String(item.startDate || item.date || item.start || "").slice(0, 10));
                return d.isValid() ? d.format("D MMM. - YYYY") : "";
              })();
              const entries = Number(item.ticketsPurchased || item.totalTickets || item.count || 0);
              const image = item.image || item.cover || item.banner || item.poster;
              return (
                <Pressable key={String(id)} style={styles.card} onPress={() => navigation.navigate("MyEventDetail", { id })}>
                  <ImageBackground
                    source={image ? { uri: image } : require("../../assets/image/descarga.png")}
                    style={styles.cardImage}
                    imageStyle={styles.cardImageInner}
                    blurRadius={10}
                  >
                    <LinearGradient
                      colors={["rgba(0,0,0,0.35)", "rgba(0,0,0,0.15)", "rgba(0,0,0,0.35)"]}
                      style={StyleSheet.absoluteFillObject}
                    />
                    <View style={styles.cardContent}>
                      <AppText weight="bold" style={styles.cardTitle} numberOfLines={2}>
                        {item.name || "Evento"}
                      </AppText>
                      <View style={styles.metaList}>
                        <View style={styles.metaItem}>
                          <CalendarIcon width={14} height={14} />
                          <AppText style={styles.metaText}>{dateStr}</AppText>
                        </View>
                        <View style={styles.metaItem}>
                          <LocationIcon width={14} height={14} />
                          <AppText style={styles.metaText} numberOfLines={1}>
                            {item.fulladdress || item.venue || item.location}
                          </AppText>
                        </View>
                        <View style={styles.metaItem}>
                          <TicketIcon width={14} height={14} />
                          <AppText style={styles.metaText}>
                            {entries} {entries === 1 ? "entrada" : "entradas"}
                          </AppText>
                        </View>
                      </View>
                    </View>
                  </ImageBackground>
                </Pressable>
              );
            })}
          </View>
        )}

        <View style={styles.footer}>
          <Image source={brandLogo} style={styles.footerLogo} resizeMode="contain" />
          <AppText style={styles.footerTagline}>La unica plataforma sin cargos de servicios</AppText>
          <View style={styles.footerSocial}>
            <View style={styles.footerIcon}>
              <FacebookIcon width={16} height={16} />
            </View>
            <View style={styles.footerIcon}>
              <InstagramIcon width={16} height={16} />
            </View>
            <View style={styles.footerIcon}>
              <YoutubeIcon width={16} height={16} />
            </View>
          </View>
          <View style={styles.footerLinks}>
            {footerLinks.map((label) => (
              <AppText key={label} style={styles.footerLink}>
                {label}
              </AppText>
            ))}
          </View>
          <AppText style={styles.footerCopy}>Copyright © ZOCO 2025</AppText>
        </View>
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingTop: 20,
    gap: spacing.lg,
  },
  header: {
    gap: 8,
  },
  title: {
    fontSize: 24,
    color: colors.ink,
    paddingBottom: 24,
  },
  tabs: {
    gap: 8,
    paddingVertical: 4,
  },
  tab: {
    borderRadius: 5,
    borderWidth: 1,
    borderColor: colors.ink,
    paddingVertical: 6,
    paddingHorizontal: 14,
    backgroundColor: "#ffffff",
  },
  tabActive: {
    backgroundColor: "#F1F6D8",
    borderColor: "#BAC819",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.ink,
  },
  tabTextActive: {
    color: colors.ink,
  },
  grid: {
    gap: 16,
  },
  card: {
    height: 160,
    borderRadius: 10,
    overflow: "hidden",
  },
  cardImage: {
    flex: 1,
    justifyContent: "center",
  },
  cardImageInner: {
    borderRadius: 10,
  },
  cardContent: {
    paddingHorizontal: 32,
    paddingVertical: 19,
    gap: 10,
  },
  cardTitle: {
    fontSize: 18,
    color: "#ffffff",
  },
  metaList: {
    gap: 6,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    color: "#ffffff",
    fontSize: 14,
    flex: 1,
  },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 150,
    gap: 12,
  },
  emptyIcon: {
    width: 48,
    height: 48,
    resizeMode: "contain",
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.ink,
  },
  footer: {
    marginTop: 300,
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  footerLogo: {
    width: 110,
    height: 32,
  },
  footerTagline: {
    fontSize: 12,
    color: colors.muted,
  },
  footerSocial: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  footerIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
  },
  footerLinks: {
    marginTop: spacing.sm,
    gap: spacing.xs,
    alignItems: "flex-start",
  },
  footerLink: {
    fontSize: 12,
    color: colors.muted,
  },
  footerCopy: {
    marginTop: spacing.sm,
    fontSize: 11,
    color: colors.muted,
  },
});

export default MyEventsScreen;
