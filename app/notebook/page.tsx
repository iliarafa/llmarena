"use client";

import { GuestGate } from "@/components/GuestGate";
import Notebook from "@/components/pages/notebook";

export default function NotebookPage() {
  return (
    <GuestGate>
      <Notebook />
    </GuestGate>
  );
}
