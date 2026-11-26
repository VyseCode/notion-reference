import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import { getSession } from "@/lib/auth";

export const metadata = { title: "Sign in" };

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect("/home");
  return <AuthForm mode="login" />;
}
