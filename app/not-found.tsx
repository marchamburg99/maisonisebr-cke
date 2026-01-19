"use client";

import Link from "next/link";
import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-slate-900">404</h1>
        <p className="mt-4 text-xl text-slate-600">Seite nicht gefunden</p>
        <p className="mt-2 text-slate-500">
          Die angeforderte Seite existiert nicht.
        </p>
        <Button asChild className="mt-6 bg-amber-500 hover:bg-amber-600">
          <Link href="/">
            <Home className="mr-2 h-4 w-4" />
            Zurück zum Dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
}
