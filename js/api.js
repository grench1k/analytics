/* ============================================================
   API — CoinGecko, MOEX, Finnhub
   ============================================================ */
import { ASSETS_DEF, state, FINNHUB_KEY } from './config.js';

// Загрузка цен крипты
export async function fetchCryptoPrices() {
  const ids = ASSETS_DEF.filter(a => a.type === 'crypto').map(a => a.cgId).join(',');
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('CoinGecko error');
  const data = await res.json();
  ASSETS_DEF.filter(a => a.type === 'crypto').forEach(a => {
    const d = data[a.cgId]; if (!d) return;
    state.prices[a.id] = d.usd;
    state.assets.push({
      ...a, price: d.usd, change: d.usd_24h_change || 0,
      cap: d.usd_market_cap ? formatCap(d.usd_market_cap) : '—'
    });
  });
}

// Загрузка цен с MOEX
export async function fetchMoexPrices() {
  const moexAssets = ASSETS_DEF.filter(a => a.type === 'stocks' || a.type === 'bonds');
  for (const a of moexAssets) {
    try {
      const url = `https://iss.moex.com/iss/engines/stock/markets/shares/boards/${a.moexBoard}/securities/${a.symbol}.json?iss.meta=off&iss.only=marketdata`;
      const res = await fetch(url);
      if (!res.ok) continue;
      const data = await res.json();
      const md = data.marketdata;
      if (!md || !md.data || !md.data.length) continue;
      const cols = md.columns, row = md.data[0];
      const get = (n) => { const i = cols.indexOf(n); return i >= 0 ? row[i] : null; };
      const last = get('LAST') || get('MARKETPRICE') || get('LEGALCLOSEPRICE');
      const changePct = get('LASTCHANGEPRCNT') || get('LASTTOPREVPRICE');
      if (last) {
        const isBond = a.type === 'bonds';
        const price = isBond ? (last / 100) * 1000 : last;
        state.prices[a.id] = price;
        state.assets.push({ ...a, price, change: changePct || 0, cap: '—' });
      }
    } catch (e) { console.warn('MOEX', a.symbol, e); }
  }
}

// История крипты
export async function fetchCryptoHistory(cgId, days) {
  const url = `https://api.coingecko.com/api/v3/coins/${cgId}/market_chart?vs_currency=usd&days=${days}&interval=daily`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('CG history error');
  const data = await res.json();
  return data.prices.map(([ts, price]) => ({ t: ts, p: price }));
}

// История акций MOEX
export async function fetchMoexHistory(symbol, days) {
  const end = new Date().toISOString().slice(0, 10);
  const start = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
  const url = `https://iss.moex.com/iss/engines/stock/markets/shares/boards/TQBR/securities/${symbol}/candles.json?from=${start}&till=${end}&interval=24&iss.meta=off`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('MOEX history error');
  const data = await res.json();
  const cols = data.candles.columns;
  const ci = { close: cols.indexOf('close'), begin: cols.indexOf('begin') };
  if (ci.close < 0) return [];
  return data.candles.data.map(row => ({ t: new Date(row[ci.begin]).getTime(), p: row[ci.close] }));
}

// Загрузка всех цен
export async function loadAllPrices() {
  state.assets = [];
  await Promise.all([
    fetchCryptoPrices().catch(e => console.warn('Crypto:', e)),
    fetchMoexPrices().catch(e => console.warn('MOEX:', e))
  ]);
}

// ============================================================
// ФОРМАТИРОВАНИЕ
// ============================================================
export const fmt = (n) => {
  if (n == null || isNaN(n)) return '—';
  if (n >= 1000) return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (n >= 1) return '$' + n.toFixed(2);
  return '$' + n.toFixed(4);
};

export const fmtRub = (n) => n == null || isNaN(n) ? '—' : n.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₽';
export const fmtChange = (n) => (n >= 0 ? '+' : '') + n.toFixed(2) + '%';

export const formatCap = (n) => {
  if (n >= 1e12) return (n / 1e12).toFixed(2) + 'T';
  if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  return n.toFixed(0);
};

export function formatPrice(asset) {
  if (!asset) return '—';
  if (asset.type === 'bonds' || asset.type === 'stocks') return fmtRub(asset.price);
  return fmt(asset.price);
}