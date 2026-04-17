import type { Metadata } from "next";
import "./globals.scss";

export const metadata: Metadata = {
  title: {
    default: "Double Long Lap — MotoAmerica fan hub",
    template: "%s · Double Long Lap",
  },
  description:
    "Standings, schedule, results, rider profiles, venue guides, and stats for MotoAmerica fans.",
  metadataBase: new URL("https://doublelonglap.com"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
