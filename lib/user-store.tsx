"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";

interface UserContext {
  userId: string | null;
  userName: string;
  userClass: number | null;
  setUser: (id: string, name: string, kelas?: number) => void;
  logout: () => void;
}

const UserContext = createContext<UserContext>({
  userId: null,
  userName: "Sobat",
  userClass: null,
  setUser: () => {},
  logout: () => {},
});

const AUTH_KEYS = ["aksaraa_user_id", "aksaraa_user_name", "aksaraa_user_expiry", "aksaraa_user_class"] as const;

export function UserProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState("Sobat");
  const [userClass, setUserClass] = useState<number | null>(null);
  const [ready, setReady] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const expiry = localStorage.getItem("aksaraa_user_expiry");
    const id = localStorage.getItem("aksaraa_user_id");
    const name = localStorage.getItem("aksaraa_user_name");
    const kelas = localStorage.getItem("aksaraa_user_class");

    if (expiry && id && Date.now() < Number(expiry)) {
      setUserId(id);
      setUserName(name || "Sobat");
      setUserClass(kelas ? Number(kelas) : null);
    } else {
      AUTH_KEYS.forEach((k) => localStorage.removeItem(k));
      setUserId(null);
      setUserName("Sobat");
      setUserClass(null);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const publicPaths = ["/login", "/register", "/"];
    if (!userId && !publicPaths.includes(pathname)) {
      router.replace("/login");
    }
  }, [ready, userId, pathname, router]);

  const setUser = useCallback((id: string, name: string, kelas?: number) => {
    const expiry = String(Date.now() + 7 * 24 * 60 * 60 * 1000);
    localStorage.setItem("aksaraa_user_id", id);
    localStorage.setItem("aksaraa_user_name", name);
    localStorage.setItem("aksaraa_user_expiry", expiry);
    if (kelas !== undefined) {
      localStorage.setItem("aksaraa_user_class", String(kelas));
      setUserClass(kelas);
    }
    setUserId(id);
    setUserName(name);
  }, []);

  const logout = useCallback(() => {
    AUTH_KEYS.forEach((k) => localStorage.removeItem(k));
    setUserId(null);
    setUserName("Sobat");
    setUserClass(null);
    router.push("/login");
  }, [router]);

  return (
    <UserContext.Provider value={{ userId, userName, userClass, setUser, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
