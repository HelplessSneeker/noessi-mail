import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
  preload: true
});

export const metadata: Metadata = {
  title: "Noessi Mail",
  description: "Modern email client",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} preload`}>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              document.body.classList.add('preload');
              window.addEventListener('load', () => {
                setTimeout(() => {
                  document.body.classList.remove('preload');
                }, 100);
              });
            `,
          }}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
