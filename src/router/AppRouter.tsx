import { useEffect, useMemo } from 'react';
import { App } from 'antd';
import { useTranslation } from 'react-i18next';
import { HashRouter as Router } from 'react-router-dom';
import nprogress from 'nprogress';
import RouterPage from './components/Router';
import StaticMessage from '@south/message';

// antd
import { theme, ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import enUS from 'antd/locale/en_US';

// 禁止进度条添加loading
nprogress.configure({ showSpinner: false });

// antd主题
const { defaultAlgorithm, darkAlgorithm } = theme;

import { useCommonStore } from '@/hooks';

/**
 * 侧边栏常驻深色, 不跟随明暗主题 —— 导航与内容分属两个平面, 边界始终清楚.
 * 各态只差一档白色透明度, 底色调深调浅时不必逐个重配.
 */
const SIDER_MENU_TOKEN = {
  darkItemBg: '#1b2029',
  darkPopupBg: '#1b2029',
  darkSubMenuItemBg: 'transparent',
  darkItemColor: 'rgba(255, 255, 255, 0.62)',
  darkGroupTitleColor: 'rgba(255, 255, 255, 0.32)',
  darkItemHoverBg: 'rgba(255, 255, 255, 0.06)',
  darkItemHoverColor: 'rgba(255, 255, 255, 0.92)',
  darkItemSelectedBg: 'rgba(96, 165, 250, 0.18)',
  darkItemSelectedColor: '#93c5fd',
  itemHeight: 40,
  itemBorderRadius: 8,
  itemMarginInline: 10,
};

function AppRouter() {
  const { i18n } = useTranslation();
  const { theme } = useCommonStore();

  // 获取当前语言
  const currentLanguage = i18n.language;

  // 根据语言选择对应的 locale
  const locale = useMemo(() => {
    return currentLanguage === 'en' ? enUS : zhCN;
  }, [currentLanguage]);

  useEffect(() => {
    // 关闭loading
    const firstElement = document.getElementById('first');
    if (firstElement && firstElement.style?.display !== 'none') {
      firstElement.style.display = 'none';
    }
  }, []);

  // 缓存 ConfigProvider 的 theme 配置
  const themeConfig = useMemo(
    () => ({
      algorithm: [theme === 'dark' ? darkAlgorithm : defaultAlgorithm],
      components: { Menu: SIDER_MENU_TOKEN },
    }),
    [theme],
  );

  return (
    <Router>
      <ConfigProvider locale={locale} theme={themeConfig}>
        <App>
          <StaticMessage />
          {/* 语言切换后整树重挂载, 让各处直接调用的 $t 重新取值 */}
          <RouterPage key={currentLanguage} />
        </App>
      </ConfigProvider>
    </Router>
  );
}

export default AppRouter;
