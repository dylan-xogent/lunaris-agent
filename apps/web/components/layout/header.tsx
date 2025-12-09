"use client";

import { Bell, Search, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { wsClient } from "@/lib/ws";

interface HeaderProps {
  title?: string;
}

export function Header({ title = "Dashboard" }: HeaderProps) {
  const [wsConnected, setWsConnected] = useState(false);
  const [notifications] = useState([
    { id: 1, message: "3 critical updates available", time: "5m ago" },
    { id: 2, message: "WORKSTATION-A1 went offline", time: "12m ago" },
    { id: 3, message: "New device enrolled", time: "1h ago" },
  ]);

  useEffect(() => {
    // Connect to WebSocket on mount
    wsClient.connect();

    const unsubConnect = wsClient.subscribe("connected", () => {
      setWsConnected(true);
    });

    const unsubDisconnect = wsClient.subscribe("disconnected", () => {
      setWsConnected(false);
    });

    return () => {
      unsubConnect();
      unsubDisconnect();
    };
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-800/50 bg-slate-950/80 px-6 backdrop-blur-sm">
      {/* Left side - Title and Search */}
      <div className="flex items-center gap-6">
        <h1 className="text-xl font-semibold text-white">{title}</h1>
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <Input
            placeholder="Search devices, updates..."
            className="w-[280px] border-slate-800 bg-slate-900/50 pl-9 text-sm text-white placeholder:text-slate-500 focus:border-cyan-500/50 focus:ring-cyan-500/20"
          />
        </div>
      </div>

      {/* Right side - Status, Notifications, Profile */}
      <div className="flex items-center gap-4">
        {/* WebSocket Status */}
        <div className="flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/50 px-3 py-1.5">
          {wsConnected ? (
            <>
              <div className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </div>
              <span className="text-xs font-medium text-emerald-400">Live</span>
              <Wifi className="h-3.5 w-3.5 text-emerald-400" />
            </>
          ) : (
            <>
              <span className="h-2 w-2 rounded-full bg-slate-600" />
              <span className="text-xs font-medium text-slate-500">Offline</span>
              <WifiOff className="h-3.5 w-3.5 text-slate-500" />
            </>
          )}
        </div>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative text-slate-400 hover:text-white"
            >
              <Bell className="h-5 w-5" />
              {notifications.length > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-cyan-500 text-[10px] font-bold text-slate-950">
                  {notifications.length}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-[320px] border-slate-800 bg-slate-900"
          >
            <DropdownMenuLabel className="text-slate-300">
              Notifications
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-slate-800" />
            {notifications.map((notif) => (
              <DropdownMenuItem
                key={notif.id}
                className="flex flex-col items-start gap-1 py-3 text-slate-300 focus:bg-slate-800 focus:text-white"
              >
                <span className="text-sm">{notif.message}</span>
                <span className="text-xs text-slate-500">{notif.time}</span>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator className="bg-slate-800" />
            <DropdownMenuItem className="justify-center text-cyan-400 focus:bg-slate-800 focus:text-cyan-300">
              View all notifications
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 px-2 text-slate-400 hover:text-white"
            >
              <Avatar className="h-8 w-8 border border-slate-700">
                <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-teal-500 text-xs font-semibold text-slate-950">
                  AD
                </AvatarFallback>
              </Avatar>
              <span className="hidden text-sm font-medium md:inline">Admin</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-[200px] border-slate-800 bg-slate-900"
          >
            <DropdownMenuLabel className="text-slate-300">
              My Account
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-slate-800" />
            <DropdownMenuItem className="text-slate-300 focus:bg-slate-800 focus:text-white">
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="text-slate-300 focus:bg-slate-800 focus:text-white">
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-slate-800" />
            <DropdownMenuItem className="text-rose-400 focus:bg-slate-800 focus:text-rose-300">
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

