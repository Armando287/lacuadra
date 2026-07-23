import Navbar from "@/components/Navbar";
import ToastProvider from "@/components/ToastProvider";
import "./globals.css";

export const metadata = {
  metadataBase: new URL('https://lacuadra-orcin.vercel.app'),
  title: "La Cuadra | Polla de Torneos Paraguayos",
  description: "La mejor polla de fútbol para el Apertura, Clausura y Copa Paraguay. Demostrá que sos el que más sabe.",
  icons: {
    icon: '/logo.png'
  },
  openGraph: {
    title: "La Cuadra | Polla de Torneos Paraguayos",
    description: "La mejor polla de fútbol para el Apertura, Clausura y Copa Paraguay.",
    url: "https://lacuadra-orcin.vercel.app/",
    siteName: "La Cuadra",
    images: [
      {
        url: "/logo.png",
        width: 800,
        height: 800,
      }
    ],
    locale: "es_PY",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "La Cuadra | Polla de Torneos Paraguayos",
    description: "La mejor polla de fútbol para el Apertura, Clausura y Copa Paraguay.",
    images: ["/logo.png"],
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <Navbar />
        <ToastProvider />
        {children}
      </body>
    </html>
  );
}
