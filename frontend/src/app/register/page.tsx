import type { Metadata } from "next";
import { RegisterForm } from "@/features/auth/auth-card";

export const metadata: Metadata = { title: "Create your agency · Agency OS" };

export default function RegisterPage() {
  return <RegisterForm />;
}
