"use client";

type Cell = { name: string } | null;

// Standard Japan prefecture block map layout (row × col)
const GRID: Cell[][] = [
  [null, null, null, null, null, null, null, null, null, null, null, { name: "北海道" }],
  [null, null, null, null, null, null, null, null, null, null, { name: "青森県" }, null],
  [null, null, null, null, null, null, null, null, null, { name: "秋田県" }, { name: "岩手県" }, null],
  [null, null, null, null, null, null, null, null, null, { name: "山形県" }, { name: "宮城県" }, null],
  [null, null, null, null, null, null, null, null, { name: "新潟県" }, { name: "福島県" }, null, null],
  [null, null, null, null, null, null, null, { name: "富山県" }, { name: "群馬県" }, { name: "栃木県" }, { name: "茨城県" }, null],
  [null, null, null, null, null, null, { name: "石川県" }, { name: "長野県" }, { name: "埼玉県" }, null, null, null],
  [null, null, null, null, null, { name: "福井県" }, { name: "岐阜県" }, { name: "山梨県" }, { name: "東京都" }, { name: "千葉県" }, null, null],
  [null, null, null, null, { name: "滋賀県" }, { name: "愛知県" }, { name: "静岡県" }, { name: "神奈川県" }, null, null, null, null],
  [null, null, null, { name: "京都府" }, { name: "三重県" }, null, null, null, null, null, null, null],
  [null, null, { name: "兵庫県" }, { name: "大阪府" }, { name: "奈良県" }, { name: "和歌山県" }, null, null, null, null, null, null],
  [null, { name: "鳥取県" }, { name: "岡山県" }, { name: "徳島県" }, null, null, null, null, null, null, null, null],
  [null, { name: "島根県" }, { name: "広島県" }, { name: "香川県" }, { name: "愛媛県" }, { name: "高知県" }, null, null, null, null, null, null],
  [null, { name: "山口県" }, { name: "福岡県" }, { name: "大分県" }, { name: "宮崎県" }, null, null, null, null, null, null, null],
  [null, null, { name: "佐賀県" }, { name: "熊本県" }, { name: "鹿児島県" }, null, null, null, null, null, null, null],
  [null, null, { name: "長崎県" }, null, null, null, null, null, null, null, null, null],
  [null, null, null, null, { name: "沖縄県" }, null, null, null, null, null, null, null],
];

interface Props {
  selected: string;
  onSelect: (prefecture: string) => void;
  facilityCounts?: Record<string, number>;
}

export default function JapanMap({ selected, onSelect, facilityCounts = {} }: Props) {
  const CELL = 40;
  const GAP = 2;

  return (
    <div className="overflow-x-auto pb-2">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(12, ${CELL}px)`,
          gap: GAP,
          width: 12 * (CELL + GAP) - GAP,
        }}
      >
        {GRID.flatMap((row, ri) =>
          row.map((cell, ci) => {
            if (!cell) {
              return (
                <div
                  key={`${ri}-${ci}`}
                  style={{ width: CELL, height: CELL }}
                />
              );
            }

            const isSelected = selected === cell.name;
            const count = facilityCounts[cell.name] ?? 0;
            const shortName = cell.name.replace(/[都道府県]$/, "").slice(0, 3);

            return (
              <button
                key={`${ri}-${ci}`}
                onClick={() => onSelect(isSelected ? "" : cell.name)}
                title={cell.name}
                style={{ width: CELL, height: CELL }}
                className={`
                  rounded text-center flex flex-col items-center justify-center
                  transition-all text-xs font-medium leading-tight
                  ${isSelected
                    ? "bg-blue-500 text-white shadow-md scale-105"
                    : count > 0
                      ? "bg-blue-100 text-blue-800 hover:bg-blue-200"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }
                `}
              >
                <span style={{ fontSize: 9 }}>{shortName}</span>
                {count > 0 && (
                  <span style={{ fontSize: 8 }} className={isSelected ? "text-blue-100" : "text-blue-600"}>
                    {count}
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>
      {selected && (
        <button
          onClick={() => onSelect("")}
          className="mt-2 text-xs text-blue-600 hover:underline"
        >
          絞り込み解除 ×
        </button>
      )}
    </div>
  );
}
