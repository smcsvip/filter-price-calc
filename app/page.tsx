'use client';

import { useState, useCallback, useEffect } from 'react';
import { calculateFilterPrice, formatPrice } from '@/lib/calculatePrice';

type Field = 'length' | 'width' | 'height';
const FIELD_ORDER: Field[] = ['length', 'width', 'height'];
const FIELD_LABEL: Record<Field, string> = { length: '长度', width: '宽度', height: '高度' };

export default function Home() {
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [active, setActive] = useState<Field>('length');
  const [copied, setCopied] = useState(false);

  const values: Record<Field, string> = { length, width, height };
  const setters: Record<Field, (v: string) => void> = { length: setLength, width: setWidth, height: setHeight };

  const result = calculateFilterPrice(length, width, height);
  const hasPrice = result.isValid && result.price > 0;

  // 追加字符到当前激活字段
  const appendToActive = useCallback((char: string) => {
    const cur = values[active];
    // 小数点只允许一个
    if (char === '.' && cur.includes('.')) return;
    // 防止前导零（"0x" → 直接替换为 x，但允许 "0."）
    if (cur === '0' && char !== '.') {
      setters[active](char);
      return;
    }
    setters[active](cur + char);
  }, [active, values, setters]);

  // 退格
  const handleBackspace = useCallback(() => {
    setters[active](values[active].slice(0, -1));
  }, [active, values, setters]);

  // ✓ 跳到下一个字段
  const handleNext = useCallback(() => {
    const idx = FIELD_ORDER.indexOf(active);
    if (idx < FIELD_ORDER.length - 1) setActive(FIELD_ORDER[idx + 1]);
  }, [active]);

  // 全清
  const handleClearAll = useCallback(() => {
    setLength(''); setWidth(''); setHeight('');
    setActive('length');
    setCopied(false);
  }, []);

  // 复制价格
  const handleCopy = useCallback(async () => {
    if (!hasPrice) return;
    const text = `¥${formatPrice(result.price)}`;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const el = document.createElement('input');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [hasPrice, result.price]);

  // 键盘输入支持：数字/小数点追加，Enter/Tab 跳字段，Backspace 退格，Escape 全清，c 复制
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // 忽略修饰键组合，避免干扰浏览器快捷键
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        appendToActive(e.key);
      } else if (e.key === '.') {
        e.preventDefault();
        appendToActive('.');
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleClearAll();
      } else if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        handleCopy();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [appendToActive, handleBackspace, handleNext, handleClearAll, handleCopy]);

  const isTypeFive = result.type === '五面网';

  return (
    <main className="min-h-screen bg-slate-950 flex flex-col items-center justify-start px-4 pt-8 pb-8">

      {/* 标题 */}
      <div className="w-full max-w-sm mb-5 text-center">
        <h1 className="text-2xl font-bold text-white tracking-tight">过滤网价格计算器</h1>
        <p className="text-slate-500 text-sm mt-1">直播快速报价工具</p>
      </div>

      {/* 主卡片 */}
      <div className="w-full max-w-sm bg-slate-800 rounded-2xl shadow-2xl overflow-hidden">

        {/* 字段显示区 */}
        <div className="px-4 pt-4 pb-3 space-y-2">
          {FIELD_ORDER.map((field) => (
            <FieldRow
              key={field}
              label={FIELD_LABEL[field]}
              value={values[field]}
              isActive={active === field}
              isOptional={field === 'height'}
              onClick={() => setActive(field)}
            />
          ))}
        </div>

        {/* 分割线 */}
        <div className="h-px bg-slate-700 mx-4" />

        {/* 结果区 */}
        <div className="px-4 pt-3 pb-4 space-y-3">
          {/* 网型标签 */}
          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-sm">自动识别：</span>
            <span className={`px-3 py-0.5 rounded-full text-sm font-semibold border transition-colors ${
              isTypeFive
                ? 'bg-orange-500/15 text-orange-400 border-orange-500/30'
                : 'bg-blue-500/15 text-blue-400 border-blue-500/30'
            }`}>
              {result.type}
            </span>
          </div>

          {/* 价格屏 */}
          <div className="bg-slate-900 rounded-xl px-4 py-4 min-h-[84px] flex flex-col items-center justify-center">
            {!result.isValid ? (
              <p className="text-red-400 text-base font-medium">请输入正确尺寸</p>
            ) : (
              <>
                <div className="flex items-baseline gap-1">
                  <span className="text-slate-400 text-xl font-light">¥</span>
                  <span className="text-5xl font-bold text-white tabular-nums leading-none">
                    {hasPrice ? formatPrice(result.price) : '0'}
                  </span>
                </div>
                {result.formula && (
                  <p className="text-slate-500 text-xs mt-1.5 text-center">{result.formula}</p>
                )}
              </>
            )}
          </div>
        </div>

        {/* 分割线 */}
        <div className="h-px bg-slate-700 mx-4" />

        {/* 数字键盘 */}
        <div className="p-4">
          <div className="grid grid-cols-4 gap-2">
            {/* 行1: 7 8 9 ← */}
            <CalcKey label="7" onClick={() => appendToActive('7')} />
            <CalcKey label="8" onClick={() => appendToActive('8')} />
            <CalcKey label="9" onClick={() => appendToActive('9')} />
            <CalcKey label="←" onClick={handleBackspace} variant="func" />

            {/* 行2: 4 5 6 全清 */}
            <CalcKey label="4" onClick={() => appendToActive('4')} />
            <CalcKey label="5" onClick={() => appendToActive('5')} />
            <CalcKey label="6" onClick={() => appendToActive('6')} />
            <CalcKey label="全清" onClick={handleClearAll} variant="danger" />

            {/* 行3: 1 2 3 复制 */}
            <CalcKey label="1" onClick={() => appendToActive('1')} />
            <CalcKey label="2" onClick={() => appendToActive('2')} />
            <CalcKey label="3" onClick={() => appendToActive('3')} />
            <CalcKey
              label={copied ? '已复制' : '复制'}
              onClick={handleCopy}
              variant={copied ? 'success' : hasPrice ? 'copy' : 'disabled'}
            />

            {/* 行4: 0 00 . ✓ */}
            <CalcKey label="0" onClick={() => appendToActive('0')} />
            <CalcKey label="00" onClick={() => appendToActive('00')} />
            <CalcKey label="." onClick={() => appendToActive('.')} />
            <CalcKey
              label={active === 'height' ? '完成' : '下一个'}
              onClick={handleNext}
              variant="next"
            />
          </div>
        </div>
      </div>

      {/* 底部说明 */}
      <div className="w-full max-w-sm mt-4 px-1 space-y-1">
        <p className="text-slate-600 text-xs">· 高度 1–4cm：五面网，(长+宽) × 1.5</p>
        <p className="text-slate-600 text-xs">· 高度 &gt; 4cm：每超出 1cm（向上取整）加 10 元</p>
        <p className="text-slate-600 text-xs">· 不填高度或高度为 0：单面网，(长+宽) × 0.8</p>
      </div>
    </main>
  );
}

/* ─── 字段展示行 ─── */
function FieldRow({
  label, value, isActive, isOptional, onClick,
}: {
  label: string;
  value: string;
  isActive: boolean;
  isOptional: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 h-14 rounded-xl border transition-all select-none ${
        isActive
          ? 'bg-slate-900 border-amber-500'
          : 'bg-slate-900/50 border-slate-700 active:border-slate-500'
      }`}
    >
      {/* 激活指示点 */}
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 transition-colors ${
        isActive ? 'bg-amber-400' : 'bg-transparent'
      }`} />

      {/* 标签 */}
      <span className={`text-sm w-10 shrink-0 text-left transition-colors ${
        isActive ? 'text-amber-400' : 'text-slate-500'
      }`}>
        {label}
        {isOptional && <span className="text-slate-600 text-xs ml-0.5">*</span>}
      </span>

      {/* 数值 + 光标 */}
      <span className="flex-1 text-left text-white text-xl font-medium tabular-nums">
        {value || <span className="text-slate-600 text-base font-normal">—</span>}
        {isActive && (
          <span className="inline-block w-0.5 h-5 bg-amber-400 ml-0.5 align-middle animate-pulse" />
        )}
      </span>

      {/* 单位 */}
      <span className="text-slate-500 text-sm shrink-0">cm</span>
    </button>
  );
}

/* ─── 计算器按键 ─── */
type KeyVariant = 'default' | 'func' | 'danger' | 'copy' | 'success' | 'disabled' | 'next';

function CalcKey({
  label, onClick, variant = 'default',
}: {
  label: string;
  onClick: () => void;
  variant?: KeyVariant;
}) {
  const base = 'h-14 rounded-xl font-semibold text-lg transition-all active:scale-95 select-none flex items-center justify-center';
  const styles: Record<KeyVariant, string> = {
    default:  'bg-slate-700 text-white active:bg-slate-600',
    func:     'bg-slate-600 text-slate-200 active:bg-slate-500',
    danger:   'bg-slate-600 text-red-400 active:bg-slate-500',
    copy:     'bg-amber-500 text-slate-900 active:bg-amber-400',
    success:  'bg-emerald-600 text-white',
    disabled: 'bg-slate-700 text-slate-600 cursor-not-allowed',
    next:     'bg-amber-500/20 text-amber-400 border border-amber-500/40 active:bg-amber-500/30 text-sm',
  };
  return (
    <button onClick={onClick} className={`${base} ${styles[variant]}`}>
      {label}
    </button>
  );
}
