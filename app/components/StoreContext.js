"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";

const StoreContext = createContext(null);

const themes = {
  dark: {
    bg: "#0c0e14", surface: "#14171f", surface2: "#1a1e28", surface3: "#222836",
    border: "#252b3a", bHover: "#333c50",
    tx: "#eaedf3", tx2: "#8891a5", tx3: "#525c72",
    accent: "#3b82f6", accentH: "#2563eb",
    green: "#22c55e", greenBg: "#0d2818",
    red: "#ef4444", redBg: "#2a0f0f",
    orange: "#f59e0b", orangeBg: "#261a04",
    headerBg: "rgba(12,14,20,.88)",
    imgOverlay: "linear-gradient(180deg, transparent 50%, #14171f)",
    shadow: "rgba(0,0,0,.4)",
  },
  light: {
    bg: "#f5f6f8", surface: "#ffffff", surface2: "#f0f1f4", surface3: "#e8eaef",
    border: "#dfe2e8", bHover: "#c5c9d3",
    tx: "#15181e", tx2: "#6b7385", tx3: "#9ca3b3",
    accent: "#3b82f6", accentH: "#2563eb",
    green: "#16a34a", greenBg: "#dcfce7",
    red: "#dc2626", redBg: "#fef2f2",
    orange: "#ea580c", orangeBg: "#fffbeb",
    headerBg: "rgba(255,255,255,.88)",
    imgOverlay: "linear-gradient(180deg, transparent 50%, #ffffff)",
    shadow: "rgba(0,0,0,.08)",
  },
};

const i18n = {
  en: {
    search: "Search games, keys, cards...",
    hero1: "Game keys & cards,", hero2: "instant delivery",
    heroSub: "Best prices, verified seller, buyer protection. Your key is delivered automatically after payment.",
    trust: ["⚡ Instant", "🛡 Protected", "✓ Verified", "💳 Secure"],
    all: "All", products: "products", loading: "Loading...",
    noProducts: "No products found.", clearSearch: "Clear search",
    topRated: "Top rated", priceLow: "Price: low → high", priceHigh: "Price: high → low", nameAZ: "Name A–Z",
    buyNow: "Buy now", sold: "sold", inStock: "In Stock", outOfStock: "Out of stock",
    features: ["Instant delivery", "Buyer protection", "Verified seller", "24/7 support"],
    descFallback: "Instant digital delivery. Your key is sent automatically after payment. Verified seller with buyer protection.",
    reviews: "Recent reviews", prev: "Prev", next: "Next",
    footer: ["About", "FAQ", "Terms", "Privacy", "Support"],
    powered: "Powered by Digiseller", back: "← Back to store",
  },
  ru: {
    search: "Поиск игр, ключей, карт...",
    hero1: "Игровые ключи и карты,", hero2: "мгновенная доставка",
    heroSub: "Лучшие цены, проверенный продавец, защита покупателя. Ключ доставляется автоматически после оплаты.",
    trust: ["⚡ Мгновенно", "🛡 Защита", "✓ Проверено", "💳 Безопасно"],
    all: "Все", products: "товаров", loading: "Загрузка...",
    noProducts: "Товары не найдены.", clearSearch: "Очистить",
    topRated: "По рейтингу", priceLow: "Цена ↑", priceHigh: "Цена ↓", nameAZ: "По названию",
    buyNow: "Купить", sold: "продано", inStock: "В наличии", outOfStock: "Нет в наличии",
    features: ["Мгновенная доставка", "Защита покупателя", "Проверенный продавец", "Поддержка 24/7"],
    descFallback: "Мгновенная доставка. Ключ отправляется автоматически после оплаты. Проверенный продавец с защитой покупателя.",
    reviews: "Последние отзывы", prev: "Назад", next: "Далее",
    footer: ["О нас", "FAQ", "Условия", "Конфиденциальность", "Поддержка"],
    powered: "Работает на Digiseller", back: "← В магазин",
  },
};

const currencies = {
  en: { code: "USD", symbol: "$" },
  ru: { code: "RUB", symbol: "₽" },
};

export function StoreProvider({ children }) {
  const [dark, setDark] = useState(true);
  const [lang, setLang] = useState("en");

  useEffect(() => {
    try {
      const st = window.localStorage?.getItem("kv-theme");
      if (st === "light") setDark(false);
      const sl = window.localStorage?.getItem("kv-lang");
      if (sl === "ru") setLang("ru");
    } catch {}
  }, []);

  const toggleTheme = useCallback(() => {
    setDark((d) => { const n = !d; try { window.localStorage?.setItem("kv-theme", n ? "dark" : "light"); } catch {} return n; });
  }, []);

  const switchLang = useCallback((l) => {
    setLang(l);
    try { window.localStorage?.setItem("kv-lang", l); } catch {}
  }, []);

  const v = dark ? themes.dark : themes.light;
  const t = i18n[lang];
  const cur = currencies[lang];

  return (
    <StoreContext.Provider value={{ dark, toggleTheme, v, lang, switchLang, t, cur }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
