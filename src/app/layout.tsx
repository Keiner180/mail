import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jabvox Mail - Gestión de correo Gmail",
  description: "Gestiona tus cuentas de correo electrónico de Gmail con seguridad, rapidez y eficiencia.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-[#f6f8fc] text-[#1f1f1f] antialiased">
        {children}
      </body>
    </html>
  );
}

