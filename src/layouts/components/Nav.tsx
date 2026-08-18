import type { BreadcrumbProps } from 'antd';
import type { NavData } from '@/menus';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useCommonStore } from '@/hooks';

interface Props {
  className?: string;
  list: NavData[];
}

function Nav(props: Props) {
  const { className, list } = props;
  const { i18n } = useTranslation();
  // 是否手机端
  const { isPhone } = useCommonStore();

  // 数据处理
  const handleList = useCallback(
    (list: NavData[]) => {
      const result: BreadcrumbProps['items'] = [];
      if (!list?.length) return [];
      // 获取当前语言
      const currentLanguage = i18n.language;

      for (let i = 0; i < list?.length; i++) {
        const item = list?.[i];
        const data = currentLanguage === 'en' ? item.labelEn : item.labelZh;
        result.push({
          title: data || '',
        });
      }

      return result;
    },
    [i18n.language],
  );

  const nav = useMemo(() => handleList(list), [handleList, list]);

  return useMemo(
    () => (
      <>
        {!isPhone && (
          <div className={`${className} flex items-center text-truncate ellipsis break-all`}>
            {nav?.map((item, index) => (
              <span key={index}>
                {index !== 0 && (
                  <span className="px-4px color-#000073 breadcrumb-separator">/</span>
                )}
                <span
                  className={`px-4px ${index !== nav.length - 1 ? 'breadcrumb-separator' : ''}`}
                >
                  {item.title}
                </span>
              </span>
            ))}
          </div>
        )}
      </>
    ),

    [nav],
  );
}

export default Nav;
