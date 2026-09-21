import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const roles = readFileSync('src/styles/common/roles.less', 'utf-8');
const order = readFileSync('src/styles/common/index.ts', 'utf-8');
const uno = readFileSync('uno.config.ts', 'utf-8');

/** uno 属性前缀: 色名 `error` 会生成 `text-error` `bg-error` `border-error` 三个类 */
const PREFIXES = ['text', 'bg', 'border'];

/** 读源码而不 import: uno.config.ts 不在 tsconfig 的辖区, 引进来会把它一并拖进类型检查 */
function unoColorNames() {
  const block = uno.match(/const THEME_COLORS = \{([\s\S]*?)\n\};/)?.[1] ?? '';

  // 顶层键恰好缩进两格, 嵌套的 DEFAULT / bg / border 缩进四格, 不在此列
  return [...block.matchAll(/^ {2}'?([\w-]+)'?:/gm)].map((each) => each[1]);
}

/** 角色层的两条约束都会静默走错 —— 撞名的那个类照样渲染, 顺序错了的覆盖照样无声失效 */
describe('元素角色层', () => {
  it('类名不与 uno 的色名撞: 撞了就是两份定义, 改一处不生效', () => {
    const roleClasses = [...roles.matchAll(/^\.([\w-]+)\s*\{/gm)].map((each) => each[1]);
    const colors = unoColorNames();
    const clash = roleClasses.filter((name) =>
      colors.some((color) => PREFIXES.some((at) => name === `${at}-${color}`)),
    );

    expect(colors.length).toBeGreaterThan(0);
    expect(clash).toEqual([]);
  });

  it('排在 uno.css 之前: 挪到后面, 调用点就再也盖不过角色类', () => {
    // 只认 import 语句 —— 头注释里也提到了 uno.css
    const lines = order.split('\n').filter((line) => line.startsWith('import '));
    const at = (name: string) => lines.findIndex((line) => line.includes(name));

    expect(at('roles.less')).toBeLessThan(at('uno.css'));
  });
});
