"use client";

import { GuestGate } from "@/components/GuestGate";
import Purchase from "@/components/pages/purchase";

export default function PurchasePage() {
  return (
    <GuestGate>
      <Purchase />
    </GuestGate>
  );
}
