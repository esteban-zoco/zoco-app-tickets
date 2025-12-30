import React, { useEffect, useState } from "react";
import { Image, Pressable, StyleSheet, View } from "react-native";
import Screen from "../../components/Screen";
import AppText from "../../components/AppText";
import Loading from "../../components/Loading";
import { colors, shadows, spacing } from "../../theme";
import { getAllBlog } from "../../services/api";
import { formatDate } from "../../utils/format";

const BlogListScreen = ({ navigation }) => {
  const [blogs, setBlogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        const res = await getAllBlog(1);
        setBlogs(res?.data?.info || []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  if (isLoading) return <Loading />;

  return (
    <Screen>
      <View style={styles.container}>
        {blogs.map((blog) => (
          <Pressable key={blog._id} style={styles.card} onPress={() => navigation.navigate("BlogDetail", { id: blog._id })}>
            <Image source={{ uri: blog.image }} style={styles.image} />
            <View style={styles.body}>
              <AppText style={styles.date}>{formatDate(blog.date)}</AppText>
              <AppText weight="bold" numberOfLines={2} style={styles.title}>
                {blog.title}
              </AppText>
              <AppText numberOfLines={3} style={styles.desc}>
                {blog.description}
              </AppText>
            </View>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    overflow: "hidden",
    ...shadows.soft,
  },
  image: {
    width: "100%",
    height: 180,
  },
  body: {
    padding: spacing.lg,
    gap: spacing.xs,
  },
  date: {
    color: colors.muted,
    fontSize: 12,
  },
  title: {
    fontSize: 16,
    color: colors.ink,
  },
  desc: {
    color: colors.muted,
    fontSize: 13,
  },
});

export default BlogListScreen;
