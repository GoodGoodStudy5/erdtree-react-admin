import type { TFunction } from 'i18next';
import type { ComponentType, BaseFormList } from '#/form';
import { initCompProps } from './helper';
import { CreateBusiness } from '../../Business';
import type { FormInstance, InputProps } from 'antd';
import { Input, Spin } from 'antd';
import { type KeyboardEvent, lazy, Suspense } from 'react';
import { cloneDeep } from 'lodash';

/**
 * 注册表容纳任意表单组件, props 形状随组件而异
 * 收窄成具体类型会让每个注册点与每次透传都失去可赋值性, 这里的 any 是注册表的入口约定
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
type AnyComponent = React.ComponentType<any>;
type AnyLazyComponent = React.LazyExoticComponent<AnyComponent>;
/** 透传给具体表单组件的参数 */
type AnyProps = any;
/* eslint-enable @typescript-eslint/no-explicit-any */

// 存储已加载的组件
const loadedComponents = new Map<string, AnyComponent>();

// 使用React.lazy创建懒加载组件
const lazyComponents = new Map<string, AnyLazyComponent>();

// 注册懒加载组件
lazyComponents.set(
  'TextArea',
  lazy(() => import('antd').then((module) => ({ default: module.Input.TextArea }))),
);
lazyComponents.set(
  'InputNumber',
  lazy(() => import('antd').then((module) => ({ default: module.InputNumber }))),
);
lazyComponents.set(
  'InputPassword',
  lazy(() => import('antd').then((module) => ({ default: module.Input.Password }))),
);
lazyComponents.set(
  'AutoComplete',
  lazy(() => import('antd').then((module) => ({ default: module.AutoComplete }))),
);
lazyComponents.set(
  'Select',
  lazy(() => import('../../Selects').then((module) => ({ default: module.BaseSelect }))),
);
lazyComponents.set(
  'TreeSelect',
  lazy(() => import('../../Selects').then((module) => ({ default: module.BaseTreeSelect }))),
);
lazyComponents.set(
  'Checkbox',
  lazy(() => import('antd').then((module) => ({ default: module.Checkbox }))),
);
lazyComponents.set(
  'CheckboxGroup',
  lazy(() => import('antd').then((module) => ({ default: module.Checkbox.Group }))),
);
lazyComponents.set(
  'RadioGroup',
  lazy(() => import('antd').then((module) => ({ default: module.Radio.Group }))),
);
lazyComponents.set(
  'Switch',
  lazy(() => import('antd').then((module) => ({ default: module.Switch }))),
);
lazyComponents.set(
  'Rate',
  lazy(() => import('antd').then((module) => ({ default: module.Rate }))),
);
lazyComponents.set(
  'Slider',
  lazy(() => import('antd').then((module) => ({ default: module.Slider }))),
);
lazyComponents.set(
  'Upload',
  lazy(() => import('../../BaseUpload').then((module) => ({ default: module.BaseUpload }))),
);
lazyComponents.set(
  'Transfer',
  lazy(() => import('../../BaseTransfer').then((module) => ({ default: module.BaseTransfer }))),
);
lazyComponents.set(
  'DatePicker',
  lazy(() => import('../../Dates').then((module) => ({ default: module.BaseDatePicker }))),
);
lazyComponents.set(
  'RangePicker',
  lazy(() => import('../../Dates').then((module) => ({ default: module.BaseRangePicker }))),
);
lazyComponents.set(
  'TimePicker',
  lazy(() => import('../../Dates').then((module) => ({ default: module.BaseTimePicker }))),
);
lazyComponents.set(
  'TimeRangePicker',
  lazy(() => import('../../Dates').then((module) => ({ default: module.BaseTimeRangePicker }))),
);
lazyComponents.set(
  'ApiSelect',
  lazy(() => import('../../Selects').then((module) => ({ default: module.ApiSelect }))),
);
lazyComponents.set(
  'ApiTreeSelect',
  lazy(() => import('../../Selects').then((module) => ({ default: module.ApiTreeSelect }))),
);
lazyComponents.set(
  'ApiPageSelect',
  lazy(() => import('../../Selects').then((module) => ({ default: module.ApiPageSelect }))),
);
lazyComponents.set(
  'PasswordStrength',
  lazy(() =>
    import('../../PasswordStrength').then((module) => ({ default: module.PasswordStrength })),
  ),
);
lazyComponents.set(
  'RichEditor',
  lazy(() => import('../../WangEditor').then((module) => ({ default: module.WangEditor }))),
);

// 创建一个包装组件，确保在Suspense加载期间也能保持表单数据
function LazyComponentWrapper({
  componentType,
  t,
  componentProps,
  fallback,
  form,
  name,
}: {
  componentType: ComponentType;
  t: TFunction;
  componentProps: AnyProps;
  fallback: React.ReactNode;
  form: FormInstance;
  name: string | string[];
}) {
  const LazyComponent = lazyComponents.get(componentType as ComponentType);

  if (!LazyComponent) {
    return <Spin>{fallback}</Spin>;
  }

  // 使用getFieldValue获取表单字段的当前值，否则在懒加载中会获取不到值
  const fieldValue = form ? form.getFieldValue(name) : undefined;

  /** 使用setFieldValue设置表单字段的值，改为非受控组件 */
  const handleChange = (newValue: unknown) => {
    // 处理e.target.value情况
    let actualValue = newValue;
    if (newValue && typeof newValue === 'object' && 'target' in newValue) {
      const event = newValue as React.ChangeEvent<HTMLInputElement>;
      actualValue = event.target.value;
    }

    if (form && name) {
      form?.setFieldValue?.(name, actualValue);
    }
    // 如果有onChange回调，也调用它
    if (componentProps?.onChange) {
      componentProps.onChange(actualValue);
    }
  };

  const mergedProps = {
    ...initCompProps(t, componentType as ComponentType),
    ...componentProps,
    value: fieldValue !== undefined ? fieldValue : componentProps?.value,
    onChange: handleChange,
  };

  return (
    <Suspense fallback={fallback}>
      {/* 注册表在模块加载时一次性建好, 同一 componentType 始终取到同一个组件引用, 不会重置状态 */}
      {/* eslint-disable-next-line react-hooks/static-components */}
      <LazyComponent {...mergedProps} />
    </Suspense>
  );
}

/**
 * 处理输入框组件多余参数
 * @param componentProps - 组件参数
 */
const handleInputProps = (componentProps?: ComponentProps) => {
  interface CurrentInputProps {
    children: unknown;
    api: unknown;
    apiResultKey: unknown;
    fieldNames: unknown;
  }

  const newComponentProps = cloneDeep(componentProps) as unknown as CurrentInputProps;
  delete newComponentProps?.children;
  delete newComponentProps?.api;
  delete newComponentProps?.apiResultKey;
  delete newComponentProps?.fieldNames;

  return (newComponentProps || {}) as unknown as InputProps;
};

/**
 * 获取组件
 * @param t - i18n 转换函数
 * @param item - 表单项
 */
export function getComponent(t: TFunction, item: BaseFormList, form: FormInstance) {
  const { component, componentProps, name } = item;

  const handlePressEnter = (e: KeyboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const onPressEnter = (componentProps as InputProps)?.onPressEnter;

    if (onPressEnter) {
      onPressEnter?.(e);
    } else {
      form.submit();
    }
  };

  // 输入框渲染
  const renderInput = (
    <Input
      {...(initCompProps(t, 'Input') as InputProps)}
      {...handleInputProps(componentProps)}
      onPressEnter={handlePressEnter}
    />
  );

  // 当组件类型为自定义时
  if (component === 'customize') {
    const { render } = item;
    // 获取组件自定义渲染失败直接返回空标签
    if (!render) return renderInput;
    addComponent('customize', render);
  }

  // 对于Input组件，直接返回
  if (component === 'Input') {
    return renderInput;
  }

  // 查找懒加载组件
  const LazyComponent = lazyComponents.get(component);

  // 如果找到对应的懒加载组件，返回包装后的组件
  if (LazyComponent) {
    return (
      <LazyComponentWrapper
        componentType={component}
        t={t}
        componentProps={componentProps}
        fallback={<LoadingComponent />}
        form={form}
        name={name}
      />
    );
  }

  // 尝试获取已加载的组件
  const Comp = loadedComponents.get(component);

  // 获取组件失败直接返回空标签
  if (!Comp) return renderInput;

  return (
    <Comp
      {...initCompProps(t, component as ComponentType)}
      {...componentProps}
      onPressEnter={handlePressEnter}
    />
  );
}

/**
 * 添加组件
 * @param name - 组件名
 * @param component - 组件
 */
export function addComponent(name: ComponentType, component: AnyComponent): void {
  loadedComponents.set(name, component);
}

/**
 * 删除组件
 * @param name - 组件名
 */
export function deleteComponent(name: ComponentType): void {
  loadedComponents.delete(name);
  lazyComponents.delete(name);
}

// 业务组件注入
CreateBusiness();
