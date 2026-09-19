// import type { Metadata } from "next";
// import type { ReactNode } from "react";

// import ThemeProvider from "@/providers/ThemeProvider";

// import "./globals.css";

// export const metadata: Metadata = {
//   title: "IKBS",
//   description:
//     "Ibrahima Khalil Business Service — Solutions digitales et gestion des organisations.",
// };

// interface RootLayoutProps {
//   children: ReactNode;
// }

// export default function RootLayout({
//   children,
// }: RootLayoutProps) {
//   return (
//     <html lang="fr" suppressHydrationWarning>
//       <body>
//         <ThemeProvider>
//           {children}
//         </ThemeProvider>
//       </body>
//     </html>
//   );
// }

import type {
  Metadata,
} from "next";

import type {
  ReactNode,
} from "react";

import ThemeProvider from "@/providers/ThemeProvider";

import ToastProvider from "@/components/ui/toast/ToastProvider";

import "./globals.css";

export const metadata: Metadata = {
  title: "IKBS",
  description:
    "Ibrahima Khalil Business Service — Solutions digitales et gestion des organisations.",
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({
  children,
}: RootLayoutProps) {
  return (
    <html
      lang="fr"
      suppressHydrationWarning
    >
      <body>
        <ThemeProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}


