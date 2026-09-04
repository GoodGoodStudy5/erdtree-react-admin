import type { MenuProps } from 'antd';
import { Dropdown } from 'antd';
import { Icon } from '../Icon';
import { useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { LANG, setTitle } from '@/utils';
import { getTabTitle, useTabsStore } from '@/stores';
import { i18n } from '@/locales';

/** 界面语言取值 */
export type Langs = 'zh' | 'en';

/** 语言切换入口 */
export function I18n() {
  const { pathname, search } = useLocation();
  const tabs = useTabsStore((state) => state.tabs);

  useEffect(() => {
    const lang = localStorage.getItem(LANG);
    // 获取当前语言
    const currentLanguage = i18n.language;

    if (!lang) {
      localStorage.setItem(LANG, 'zh');
      i18n.changeLanguage('zh');
    } else if (currentLanguage !== lang) {
      i18n.changeLanguage(lang);
    }
  }, []);

  // 下拉菜单内容
  const items: MenuProps['items'] = [
    {
      key: 'zh',
      label: <span>中文</span>,
    },
    {
      key: 'en',
      label: <span>English</span>,
    },
  ];

  /**
   * 设置浏览器标签
   * @param list - 菜单列表
   * @param path - 路径
   */
  const handleSetTitle = useCallback(() => {
    const path = `${pathname}${search || ''}`;
    // 通过路由获取标签名
    const title = getTabTitle(tabs, path);
    if (title) setTitle(title);
  }, [pathname]);

  /** 点击更换语言 */
  const onClick: MenuProps['onClick'] = (e) => {
    i18n.changeLanguage(e.key as Langs);
    localStorage.setItem(LANG, e.key);
    handleSetTitle();
  };

  return (
    <Dropdown placement="bottom" trigger={['click']} menu={{ items, onClick }}>
      <div
        className="ant-dropdown-link flex items-center cursor-pointer"
        onClick={(e) => e.preventDefault()}
      >
        <Icon
          className="flex items-center justify-center text-lg mr-3 cursor-pointer"
          icon="cil:language"
        />
      </div>
    </Dropdown>
  );
}
