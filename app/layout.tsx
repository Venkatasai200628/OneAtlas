import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "OneAtlas — AI App Generator",
  description: "Describe your app. OneAtlas builds and deploys it.",
};

/** API-only root layout — UI is the Vite SPA served from public/index.html */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
