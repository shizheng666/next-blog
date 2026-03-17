import { RegisterForm } from "@/components/auth/register-form";

interface RegisterPageProps {
  searchParams: Promise<{ from?: string }>;
}

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const { from = "" } = await searchParams;
  return <RegisterForm from={from} />;
}
