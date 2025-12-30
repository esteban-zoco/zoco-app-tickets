import React, { useEffect, useState } from "react";
import { Image, StyleSheet, View } from "react-native";
import Screen from "../../components/Screen";
import AppText from "../../components/AppText";
import Loading from "../../components/Loading";
import { colors, spacing } from "../../theme";
import { getBlogById } from "../../services/api";
import { formatDate } from "../../utils/format";

const BlogDetailScreen = ({ route }) => {
  const [blog, setBlog] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const id = route?.params?.id;

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setIsLoading(true);
        const res = await getBlogById(id);
        setBlog(res?.data?.info || null);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [id]);

  if (isLoading) return <Loading />;
  if (!blog) {
    return (
      <Screen>
        <View style={styles.center}>
          <AppText>Blog no encontrado</AppText>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <Image source={{ uri: blog.image }} style={styles.cover} />
      <View style={styles.content}>
        <AppText style={styles.date}>{formatDate(blog.date)}</AppText>
        <AppText weight="bold" style={styles.title}>
          {blog.title}
        </AppText>
        <AppText style={styles.description}>{blog.description}</AppText>
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  cover: {
    width: "100%",
    height: 240,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  date: {
    color: colors.muted,
  },
  title: {
    fontSize: 20,
    color: colors.ink,
  },
  description: {
    color: colors.text,
  },
  center: {
    padding: spacing.xl,
    alignItems: "center",
  },
});

export default BlogDetailScreen;
