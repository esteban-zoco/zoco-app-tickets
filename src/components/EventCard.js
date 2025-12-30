import React from "react";
import { Image, Pressable, StyleSheet, View } from "react-native";
import AppText from "./AppText";
import { colors, shadows, spacing } from "../theme";
import { formatDate } from "../utils/format";

const EventCard = ({ event, onPress }) => {
  const image = event?.image || event?.banner || event?.cover || event?.imageUrl;
  const name = event?.name || event?.title || "Evento";
  const date = formatDate(event?.startDate || event?.date);
  const location = event?.fulladdress || event?.venue || event?.location || "";

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <Image
        source={image ? { uri: image } : require("../assets/image/homepagemob.png")}
        style={styles.image}
        resizeMode="cover"
      />
      <View style={styles.body}>
        <AppText weight="bold" style={styles.title} numberOfLines={2}>
          {name}
        </AppText>
        {date ? (
          <AppText style={styles.meta}>{date}</AppText>
        ) : null}
        {location ? (
          <AppText style={styles.meta} numberOfLines={1}>
            {location}
          </AppText>
        ) : null}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    overflow: "hidden",
    marginBottom: spacing.lg,
    ...shadows.soft,
  },
  image: {
    width: "100%",
    height: 170,
  },
  body: {
    padding: spacing.lg,
    gap: spacing.xs,
  },
  title: {
    fontSize: 16,
    color: colors.ink,
  },
  meta: {
    fontSize: 12,
    color: colors.muted,
  },
});

export default EventCard;
