import React from "react";
import { Image, Pressable, StyleSheet, View } from "react-native";
import AppText from "./AppText";
import { colors, spacing } from "../theme";
import { formatDate, formatCurrency } from "../utils/format";

const EventListItem = ({ event, onPress }) => {
  const image = event?.image || event?.banner || event?.cover;
  const title = event?.name || event?.title || "Evento";
  const location = event?.fulladdress || event?.venue || event?.location || "";
  const date = formatDate(event?.startDate || event?.date, "D MMM. - YYYY");
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

  const minTicketPrice = getMinTicketPrice(event);
  const basePrice = Number(event?.price ?? event?.amount ?? 0);
  const safeBasePrice = Number.isFinite(basePrice) ? basePrice : 0;
  const priceValue = Number.isFinite(minTicketPrice) ? minTicketPrice : safeBasePrice;
  const isFree = Boolean(event?.isFree) || priceValue <= 0;
  const prefix = Number.isFinite(minTicketPrice) && (!basePrice || basePrice === 0) ? "Desde " : "";
  const price = isFree ? "Gratis" : `${prefix}${formatCurrency(priceValue)}`;

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.imageWrap}>
        <Image source={image ? { uri: image } : require("../assets/image/descarga.png")} style={styles.image} />
      </View>
      <View style={styles.body}>
        <AppText weight="bold" style={styles.title} numberOfLines={1}>
          {title}
        </AppText>
        <AppText style={styles.meta} numberOfLines={1}>
          {location}
        </AppText>
        <AppText style={styles.meta}>{date}</AppText>
        <AppText style={styles.price}>{price}</AppText>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E7EDF3",
    paddingRight: spacing.lg,
    height: 120,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  imageWrap: {
    width: 110,
    height: 120,
    borderRadius: 12,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  body: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 16,
    color: colors.ink,
  },
  meta: {
    fontSize: 13,
    color: colors.ink,
  },
  price: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "500",
    color: colors.ink,
  },
});

export default EventListItem;
