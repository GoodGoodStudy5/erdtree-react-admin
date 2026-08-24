/**
 * 请求原语的唯一切换点.
 *
 * 组件与 hooks 门面都从这里取件, 谁也不直接引实现 (eslint 的 NO_REQUEST_IMPL_DIRECT 看着).
 * 换成 ahooks 就是把下面两行的来源从 './useRequest' 改成 'ahooks': 接口是它的子集,
 * 调用点一律不动.
 *
 * 选型综述与被否决的方案见 .design/wayfinder/tickets/004-request-primitive-survey.md.
 */
export { useRequest } from './useRequest';
export type { RequestService, UseRequestOptions, UseRequestResult } from './useRequest';
