import Navbar from "@/components/Navbar";
import "./globals.css";

export const metadata = {
  title: "La Cuadra | Polla de Torneos Paraguayos",
  description: "La mejor polla de fútbol para el Apertura, Clausura y Copa Paraguay.",
  icons: {
    icon: '/logo.png'
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
