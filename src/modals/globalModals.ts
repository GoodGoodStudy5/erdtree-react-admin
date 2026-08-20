import { createModalSet } from '@south/components';
import { UpdatePassword } from './UpdatePassword';

/**
 * 全局公共弹窗组: 只收不属于任何页面的共性弹窗.
 *
 * 用注册表换来的是"调用方不必 import 弹窗组件" —— 请求拦截器、通用 store action 这些
 * 底层调用点因此也能调起弹窗, 不必反向依赖上层. 而这份收益只有全局弹窗拿得到:
 * 它们本来就在主 chunk 里, 进注册表不多下载一个字节.
 *
 * 页面弹窗不进这里. 页面弹窗进注册表会被拉进同一 chunk, 破坏按页分包, 而页面 import
 * 自己的弹窗依赖方向本来就是对的, 换不到任何解耦. 页面弹窗请直接 open(Comp, props),
 * 需要短写法就在弹窗同文件导出一个具名 open 函数.
 *
 * 「只收全局弹窗」这条口径由 depcruise 的 no-page-as-dependency 兜住: 本目录引 src/pages 直接报错.
 */
export const globalModals = createModalSet({
  updatePassword: UpdatePassword,
});
