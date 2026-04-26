export default function Disclaimer({ className = "" }: { className?: string }) {
  return (
    <p className={`text-xs text-gray-500 ${className}`}>
      掲載情報は自治体公開資料に基づきます。最新情報は必ず自治体に直接ご確認ください。
    </p>
  );
}
