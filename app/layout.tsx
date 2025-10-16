import localFont from "next/font/local";
import "./globals.css";

const ttHoves = localFont({
  src: [
    {
      path: "../public/fonts/TT_Hoves_Pro_Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/TT_Hoves_Pro_Expanded_Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../public/fonts/TT_Hoves_Pro_Expanded_Black.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-tt-hoves",
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
    <html lang="en" className={ttHoves.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
