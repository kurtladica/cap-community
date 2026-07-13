import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "../components/Navbar";
import { ThemeProvider } from "../components/ThemeProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "CAP Community",
  description: "A free social community platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-white dark:bg-gray-900 transition-colors`}>
        <ThemeProvider>
          <Navbar />
          <main>{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}