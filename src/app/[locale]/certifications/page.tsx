import { redirect } from "next/navigation";

export default async function CertificationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}#certifications`);
}