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

export type ApiSelectProps = ApiParam & SelectProps;

export type ApiTreeSelectProps = ApiParam & TreeSelectProps;

export type ApiPageSelectProps = ApiPageParam & SelectProps;
