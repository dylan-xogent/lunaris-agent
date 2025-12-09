"use client";

import { Header } from "@/components/layout/header";
import { DeviceListEnhanced } from "@/components/devices/device-list-enhanced";

export default function DevicesPage() {
  return (
    <>
      <Header title="Devices" />
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white">Enrolled Devices</h2>
          <p className="text-slate-400">
            Manage and monitor all devices running Lunaris Agent
          </p>
        </div>
        <DeviceListEnhanced />
      </div>
    </>
  );
}

