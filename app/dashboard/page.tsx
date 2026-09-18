"use client";

import { GuestGate } from "@/components/GuestGate";
import Dashboard from "@/components/pages/dashboard";

export default function DashboardPage() {
  return (
    <GuestGate>
      <Dashboard />
    </GuestGate>
  );
}
