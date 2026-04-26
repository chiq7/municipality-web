export default function WarningBanner() {
  return (
    <div className="bg-amber-50 border-b-2 border-amber-300 px-4 py-3">
      <div className="max-w-5xl mx-auto flex items-start gap-2">
        <span className="text-amber-500 text-lg shrink-0 mt-0.5">⚠️</span>
        <p className="text-sm text-amber-900 leading-relaxed">
          <span className="font-bold">この情報は自治体が公開したPDF資料に基づきます。</span>
          施設の状況は変わっている場合があります。
          必ず自治体に最新情報をご確認ください。
        </p>
      </div>
    </div>
  );
}
