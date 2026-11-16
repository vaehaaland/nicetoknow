import AppShell from "@/components/AppShell";
import { requireHousehold } from "@/lib/household";

// Alle innlogga sider krev husstand og får same skal
export default async function AppLayout({ children }: LayoutProps<"/">) {
  const { household } = await requireHousehold();
  return <AppShell householdName={household.name}>{children}</AppShell>;
}
