import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "One Atlas API",
  description: "Server API for One Atlas",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
