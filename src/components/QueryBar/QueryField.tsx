import type { BaseSearchList, ComponentProps } from '#/form';
import type { RowLayoutChildProps } from '@south/components';
import type { FormInstance } from 'antd';
import { Form } from 'antd';
import { getComponent } from '../Form/utils/componentMap';
import { filterFormItem, handleValuePropName } from '../Form/utils/helper';

interface Props extends RowLayoutChildProps {
  /** 搜索项 */
  item: BaseSearchList;
  /** 表单实例, 交给控件用于回车提交与联动 */
  form: FormInstance;
}

/**
 * 顶层 placeholder 补进控件参数.
 *
 * 它是声明过的契约字段, 但共用的 getComponent 只读 componentProps, 从不读它 —— 在这里补而不去改
 * getComponent: 那条链路全仓库的表单都走, 改它会波及弹窗表单.
 * @param item - 搜索项
 */
function propsWithPlaceholder(item: BaseSearchList) {
  const componentProps = { ...(item.componentProps as Record<string, unknown>) };

  if (item.placeholder && componentProps.placeholder === undefined) {
    componentProps.placeholder = item.placeholder;
  }

  return componentProps as ComponentProps;
}

/**
 * 条件区里的一个搜索项.
 *
 * 单独成组件是为了采纳 RowLayout 的 colProps 协议 —— 直接写 `<Form.Item>` 只能按对象展开传布局参数,
 * 那样布局意图会藏进一堆展开语法里.
 * @param props - 组件参数
 */
export function QueryField(props: Props) {
  const { item, form } = props;
  const filled: BaseSearchList = { ...item, componentProps: propsWithPlaceholder(item) };

  return (
    <Form.Item
      {...filterFormItem(filled)}
      className={item.className}
      labelCol={item.labelWidth ? { flex: `0 0 ${item.labelWidth}px` } : undefined}
      valuePropName={handleValuePropName(item.component)}
    >
      {getComponent(filled, form)}
    </Form.Item>
  );
}
