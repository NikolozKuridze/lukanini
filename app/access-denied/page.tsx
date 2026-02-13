import { AccessDeniedClient } from "@/app/access-denied/AccessDeniedClient";

type Props = {
  searchParams?: { from?: string };
};

export default function AccessDeniedPage({ searchParams }: Props) {
  const raw = searchParams?.from || "/";
  const from = raw.startsWith("/") ? raw : "/";
  return <AccessDeniedClient from={from} />;
}
