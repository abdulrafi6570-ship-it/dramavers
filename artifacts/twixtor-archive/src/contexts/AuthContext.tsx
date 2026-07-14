import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useGetMe, getGetMeQueryKey, useLogin, useLogout, useRegister, useVerifyAccessCode, LoginInput, RegisterInput, AccessCodeInput, User } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (data: LoginInput, redirectTo?: string) => Promise<void>;
  register: (data: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  verifyCode: (data: AccessCodeInput) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const { data: meData, isLoading: isLoadingMe } = useGetMe({ query: { queryKey: getGetMeQueryKey(), retry: false } });

  const loginMutation = useLogin();
  const registerMutation = useRegister();
  const logoutMutation = useLogout();
  const verifyCodeMutation = useVerifyAccessCode();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (meData) setUser(meData);
    else if (!isLoadingMe) setUser(null);
  }, [meData, isLoadingMe]);

  const login = async (data: LoginInput, redirectTo?: string) => {
    try {
      const res = await loginMutation.mutateAsync({ data });
      localStorage.setItem("twixtor_token", res.token);
      setUser(res.user);
      toast({ title: "Login berhasil" });
      setLocation(redirectTo ?? (res.user.role === "admin" ? "/admin" : "/"));
    } catch (error) {
      toast({ title: "Login gagal. Cek username & password.", variant: "destructive" });
      throw error;
    }
  };

  const register = async (data: RegisterInput) => {
    try {
      const res = await registerMutation.mutateAsync({ data });
      localStorage.setItem("twixtor_token", res.token);
      setUser(res.user);
      toast({ title: "Akun berhasil dibuat!" });
      setLocation("/");
    } catch (error) {
      toast({ title: "Registrasi gagal", variant: "destructive" });
      throw error;
    }
  };

  const logout = async () => {
    try { await logoutMutation.mutateAsync(); } catch {}
    localStorage.removeItem("twixtor_token");
    setUser(null);
    toast({ title: "Logout berhasil" });
    setLocation("/");
  };

  const verifyCode = async (data: AccessCodeInput) => {
    try {
      const res = await verifyCodeMutation.mutateAsync({ data });
      setUser(res);
      toast({ title: "Kode valid! Download tersedia." });
      return true;
    } catch {
      toast({ title: "Kode tidak valid", variant: "destructive" });
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading: isLoadingMe, login, register, logout, verifyCode }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
