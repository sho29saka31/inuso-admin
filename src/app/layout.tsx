import type { Metadata } from "next";
import { M_PLUS_Rounded_1c } from "next/font/google";
import "./globals.css";

const mPlusRounded = M_PLUS_Rounded_1c({
  weight: ["400", "500", "700", "800"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ISF",
  description: "犬山総合高等学校 文化祭アプリ",
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