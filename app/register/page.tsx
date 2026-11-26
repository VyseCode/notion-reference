import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import { getSession } from "@/lib/auth";

export const metadata = { title: "Create account" };

export default async function RegisterPage() {
  const session = await getSession();
  if (session) redirect("/home");
  return <AuthForm mode="register" />;
}
