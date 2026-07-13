import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "../components/ThemeProvider";
import AppContent from "../components/AppContent";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "CAP Community",
  description: "A free social community platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="">
      <body className={`${inter.className} bg-white dark:bg-gray-900 transition-colors`}>
        <ThemeProvider>
          <AppContent>{children}</AppContent>
        </ThemeProvider>
      </body>
    </html>
  );
}