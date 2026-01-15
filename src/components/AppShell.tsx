"use client";

import { Menu } from "lucide-react";
import { SearchProvider } from "./search-context";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { Button } from "./ui/button";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SearchProvider>
      <div className="flex min-h-screen">
        <aside className="hidden w-72 shrink-0 lg:block">
          <div className="sticky top-0 h-screen p-6">
            <Sidebar />
          </div>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <div className="sticky top-0 z-40">
            <div className="glass border-b border-border">
              <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-4">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" className="lg:hidden">
                      <Menu className="h-5 w-5" />
                      <span className="sr-only">Open sidebar</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent>
                    <Sidebar />
                  </SheetContent>
                </Sheet>
                <Topbar />
              </div>
            </div>
          </div>

          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
            {children}
          </main>
        </div>
      </div>
    </SearchProvider>
  );
}
