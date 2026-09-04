/**
 * 抽屉路由: 一个抽屉在 URL 上的可寻址身份 —— 地址栏能表达「这一屏开着哪些抽屉、各自看的是哪条数据」.
 *
 * 抽屉表: 一个页面全部抽屉路由的声明处, 就地写在页面里 `useDrawerRoutes` 的调用处;
 * 抽屉名在表内唯一, 它就是 URL 上的名字.
 */

import type { ModalComponent } from '@south/components';
import { getModalInstances, openModal, requestCloseModal } from '@south/components';
import { useEffect, useRef } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';

/** URL 上承载抽屉路由的查询键. 与搜索条件共处一个 query, 所以只占这一个 */
const URL_KEY = 'openDrawer';

/** 抽屉名 → 抽屉组件. 名字即 URL 上的名字, 同表内唯一由对象键保证 */
export type DrawerTable = Record<string, ModalComponent>;

/** URL 载荷: 抽屉名 → 该抽屉的 props. 键序即叠层序, ES 规范保证字符串键的插入序 */
type DrawerPayload = Record<string, Record<string, unknown>>;

/** 一个抽屉组件在哪个页面上叫什么 */
interface DrawerIdentity {
  /** URL 上的名字 */
  name: string;
  /** 声明它的那个页面 */
  pathname: string;
}

/**
 * 此刻声明过的抽屉. 页面挂载时登记, 卸载时注销.
 *
 * 是运行时值而非模块顶层的静态引用, 所以不把页面抽屉拉进主 chunk —— globalModals 那条
 * 「页面弹窗不进注册表」的判据管的是静态引用, 与这里不冲突.
 *
 * 代价认下: 同一个抽屉组件被两个页面登记时后者盖掉前者. 眼下没有这种共用.
 */
const registry = new Map<ModalComponent, DrawerIdentity>();

/**
 * 读 URL 上的载荷. 解析不出来只当没有 —— 手改乱的地址栏不该让页面白屏.
 * @param raw - 查询键的原值
 */
function parsePayload(raw: string | null): DrawerPayload {
  if (!raw) return {};

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('非对象');
    return parsed as DrawerPayload;
  } catch {
    if (import.meta.env.DEV) console.warn(`[抽屉路由] ${URL_KEY} 解析失败, 已忽略:`, raw);
    return {};
  }
}

/**
 * 认出这个实例是表里的哪一项. 没登记过的抽屉不参与记账.
 * @param modalId - 实例 id
 */
function identify(modalId: number): (DrawerIdentity & { props: Record<string, unknown> }) | null {
  const instance = getModalInstances().find((one) => one.id === modalId);
  if (!instance) return null;

  const identity = registry.get(instance.Comp);
  return identity ? { ...identity, props: instance.props } : null;
}

/**
 * 抽屉与 URL 的记账, 挂在 BaseDrawer 上 —— 抽屉是唯一载体, 所以调用处一个字都不用写.
 *
 * 只在开与关两个时刻各记一次, 不去比对实例表. 差别要紧: 比对得先推断「这次实例变化是谁引起的」,
 * 而关闭这个动作自己知道自己是关闭, 不必猜.
 * @param props - 实例 id 与它此刻开着没有
 */
export function DrawerRouteSync(props: { modalId: number; open: boolean }): null {
  const { modalId, open } = props;
  const [searchParams, setSearchParams] = useSearchParams();
  const { pathname } = useLocation();
  const ownPathname = useRef(pathname);
  /** 上一次记过的开合态. 记账只发生在它翻面那一刻 */
  const written = useRef(false);

  // 换页面时关掉自己: 命令式抽屉挂在路由树根的 ModalOutlet 上, 不关就悬在新页面之上
  useEffect(() => {
    if (pathname === ownPathname.current) return;

    requestCloseModal(modalId);
  }, [modalId, pathname]);

  useEffect(() => {
    if (open === written.current) return;

    const identity = identify(modalId);
    if (!identity) return;

    // 人已经不在抽屉那一页了: 这次关闭是路由带走的, 再写就写到别人的地址栏上去了
    if (!open && pathname !== identity.pathname) return;
    written.current = open;

    const params = new URLSearchParams(searchParams);
    const payload = parsePayload(params.get(URL_KEY));
    if (open) payload[identity.name] = identity.props;
    else delete payload[identity.name];

    const next = JSON.stringify(payload);
    if (next === '{}') params.delete(URL_KEY);
    else params.set(URL_KEY, next);

    const query = params.toString();
    if (query === searchParams.toString()) return;

    /*
     * 只改地址栏, 不碰标签页记的那份 query.
     *
     * 标签页记了抽屉, 切回来它就自己弹出来, 而用户上次多半是关着离开的. 代价认下:
     * 刷新与分享能把抽屉带回来, 切标签不能 —— 这两件事在用户那里本来也不是一回事.
     */
    setSearchParams(params, { replace: true });
  }, [modalId, open, pathname, searchParams, setSearchParams]);

  return null;
}

/**
 * 抽屉路由: 页面声明哪些抽屉可以住在 URL 上, 刷新与分享因此保真.
 *
 * 不进 globalModals 注册表: 那条判据管的是模块顶层的静态引用, 会破坏按页分包.
 * 是 hook 而非纯函数: 消费者只有页面组件, 换不到「非 React 也能用」那份收益.
 * props 走 JSON 往返, Date 与函数这类值还原后会变形 —— 那一档当场就炸, 不上锁.
 * @param table - 抽屉表. 首次渲染后固定, 之后传入的新对象一概忽略
 */
export function useDrawerRoutes(table: DrawerTable): void {
  const tableRef = useRef(table);
  const [searchParams] = useSearchParams();
  const { pathname } = useLocation();
  const ownPathname = useRef(pathname);

  useEffect(() => {
    const own = ownPathname.current;
    const entries = Object.entries(tableRef.current);
    entries.forEach(([name, Comp]) => registry.set(Comp, { name, pathname: own }));

    return () => entries.forEach(([, Comp]) => registry.delete(Comp));
  }, []);

  /** URL → 实例表. 反向那条归 DrawerRouteSync, 所以这里只开不关, 两条不成环 */
  useEffect(() => {
    if (pathname !== ownPathname.current) return;

    const live = new Set(
      getModalInstances()
        .filter((one) => one.visible)
        .map((one) => one.Comp),
    );

    for (const [name, props] of Object.entries(parsePayload(searchParams.get(URL_KEY)))) {
      const Comp = tableRef.current[name];
      if (!Comp) {
        if (import.meta.env.DEV) console.warn(`[抽屉路由] 表里没有 ${name}, 已忽略`);
        continue;
      }
      if (live.has(Comp)) continue;

      void openModal(Comp, props);
    }
  }, [pathname, searchParams]);
}
