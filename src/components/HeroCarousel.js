import React, { useEffect, useRef, useState } from "react";
import { ImageBackground, Pressable, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import AppText from "./AppText";
import Button from "./Button";
import { colors, spacing } from "../theme";
import { formatDate } from "../utils/format";

const HeroCarousel = ({ slides = [], featuredEvents = [], onPressEvent, showInfoCard = true, height = 220 }) => {
  const [index, setIndex] = useState(0);
  const timer = useRef(null);

  useEffect(() => {
    if (!slides.length) return undefined;
    timer.current = setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer.current);
  }, [slides]);

  const activeEvent = featuredEvents.length ? featuredEvents[index % featuredEvents.length] : null;
  const image = slides[index] || slides[0];

  const canPress = Boolean(onPressEvent && activeEvent);

  return (
    <View style={styles.wrapper}>
      <Pressable
        style={[styles.hero, { height }]}
        onPress={() => {
          if (canPress) onPressEvent(activeEvent);
        }}
        disabled={!canPress}
      >
        <ImageBackground source={{ uri: image }} style={StyleSheet.absoluteFillObject} imageStyle={styles.heroImage}>
          {showInfoCard ? (
            <LinearGradient colors={["rgba(0,0,0,0.45)", "rgba(0,0,0,0.65)"]} style={styles.overlay} />
          ) : null}
        </ImageBackground>
        {showInfoCard && activeEvent ? (
          <View style={styles.card}>
            <AppText weight="bold" style={styles.cardTitle} numberOfLines={2}>
              {activeEvent.name}
            </AppText>
            <AppText style={styles.cardMeta}>{formatDate(activeEvent.startDate)}</AppText>
            <AppText style={styles.cardMeta} numberOfLines={2}>
              {activeEvent.fulladdress}
            </AppText>
            <Button title="Ver tickets" style={styles.cardButton} onPress={() => onPressEvent?.(activeEvent)} />
          </View>
        ) : null}
      </Pressable>
      {slides.length > 1 ? (
        <View style={styles.dots}>
          {slides.map((_, i) => (
            <View key={`dot-${i}`} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  hero: {
    height: 220,
    borderRadius: 10,
    overflow: "hidden",
    justifyContent: "flex-end",
    backgroundColor: "#000000",
  },
  heroImage: {
    borderRadius: 10,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  card: {
    backgroundColor: "rgba(255,255,255,0.92)",
    margin: spacing.lg,
    borderRadius: 20,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  cardTitle: {
    fontSize: 18,
    color: colors.ink,
  },
  cardMeta: {
    color: colors.muted,
    fontSize: 12,
  },
  cardButton: {
    alignSelf: "flex-start",
    marginTop: spacing.sm,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginTop: spacing.md,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#d4d7e3",
  },
  dotActive: {
    backgroundColor: colors.brand,
  },
});

export default HeroCarousel;
