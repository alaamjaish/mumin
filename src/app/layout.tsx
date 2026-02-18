import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { AppProvider } from "@/components/AppProvider";

export const metadata: Metadata = {
  title: "Mumin — مولد إعلانات روسية بالذكاء الاصطناعي",
  description:
    "توليد إعلانات تعليم اللغة العربية بالروسية باستخدام الذكاء الاصطناعي",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-screen antialiased">
        {/* Warm ambient gradient — top right */}
        <div
          className="pointer-events-none fixed -top-40 -left-40 h-[700px] w-[700px] rounded-full opacity-30"
          style={{
            background:
              "radial-gradient(circle, rgba(232,101,74,0.08) 0%, transparent 70%)",
          }}
        />
        {/* Cool ambient gradient — bottom left */}
        <div
          className="pointer-events-none fixed -bottom-40 -right-40 h-[500px] w-[500px] rounded-full opacity-20"
          style={{
            background:
              "radial-gradient(circle, rgba(44,62,107,0.06) 0%, transparent 70%)",
          }}
        />

        <AppProvider>
          <div className="relative z-10 flex min-h-screen flex-col">
            <Navbar />
            <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-8 sm:px-8 sm:py-12">
              {children}
            </main>
            {/* Minimal footer */}
            <footer className="border-t py-6 text-center" style={{ borderColor: 'var(--gray-200)' }}>
              <p className="text-xs" style={{ color: 'var(--gray-400)' }}>
                Mumin — مولد إعلانات بالذكاء الاصطناعي
              </p>
            </footer>
          </div>
        </AppProvider>
      </body>
    </html>
  );
}
