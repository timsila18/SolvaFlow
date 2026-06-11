import { AppShell } from "@/components/app-shell";

export default function EnterpriseLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
