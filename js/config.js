/* ============================================================
   КОНФИГУРАЦИЯ — активы и прогнозы аналитиков
   ============================================================ */

// Прогнозы аналитиков (данные из открытых источников)
export const ANALYST_FORECASTS = {
  'ofz26238': {
    targetPrice: 92.45, targetYield: 16.77, upside: 17.0, horizon: '12 мес',
    verdict: 'buy', source: 'БКС Мир инвестиций',
    thesis: 'Длинные ОФЗ выигрывают от снижения ключевой ставки. Прогноз ЦБ: 14,5–14,6% в 2026, 10,5–12,5% в 2027. Совокупный доход до 32% за год.',
    risks: ['Затяжной период высокой ставки', 'Рост геополитической премии', 'Инфляционные сюрпризы'],
    allocation: '40–50%'
  },
  'ofz26243': {
    targetPrice: 88.5, targetYield: 16.76, upside: 15.0, horizon: '12 мес',
    verdict: 'buy', source: 'Аналитика облигаций',
    thesis: 'Доходность к погашению 16,76% при дюрации 5,9 лет. ОФЗ 26243 входит в топ по доходности среди среднесрочных выпусков.',
    risks: ['Процентный риск', 'Ликвидность', 'Валютный риск'],
    allocation: '40–50%'
  },
  'sber': {
    targetPrice: 316.65, upside: 15.0, horizon: '12 мес',
    verdict: 'buy', source: 'Средняя целевая',
    thesis: 'Сбербанк — самый популярный актив у частных инвесторов (27,8% портфелей). Банковский сектор выигрывает от высоких ставок.',
    risks: ['Геополитика', 'Санкции', 'Замедление экономики'],
    allocation: '15–20%'
  },
  'gazp': {
    targetPrice: 120.12, upside: 26.0, horizon: '12 мес',
    verdict: 'buy', source: 'Средняя целевая',
    thesis: 'Газпром имеет наибольший потенциал среди голубых фишек. Поддержка от высоких цен на энергоносители.',
    risks: ['Санкции на экспорт', 'Снижение объёмов прокачки', 'Налоговые инициативы'],
    allocation: '10–15%'
  },
  'vtbr': {
    targetPrice: 39.96, upside: -20.0, horizon: '12 мес',
    verdict: 'avoid', source: 'Средняя целевая',
    thesis: 'Единственный из голубых фишек с отрицательным прогнозом. Давление от размывания капитала.',
    risks: ['Размывание капитала', 'Низкая маржа', 'Регуляторное давление'],
    allocation: '0%'
  },
  'btc': {
    targetPrice: 181000, upside: 115.0, horizon: '12 мес',
    verdict: 'buy', source: 'Citigroup',
    thesis: 'Целевая цена $181,000. BTC остаётся ключевым рисковым активом с высоким потенциалом.',
    risks: ['Коррекция риск-активов в 2027', 'Отток из ETF', 'Регуляторные риски'],
    allocation: '8–12%'
  },
  'eth': {
    targetPrice: 5400, upside: 111.0, horizon: '12 мес',
    verdict: 'buy', source: 'Citigroup',
    thesis: 'Целевая цена $5,400. Ethereum выигрывает от роста DeFi и токенизации активов.',
    risks: ['Конкуренция с L2', 'Регуляторные риски', 'Волатильность'],
    allocation: '5–8%'
  }
};

// Список активов
export const ASSETS_DEF = [
  { id:'sber',  name:'Сбербанк',    symbol:'SBER',  type:'stocks', moexBoard:'TQBR', color:'#21a038' },
  { id:'gazp',  name:'Газпром',     symbol:'GAZP',  type:'stocks', moexBoard:'TQBR', color:'#0d6efd' },
  { id:'lkoh',  name:'Лукойл',      symbol:'LKOH',  type:'stocks', moexBoard:'TQBR', color:'#e53935' },
  { id:'gmkn',  name:'Норникель',   symbol:'GMKN',  type:'stocks', moexBoard:'TQBR', color:'#f57c00' },
  { id:'vtbr',  name:'ВТБ',         symbol:'VTBR',  type:'stocks', moexBoard:'TQBR', color:'#1565c0' },
  { id:'ofz26238', name:'ОФЗ 26238', symbol:'SU26238RMFS4', type:'bonds', moexBoard:'TQOB', color:'#43a047' },
  { id:'ofz26243', name:'ОФЗ 26243', symbol:'SU26243RMFS4', type:'bonds', moexBoard:'TQOB', color:'#7b1fa2' },
  { id:'btc', name:'Bitcoin',   symbol:'BTC',  type:'crypto', cgId:'bitcoin',     color:'#f7931a' },
  { id:'eth', name:'Ethereum',  symbol:'ETH',  type:'crypto', cgId:'ethereum',    color:'#627eea' },
  { id:'bnb', name:'BNB',       symbol:'BNB',  type:'crypto', cgId:'binancecoin', color:'#f3ba2f' },
  { id:'sol', name:'Solana',    symbol:'SOL',  type:'crypto', cgId:'solana',      color:'#14f195' },
  { id:'xrp', name:'Ripple',    symbol:'XRP',  type:'crypto', cgId:'ripple',      color:'#23292f' }
];

// Ключ Finnhub (опционально)
export const FINNHUB_KEY = '';

// Глобальное состояние приложения
export const state = {
  assets: [],
  prices: {},
  history: {},
  portfolio: JSON.parse(localStorage.getItem('portfolio') || '[]'),
  filter: 'all',
  chartPeriod: 30,
  activeChartAssets: ['btc', 'eth', 'sber']
};

// Сохранение портфеля в localStorage
export function savePortfolio() {
  localStorage.setItem('portfolio', JSON.stringify(state.portfolio));
}