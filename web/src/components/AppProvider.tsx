"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { Role, User, WorkOrder } from "@/lib/types";
import { USERS } from "@/mock/data";
import { api, resetMock } from "@/lib/api";

interface Ctx {
  user: User | null; setRole: (r: Role) => void; logout: () => void; login: (id: string) => void;
  wos: WorkOrder[]; refresh: () => Promise<void>; reset: () => Promise<void>; ready: boolean;
}
const C = createContext<Ctx>(null!);
export const useApp = () => useContext(C);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [wos, setWos] = useState<WorkOrder[]>([]);
  const [ready, setReady] = useState(false);
  const refresh = useCallback(async () => setWos([...(await api.listWorkOrders())]), []);
  useEffect(() => {
    try { const id = localStorage.getItem("cmms-user"); if (id) setUser(USERS.find((u) => u.id === id) ?? null); } catch {}
    refresh().then(() => setReady(true));
  }, [refresh]);
  const login = (id: string) => { const u = USERS.find((x) => x.id === id)!; setUser(u); try { localStorage.setItem("cmms-user", id); } catch {} };
  const logout = () => { setUser(null); try { localStorage.removeItem("cmms-user"); } catch {} };
  const setRole = (r: Role) => { const u = USERS.find((x) => x.role === r); if (u) login(u.id); };
  const reset = async () => { resetMock(); await refresh(); };
  return <C.Provider value={{ user, setRole, logout, login, wos, refresh, reset, ready }}>{children}</C.Provider>;
}
