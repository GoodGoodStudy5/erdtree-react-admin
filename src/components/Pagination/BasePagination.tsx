import type { PaginationProps } from 'antd';
import { Pagination } from 'antd';
import './index.less';
import { $t } from '@/locales';

/** 分页器, 总数文案随界面语言切换 */
export function BasePagination(props: PaginationProps) {
  /**
   * 显示总数
   * @param total - 总数
   */
  const showTotal = (total?: number): string => {
    return $t('public.totalNum', { num: total || 0 });
  };

  return (
    <div
      id="pagination"
      className={`
        w-full
        flex
        items-center
        justify-end
        min-h-40px
        box-border
        z-999
      `}
    >
      <Pagination showSizeChanger showQuickJumper size="small" showTotal={showTotal} {...props} />
    </div>
  );
}
