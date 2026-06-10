"use client";
import { useEffect, useMemo, useState } from "react";
import PostCard from "./PostCard";
import { Box, Paper, Skeleton, Stack, Typography } from "@mui/material";
import PaginationCustom from "../PaginationCustom";
import type { PostWithDetails } from "../../lib/fetchPosts";

function PostSkeleton() {
  return (
    <Paper
      elevation={0}
      sx={(theme) => ({
        mb: 3,
        p: 2,
        borderRadius: 4,
        border: `1px solid ${theme.palette.divider}`,
      })}
    >
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
        <Skeleton variant="circular" width={40} height={40} />
        <Box sx={{ flex: 1 }}>
          <Skeleton variant="text" width="40%" />
          <Skeleton variant="text" width="25%" />
        </Box>
      </Stack>
      <Skeleton variant="rounded" height={180} sx={{ borderRadius: 2, mb: 2 }} />
      <Skeleton variant="text" width="90%" />
      <Skeleton variant="text" width="70%" />
    </Paper>
  );
}

interface PostListProps {
  currentUserId: string;
  posts: PostWithDetails[];
  loading: boolean;
  onRefresh: () => void;
}

const PAGE_SIZE = 3;

export default function PostList({
  currentUserId,
  posts,
  loading,
  onRefresh,
}: PostListProps) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(posts.length / PAGE_SIZE);

  // Giữ currentPage hợp lệ khi số lượng post thay đổi (vd. sau khi refresh)
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages > 0 ? totalPages : 1);
    }
  }, [currentPage, totalPages]);

  const paginatedPosts = useMemo(
    () =>
      posts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [posts, currentPage]
  );

  if (loading && posts.length === 0) {
    return (
      <Box>
        <PostSkeleton />
        <PostSkeleton />
      </Box>
    );
  }

  if (!loading && posts.length === 0) {
    return (
      <Paper
        elevation={0}
        sx={(theme) => ({
          py: 8,
          textAlign: "center",
          borderRadius: 4,
          border: `1px dashed ${theme.palette.divider}`,
        })}
      >
        <Typography variant="h6" fontWeight={700} gutterBottom>
          Chưa có bài viết nào 📭
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Hãy quay lại sau để xem những câu chuyện mới nhất.
        </Typography>
      </Paper>
    );
  }

  return (
    <Box sx={{ paddingBottom: 5 }}>
      {paginatedPosts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          currentUserId={currentUserId}
          onRefresh={onRefresh}
        />
      ))}

      {totalPages > 1 && (
        <Box py={2} display="flex" justifyContent="center" mt={3}>
          <PaginationCustom
            totalPages={totalPages}
            currentPage={currentPage}
            onPageChange={(page) => setCurrentPage(page)}
          />
        </Box>
      )}
    </Box>
  );
}
