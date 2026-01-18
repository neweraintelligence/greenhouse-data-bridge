import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Session {
  code: string;
  name: string;
}

interface SessionState {
  session: Session | null;
  setSession: (session: Session | null) => void;
  clearSession: () => void;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      session: null,
      setSession: (session) => set({ session }),
      clearSession: () => set({ session: null }),
    }),
    {
      name: 'greenhouse-session',
    }
  )
);
