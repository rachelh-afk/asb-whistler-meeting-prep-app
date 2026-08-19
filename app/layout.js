import "./globals.css";

export const metadata = {
  title: "ASB Whistler — Meeting Prep",
  description: "Meeting prep tool for the ASB National Summit roster in Whistler, BC.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
