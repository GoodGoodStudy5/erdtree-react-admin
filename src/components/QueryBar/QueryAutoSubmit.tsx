import type { FormInstance } from 'antd';
import { Form } from 'antd';
import { useEffect, useRef } from 'react';

interface Props {
  /** 表单实例 */
  form: FormInstance;
  /** 值变了. 防抖在调用方那一侧 */
  onChange: () => void;
}

/**
 * 本地模式下把表单的值变化接到提交上, 自己不渲染任何东西.
 *
 * **不用 `Form` 的 `onValuesChange`**: 懒加载的控件 (`Select` 一族, 日期, 上传) 经
 * `form.setFieldValue` 写值, 而表单内核只在 `Field` 收到子控件 onChange 时才触发那个回调 ——
 * 于是改下拉不会被结算, 只有 `Input` 会. `useWatch` 两条写值的路都收得到.
 *
 * 单独成组件是因为它订阅全表单的值: 每次击键要重渲染的只有这里, 条件区里的十几个控件不动.
 * @param props - 组件参数
 */
export function QueryAutoSubmit(props: Props) {
  const { form, onChange } = props;
  const values = Form.useWatch([], form);
  const isWatchingRef = useRef(false);

  useEffect(() => {
    // 首帧还没订阅上
    if (!values) return;
    // 订阅上的那一轮不算用户改了条件: 首屏取不取数由 SearchTable 的 manual 决定, 不由这里
    if (!isWatchingRef.current) {
      isWatchingRef.current = true;
      return;
    }
    onChange();
  }, [values, onChange]);

  return null;
}
