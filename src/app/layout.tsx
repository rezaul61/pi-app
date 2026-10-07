import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "PI — Verified Social Intelligence Network",
    template: "%s · PI",
  },
  description:
    "PI is a verified social intelligence network for students, teachers, researchers and professionals — identity you can trust, knowledge that compounds.",
};

export const viewport: Viewport = {
  themeColor: "#06080f",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const store = await cookies();
  const theme = store.get("pi-theme")?.value === "light" ? "light" : "dark";
  const fxRaw = store.get("pi-fx")?.value;
  const fx = fxRaw === "balanced" || fxRaw === "performance" ? fxRaw : "premium";

  return (
    <html lang="en" data-theme={theme} data-fx={fx} suppressHydrationWarning>
      <body className={`${inter.variable} antialiased`}>{children}</body>
    </html>
  );
}
