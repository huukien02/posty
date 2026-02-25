import { useState, useEffect } from "react";

export function useUser() {
  const [user, setUser] = useState<{
    id: string;
    email: any;
    username: string;
    uid: string;
    avatar?: string;
    postsRemaining: number;
  } | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) setUser(JSON.parse(stored));
  }, []);

  return user;
}
