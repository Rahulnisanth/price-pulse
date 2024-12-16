import { Montserrat } from "next/font/google";
import "./globals.css";
// Components Importer :
import Navbar from "@/components/Navbar";
import AuthModal from "@/components/AuthModal";
import ClientSessionProvider from "@/components/ClientSessionProvider";
// React toaster :
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Fonts-util :
const montserrat = Montserrat({ subsets: ["latin"] });
// Meta-data :
export const metadata = {
  title: "TrackItNow - The ultimate price tracker",
  description: "Generated by create next app",
};
// Over-all root layout :
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={montserrat.className}>
        <ClientSessionProvider>
          <AuthModal />
          <main className="max-w-10xl mx-auto">
            <Navbar />
            {children}
            <ToastContainer />
          </main>
        </ClientSessionProvider>
      </body>
    </html>
  );
}
