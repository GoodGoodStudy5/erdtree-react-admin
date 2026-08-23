/**
 * 公共 hooks 的类型测试. 它既是规格也是门禁 —— 改签名先改这里, 再改实现.
 *
 * 负向用例靠 @ts-expect-error 断言: 若某条本该报错却没报, tsc 会以
 * TS2578 "Unused '@ts-expect-error' directive" 失败, 所以本文件通过即代表全部用例成立.
 *
 * 断言一律走 expectType 而非局部变量, 因为项目开了 noUnusedLocals.
 */
import { useEvent } from '../useEvent';
import { useRequest } from '../requestAdapter';

/** 断言实参可赋给 T. 类型不符则编译期报错 */
declare function expectType<T>(value: T): void;

// ── useEvent 保持原回调的形状 ──────────────────────────────────
//
// 约束取 Function, 不取看起来更贴切的 `(...args: any[]) => any`: 后者带调用签名, 会给内联箭头
// 的参数列表定下上下文类型, 参数类型于是静默失效 —— `useEvent((x = 1) => x + 1)` 里的 x 成了
// any, 之后传字符串也不报, 而 tsc 全绿. 改成 `A extends unknown[]` 同样是上下文类型, 只是把
// 静默换成刺耳(报 x is of type unknown). Function 不带调用签名, 参数才从注解与默认值自己推,
// 没注解也没默认值时正常报隐式 any.
//
// 实现里最后一次向外的类型转换也去不掉: 造出来的是收 unknown[] 的函数, 而 T 可能是更窄的子类型.
// 用函数重载能去掉它且 tsc 干净, 但基础 eslint 的 no-redeclare 不认 TS 重载会报警告, 为一个函数
// 把全局规则换成 TS 版不值.
//
// 约束改回去, 下面几条 @ts-expect-error 会哑掉, tsc 以 TS2578 失败.

function useEvent锁身份不改形状() {
  const 默认参数 = useEvent((count = 1) => count + 1);
  expectType<number>(默认参数());
  expectType<number>(默认参数(2));
  // @ts-expect-error 默认值决定了参数是 number
  默认参数('2');

  const 显式参数 = useEvent((name: string, age: number) => `${name}${age}`);
  expectType<string>(显式参数('a', 1));
  // @ts-expect-error 实参顺序反了
  显式参数(1, 'a');

  const 异步回调 = useEvent(async (id: string) => id.length);
  expectType<Promise<number>>(异步回调('a'));
  // @ts-expect-error 返回的是 Promise, 不是裸值
  expectType<number>(异步回调('a'));

  const 可选参数 = useEvent((flag?: boolean) => flag);
  expectType<boolean | undefined>(可选参数());
}

// ── useRequest 的类型从 service 推导 ──────────────────────────

type User = { id: string; name: string };

declare function apiUserDetail(id: string): Promise<User>;
declare function apiUserList(): Promise<User[]>;

function useRequest泛型经service推导() {
  const { data, loading, run, runAsync } = useRequest(apiUserDetail);

  expectType<User | undefined>(data);
  expectType<boolean>(loading);
  expectType<void>(run('1'));
  expectType<Promise<User>>(runAsync('1'));

  // @ts-expect-error service 收的是 string, 不是 number
  run(1);
  // @ts-expect-error 漏了 service 的必填入参
  runAsync();

  const 无参 = useRequest(apiUserList, { manual: true });

  expectType<User[] | undefined>(无参.data);
  // @ts-expect-error 交付的是 User[], 不是单个 User
  expectType<User | undefined>(无参.data);
}

function useRequest可选项收窄() {
  useRequest(apiUserDetail, {
    manual: true,
    debounceWait: 500,
    onSuccess(data, params) {
      expectType<User>(data);
      expectType<[string]>(params);
    },
    onError(error) {
      // 异常类型未知是刻意的: 组件不该假设 service 抛的是什么
      expectType<unknown>(error);
    },
  });

  // @ts-expect-error 自动请求不带参: 要带参就 manual + run, 所以没有 defaultParams 这个口
  useRequest(apiUserDetail, { defaultParams: ['1'] });
  // @ts-expect-error 缓存/轮询不在本原语的范围内, 拼错的可选项要当场报
  useRequest(apiUserDetail, { pollingInterval: 1000 });
}

export { useEvent锁身份不改形状, useRequest泛型经service推导, useRequest可选项收窄 };
