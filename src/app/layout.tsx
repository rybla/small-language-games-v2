import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "small-language-games",
  description:
    "a collection of demos using LLMs, by [Henry Blanchette](github.com/rybl4)",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
