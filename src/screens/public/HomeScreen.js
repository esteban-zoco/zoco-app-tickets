import React, { useEffect, useMemo, useState } from "react";
import { FlatList, Image, Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useRoute } from "@react-navigation/native";
import LocationIcon from "../../assets/image/ubicacion 1.svg";
import CalendarIcon from "../../assets/image/calendario 1.svg";
import PriceIcon from "../../assets/image/dolar 1.svg";
import CloseIcon from "../../assets/image/xmarca 1.svg";
import { Calendar } from "react-native-calendars";
import Screen from "../../components/Screen";
import MobileHeader from "../../components/MobileHeader";
import HeroCarousel from "../../components/HeroCarousel";
import AppText from "../../components/AppText";
import Button from "../../components/Button";
import EventListItem from "../../components/EventListItem";
import { colors, spacing } from "../../theme";
import { getActiveBannerByCodeApi, getCategory, getFeaturedEvent, getSearchEvent, getState } from "../../services/api";


const HomeScreen = ({ navigation }) => {
  const route = useRoute();
  const tabBarHeight = useBottomTabBarHeight();
  const [bannerSlides, setBannerSlides] = useState([]);
  const [featuredEvents, setFeaturedEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [states, setStates] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedState, setSelectedState] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [modal, setModal] = useState(null);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [featuredRes, categoryRes, statesRes, bannerRes] = await Promise.all([
          getFeaturedEvent(),
          getCategory(),
          getState(),
          getActiveBannerByCodeApi("principal23"),
        ]);

        const featuredList = Array.isArray(featuredRes?.data?.info) ? featuredRes.data.info : [];
        setFeaturedEvents(featuredList);
        setCategories(categoryRes?.data?.info || []);
        setStates(statesRes?.data?.info || []);

        const banner = bannerRes?.data?.info || null;
        if (banner?.isVisible) {
          const mobile = Array.isArray(banner.mobile) ? banner.mobile : [];
          const desktop = Array.isArray(banner.desktop) ? banner.desktop : [];
          setBannerSlides(mobile.length ? mobile : desktop);
        } else {
          setBannerSlides([]);
        }
      } catch (err) {
        console.error("Home load error", err);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const categoryId = route?.params?.categoryId;
    const stateId = route?.params?.stateId;
    if (categoryId) setSelectedCategory(categoryId);
    if (stateId) setSelectedState(stateId);
  }, [route?.params?.categoryId, route?.params?.stateId]);

  const categoryData = useMemo(() => categories.slice(0, 12), [categories]);

  const getMinTicketPrice = (target) => {
    if (!target) return undefined;
    const list = Array.isArray(target.ticketTypes)
      ? target.ticketTypes
      : Array.isArray(target.tickettypes)
      ? target.tickettypes
      : [];
    const prices = list
      .map((ticket) => Number(ticket?.price ?? ticket?.amount ?? 0))
      .filter((value) => Number.isFinite(value));
    if (!prices.length) return undefined;
    return Math.min(...prices);
  };

  const getEventPriceValue = (event) => {
    const minTicketPrice = getMinTicketPrice(event);
    const basePrice = Number(event?.price ?? event?.amount ?? 0);
    if (Number.isFinite(minTicketPrice)) return minTicketPrice;
    if (Number.isFinite(basePrice)) return basePrice;
    return 0;
  };

  const filteredEvents = useMemo(() => {
    const list = Array.isArray(events) ? events : [];
    return list.filter((event) => {
      const categoryId = event?.categoryid || event?.categoryId || event?.category?._id || event?.category?.id;
      const stateId = event?.stateid || event?.stateId || event?.state?._id || event?.state?.id;
      if (selectedCategory && String(categoryId) !== String(selectedCategory)) {
        return false;
      }
      if (selectedState && String(stateId) !== String(selectedState)) {
        return false;
      }
      if (selectedDate) {
        const raw = String(event.startDate || event.date || "");
        const eventDate = raw.slice(0, 10);
        if (eventDate !== selectedDate) return false;
      }
      const min = Number(priceRange.min || 0);
      const max = Number(priceRange.max || 0);
      if (min || max) {
        const price = getEventPriceValue(event);
        if (min && price < min) return false;
        if (max && price > max) return false;
      }
      return true;
    });
  }, [events, selectedCategory, selectedState, selectedDate, priceRange]);

  const fetchEvents = async (nextPage = 1, { append = false } = {}) => {
    try {
      const payload = {
        categoryid: selectedCategory || "",
        statedid: selectedState || "",
        stateid: selectedState || "",
        stateId: selectedState || "",
        statedId: selectedState || "",
      };
      const res = await getSearchEvent(payload, nextPage);
      const info = res?.data?.info;
      const list = Array.isArray(info?.events)
        ? info.events
        : Array.isArray(info)
        ? info
        : Array.isArray(info?.data)
        ? info.data
        : [];
      const pageInfo = info?.pagination || {};
      if (append) {
        setEvents((prev) => {
          const prevList = Array.isArray(prev) ? prev : [];
          const existing = new Set(prevList.map((item) => item?._id || item?.id));
          const merged = [...prevList];
          list.forEach((item) => {
            const key = item?._id || item?.id;
            if (!existing.has(key)) merged.push(item);
          });
          return merged;
        });
      } else {
        setEvents(list);
      }
      setPagination({
        currentPage: Number(pageInfo.currentPage || nextPage || 1),
        totalPages: Number(pageInfo.totalPages || nextPage || 1),
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchEvents(1);
  }, [selectedCategory, selectedState]);

  const heroEvents = useMemo(() => {
    const list = featuredEvents.length ? featuredEvents : events;
    return Array.isArray(list) ? list.slice(0, 6) : [];
  }, [featuredEvents, events]);

  const heroSlides = useMemo(() => {
    const eventSlides = heroEvents.map((ev) => ev?.image).filter(Boolean);
    if (bannerSlides.length > 1) return bannerSlides;
    if (eventSlides.length > 1) return eventSlides;
    if (bannerSlides.length) return bannerSlides;
    return eventSlides;
  }, [bannerSlides, heroEvents]);

  const hasFilters =
    Boolean(selectedCategory || selectedState || selectedDate) || Boolean(priceRange.min || priceRange.max);

  const clearAllFilters = () => {
    setSelectedCategory(null);
    setSelectedState(null);
    setSelectedDate(null);
    setPriceRange({ min: "", max: "" });
  };

  const goTab = (tabName, params) => {
    const parent = navigation.getParent();
    const payload = params ? { screen: "Search", params } : undefined;
    if (parent) {
      parent.navigate(tabName, payload);
    } else if (payload) {
      navigation.navigate(tabName, payload);
    } else {
      navigation.navigate(tabName);
    }
  };

  const handleHeroPress = (event) => {
    if (!event) return;
    const id = event._id || event.id;
    if (id) navigation.navigate("EventDetail", { id });
  };

  return (
    <Screen scroll={false} style={{ backgroundColor: "#ffffff" }}>
      <MobileHeader
      />

      <ScrollView contentContainerStyle={{ paddingBottom: 48 + tabBarHeight }} showsVerticalScrollIndicator={false}>
        <HeroCarousel
          slides={heroSlides.length ? heroSlides : ["https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200"]}
          featuredEvents={heroEvents}
          onPressEvent={handleHeroPress}
          showInfoCard={false}
          showDots={false}
          height={250}
        />

        <View style={styles.filtersRow}>
          <Pressable style={styles.filterPill} onPress={() => setModal("location")}>
            <LocationIcon width={14} height={14} />
            <AppText style={styles.filterLabel}>Ubicacion</AppText>
          </Pressable>
          <Pressable style={styles.filterPill} onPress={() => setModal("date")}>
            <CalendarIcon width={14} height={14} />
            <AppText style={styles.filterLabel}>Fecha</AppText>
          </Pressable>
          <Pressable style={styles.filterPill} onPress={() => setModal("price")}>
            <PriceIcon width={14} height={14} />
            <AppText style={styles.filterLabel}>Precio</AppText>
          </Pressable>
        </View>

        <View style={styles.categoriesRow}>
          <FlatList
            data={categoryData}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item._id || item.id}
            contentContainerStyle={styles.categoryList}
            renderItem={({ item }) => {
              const active = String(selectedCategory) === String(item._id || item.id);
              const iconSrc = active
                ? item.hoverimage || item.image || item.icon
                : item.image || item.icon || item.hoverimage;
              return (
                <Pressable
                  style={[styles.categoryCard, active && styles.categoryCardActive]}
                  onPress={() => setSelectedCategory(active ? null : item._id || item.id)}
                >
                  {active ? (
                    <View style={styles.categoryClose}>
                      <CloseIcon width={10} height={10} />
                    </View>
                  ) : null}
                  {iconSrc ? (
                    <Image source={{ uri: iconSrc }} style={styles.categoryIcon} resizeMode="contain" />
                  ) : (
                    <View style={styles.categoryPlaceholder} />
                  )}
                  <AppText style={[styles.categoryName, active && styles.categoryNameActive]} numberOfLines={2}>
                    {item.name}
                  </AppText>
                </Pressable>
              );
            }}
          />
          {hasFilters ? (
            <Pressable style={styles.clearButton} onPress={clearAllFilters}>
              <AppText style={styles.clearButtonText}>Borrar todo</AppText>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.eventsList}>
          {filteredEvents.map((event) => (
            <EventListItem
              key={event._id || event.id}
              event={event}
              onPress={() => navigation.navigate("EventDetail", { id: event._id || event.id })}
            />
          ))}
          {pagination.currentPage < pagination.totalPages ? (
            <Button
              title={isLoadingMore ? "Cargando..." : "Ver mas"}
              variant="dark"
              style={styles.moreButton}
              onPress={() => {
                setIsLoadingMore(true);
                fetchEvents(pagination.currentPage + 1, { append: true });
              }}
              disabled={isLoadingMore}
            />
          ) : null}
        </View>
      </ScrollView>

      <Modal visible={modal === "location"} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <AppText weight="bold" style={styles.modalTitle}>
              Ubicacion
            </AppText>
            <FlatList
              data={states}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.modalItem}
                  onPress={() => {
                    setSelectedState(item._id);
                    setModal(null);
                  }}
                >
                  <AppText>{item.name}</AppText>
                </Pressable>
              )}
            />
            <View style={styles.modalActions}>
              <Button title="Limpiar" variant="ghost" onPress={() => setSelectedState(null)} />
              <Button title="Cerrar" variant="ghost" onPress={() => setModal(null)} />
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={modal === "date"} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <AppText weight="bold" style={styles.modalTitle}>
              Elegir fecha
            </AppText>
            <View style={styles.quickRow}>
              <Pressable style={styles.quickChip} onPress={() => setSelectedDate(new Date().toISOString().slice(0, 10))}>
                <AppText style={styles.quickText}>Hoy</AppText>
              </Pressable>
              <Pressable
                style={styles.quickChip}
                onPress={() => {
                  const tomorrow = new Date();
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  setSelectedDate(tomorrow.toISOString().slice(0, 10));
                }}
              >
                <AppText style={styles.quickText}>Manana</AppText>
              </Pressable>
              <Pressable
                style={styles.quickChip}
                onPress={() => {
                  const today = new Date();
                  const end = new Date();
                  end.setDate(today.getDate() + (6 - today.getDay()));
                  setSelectedDate(end.toISOString().slice(0, 10));
                }}
              >
                <AppText style={styles.quickText}>Esta semana</AppText>
              </Pressable>
            </View>
            <Calendar
              onDayPress={(day) => setSelectedDate(day.dateString)}
              markedDates={selectedDate ? { [selectedDate]: { selected: true, selectedColor: colors.brand } } : {}}
              theme={{
                todayTextColor: colors.brand,
                arrowColor: colors.ink,
                textDayFontFamily: "Montserrat_500Medium",
                textMonthFontFamily: "Montserrat_600SemiBold",
                textDayHeaderFontFamily: "Montserrat_500Medium",
              }}
            />
            <View style={styles.modalActions}>
              <Button title="Limpiar" variant="ghost" onPress={() => setSelectedDate(null)} />
              <Button title="Cerrar" variant="ghost" onPress={() => setModal(null)} />
              <Button title="Aplicar" variant="dark" onPress={() => setModal(null)} />
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={modal === "price"} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <AppText weight="bold" style={styles.modalTitle}>
              Precio
            </AppText>
            <View style={styles.priceRow}>
              <View style={styles.priceField}>
                <AppText style={styles.priceLabel}>Min</AppText>
                <TextInput
                  value={priceRange.min}
                  onChangeText={(value) => setPriceRange((prev) => ({ ...prev, min: value }))}
                  keyboardType="number-pad"
                  placeholder="0"
                  style={styles.priceInput}
                />
              </View>
              <View style={styles.priceField}>
                <AppText style={styles.priceLabel}>Max</AppText>
                <TextInput
                  value={priceRange.max}
                  onChangeText={(value) => setPriceRange((prev) => ({ ...prev, max: value }))}
                  keyboardType="number-pad"
                  placeholder="50000"
                  style={styles.priceInput}
                />
              </View>
            </View>
            <View style={styles.modalActions}>
              <Button title="Limpiar" variant="ghost" onPress={() => setPriceRange({ min: "", max: "" })} />
              <Button title="Cerrar" variant="ghost" onPress={() => setModal(null)} />
              <Button title="Aplicar" variant="dark" onPress={() => setModal(null)} />
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
};

const styles = StyleSheet.create({
  filtersRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  filterPill: {
    flex: 1,
    height: 38,
    backgroundColor: "#ffffff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.ink,
  },
  categoriesRow: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  categoryList: {
    gap: 8,
    paddingRight: spacing.lg,
  },
  categoryCard: {
    width: 70,
    height: 60,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D0D5DD",
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    padding: 4,
  },
  categoryCardActive: {
    borderColor: colors.brand,
  },
  categoryClose: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#D0D5DD",
  },
  categoryIcon: {
    width: 22,
    height: 22,
  },
  categoryPlaceholder: {
    width: 22,
    height: 22,
    borderRadius: 4,
    backgroundColor: "#E9EDF2",
  },
  categoryName: {
    fontSize: 10,
    textAlign: "center",
  },
  categoryNameActive: {
    color: colors.brand,
  },
  clearButton: {
    alignSelf: "flex-start",
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: "#D0D5DD",
    borderRadius: 20,
    paddingHorizontal: 16,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
  },
  clearButtonText: {
    fontSize: 12,
    color: colors.ink,
  },
  eventsList: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
    gap: 12,
  },
  moreButton: {
    alignSelf: "center",
    marginTop: spacing.md,
    width: 120,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#ffffff",
    padding: spacing.xl,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "80%",
    gap: spacing.md,
  },
  modalTitle: {
    fontSize: 16,
  },
  modalItem: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "#E7E7E7",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  quickRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  quickChip: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#ffffff",
  },
  quickText: {
    fontSize: 12,
    textTransform: "uppercase",
    fontWeight: "700",
  },
  priceRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  priceField: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E7E7E7",
    borderRadius: 12,
    padding: spacing.md,
  },
  priceLabel: {
    fontSize: 12,
    color: colors.muted,
  },
  priceInput: {
    fontSize: 14,
    color: colors.ink,
    paddingVertical: 4,
  },
});

export default HomeScreen;
