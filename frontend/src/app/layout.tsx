// This file is required for the app directory to work.
// Since we're using the [locale] directory structure,
// this layout will only be used for non-localized routes.
// The actual HTML structure is handled by the locale layout.

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
