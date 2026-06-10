import { db } from "@/lib/firebase.config";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";

export interface PostUser {
  id: string;
  username: string;
  avatar: string;
}

export interface PostComment {
  id: string;
  text: string;
  user: PostUser;
}

export interface PostWithDetails {
  id: string;
  title: string;
  thrilled: string;
  imageUrl: string;
  imageUrls: string[];
  author: PostUser;
  authorId: string;
  comments: PostComment[];
  sent: boolean;
  createdAt: string | number;
  favorite: boolean;
  visible: boolean;
  shareCount: number;
}

const UNKNOWN_USER: PostUser = { id: "", username: "Unknown", avatar: "" };

/**
 * Tải tất cả bài viết (visible) kèm tác giả và bình luận.
 *
 * Tối ưu chính so với phiên bản cũ:
 * - Cache user theo email bằng Map<email, Promise<PostUser>>: mỗi user chỉ
 *   query đúng 1 lần, kể cả khi xuất hiện ở nhiều post/comment (trước đây mỗi
 *   comment đều query lại tác giả -> N+1 bùng nổ).
 * - Một nguồn dữ liệu duy nhất cho cả feed lẫn sidebar "Post sôi nổi",
 *   thay vì fetch toàn bộ posts + comments hai lần.
 */
export async function fetchPostsWithDetails(): Promise<PostWithDetails[]> {
  const userCache = new Map<string, Promise<PostUser>>();

  const getUserByEmail = (email?: string): Promise<PostUser> => {
    if (!email) return Promise.resolve(UNKNOWN_USER);
    let cached = userCache.get(email);
    if (!cached) {
      cached = (async () => {
        const snap = await getDocs(
          query(collection(db, "users"), where("email", "==", email))
        );
        if (snap.empty) return UNKNOWN_USER;
        const u = snap.docs[0];
        const data = u.data();
        return {
          id: u.id,
          username: data.username ?? "Unknown",
          avatar: data.avatar ?? "",
        };
      })();
      userCache.set(email, cached);
    }
    return cached;
  };

  const postsSnap = await getDocs(
    query(collection(db, "posts"), orderBy("createdAt", "desc"))
  );

  const posts = await Promise.all(
    postsSnap.docs.map(async (docSnap) => {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      const data = docSnap.data() as any;
      if (data.visible === false) return null;

      // Tác giả và danh sách comment lấy song song
      const [author, commentsSnap] = await Promise.all([
        getUserByEmail(data.authorId),
        getDocs(collection(db, "posts", docSnap.id, "comments")),
      ]);

      const comments = await Promise.all(
        commentsSnap.docs.map(async (c) => {
          const cData = c.data() as any;
          const user = await getUserByEmail(cData.userId);
          return { id: c.id, text: cData.text, user } as PostComment;
        })
      );

      return {
        id: docSnap.id,
        title: data.title,
        thrilled: data.thrilled,
        imageUrl: data.imageUrl,
        imageUrls: data.imageUrls ?? [],
        author,
        authorId: data.authorId,
        comments,
        sent: data.sent,
        createdAt: data.createdAt,
        favorite: data.favorite ?? false,
        visible: data.visible ?? true,
        shareCount: data.shareCount ?? 0,
      } as PostWithDetails;
    })
  );

  return posts.filter((p): p is PostWithDetails => p !== null);
}
