import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppProvider } from "@/components/AppProvider";
import Shell from "@/components/Shell";

export const metadata: Metadata = { title: "CMMS — Maintenance Management (Portfolio Demo)", description: "Portfolio demo: CMMS with Breakdown Maintenance workflow, SLA and KPIs. All data is fictional.", manifest: "/manifest.webmanifest" };
export const viewport: Viewport = { themeColor: "#1e3a8a", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th"><body className="bg-slate-50 text-slate-900 antialiased">
      <AppProvider><Shell>{children}</Shell></AppProvider>
    </body></html>
  );
}
