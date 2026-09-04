import type { PaginationProps } from 'antd';
import { Pagination } from 'antd';
import './index.less';
import { $t } from '@/locales';

interface Props extends PaginationProps {
  /** 贴在视口底常驻. 不给则跟着内容滚到文档底 */
  isSticky?: boolean;
}

/** 分页器, 总数文案随界面语言切换 */
export function BasePagination(props: Props) {
  const { isSticky, ...rest } = props;
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
      data-sticky={isSticky ? 'bottom' : undefined}
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
      <Pagination showSizeChanger showQuickJumper showTotal={showTotal} {...rest} />
    </div>
  );
}
