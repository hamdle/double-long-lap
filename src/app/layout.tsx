import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import "./globals.scss";

const PLAUSIBLE_DOMAIN = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
const PLAUSIBLE_SRC =
  process.env.NEXT_PUBLIC_PLAUSIBLE_SRC ?? "https://plausible.io/js/script.js";

export const metadata: Metadata = {
  title: {
    default: "Double Long Lap — MotoAmerica fan hub",
    template: "%s · Double Long Lap",
  },
  description:
    "Standings, schedule, results, rider profiles, venue guides, and stats for MotoAmerica fans.",
  metadataBase: new URL("https://doublelonglap.com"),
};

const navLinks = [
  { href: "/standings", label: "Standings" },
  { href: "/schedule", label: "Schedule" },
  { href: "/results", label: "Results" },
  { href: "/riders", label: "Riders" },
  { href: "/venues", label: "Venues" },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {PLAUSIBLE_DOMAIN ? (
        <head>
          <Script
            defer
            data-domain={PLAUSIBLE_DOMAIN}
            src={PLAUSIBLE_SRC}
            strategy="afterInteractive"
          />
        </head>
      ) : null}
      <body>
        <header id="navigation" className="p-navigation">
          <div className="p-navigation__row">
            <div className="p-navigation__banner">
              <div className="p-navigation__tagged-logo">
                <Link className="p-navigation__link" href="/">
                  <span className="p-navigation__logo-title">Double Long Lap</span>
                </Link>
              </div>
              <a href="#main-content" className="p-navigation__toggle--open" title="menu">Menu</a>
            </div>
            <nav className="p-navigation__nav" aria-label="Main">
              <ul className="p-navigation__items">
                {navLinks.map((link) => (
                  <li key={link.href} className="p-navigation__item">
                    <Link className="p-navigation__link" href={link.href}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </header>

        <main id="main-content">{children}</main>

        <footer className="p-strip--dark">
          <div className="row">
            <div className="col-6">
              <NewsletterSignup />
            </div>
            <div className="col-6 u-align--right">
              <p>Double Long Lap — an independent MotoAmerica fan project.</p>
              <p>
                <small>Not affiliated with MotoAmerica.</small>
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
