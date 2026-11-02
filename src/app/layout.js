import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/**
 * Exports metadata.
 * @type {*} Exported application value.
*/
export const metadata = {
  title: "CampusEats — Campus Food & Dorm Delivery",
  description:
    "Peer-to-peer campus food ordering and dormitory delivery platform connecting students, university shops, and student riders.",
};

/**
 * Function RootLayout.
 * @returns {*} The operation result.
 */
export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#f8faf8] dark:bg-[#0d1511] text-[#18241c] dark:text-[#edf4ee] transition-colors duration-200">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
