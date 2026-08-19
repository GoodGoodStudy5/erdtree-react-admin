# 0001. 弹窗组件用受控 props, 不用 ref 契约

日期: 2026-08-19
状态: 已接受

## 背景

命令式弹窗需要在"调用方"与"弹窗组件"之间传两样东西: 打开时的参数, 与关闭时交付的结果.

既有做法(沿用自另一项目的 `useModalSet`)是让弹窗组件用 `useImperativeHandle` 暴露 `open(params)`,
调用方持 ref 调用. 本仓库的 `UpdatePassword` 就是这个形状.

## 判据

ref 契约把类型信息的流向弄反了: `open` 的参数藏在 ref 类型里, TypeScript 必须从 ref 反推参数,
而集合场景下又要用单个泛型约束整组弹窗, 多个形状不同的弹窗被迫求交集 —— 推导在此塌方.

实测(见 `packages/components/src/modal/types.typetest.tsx`): 改成把 `ModalControl<R>` 混进
弹窗组件自己的 props 之后, 参数类型即 `ComponentProps<C>`, 结果类型由
`ComponentProps<C> extends ModalControl<infer R>` 反推, 两者都是单向流出, 不需要求交集.
集合门面下三个形状互不相同的弹窗各推各的, 全部成立.

附带收益: React 19 已废弃 `forwardRef`, 受控 props 不再需要它; 弹窗组件退化成普通 React 组件,
可以直接在 JSX 里当受控组件用.

## 被否决的方案

**沿用 ref 契约** —— 单个、无参、无结果的弹窗确实够用, 但集合场景类型塌方, 且拿不到返回值,
只能退回 `submitSuccessCB` 之类的回调, 那正是要消灭的东西.

**`@ebay/nice-modal-react`** —— 头部开源库, 但 `show()` 的返回类型没有推导来源(实际推成 `unknown`),
必填 props 漏传不报错, `create()` HOC 强制包装, 且 npm 停在 2023-10, 近期提交全是机器人.

**context 取控制面** —— 让弹窗组件从 context 拿 `resolve`. props 更干净, 但 `R` 与外层组件声明的
`ModalControl<R>` 隔着组件边界, 类型连不通 —— 实测 `onOk` 返回错类型编译器不报.
所以外壳层的 `control` 必须作为 prop 显式传入.

## 代价

- 弹窗组件的 props 里混着两个不属于业务的字段(`resolve` / `cancel`), 靠 `OpenProps<C>` 在调用侧 Omit 掉.
- 存量 ref 写法要改. 实际影响面为 3 个文件, 已迁完.
