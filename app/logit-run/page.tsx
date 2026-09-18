"use client";

import { GuestGate } from "@/components/GuestGate";
import LogitRun from "@/components/pages/logit-run";

export default function LogitRunPage() {
  return (
    <GuestGate>
      <LogitRun />
    </GuestGate>
  );
}
