"use client";

import { Bell, LogOut, Menu, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { getRoleLabel, type AnomalyType, type ProductCategory } from "@/types";
import { Id } from "@/convex/_generated/dataModel";
import { useSidebar } from "@/components/layout/sidebar";

type Product = {
  _id: Id<"products">;
  name: string;
  category: ProductCategory;
  unit: string;
  currentStock: number;
  minStock: number;
  avgPrice: number;
  supplierId: Id<"suppliers">;
};

type Anomaly = {
  _id: Id<"anomalies">;
  type: AnomalyType;
  severity: "low" | "medium" | "high";
  title: string;
  description: string;
  detectedAt: number;
  resolved: boolean;
};

export function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { collapsed, setMobileOpen } = useSidebar();

  const anomalies = useQuery(api.anomalies.listOpen) ?? [];
  const products = useQuery(api.products.list) ?? [];

  const lowStockCount = products.filter(
    (p: Product) => p.currentStock < p.minStock
  ).length;

  const handleLogout = () => {
    logout();
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <header
      className={cn(
        "fixed top-0 right-0 z-30 h-16 border-b bg-white transition-all duration-300",
        "left-0",
        collapsed ? "md:left-16" : "md:left-64"
      )}
    >
      <div className="flex h-full items-center justify-between px-4 md:px-6">
        {/* Left side - Hamburger menu on mobile */}
        <div className="flex items-center gap-3">
          {/* Hamburger menu button - only visible on mobile */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-11 w-11 touch-manipulation"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-6 w-6 text-slate-600" />
          </Button>

          {/* Page Title */}
          <h1 className="text-lg md:text-xl font-semibold text-slate-900 truncate">
            Restaurant Warenwirtschaft
          </h1>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative h-11 w-11 md:h-10 md:w-10 touch-manipulation"
              >
                <Bell className="h-5 w-5 text-slate-600" />
                {(anomalies.length > 0 || lowStockCount > 0) && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                  >
                    {anomalies.length + lowStockCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-80 max-w-[calc(100vw-2rem)]"
            >
              <DropdownMenuLabel>Benachrichtigungen</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-[300px] overflow-y-auto">
                {anomalies.length === 0 && lowStockCount === 0 ? (
                  <div className="p-4 text-center text-sm text-slate-500">
                    Keine neuen Benachrichtigungen
                  </div>
                ) : (
                  <>
                    {anomalies.map((anomaly: Anomaly) => (
                      <DropdownMenuItem
                        key={anomaly._id}
                        className="flex flex-col items-start gap-1 p-3 cursor-pointer"
                        onClick={() => router.push("/documents")}
                      >
                        <div className="flex items-center gap-2 w-full">
                          <span className="h-2 w-2 rounded-full bg-red-500" />
                          <span className="font-medium text-sm">
                            Auffälligkeit erkannt
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-2">
                          {anomaly.title}: {anomaly.description}
                        </p>
                      </DropdownMenuItem>
                    ))}
                    {lowStockCount > 0 && (
                      <DropdownMenuItem
                        className="flex flex-col items-start gap-1 p-3 cursor-pointer"
                        onClick={() => router.push("/inventory")}
                      >
                        <div className="flex items-center gap-2 w-full">
                          <span className="h-2 w-2 rounded-full bg-amber-500" />
                          <span className="font-medium text-sm">
                            Niedriger Bestand
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">
                          {lowStockCount} Produkte unter Mindestbestand
                        </p>
                      </DropdownMenuItem>
                    )}
                  </>
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-2 md:gap-3 px-2 h-11 md:h-10 touch-manipulation"
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-amber-100 text-amber-700">
                    {user ? getInitials(user.name) : "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-slate-900">
                    {user?.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {user ? getRoleLabel(user.role) : ""}
                  </p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 max-w-[calc(100vw-2rem)]"
            >
              <DropdownMenuLabel>Mein Konto</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/settings")}>
                <User className="mr-2 h-4 w-4" />
                Profil
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                Abmelden
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
