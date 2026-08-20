/* eslint-disable @typescript-eslint/no-unused-vars -- 类型测试里的组件只为承载 props 类型, 函数体用不到参数 */
/* eslint-disable react-refresh/only-export-components -- 本文件是类型测试, 不参与运行时渲染 */
/**
 * 弹窗契约的类型测试. 它既是规格也是门禁 —— 改契约先改这里, 再改实现.
 *
 * 全部签名从 ./types 取, 不在此重新声明, 避免测试与契约各说各话.
 * 负向用例靠 @ts-expect-error 断言: 若某条本该报错却没报, tsc 会以
 * TS2578 "Unused '@ts-expect-error' directive" 失败, 所以本文件通过即代表全部用例成立.
 *
 * 断言一律走 expectType 而非局部变量, 因为项目开了 noUnusedLocals.
 */
import type { DrawerProps, ModalProps } from 'antd';
import { Form } from 'antd';
import type { ReactNode } from 'react';
import type {
  CreateModalSetFn,
  ModalControl,
  UseModalFormFn,
  ModalShellFn,
  OpenFn,
  UseCloseGuardFn,
  UseModalIdFn,
  UseModalShellFn,
} from './types';

/** 断言实参可赋给 T. 类型不符则编译期报错 */
declare function expectType<T>(value: T): void;

// 用真实现而非占位声明, 否则实现与契约仍可能各走各的
import { BaseModal } from './BaseModal';
import { ModalShell } from './ModalShell';
import { createModalSet, openModal, useModalId } from './adapter';
import { useCloseGuard } from './useCloseGuard';
import { useModalForm } from './useModalForm';
import { useEvent } from './useEvent';
import { useModalShell } from './useModalShell';

// 实现必须符合契约里导出的签名. 任一处漂移这里先红
const _openModal = openModal satisfies OpenFn;
const _createModalSet = createModalSet satisfies CreateModalSetFn;
const _useModalId = useModalId satisfies UseModalIdFn;
const _useCloseGuard = useCloseGuard satisfies UseCloseGuardFn;
const _useModalShell = useModalShell satisfies UseModalShellFn;
const _ModalShell = ModalShell satisfies ModalShellFn;
const _useModalForm = useModalForm satisfies UseModalFormFn;
void [
  _openModal,
  _createModalSet,
  _useModalId,
  _useCloseGuard,
  _useModalShell,
  _ModalShell,
  _useModalForm,
];

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

declare function Drawer(props: DrawerProps): ReactNode;
declare function Modal(props: ModalProps): ReactNode;

type User = { id: string; name: string };
type Role = { roleId: number };

declare function createUser(id?: string): Promise<User>;

/** 有必填 prop, 交付 User */
function ModalUserEdit(_props: { id?: string; readonly?: boolean } & ModalControl<User>) {
  return null;
}

/** 有必填 prop, 交付 Role */
function ModalRoleEdit(_props: { deptId: number } & ModalControl<Role>) {
  return null;
}

/** 无业务 prop, 交付 boolean */
function ModalConfirmDelete(_props: ModalControl<boolean>) {
  return null;
}

// ── 结果类型从 props 反推 ──────────────────────────────────────

async function 结果类型从props反推() {
  expectType<User | undefined>(await openModal(ModalUserEdit, { id: '1' }));
  expectType<Role | undefined>(await openModal(ModalRoleEdit, { deptId: 3 }));
  expectType<boolean | undefined>(await openModal(ModalConfirmDelete));

  // @ts-expect-error 交付的是 User 不是 Role
  expectType<Role | undefined>(await openModal(ModalUserEdit, { id: '1' }));
}

// ── 控制面字段不许调用方传 ────────────────────────────────────

async function 控制面字段不许调用方传() {
  // @ts-expect-error resolve 属于底座
  await openModal(ModalUserEdit, { id: '1', resolve: () => undefined });
  // @ts-expect-error cancel 属于底座
  await openModal(ModalUserEdit, { id: '1', cancel: () => undefined });
}

// ── 多传或漏传必填 prop ───────────────────────────────────────

async function 多传或漏传必填prop() {
  // @ts-expect-error nope 不存在
  await openModal(ModalRoleEdit, { deptId: 3, nope: 1 });
  // @ts-expect-error 漏传必填的 deptId
  await openModal(ModalRoleEdit, {});
  // @ts-expect-error 有必填 prop 时不许省略第二个实参
  await openModal(ModalRoleEdit);
}

// ── 集合门面下异形弹窗共存 ────────────────────────────────────

async function 集合门面下异形弹窗共存() {
  const modals = createModalSet({
    user: ModalUserEdit,
    role: ModalRoleEdit,
    del: ModalConfirmDelete,
  });

  expectType<User | undefined>(await modals.user.open({ id: '1' }));
  expectType<Role | undefined>(await modals.role.open({ deptId: 3 }));
  expectType<boolean | undefined>(await modals.del.open());

  // @ts-expect-error 张冠李戴: user 收不了 deptId
  await modals.user.open({ deptId: 3 });
  // @ts-expect-error 集合里不存在的 key
  await modals.nothere.open({});
}

// ── 叠层多开, 每个实例的 Promise 互不串台 ─────────────────────

async function 叠层Promise不串台() {
  const [ra, rb, rc] = await Promise.all([
    openModal(ModalUserEdit, { id: 'a' }),
    openModal(ModalUserEdit, { id: 'b' }),
    openModal(ModalRoleEdit, { deptId: 9 }),
  ]);
  expectType<User | undefined>(ra);
  expectType<User | undefined>(rb);
  expectType<Role | undefined>(rc);

  // @ts-expect-error 第三个是 Role 不是 User
  expectType<User | undefined>(rc);
}

// ── R 从外层 props 连通到内层 onOk ────────────────────────────
// 外壳层的核心风险: control 必须走 prop, 走 context 则类型断开

/** 正例: control={props} 让 R 推成 User */
function ModalViaShell(props: { id?: string } & ModalControl<User>) {
  return (
    <ModalShell control={props} title="编辑用户" onOk={() => createUser(props.id)}>
      表单
    </ModalShell>
  );
}

/** 反例: onOk 返回错的类型 */
function ModalViaShellBadResult(props: { id?: string } & ModalControl<User>) {
  return (
    // @ts-expect-error 外层交付 User, onOk 却返回 number
    <ModalShell control={props} title="编辑用户" onOk={async () => 42}>
      表单
    </ModalShell>
  );
}

/** 反例: 忘了传 control */
function ModalViaShellNoControl(_props: { id?: string } & ModalControl<User>) {
  return (
    // @ts-expect-error 缺少 control
    <ModalShell title="编辑用户" onOk={() => createUser()}>
      表单
    </ModalShell>
  );
}

/** 反例: 张冠李戴, 拿 Role 的控制面配 User 的返回值 */
function ModalViaShellMismatch(props: { deptId: number } & ModalControl<Role>) {
  return (
    // @ts-expect-error 外层交付 Role, onOk 却返回 User
    <ModalShell control={props} title="编辑角色" onOk={() => createUser()}>
      表单
    </ModalShell>
  );
}

// ── hook 版同样要连通 ─────────────────────────────────────────

function ModalViaHook(props: { id?: string } & ModalControl<User>) {
  const shell = useModalShell(props, { onOk: () => createUser(props.id) });
  return <BaseModal {...shell.modalProps} title="编辑用户" />;
}

function ModalViaHookBad(props: { id?: string } & ModalControl<User>) {
  // @ts-expect-error 外层交付 User, onOk 却返回 number
  const shell = useModalShell(props, { onOk: async () => 42 });
  return <BaseModal {...shell.modalProps} title="编辑用户" />;
}

/** onError 接管异常, 不传则底座重抛 */
function ModalViaHookWithOnError(props: { id?: string } & ModalControl<User>) {
  const shell = useModalShell(props, {
    onOk: () => createUser(props.id),
    onError: (error: unknown) => void error,
  });
  return <BaseModal {...shell.modalProps} title="编辑用户" />;
}

// ── 非 Modal 载体必须显式接中性原语 ───────────────────────────

function ModalViaDrawer(props: { id?: string } & ModalControl<User>) {
  const { close } = useModalShell(props, { onOk: () => createUser(props.id) });
  // Drawer 要的是 onClose 而非 onCancel, 显式接才拦得住写错
  return <Drawer open onClose={close} title="侧滑编辑" />;
}

function ModalViaDrawerBad(props: { id?: string } & ModalControl<User>) {
  const { close } = useModalShell(props, { onOk: () => createUser(props.id) });
  // @ts-expect-error Drawer 没有 onCancel
  return <Drawer open onCancel={close} title="侧滑编辑" />;
}

function ModalViaPlainModal(props: { id?: string } & ModalControl<User>) {
  const shell = useModalShell(props, { onOk: () => createUser(props.id) });
  return <Modal {...shell.modalProps} title="裸 Modal" />;
}

// ── ModalForm 的两个泛型 ──────────────────────────────────────

type UserForm = { username: string; age: number };

declare function submitUser(values: UserForm): Promise<User>;

function ModalUserForm(props: { id?: string } & ModalControl<User>) {
  const { form, handleFinish, modalProps } = useModalForm<UserForm, User>(props, {
    onSubmit: (values) => submitUser(values),
  });
  return (
    <BaseModal {...modalProps} title="编辑用户">
      <Form form={form} onFinish={handleFinish}>
        表单项
      </Form>
    </BaseModal>
  );
}

/** 回车提交是外壳上的显式开关, 默认关闭 */
function ModalUserFormSubmitOnEnter(props: { id?: string } & ModalControl<User>) {
  const { modalProps } = useModalForm<UserForm, User>(props, {
    onSubmit: (values) => submitUser(values),
  });
  return <BaseModal {...modalProps} title="编辑用户" submitOnEnter />;
}

function ModalUserFormBad(props: { id?: string } & ModalControl<User>) {
  // @ts-expect-error 外层交付 User, onSubmit 却返回 number
  const { modalProps } = useModalForm<UserForm, User>(props, { onSubmit: async () => 42 });
  return <BaseModal {...modalProps} title="编辑用户" />;
}

// ── 关闭原因只走组件内部 ──────────────────────────────────────

function ModalWithGuard(_props: { id?: string } & ModalControl<User>) {
  useCloseGuard((reason) => {
    // 目前只有一个来源, 但类型是联合, 日后扩展不破坏这里
    return reason === 'userRequest';
  });
  return null;
}

async function 关闭原因不外泄() {
  const result = await openModal(ModalWithGuard, { id: '1' });
  // @ts-expect-error 取消不带原因, 结果不是带 reason 的对象
  void result?.reason;
}

// ── 全链路 ────────────────────────────────────────────────────

async function 全链路() {
  expectType<User | undefined>(await openModal(ModalViaShell, { id: '1' }));
  expectType<User | undefined>(await openModal(ModalViaHook, { id: '1' }));
  expectType<User | undefined>(await openModal(ModalUserForm, { id: '1' }));

  // @ts-expect-error control 是外壳层的实现细节, 不该出现在调用侧
  await openModal(ModalViaShell, { id: '1', control: undefined });
}

export {
  useEvent锁身份不改形状,
  结果类型从props反推,
  控制面字段不许调用方传,
  多传或漏传必填prop,
  集合门面下异形弹窗共存,
  叠层Promise不串台,
  关闭原因不外泄,
  全链路,
  ModalViaShell,
  ModalViaShellBadResult,
  ModalViaShellNoControl,
  ModalViaShellMismatch,
  ModalViaHook,
  ModalViaHookBad,
  ModalViaHookWithOnError,
  ModalViaDrawer,
  ModalViaDrawerBad,
  ModalViaPlainModal,
  ModalUserForm,
  ModalUserFormSubmitOnEnter,
  ModalUserFormBad,
  ModalWithGuard,
};
