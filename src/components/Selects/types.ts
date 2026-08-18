import type { SelectProps, TreeSelectProps } from 'antd';
import type { ApiFn } from '#/form';

// api参数
interface ApiParam {
  api?: ApiFn;
  params?: object | unknown[];
  apiResultKey?: string;
}

// 带分页的api参数
interface ApiPageParam extends Omit<ApiParam, 'params'> {
  pageKey?: string;
  pageSizeKey?: string;
  queryKey?: string;
  page?: number;
  pageSize?: number;
  params?: object & {
    [key: string]: number;
  };
}

/** 远程数据下拉的参数 */
export type ApiSelectProps = ApiParam & SelectProps;

/** 远程数据树形下拉的参数 */
export type ApiTreeSelectProps = ApiParam & TreeSelectProps;

/** 滚动分页加载下拉的参数 */
export type ApiPageSelectProps = ApiPageParam & SelectProps;
