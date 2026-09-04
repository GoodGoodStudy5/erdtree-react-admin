import type { ComponentType } from 'react';

/**
 * 原型挂载点: 让原型嵌进真实页面, 而生产代码**不引用**任何原型文件.
 *
 * 判据是一条硬要求: **删掉整个 `prototype/` 目录后, 仓库照常构建.** 反向 import 做不到这一点
 * —— 删了目录, `tsc` 当场报 Cannot find module. 所以这里用 `import.meta.glob`: 它匹配不到
 * 文件时返回空对象而不是报错, 于是原型在与不在, 生产侧都编译得过.
 *
 * 方向由 `.dependency-cruiser.mjs` 的 `no-prototype-as-dependency` 上锁, **零豁免** ——
 * 「就破例这一个文件」的名单一旦开口, 第二个名字就没有判据可以拦.
 *
 * 原型侧要提供的东西见本目录 README 或既有的 `mount.tsx` 样例.
 */

/** 原型挂载点要导出的形状 */
interface MountModule {
  /** 挂在哪个插槽. 与 `<PrototypeSlot at>` 对上才渲染 */
  at?: string;
  /** 渲染什么. context 由宿主给, 原型侧自己断言类型 */
  Mount?: ComponentType<{ context: unknown }>;
}

/**
 * 扫全部原型挂载点.
 *
 * eager 取真: 插槽要在渲染期同步判断有没有原型, 异步模块做不到这一点而 `hasPrototype` 又要在
 * 构造表格列时就给出答案.
 *
 * 路径写死成 `mount.tsx`: 一个原型目录只允许一个挂载点 —— 多个挂载点意味着原型在宿主页面里
 * 长出了第二处接缝, 而接缝越多, 删除原型时越容易漏.
 */
const modules = import.meta.glob<MountModule>('/src/pages/**/prototype/mount.tsx', {
  eager: true,
});

/**
 * 找出挂在某个插槽上的原型.
 * @param at - 插槽名
 */
function findMount(at: string): MountModule | undefined {
  // 生产构建里一律当作没有原型: glob 在生产构建中也会命中文件, 只有这一条能拦住它进产物
  if (import.meta.env.PROD) return undefined;

  return Object.values(modules).find((module) => module.at === at && module.Mount);
}

/**
 * 这个插槽上有没有挂原型.
 *
 * 给宿主用来决定「要不要加这一列 / 这一块」—— 只用 {@link PrototypeSlot} 的话, 原型删掉之后
 * 宿主会留下一个空列, 而空列也是一种没删干净.
 * @param at - 插槽名
 */
export function hasPrototype(at: string): boolean {
  return findMount(at) !== undefined;
}

interface Props {
  /** 插槽名, 与原型 `mount.tsx` 导出的 `at` 对上 */
  at: string;
  /** 传给原型的上下文. 原型侧自己断言类型 —— 生产侧不该知道原型要什么 */
  context?: unknown;
}

/**
 * 渲染挂在这个插槽上的原型; 没有就渲染 null.
 * @param props - 组件参数
 */
export function PrototypeSlot(props: Props) {
  const { at, context } = props;
  const module = findMount(at);

  if (!module?.Mount) return null;

  return <module.Mount context={context} />;
}
