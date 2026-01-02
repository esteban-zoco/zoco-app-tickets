import React, { useEffect, useRef, useState } from "react";
import { FlatList, ImageBackground, Pressable, StyleSheet, useWindowDimensions, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import AppText from "./AppText";
import Button from "./Button";
import { colors, spacing } from "../theme";
import { formatDate } from "../utils/format";

const HeroCarousel = ({
  slides = [],
  featuredEvents = [],
  onPressEvent,
  showInfoCard = true,
  showDots = true,
  height = 220,
}) => {
  const [index, setIndex] = useState(0);
  const timer = useRef(null);
  const listRef = useRef(null);
  const { width } = useWindowDimensions();
  const cardGap = spacing.md;
  const horizontalPadding = spacing.lg;
  const targetWidth = Math.round(width * 0.84);
  const maxWidth = width - horizontalPadding * 2;
  const cardWidth = Math.max(240, Math.min(targetWidth, maxWidth));

  useEffect(() => {
    if (slides.length <= 1) return undefined;
    timer.current = setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, 4500);
    return () => clearInterval(timer.current);
  }, [slides.length]);

  useEffect(() => {
    if (!slides.length) return;
    setIndex(0);
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [slides.length, cardWidth, cardGap]);

  useEffect(() => {
    if (!slides.length) return;
    const offset = index * (cardWidth + cardGap);
    listRef.current?.scrollToOffset({ offset, animated: true });
  }, [index, slides.length, cardWidth, cardGap]);

  return (
    <View style={styles.wrapper}>
      <FlatList
        ref={listRef}
        data={slides}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, idx) => `slide-${idx}`}
        contentContainerStyle={[styles.list, { paddingHorizontal: horizontalPadding }]}
        snapToInterval={cardWidth + cardGap}
        snapToAlignment="start"
        disableIntervalMomentum
        decelerationRate="fast"
        scrollEnabled={slides.length > 1}
        getItemLayout={(_, idx) => ({
          length: cardWidth + cardGap,
          offset: (cardWidth + cardGap) * idx,
          index: idx,
        })}
        onMomentumScrollEnd={(event) => {
          const step = cardWidth + cardGap;
          const nextIndex = Math.round((event.nativeEvent.contentOffset.x || 0) / step);
          if (Number.isFinite(nextIndex)) setIndex(nextIndex);
        }}
        onScrollToIndexFailed={(info) => {
          const offset = info.averageItemLength * info.index;
          listRef.current?.scrollToOffset({ offset, animated: true });
        }}
        ItemSeparatorComponent={() => <View style={{ width: cardGap }} />}
        renderItem={({ item, index: slideIndex }) => {
          const event = featuredEvents[slideIndex];
          const canSlidePress = Boolean(onPressEvent && event);
          return (
            <Pressable
              style={[styles.hero, { height, width: cardWidth }]}
              onPress={() => {
                if (canSlidePress) onPressEvent(event);
              }}
              disabled={!canSlidePress}
            >
              <ImageBackground source={{ uri: item }} style={StyleSheet.absoluteFillObject} imageStyle={styles.heroImage}>
                {showInfoCard ? (
                  <LinearGradient colors={["rgba(0,0,0,0.45)", "rgba(0,0,0,0.65)"]} style={styles.overlay} />
                ) : null}
              </ImageBackground>
              {showInfoCard && event ? (
                <View style={styles.card}>
                  <AppText weight="bold" style={styles.cardTitle} numberOfLines={2}>
                    {event.name}
                  </AppText>
                  <AppText style={styles.cardMeta}>{formatDate(event.startDate)}</AppText>
                  <AppText style={styles.cardMeta} numberOfLines={2}>
                    {event.fulladdress}
                  </AppText>
                  <Button title="Ver tickets" style={styles.cardButton} onPress={() => onPressEvent?.(event)} />
                </View>
              ) : null}
            </Pressable>
          );
        }}
      />
      {showDots && slides.length > 1 ? (
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
    paddingTop: spacing.md,
  },
  list: {
    paddingVertical: 0,
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
