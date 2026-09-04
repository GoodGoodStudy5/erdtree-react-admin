import type { BaseFormList, BaseSearchList } from '#/form';
import { filterDayjs } from '../../Dates';
import { filterEmptyStr } from '../../Form/utils/helper';

/**
 * 出口层: 把已提交条件转成请求参数.
 *
 * 转换是独立于「实时值 vs 已提交值」的第三根轴, 只在条件出门时作用一次 —— 取数与导出共用这一份口径.
 * 它**不参与两份值的比对**: 那两份是同形状的表单原值, 直接比.
 *
 * 是纯函数不是 hook: 页面按当前条件导出时要在事件处理器里调它, 那里没有 React 渲染期.
 * @param committed - 已提交条件, 表单原值形状
 * @param list - 搜索项声明, 用来认出哪几项是日期
 */
export function toQueryParams(committed: BaseFormData, list: BaseSearchList[]) {
  return filterEmptyStr(filterDayjs(committed, list as BaseFormList[]));
}
