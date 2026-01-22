import React, { useEffect, useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { Calendar } from "react-native-calendars";
import Screen from "../../components/Screen";
import MobileHeader from "../../components/MobileHeader";
import AppText from "../../components/AppText";
import Button from "../../components/Button";
import EventListItem from "../../components/EventListItem";
import Loading from "../../components/Loading";
import { colors, fontFamilies, spacing } from "../../theme";
import { getCity, getEventById, getSearchEvent } from "../../services/api";
import { formatDate } from "../../utils/format";
import { getEventBasePriceValue, getMinTicketPrice } from "../../utils/price";

const SearchScreen = ({ navigation }) => {
  const tabBarHeight = useBottomTabBarHeight();
  const [events, setEvents] = useState([]);
  const [cities, setCities] = useState([]);
  const [query, setQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [modal, setModal] = useState(null);
  const [isEventsLoading, setIsEventsLoading] = useState(true);
  const [minPrices, setMinPrices] = useState({});

  useEffect(() => {
    const load = async () => {
      try {
        const [cityRes] = await Promise.all([getCity()]);
        setCities(Array.isArray(cityRes?.data?.info) ? cityRes.data.info : []);
      } catch (err) {
        console.error("Search city load error", err);
      }
    };
    load();
  }, []);

  const fetchEvents = async () => {
    setIsEventsLoading(true);
    try {
      const all = [];
      const seen = new Set();
      let page = 1;
      let totalPages = 1;
      do {
        const res = await getSearchEvent({}, page);
        const info = res?.data?.info;
        const list = Array.isArray(info?.events)
          ? info.events
          : Array.isArray(info)
          ? info
          : Array.isArray(info?.data)
          ? info.data
          : [];
        list.forEach((item) => {
          const key = item?._id || item?.id;
          if (key && !seen.has(key)) {
            seen.add(key);
            all.push(item);
          }
        });
        const pageInfo = info?.pagination || {};
        const nextTotal = Number(pageInfo.totalPages || totalPages || 1);
        totalPages = Number.isFinite(nextTotal) && nextTotal > 0 ? nextTotal : totalPages;
        page += 1;
      } while (page <= totalPages);
      setEvents(all);
      preloadMinPrices(all);
    } catch (err) {
      console.error("Search events error", err);
    } finally {
      setIsEventsLoading(false);
    }
  };

  const preloadMinPrices = async (eventsList) => {
    const list = Array.isArray(eventsList) ? eventsList : [];
    const pending = list.filter((event) => {
      const id = event?._id || event?.id;
      if (!id) return false;
      if (minPrices[id] !== undefined) return false;
      if (event?.isFree) return false;
      const basePrice = getEventBasePriceValue(event);
      const localMin = getMinTicketPrice(event);
      if (Number.isFinite(localMin)) return false;
      if (Number.isFinite(basePrice) && basePrice > 0) return false;
      return true;
    });
    if (!pending.length) return;
    try {
      const pairs = await Promise.all(
        pending.map(async (event) => {
          const id = event?._id || event?.id;
          try {
            const res = await getEventById(id);
            const info = res?.data?.info;
            const eventData = info?.event || info || {};
            const eventWithTypes = {
              ...eventData,
              ticketTypes: info?.ticketTypes ?? eventData?.ticketTypes,
              tickettypes: info?.tickettypes ?? eventData?.tickettypes,
            };
            const min = getMinTicketPrice(eventWithTypes);
            return [id, min];
          } catch (err) {
            return [id, null];
          }
        })
      );
      const updates = {};
      pairs.forEach(([id, min]) => {
        if (Number.isFinite(min)) updates[id] = min;
      });
      if (Object.keys(updates).length) {
        setMinPrices((prev) => ({ ...prev, ...updates }));
      }
    } catch (err) {
      console.error("Min price preload error", err);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const filteredEvents = useMemo(() => {
    const text = query.trim().toLowerCase();
    return (Array.isArray(events) ? events : []).filter((event) => {
      if (text) {
        const haystack = [
          event?.name,
          event?.title,
          event?.venue?.name,
          event?.venue,
          event?.location,
          event?.fulladdress,
          event?.city?.name,
          event?.city,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(text)) return false;
      }
      if (selectedDate) {
        const raw = String(event?.startDate || event?.date || "");
        const eventDate = raw.slice(0, 10);
        if (eventDate !== selectedDate) return false;
      }
      if (selectedCity?.id || selectedCity?.name) {
        const cityId =
          event?.cityid ||
          event?.cityId ||
          event?.city?._id ||
          event?.city?.id ||
          event?.venue?.cityid ||
          event?.venue?.cityId ||
          event?.venue?.city?._id ||
          event?.venue?.city?.id;
        const cityName =
          event?.city?.name ||
          event?.city ||
          event?.venue?.city?.name ||
          event?.venue?.city ||
          "";
        if (selectedCity?.id && cityId && String(cityId) !== String(selectedCity.id)) {
          return false;
        }
        if (!cityId && selectedCity?.name) {
          if (!String(cityName).toLowerCase().includes(String(selectedCity.name).toLowerCase())) {
            return false;
          }
        }
      }
      return true;
    });
  }, [events, query, selectedDate, selectedCity]);

  const dateLabel = selectedDate ? formatDate(selectedDate, "DD.MM") : "Fecha";
  const cityLabel = selectedCity?.name || "Ciudad";

  if (isEventsLoading) {
    return <Loading />;
  }

  return (
    <Screen scroll={false} style={styles.screen}>
      <MobileHeader />

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 24 + tabBarHeight }]} showsVerticalScrollIndicator={false}>
        <View style={styles.panel}>
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={18} color="#2D3035" />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Buscar eventos"
              placeholderTextColor="#2D3035"
              style={styles.searchInput}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {query ? (
              <Pressable style={styles.clearBtn} onPress={() => setQuery("")}>
                <Ionicons name="close" size={16} color="#2D3035" />
              </Pressable>
            ) : null}
          </View>

          <View style={styles.filtersRow}>
            <Pressable style={styles.filterChip} onPress={() => setModal("date")}>
              <Ionicons name="calendar-outline" size={14} color="#2D3035" />
              <AppText style={styles.filterText}>{dateLabel}</AppText>
            </Pressable>
            <Pressable style={styles.filterChip} onPress={() => setModal("city")}>
              <Ionicons name="location-outline" size={14} color="#2D3035" />
              <AppText style={styles.filterText}>{cityLabel}</AppText>
            </Pressable>
          </View>

          <View style={styles.results}>
            {filteredEvents.map((event) => (
              <EventListItem
                key={event?._id || event?.id}
                event={event}
                minTicketPrice={minPrices[event?._id || event?.id]}
                onPress={() => navigation.navigate("EventDetail", { id: event?._id || event?.id })}
              />
            ))}

            {!filteredEvents.length ? (
              <View style={styles.emptyState}>
                <AppText style={styles.emptyText}>No encontramos eventos con esos filtros.</AppText>
              </View>
            ) : null}

          </View>
        </View>
      </ScrollView>

      <Modal visible={modal === "date"} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <AppText weight="bold" style={styles.modalTitle}>
              Fecha
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
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={modal === "city"} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <AppText weight="bold" style={styles.modalTitle}>
              Ciudad
            </AppText>
            <ScrollView>
              {cities.map((city) => {
                const id = city?._id || city?.id;
                return (
                  <Pressable
                    key={id}
                    style={styles.modalItem}
                    onPress={() => {
                      setSelectedCity({ id, name: city?.name || "Ciudad" });
                      setModal(null);
                    }}
                  >
                    <AppText>{city?.name}</AppText>
                  </Pressable>
                );
              })}
            </ScrollView>
            <View style={styles.modalActions}>
              <Button title="Limpiar" variant="ghost" onPress={() => setSelectedCity(null)} />
              <Button title="Cerrar" variant="ghost" onPress={() => setModal(null)} />
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
};

const styles = StyleSheet.create({
  screen: {
    backgroundColor: "#fff",
    paddingBottom: 60,
  },
  content: {
    padding: 0,
  },
  panel: {
    backgroundColor: "#fff",
    borderRadius: 0,
    padding: spacing.lg,
    gap: spacing.md,
  },
  searchBar: {
    height: 44,
    backgroundColor: "#FFF",
    borderRadius: 10,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderColor: "#2D3035",
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    color: "#2D3035",
    fontSize: 14,
    fontFamily: fontFamilies.regular,
  },
  clearBtn: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  filtersRow: {
    flexDirection: "row",
    gap: 10,
  },
  filterChip: {
    height: 32,
    borderRadius: 10,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#2D3035",
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  filterText: {
    color: "#2D3035",
    fontSize: 12,
  },
  results: {
    marginTop: spacing.lg,
    gap: 12,
  },
  emptyState: {
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  emptyText: {
    color: "#A5A9B5",
    fontSize: 12,
    textAlign: "center",
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
    paddingBottom: 60,
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
});

export default SearchScreen;
