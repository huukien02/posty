"use client";
import { useEffect, useState } from "react";
import { db } from "../../../lib/firebase.config";
import { collection, query, orderBy, getDocs, where } from "firebase/firestore";
import PostCard from "./PostCard";
import { Box, Button, Pagination } from "@mui/material";
import PaginationCustom from "../PaginationCustom";

interface User {
  id: string;
  username: string;
  avatar: string;
}
interface Comment {
  id: string;
  text: string;
  user: User;
}
interface Post {
  id: string;
  title: string;
  thrilled: string;
  imageUrl: string;
  imageUrls: string[];
  author: User;
  comments: Comment[];
  sent: boolean;
  createdAt: string | number;
  favorite: boolean;
  visible: boolean;
  shareCount: number;
  reactionsCount: number;
}

interface PostListProps {
  currentUserId: string;
  refreshKey: number;
}

export default function PostList({ currentUserId, refreshKey }: PostListProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const PAGE_SIZE = 3;

  // Lấy user từ email
  const getUserByEmail = async (email: string): Promise<User> => {
    const userQ = query(collection(db, "users"), where("email", "==", email));
    const snap = await getDocs(userQ);
    if (!snap.empty) {
      const u = snap.docs[0];
      const data = u.data();
      return {
        id: u.id,
        username: data.username ?? "Unknown",
        avatar: data.avatar ?? "",
      };
    }
    return { id: "", username: "Unknown", avatar: "" };
  };

  // Load tất cả posts
  const fetchPosts = async () => {
    if (loading) return;
    setLoading(true);

    try {
      const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);

      const postsData: (Post | null)[] = await Promise.all(
        snap.docs.map(async (docSnap) => {
          const postData = docSnap.data();
          if (!postData.visible) return null;

          const author = await getUserByEmail(postData.authorId);

          const commentsSnap = await getDocs(
            collection(db, "posts", docSnap.id, "comments")
          );
          const comments: Comment[] = await Promise.all(
            commentsSnap.docs.map(async (c) => {
              const cData = c.data();
              const user = await getUserByEmail(cData.userId);
              return { id: c.id, text: cData.text, user };
            })
          );

          return {
            id: docSnap.id,
            title: postData.title,
            thrilled: postData.thrilled,
            imageUrl: postData.imageUrl,
            imageUrls: postData.imageUrls,
            sent: postData.sent,
            createdAt: postData.createdAt,
            author,
            comments,
            shareCount: postData.shareCount ?? 0,
            favorite: postData.favorite ?? false,
            visible: postData.visible ?? true,
          } as Post;
        })
      );

      setPosts(postsData.filter((p): p is Post => p !== null));
      setCurrentPage(1); // reset về trang đầu
    } catch (err) {
      console.error("Error fetching posts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [refreshKey]);

  // Tính phân trang
  const totalPages = Math.ceil(posts.length / PAGE_SIZE);
  const paginatedPosts = posts.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  return (
    <Box sx={{ paddingBottom: 5 }}>
      {paginatedPosts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          currentUserId={currentUserId}
          onRefresh={fetchPosts}
        />
      ))}

      {/* Pagination */}
      {totalPages > 1 && (
        <Box py={2} display="flex" justifyContent="center" mt={3}>
          {/* <Pagination
            count={totalPages} // Tổng số trang
            page={currentPage} // Trang hiện tại
            onChange={(_, page) => setCurrentPage(page)} // Hàm đổi trang
           
          /> */}
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
