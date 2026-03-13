import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "DitherBoy",
  description: "Classic image dithering application with retro aesthetics",
  applicationName: "DitherBoy",
  authors: [{ name: "DitherBoy Team" }],
  icons: {
    icon: "/ditherboy-icon.svg",
    apple: "/ditherboy-icon.svg",
  },
  openGraph: {
    title: "DitherBoy",
    description: "Classic image dithering application with retro aesthetics",
    images: "/ditherboy-icon.svg",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
