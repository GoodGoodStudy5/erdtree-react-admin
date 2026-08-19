/**
 * 弹窗外壳已下沉到 @south/components, 这里只做转发.
 * 转发放在具名文件而非目录 index —— autoImport 的 dirs 明确排除了各组件目录的 index,
 * 放进去会让 BaseModal 不再被自动导入.
 */
export { BaseModal } from '@south/components';
