import type { ColProps, RowProps } from 'antd';
import type { ReactNode } from 'react';

/**
 * 每行几列. 收成字面量联合而不是 number: 24 格栅格只有这四种整除法,
 * 给 5 会算出 4.8 格这种排不出来的列宽.
 */
export type RowLayoutColumnNum = 1 | 2 | 3 | 4;

export interface RowLayoutProps extends Omit<RowProps, 'children'> {
  children: ReactNode;
  /** 每行几列, 默认 3 */
  columnNum?: RowLayoutColumnNum;
  /**
   * 是否渲染, 默认 true.
   *
   * 布局组件自带这个开关, 调用方就不必为"这一整行要不要出现"在 JSX 里套一层 js 条件表达式 ——
   * 那层嵌套会把版式结构埋进逻辑里.
   */
  ifShow?: boolean;
}

export interface RowInnerProps {
  /** 是否渲染, 默认 true */
  ifShow?: boolean;
  children: ReactNode;
}

/**
 * 子元素可以带的布局协议. RowLayout 读走它, 不会落到子元素自己的 props 上.
 *
 * 自己写的字段组件可以把它并进 props 类型 (`MyFieldProps & RowLayoutChildProps`),
 * 于是 `<MyField colProps={{ colSize: 2 }} />` 直接就有类型保障;
 * antd 这类第三方组件的 props 不认识本协议, 只能按对象展开传
 * (`<Form.Item {...{ label, colProps: { colSize: 2 } }} />`), 或者改用直接写 Col 的逃生舱.
 */
export interface RowLayoutChildProps {
  colProps?: ColProps & {
    /** 占几列, 真实列宽 = 单列宽 * colSize; 默认 1 */
    colSize?: number;
  };
}
