import { EMPTY_VALUE } from '@/utils';

/** 千分位加两位小数. 建一次复用, 每次渲染新建实例很贵 */
const FORMATTER = new Intl.NumberFormat('zh-CN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

interface Props {
  /** 金额. 空值给占位符而不是 0 —— 「没有值」与「值是零」是两回事 */
  value?: number | null;
}

/**
 * 金额的唯一渲染入口.
 *
 * 红蓝票不单独开列, 于是负号与这里的红色就是红蓝的**全部**表达. 做成组件而不是格式化函数: 函数管不住
 * 调用方少写一个 class, 而漏了 class 红蓝的表达当场消失.
 *
 * 格式写死不走配置: 同一个金额在两个页面显示不同是要避免的事.
 * @param props - 组件参数
 */
export function Money(props: Props) {
  const { value } = props;

  if (value === null || value === undefined) {
    return <span className="text-[#c9ced7]">{EMPTY_VALUE}</span>;
  }

  return (
    <span className={value < 0 ? 'tabular-nums text-[#d6363b]' : 'tabular-nums'}>
      {FORMATTER.format(value)}
    </span>
  );
}
