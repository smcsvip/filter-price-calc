'use client';

import { useState, useCallback, useEffect } from 'react';
import { calculateFilterPrice, formatPrice, DEFAULT_RATES, type Rates } from '@/lib/calculatePrice';

type Field = 'length' | 'width' | 'height';
const FIELD_ORDER: Field[] = ['length', 'width', 'height'];
const FIELD_LABEL: Record<Field, string> = { length: '长度', width: '宽度', height: '高度' };
const STORAGE_KEY = 'filter-calc-rates';

function loadRates(): Rates {
  if (typeof window === 'undefined') return DEFAULT_RATES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_RATES;
    const parsed = JSON.parse(raw);
    return {
      single: Number(parsed.single) || DEFAULT_RATES.single,
      five:   Number(parsed.five)   || DEFAULT_RATES.five,
      extra:  Number(parsed.extra)  || DEFAULT_RATES.extra,
    };
  } catch { return DEFAULT_RATES; }
}

export default function Home() {
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [active, setActive] = useState<Field>('length');
  const [copied, setCopied] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [rates, setRates] = useState<Rates>(DEFAULT_RATES);

  useEffect(() => { setRates(loadRates()); }, []);

  const values: Record<Field, string> = { length, width, height };
  const setters: Record<Field, (v: string) => void> = { length: setLength, width: setWidth, height: setHeight };

  const result = calculateFilterPrice(length, width, height, rates);
  const hasPrice = result.isValid && result.price > 0;

  const appendToActive = useCallback((char: string) => {
    const cur = values[active];
    if (char === '.' && cur.includes('.')) return;
    if (cur === '0' && char !== '.') { setters[active](char); return; }
    setters[active](cur + char);
  }, [active, values, setters]);

  const handleBackspace = useCallback(() => {
    setters[active](values[active].slice(0, -1));
  }, [active, values, setters]);

  const handleNext = useCallback(() => {
    const idx = FIELD_ORDER.indexOf(active);
    if (idx < FIELD_ORDER.length - 1) setActive(FIELD_ORDER[idx + 1]);
  }, [active]);

  const handleClearAll = useCallback(() => {
    setLength(''); setWidth(''); setHeight('');
    setActive('length'); setCopied(false);
  }, []);

  const handleCopy = useCallback(async () => {
    if (!hasPrice) return;
    const text = `¥${formatPrice(result.price)}`;
    try { await navigator.clipboard.writeText(text); } catch {
      const el = document.createElement('input');
      el.value = text; document.body.appendChild(el);
      el.select(); document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [hasPrice, result.price]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (showSettings) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (/^[0-9]$/.test(e.key)) { e.preventDefault(); appendToActive(e.key); }
      else if (e.key === '.') { e.preventDefault(); appendToActive('.'); }
      else if (e.key === 'Backspace') { e.preventDefault(); handleBackspace(); }
      else if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); handleNext(); }
      else if (e.key === 'Escape') { e.preventDefault(); handleClearAll(); }
      else if (e.key === 'c' || e.key === 'C') { e.preventDefault(); handleCopy(); }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [appendToActive, handleBackspace, handleNext, handleClearAll, handleCopy, showSettings]);

  const isTypeFive = result.type === '五面网';
  const priceStr = hasPrice ? formatPrice(result.price) : '0';
  // 价格字号随屏幕高度和数字长度动态缩放
  const priceFontSize = priceStr.length > 7
    ? 'clamp(1.6rem, 4.5vh, 2.8rem)'
    : priceStr.length > 5
    ? 'clamp(2rem, 5.5vh, 3.6rem)'
    : 'clamp(2.4rem, 7vh, 4.8rem)';

  return (
    // 外层锁死 100dvh，禁止滚动；dvh 正确处理 Android Chrome 地址栏
    <div style={{
      height: '100dvh', overflow: 'hidden',
      background: '#1c1c1e',
      display: 'flex', justifyContent: 'center',
    }}>
      <div style={{
        width: '100%', maxWidth: 480,
        height: '100dvh',
        display: 'flex', flexDirection: 'column',
        background: '#1c1c1e',
        // 兼容 iOS/Android 安全区
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}>

        {/* ── 标题栏（固定紧凑） ── */}
        <div style={{ padding: 'clamp(8px,1.5vh,16px) 16px clamp(4px,1vh,10px)', flexShrink: 0 }}>
          <div style={{ textAlign: 'center', marginBottom: 'clamp(4px,1vh,8px)' }}>
            <div style={{ color: '#F5F5F5', fontSize: 'clamp(16px,2.5vh,22px)', fontWeight: 700, letterSpacing: '-0.3px' }}>
              过滤网价格计算器
            </div>
            <div style={{ color: '#8E8E93', fontSize: 'clamp(10px,1.5vh,13px)', marginTop: 2 }}>
              过滤网快速报价工具
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
            <span style={{
              fontSize: 'clamp(11px,1.6vh,14px)', fontWeight: 700,
              padding: '4px 12px', borderRadius: 20,
              background: isTypeFive ? 'rgba(255,159,10,0.28)' : 'rgba(10,132,255,0.28)',
              color: isTypeFive ? '#FF9F0A' : '#3DA8FF',
              border: `1.5px solid ${isTypeFive ? 'rgba(255,159,10,0.6)' : 'rgba(10,132,255,0.6)'}`,
            }}>
              {result.type}
            </span>
            <button
              onClick={() => setShowSettings(true)}
              style={{
                width: 'clamp(30px,4vh,36px)', height: 'clamp(30px,4vh,36px)',
                borderRadius: '50%', background: '#3A3A3C', border: 'none',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#AFAFAF', fontSize: 'clamp(14px,2vh,18px)',
                WebkitTapHighlightColor: 'transparent', flexShrink: 0,
              }}
            >⚙</button>
          </div>
        </div>

        {/* ── 输入区（横排三列） ── */}
        <div style={{ padding: '0 12px', display: 'flex', gap: 'clamp(4px,0.8vh,8px)', flexShrink: 0 }}>
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

        {/* ── 价格区（固定，紧凑） ── */}
        <div style={{
          margin: 'clamp(6px,1vh,12px) 12px',
          background: '#262626', borderRadius: 14,
          padding: 'clamp(8px,1.5vh,14px) 16px',
          border: '1px solid rgba(255,255,255,0.08)',
          flexShrink: 0,
        }}>
          <div style={{ fontSize: 'clamp(10px,1.4vh,12px)', fontWeight: 600, color: '#8e8e93', letterSpacing: '0.05em', marginBottom: 4 }}>
            当前：{result.type}
          </div>
          {!result.isValid ? (
            <div style={{ color: '#ff453a', fontSize: 16, fontWeight: 600 }}>请输入正确尺寸</div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span style={{ color: '#AFAFAF', fontSize: 'clamp(1rem,2.5vh,1.6rem)', fontWeight: 400, lineHeight: 1 }}>¥</span>
                <span style={{ color: '#FFFFFF', fontSize: priceFontSize, fontWeight: 600, letterSpacing: '-0.03em', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                  {priceStr}
                </span>
              </div>
              {result.formula && (
                <div style={{ color: '#636366', fontSize: 'clamp(10px,1.4vh,12px)', marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>
                  {result.formula}
                </div>
              )}
            </>
          )}
        </div>

        {/* ── 键盘区（flex:1 填满剩余空间） ── */}
        <div style={{ flex: 1, padding: '0 12px', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{
            flex: 1, display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gridTemplateRows: 'repeat(4, 1fr)',
            gap: 'clamp(6px,1.2vh,12px)',
          }}>
            <Key label="7"  onClick={() => appendToActive('7')} />
            <Key label="8"  onClick={() => appendToActive('8')} />
            <Key label="9"  onClick={() => appendToActive('9')} />
            <Key label="⌫"  onClick={handleBackspace} type="func" />
            <Key label="4"  onClick={() => appendToActive('4')} />
            <Key label="5"  onClick={() => appendToActive('5')} />
            <Key label="6"  onClick={() => appendToActive('6')} />
            <Key label="AC" onClick={handleClearAll} type="func" danger />
            <Key label="1"  onClick={() => appendToActive('1')} />
            <Key label="2"  onClick={() => appendToActive('2')} />
            <Key label="3"  onClick={() => appendToActive('3')} />
            <Key label={copied ? '✓' : '复制'} onClick={handleCopy} type={copied ? 'green' : hasPrice ? 'accent' : 'func'} />
            <Key label="0"  onClick={() => appendToActive('0')} />
            <Key label="00" onClick={() => appendToActive('00')} />
            <Key label="."  onClick={() => appendToActive('.')} />
            <Key label={active === 'height' ? '完成' : '→'} onClick={handleNext} type="accent" />
          </div>
        </div>

        {/* ── 底部规则说明（紧凑） ── */}
        <div style={{
          margin: 'clamp(4px,0.8vh,8px) 12px clamp(6px,1vh,12px)',
          background: '#262626', borderRadius: 10,
          padding: 'clamp(6px,1vh,10px) 12px',
          border: '1px solid rgba(255,255,255,0.07)',
          flexShrink: 0,
        }}>
          <div style={{ color: '#AFAFAF', fontSize: 'clamp(10px,1.3vh,12px)', lineHeight: 1.7 }}>
            <div>· 高度 1–4cm：五面网，(长+宽) × {rates.five}</div>
            <div>· 高度 &gt; 4cm：超出部分每 1cm 加 {rates.extra} 元</div>
            <div>· 不填高度：单面网，(长+宽) × {rates.single}</div>
          </div>
        </div>

      </div>

      {/* ── 设置面板 ── */}
      {showSettings && (
        <SettingsPanel
          rates={rates}
          onSave={(newRates) => {
            setRates(newRates);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newRates));
            setShowSettings(false);
          }}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}

/* ─── 设置面板（顶部抽屉） ─── */
function SettingsPanel({ rates, onSave, onClose }: {
  rates: Rates; onSave: (r: Rates) => void; onClose: () => void;
}) {
  const [single, setSingle] = useState(String(rates.single));
  const [five, setFive]     = useState(String(rates.five));

  const handleSave = () => {
    const s = parseFloat(single);
    const f = parseFloat(five);
    if (isNaN(s) || s <= 0 || isNaN(f) || f <= 0) return;
    onSave({ single: s, five: f, extra: rates.extra });
  };

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 40 }} />
      <div style={{
        position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 480,
        background: '#2C2C2E', borderRadius: '0 0 20px 20px',
        padding: '0 20px 24px',
        zIndex: 50, boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
        paddingTop: 'env(safe-area-inset-top, 16px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0 20px' }}>
          <span style={{ color: '#F5F5F5', fontSize: 18, fontWeight: 700 }}>计算系数设置</span>
          <button onClick={() => { setSingle(String(DEFAULT_RATES.single)); setFive(String(DEFAULT_RATES.five)); }}
            style={{ background: 'none', border: 'none', color: '#FF9F0A', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
            恢复默认
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <SettingRow label="单面网系数" desc={`价格 = (长+宽) × ${single || '?'}`} value={single} onChange={setSingle} />
          <SettingRow label="五面网系数" desc={`价格 = (长+宽) × ${five || '?'}`} value={five} onChange={setFive} />
        </div>
        <button onClick={handleSave} style={{
          marginTop: 20, width: '100%', height: 50,
          background: '#FF9F0A', color: '#000', border: 'none',
          borderRadius: 14, fontSize: 17, fontWeight: 700,
          cursor: 'pointer', fontFamily: 'inherit',
        }}>保存设置</button>
      </div>
    </>
  );
}

/* ─── 设置行 ─── */
function SettingRow({ label, desc, value, onChange }: {
  label: string; desc: string; value: string; onChange: (v: string) => void;
}) {
  return (
    <div style={{ background: '#3A3A3C', borderRadius: 12, padding: '12px 14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div style={{ color: '#F5F5F5', fontSize: 15, fontWeight: 600 }}>{label}</div>
          <div style={{ color: '#8E8E93', fontSize: 12, marginTop: 2 }}>{desc}</div>
        </div>
        <input type="number" inputMode="decimal" value={value} onChange={(e) => onChange(e.target.value)}
          style={{ width: 80, height: 40, borderRadius: 8, background: '#1C1C1E', border: '1.5px solid #636366', color: '#FF9F0A', fontSize: 18, fontWeight: 700, textAlign: 'center', outline: 'none', fontFamily: 'inherit' }}
          onFocus={(e) => { e.currentTarget.style.borderColor = '#FF9F0A'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = '#636366'; }}
        />
      </div>
    </div>
  );
}

/* ─── 输入框列（横排三列） ─── */
function FieldRow({ label, value, isActive, isOptional, onClick }: {
  label: string; value: string; isActive: boolean; isOptional: boolean; onClick: () => void;
}) {
  const numFontSize = value.length > 6 ? 'clamp(1rem,2.5vh,1.3rem)' : value.length > 3 ? 'clamp(1.2rem,3vh,1.5rem)' : 'clamp(1.4rem,3.5vh,1.8rem)';
  return (
    <button onClick={onClick} style={{
      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch',
      height: 'clamp(60px,9vh,80px)', padding: 'clamp(6px,1vh,10px) 10px clamp(4px,0.8vh,8px)',
      background: '#2B2B2B',
      border: `2px solid ${isActive ? '#FF9F0A' : 'rgba(255,255,255,0.1)'}`,
      borderRadius: 12, cursor: 'pointer',
      touchAction: 'manipulation',
    }}>
      {/* 标签行 */}
      <span style={{ fontSize: 'clamp(11px,1.6vh,13px)', fontWeight: 600, color: isActive ? '#FF9F0A' : '#8E8E93', textAlign: 'left', lineHeight: 1 }}>
        {label}{isOptional && <sup style={{ fontSize: 8, color: '#636366', marginLeft: 1 }}>*</sup>}
      </span>
      {/* 数值行 */}
      <span style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 2, minHeight: 0 }}>
        <span style={{ fontSize: numFontSize, fontWeight: 600, color: isActive ? '#FFFFFF' : '#AFAFAF', letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
          {value || <span style={{ opacity: 0.25, fontSize: 'clamp(1rem,2.5vh,1.3rem)', fontWeight: 400 }}>—</span>}
          {isActive && <span style={{ display: 'inline-block', width: 2, height: '1em', background: '#FF9F0A', borderRadius: 1, marginLeft: 2, verticalAlign: 'middle', animation: 'blink 1s step-end infinite' }} />}
        </span>
      </span>
      {/* 单位行 */}
      <span style={{ fontSize: 'clamp(10px,1.4vh,12px)', fontWeight: 500, color: isActive ? '#AFAFAF' : '#636366', textAlign: 'right', lineHeight: 1 }}>cm</span>
    </button>
  );
}

/* ─── 圆形按键（填满 grid 单元格） ─── */
type KeyType = 'num' | 'func' | 'accent' | 'green';

function Key({ label, onClick, type = 'num', danger }: {
  label: string; onClick: () => void; type?: KeyType; danger?: boolean;
}) {
  const bg: Record<KeyType, string> = { num: '#3A3A3C', func: '#5A5A5F', accent: '#FF9F0A', green: '#30d158' };
  const fg: Record<KeyType, string> = { num: '#FFFFFF', func: '#FFFFFF', accent: '#000000', green: '#FFFFFF' };
  const isLong = label.length > 2;
  return (
    <button
      onClick={onClick}
      style={{
        background: bg[type], color: danger ? '#FF453A' : fg[type],
        borderRadius: '50%',
        // 宽高都用 100% 填满 grid 单元格，aspect-ratio 保持圆形
        width: '100%', height: '100%',
        border: 'none', cursor: 'pointer',
        fontSize: isLong ? 'clamp(0.75rem,1.8vh,1rem)' : 'clamp(1.1rem,2.8vh,1.6rem)',
        fontWeight: isLong ? 700 : 400,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
        WebkitTapHighlightColor: 'transparent', userSelect: 'none',
        touchAction: 'manipulation',
        transition: 'opacity 0.08s, transform 0.08s', fontFamily: 'inherit',
      }}
      onPointerDown={(e) => { const el = e.currentTarget as HTMLButtonElement; el.style.opacity = '0.55'; el.style.transform = 'scale(0.91)'; }}
      onPointerUp={(e) => { const el = e.currentTarget as HTMLButtonElement; el.style.opacity = '1'; el.style.transform = 'scale(1)'; }}
      onPointerLeave={(e) => { const el = e.currentTarget as HTMLButtonElement; el.style.opacity = '1'; el.style.transform = 'scale(1)'; }}
    >
      {label}
    </button>
  );
}
