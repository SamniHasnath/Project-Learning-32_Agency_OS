import type { Metadata } from "next";
import { LoginForm } from "@/features/auth/auth-card";

export const metadata: Metadata = { title: "Sign in · Agency OS" };

export default function LoginPage() {
  return <LoginForm />;
}
