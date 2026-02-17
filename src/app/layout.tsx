import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { FloatingParticles } from "@/components/floating-particles";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Poll Rooms — Real-Time Polls",
  description:
    "Create instant polls, share a link, and watch votes come in live. No sign-up required.",
  keywords: ["poll", "voting", "real-time", "live poll", "survey", "poll rooms"],
  authors: [{ name: "Poll Rooms" }],
  openGraph: {
    title: "Poll Rooms — Create Real-Time Polls Instantly",
    description: "Create a poll in seconds, share the link, and watch votes roll in live. No sign-up needed.",
    type: "website",
    siteName: "Poll Rooms",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Poll Rooms — Real-Time Polls",
    description: "Create instant polls and share a link for real-time voting.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}
      >
        {/* Animated gradient background with particles */}
        <FloatingParticles />

        <main className="min-h-screen flex flex-col relative z-10">
          {/* Header — glass morphism */}
          <header className="w-full bg-white/10 backdrop-blur-md border-b border-white/20 sticky top-0 z-50">
            <div className="max-w-3xl mx-auto px-4 h-14 flex items-center">
              <a
                href="/"
                className="text-lg font-bold tracking-tight text-white hover:text-white/80 transition-all duration-300 hover:scale-105"
              >
                🗳️ Poll Rooms
              </a>
            </div>
          </header>

          {/* Content */}
          <div className="flex-1 flex items-start justify-center px-4 py-12">
            {children}
          </div>

          {/* Footer — glass morphism */}
          <footer className="w-full bg-white/5 backdrop-blur-sm border-t border-white/10 py-4">
            <div className="max-w-3xl mx-auto px-4 text-center space-y-1">
              <p className="text-xs text-white/50">
                Built with <span className="font-semibold text-white/70">Next.js</span> + <span className="font-semibold text-white/70">Supabase</span> + <span className="font-semibold text-white/70">Tailwind CSS</span>
              </p>
              <p className="text-[10px] text-white/30">
                Real-time polling &middot; Anti-abuse fairness &middot; No sign-up required
              </p>
            </div>
          </footer>
        </main>

        <Toaster
          position="top-center"
          richColors
          toastOptions={{
            duration: 3000,
          }}
        />
      </body>
    </html>
  );
}
