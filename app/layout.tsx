import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "未利用公共施設バンク | 全国の空き施設情報",
  description:
    "全国の未利用公共施設を格安で借りたい事業者向けの情報サービスです。廃校・温泉・公民館など1,000件以上の施設情報を掲載。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className="h-full">
      <body className="min-h-full flex flex-col bg-white text-gray-900 antialiased">
        {children}
        <footer className="mt-auto border-t border-gray-200 py-6 px-4">
          <div className="max-w-5xl mx-auto space-y-1">
            <p className="text-xs text-gray-500">
              掲載情報は自治体公開資料に基づきます。最新情報は必ず自治体に直接ご確認ください。
            </p>
            <p className="text-xs text-gray-400">
              © 2025 未利用公共施設バンク｜空き施設バンク運営事務局
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
