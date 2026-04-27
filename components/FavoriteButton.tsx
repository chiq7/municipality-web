"use client";

import { useState, useEffect } from "react";

const KEY = "facility_favorites_v1";

function loadFavorites(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const data = JSON.parse(localStorage.getItem(KEY) || "[]");
    return new Set(Array.isArray(data) ? data : []);
  } catch {
    return new Set();
  }
}

function saveFavorites(ids: Set<string>) {
  localStorage.setItem(KEY, JSON.stringify(Array.from(ids)));
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  useEffect(() => {
    setFavorites(loadFavorites());
  }, []);

  const toggle = (id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      saveFavorites(next);
      return next;
    });
  };

  return { favorites, toggle };
}

export default function FavoriteButton({
  id,
  favorites,
  onToggle,
}: {
  id: string;
  favorites: Set<string>;
  onToggle: (id: string) => void;
}) {
  const isFav = favorites.has(id);

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggle(id);
      }}
      className={`p-1.5 rounded-full transition-colors ${
        isFav
          ? "text-red-500 bg-red-50 hover:bg-red-100"
          : "text-gray-300 hover:text-red-400 hover:bg-red-50"
      }`}
      aria-label={isFav ? "お気に入りを解除" : "お気に入りに追加"}
    >
      <svg
        viewBox="0 0 24 24"
        className="w-4 h-4"
        fill={isFav ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
    </button>
  );
}
