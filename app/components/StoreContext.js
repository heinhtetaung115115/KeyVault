'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { t } from '../lib/i18n';

const StoreContext = createContext();

export function StoreProvider({ children }) {
  const [theme, setTheme] = useState('dark');
  const [locale, setLocale] = useState('en');
  const [currency, setCurrency] = useState('USD');
  const [cart, setCart] = useState([]);
  const [toast, setToast] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('kv-theme');
    if (saved) setTheme(saved);
    const savedLocale = localStorage.getItem('kv-locale');
    if (savedLocale) setLocale(savedLocale);
    const savedCart = localStorage.getItem('kv-cart');
    if (savedCart) try { setCart(JSON.parse(savedCart)); } catch {}
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('kv-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('kv-locale', locale);
  }, [locale]);

  useEffect(() => {
    localStorage.setItem('kv-cart', JSON.stringify(cart));
  }, [cart]);

  const toggleTheme = () => setTheme(p => p === 'dark' ? 'light' : 'dark');
  const toggleLocale = () => setLocale(p => p === 'en' ? 'ru' : 'en');

  const addToCart = useCallback((product) => {
    setCart(prev => {
      const exists = prev.find(i => i.id === product.id);
      if (exists) return prev;
      return [...prev, { ...product, qty: 1 }];
    });
    showToast(locale === 'ru' ? 'Добавлено в корзину' : 'Added to cart');
    setCartOpen(true);
  }, [locale]);

  const removeFromCart = useCallback((id) => {
    setCart(prev => prev.filter(i => i.id !== id));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const cartTotal = cart.reduce((sum, i) => sum + (i.price * i.qty), 0);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const i = useCallback((key) => t(key, locale), [locale]);

  return (
    <StoreContext.Provider value={{
      theme, toggleTheme,
      locale, toggleLocale,
      currency, setCurrency,
      cart, addToCart, removeFromCart, clearCart, cartTotal, cartOpen, setCartOpen,
      toast, showToast,
      t: i,
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  return useContext(StoreContext);
}
