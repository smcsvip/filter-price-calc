export type NetType = '单面网' | '五面网';

export interface PriceResult {
  type: NetType;
  price: number;
  formula: string;
  isValid: boolean;
  errorMsg?: string;
}

export interface Rates {
  single: number;  // 单面网系数，默认 0.8
  five: number;    // 五面网系数，默认 1.5
  extra: number;   // 超高每 cm 加价，默认 10
}

export const DEFAULT_RATES: Rates = { single: 0.8, five: 1.5, extra: 10 };

export function formatPrice(price: number): string {
  if (price === Math.floor(price)) return price.toString();
  return parseFloat(price.toFixed(2)).toString();
}

/**
 * 核心定价逻辑（系数可配置）
 * - 高度为空/0 → 单面网：(长+宽) × rates.single
 * - 0 < 高度 ≤ 4 → 五面网：(长+宽) × rates.five
 * - 高度 > 4 → 五面网：(长+宽) × rates.five + ceil(高度-4) × rates.extra
 */
export function calculateFilterPrice(
  lengthStr: string,
  widthStr: string,
  heightStr: string,
  rates: Rates = DEFAULT_RATES,
): PriceResult {
  const l = parseFloat(lengthStr);
  const w = parseFloat(widthStr);
  const h = heightStr === '' ? 0 : parseFloat(heightStr);

  if (lengthStr === '' && widthStr === '') {
    return { type: '单面网', price: 0, formula: '', isValid: true };
  }

  if (lengthStr !== '' && (isNaN(l) || l <= 0)) {
    return { type: '单面网', price: 0, formula: '', isValid: false, errorMsg: '请输入正确尺寸' };
  }
  if (widthStr !== '' && (isNaN(w) || w <= 0)) {
    return { type: '单面网', price: 0, formula: '', isValid: false, errorMsg: '请输入正确尺寸' };
  }
  if (heightStr !== '' && (isNaN(h) || h < 0)) {
    return { type: '单面网', price: 0, formula: '', isValid: false, errorMsg: '请输入正确尺寸' };
  }

  if (lengthStr === '' || widthStr === '') {
    return { type: h > 0 ? '五面网' : '单面网', price: 0, formula: '', isValid: true };
  }

  const base = l + w;

  if (heightStr === '' || h === 0) {
    const price = base * rates.single;
    return {
      type: '单面网',
      price,
      formula: `(${l} + ${w}) × ${rates.single} = ¥${formatPrice(price)}`,
      isValid: true,
    };
  }

  if (h <= 4) {
    const price = base * rates.five;
    return {
      type: '五面网',
      price,
      formula: `(${l} + ${w}) × ${rates.five} = ¥${formatPrice(price)}`,
      isValid: true,
    };
  }

  const extraCm = Math.ceil(h - 4);
  const basePrice = base * rates.five;
  const extraPrice = extraCm * rates.extra;
  const price = basePrice + extraPrice;
  return {
    type: '五面网',
    price,
    formula: `(${l} + ${w}) × ${rates.five} + ${extraCm} × ${rates.extra} = ¥${formatPrice(price)}`,
    isValid: true,
  };
}
