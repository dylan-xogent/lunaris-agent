"use client";

import { Header } from "@/components/layout/header";
import { UpdatesTable } from "@/components/updates/updates-table";

export default function UpdatesPage() {
  return (
    <>
      <Header title="Updates" />
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white">Pending Updates</h2>
          <p className="text-slate-400">
            View and manage all pending updates across your devices
          </p>
        </div>
        <UpdatesTable />
      </div>
    </>
  );
}

