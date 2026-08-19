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
  UseModalShellFn,
} from './types';

/** 断言实参可赋给 T. 类型不符则编译期报错 */
declare function expectType<T>(value: T): void;

// 用真实现而非占位声明, 否则实现与契约仍可能各走各的
import { BaseModal } from './BaseModal';
import { ModalShell } from './ModalShell';
import { createModalSet, open } from './open';
import { useCloseGuard } from './useCloseGuard';
import { useModalForm } from './useModalForm';
import { useModalShell } from './useModalShell';

// 实现必须符合契约里导出的签名. 任一处漂移这里先红
const _open = open satisfies OpenFn;
const _createModalSet = createModalSet satisfies CreateModalSetFn;
const _useCloseGuard = useCloseGuard satisfies UseCloseGuardFn;
const _useModalShell = useModalShell satisfies UseModalShellFn;
const _ModalShell = ModalShell satisfies ModalShellFn;
const _useModalForm = useModalForm satisfies UseModalFormFn;
void [_open, _createModalSet, _useCloseGuard, _useModalShell, _ModalShell, _useModalForm];

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
  expectType<User | undefined>(await open(ModalUserEdit, { id: '1' }));
  expectType<Role | undefined>(await open(ModalRoleEdit, { deptId: 3 }));
  expectType<boolean | undefined>(await open(ModalConfirmDelete));

  // @ts-expect-error 交付的是 User 不是 Role
  expectType<Role | undefined>(await open(ModalUserEdit, { id: '1' }));
}

// ── 控制面字段不许调用方传 ────────────────────────────────────

async function 控制面字段不许调用方传() {
  // @ts-expect-error resolve 属于底座
  await open(ModalUserEdit, { id: '1', resolve: () => undefined });
  // @ts-expect-error cancel 属于底座
  await open(ModalUserEdit, { id: '1', cancel: () => undefined });
}

// ── 多传或漏传必填 prop ───────────────────────────────────────

async function 多传或漏传必填prop() {
  // @ts-expect-error nope 不存在
  await open(ModalRoleEdit, { deptId: 3, nope: 1 });
  // @ts-expect-error 漏传必填的 deptId
  await open(ModalRoleEdit, {});
  // @ts-expect-error 有必填 prop 时不许省略第二个实参
  await open(ModalRoleEdit);
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
    open(ModalUserEdit, { id: 'a' }),
    open(ModalUserEdit, { id: 'b' }),
    open(ModalRoleEdit, { deptId: 9 }),
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
  const result = await open(ModalWithGuard, { id: '1' });
  // @ts-expect-error 取消不带原因, 结果不是带 reason 的对象
  void result?.reason;
}

// ── 全链路 ────────────────────────────────────────────────────

async function 全链路() {
  expectType<User | undefined>(await open(ModalViaShell, { id: '1' }));
  expectType<User | undefined>(await open(ModalViaHook, { id: '1' }));
  expectType<User | undefined>(await open(ModalUserForm, { id: '1' }));

  // @ts-expect-error control 是外壳层的实现细节, 不该出现在调用侧
  await open(ModalViaShell, { id: '1', control: undefined });
}

export {
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
  ModalUserFormBad,
  ModalWithGuard,
};
