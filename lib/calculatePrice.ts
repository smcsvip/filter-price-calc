export type NetType = '单面网' | '五面网';

export interface PriceResult {
  type: NetType;
  price: number;
  formula: string;
  isValid: boolean;
  errorMsg?: string;
}

/**
 * 格式化价格：整数不显示小数，否则最多保留2位
 */
export function formatPrice(price: number): string {
  if (price === Math.floor(price)) return price.toString();
  return parseFloat(price.toFixed(2)).toString();
}

/**
 * 核心定价逻辑
 * - 高度为空/0 → 单面网：(长+宽) × 0.8
 * - 0 < 高度 ≤ 4 → 五面网：(长+宽) × 1.5
 * - 高度 > 4 → 五面网：(长+宽) × 1.5 + ceil(高度-4) × 10
 */
export function calculateFilterPrice(
  lengthStr: string,
  widthStr: string,
  heightStr: string
): PriceResult {
  const l = parseFloat(lengthStr);
  const w = parseFloat(widthStr);
  const h = heightStr === '' ? 0 : parseFloat(heightStr);

  // 长宽都为空时，返回初始状态
  if (lengthStr === '' && widthStr === '') {
    return { type: '单面网', price: 0, formula: '', isValid: true };
  }

  // 验证长度
  if (lengthStr !== '' && (isNaN(l) || l <= 0)) {
    return { type: '单面网', price: 0, formula: '', isValid: false, errorMsg: '请输入正确尺寸' };
  }
  // 验证宽度
  if (widthStr !== '' && (isNaN(w) || w <= 0)) {
    return { type: '单面网', price: 0, formula: '', isValid: false, errorMsg: '请输入正确尺寸' };
  }
  // 验证高度（允许0，不允许负数）
  if (heightStr !== '' && (isNaN(h) || h < 0)) {
    return { type: '单面网', price: 0, formula: '', isValid: false, errorMsg: '请输入正确尺寸' };
  }

  // 长或宽未填完整时，只显示类型，不计算价格
  if (lengthStr === '' || widthStr === '') {
    return { type: h > 0 ? '五面网' : '单面网', price: 0, formula: '', isValid: true };
  }

  const base = l + w;

  // 高度为空或0：单面网
  if (heightStr === '' || h === 0) {
    const price = base * 0.8;
    return {
      type: '单面网',
      price,
      formula: `(${l} + ${w}) × 0.8 = ¥${formatPrice(price)}`,
      isValid: true,
    };
  }

  // 高度 1~4cm：五面网基础价，不加价
  if (h <= 4) {
    const price = base * 1.5;
    return {
      type: '五面网',
      price,
      formula: `(${l} + ${w}) × 1.5 = ¥${formatPrice(price)}`,
      isValid: true,
    };
  }

  // 高度 > 4cm：五面网，超出部分向上取整，每厘米加10元
  const extraCm = Math.ceil(h - 4);
  const basePrice = base * 1.5;
  const extraPrice = extraCm * 10;
  const price = basePrice + extraPrice;
  return {
    type: '五面网',
    price,
    formula: `(${l} + ${w}) × 1.5 + ${extraCm} × 10 = ¥${formatPrice(price)}`,
    isValid: true,
  };
}
