import localFont from "next/font/local";
import "./globals.css";
import { Toaster } from 'sonner';

const ttNorms = localFont({
  src: [
    {
      path: "../public/fonts/TT-Norms-Pro-Regular.ttf",
      weight: "400 500 600 700",
      style: "normal",
    },
  ],
  variable: "--font-tt-norms",
});

export const metadata = {
  title: "Inbound Knowledge Base",
  description: "Internal documentation and knowledge sharing for Inbound.no",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={ttNorms.variable}>
      <body className="font-sans antialiased">
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
