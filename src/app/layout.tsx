import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const mPlusRounded = localFont({
  src: [
    { path: "../../node_modules/@fontsource/m-plus-rounded-1c/files/m-plus-rounded-1c-japanese-400-normal.woff2", weight: "400" },
    { path: "../../node_modules/@fontsource/m-plus-rounded-1c/files/m-plus-rounded-1c-japanese-500-normal.woff2", weight: "500" },
    { path: "../../node_modules/@fontsource/m-plus-rounded-1c/files/m-plus-rounded-1c-japanese-700-normal.woff2", weight: "700" },
    { path: "../../node_modules/@fontsource/m-plus-rounded-1c/files/m-plus-rounded-1c-japanese-800-normal.woff2", weight: "800" },
  ],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ISF",
  description: "犬山総合高等学校 文化祭アプリ",
  icons: { icon: "/logo.png", apple: "/logo.png" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className={mPlusRounded.className}>
        {children}
      </body>
    </html>
  );
}