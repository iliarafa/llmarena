"use client";

import { GuestGate } from "@/components/GuestGate";
import Admin from "@/components/pages/admin";

export default function AdminPage() {
  return (
    <GuestGate>
      <Admin />
    </GuestGate>
  );
}
