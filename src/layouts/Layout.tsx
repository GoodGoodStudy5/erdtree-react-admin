import { useToken, useCommonStore } from '@/hooks';
import { useCallback, useEffect, useMemo, useState, memo } from 'react';
import { useOutlet, useLocation } from 'react-router-dom';
import { Skeleton, message } from 'antd';
import { debounce } from 'lodash';
import { useShallow } from 'zustand/shallow';
import { motion } from 'motion/react';
import { versionCheck } from './utils/helper';
import { getMenuList, getUserRefreshPermissions } from '@/servers';
import { useMenuStore, useUserStore } from '@/stores';
import { KeepAlive, useKeepAliveRef } from 'keepalive-for-react';
import Menu from './components/Menu';
import Header from './components/Header';
import Tabs from './components/Tabs';
import { Forbidden } from '@/components';
import ErrorBoundary from './components/ErrorBoundary';
import styles from './index.module.less';

function Layout() {
  const [getToken] = useToken();
  const { pathname } = useLocation();
  const token = getToken();
  const outlet = useOutlet();
  const keepaliveRef = useKeepAliveRef();
  const [isLoading, setLoading] = useState(true);
  const [messageApi, contextHolder] = message.useMessage();
  const setAliveRef = usePublicStore(useShallow((state) => state.setAliveRef));
  const aliveRef = usePublicStore(useShallow((state) => state.aliveRef));
  const { setPermissions, setUserInfo } = useUserStore(
    useShallow((state) => ({
      setPermissions: state.setPermissions,
      setUserInfo: state.setUserInfo,
    })),
  );
  const { menuList, setMenuList, toggleCollapsed, togglePhone } = useMenuStore(
    useShallow((state) => ({
      menuList: state.menuList,
      setMenuList: state.setMenuList,
      toggleCollapsed: state.toggleCollapsed,
      togglePhone: state.togglePhone,
    })),
  );

  const { permissions, userId, isMaximize, isCollapsed, isPhone } = useCommonStore();

  // keepalive 实例挂载后发布到 store, 供跨页面刷新调用
  useEffect(() => {
    if (keepaliveRef.current && !aliveRef.current) {
      setAliveRef(keepaliveRef);
    }
  }, []);

  /** 获取用户信息和权限 */
  const getUserInfo = useCallback(async () => {
    try {
      const { code, data } = await getUserRefreshPermissions({ refresh_cache: false });
      if (Number(code) !== 200) return;
      const { user, permissions } = data;
      setUserInfo(user);
      setPermissions(permissions);
    } catch (err) {
      console.error('获取用户数据失败:', err);
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  /** 获取菜单数据 */
  const getMenuData = useCallback(async () => {
    try {
      const { code, data } = await getMenuList();
      if (Number(code) !== 200) return;
      setMenuList(data || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // 当用户信息缓存不存在时则重新获取
    if (token && !userId) {
      getUserInfo();
      getMenuData();
    }
  }, []);

  // 监测是否需要刷新
  useEffect(() => {
    requestAnimationFrame(() => {
      versionCheck(messageApi);
    });
  }, [pathname]);

  /** 判断是否是手机端 */
  const handleIsPhone = useMemo(
    () =>
      debounce(() => {
        const isPhone = window.innerWidth <= 768;
        // 手机首次进来收缩菜单
        if (isPhone) toggleCollapsed(true);
        togglePhone(isPhone);
      }, 500),
    [toggleCollapsed, togglePhone],
  );

  // 监听是否是手机端
  useEffect(() => {
    handleIsPhone();
    window.addEventListener('resize', handleIsPhone);

    return () => {
      window.removeEventListener('resize', handleIsPhone);
      handleIsPhone.cancel(); // 清理 debounce 函数
    };
  }, [handleIsPhone]);

  // 使用 useMemo 缓存 className，避免每次渲染都重新计算
  const headerClassName = useMemo(
    () =>
      `
        border-bottom
        transition-all
        z-50!
        ${styles.header}
        ${isCollapsed ? styles['header-close-menu'] : ''}
        ${isMaximize ? styles['header-none'] : ''}
        ${isPhone ? `!left-0 z-999` : ''}
      `,
    [isCollapsed, isMaximize, isPhone],
  );

  const contentClassName = useMemo(
    () =>
      `
        overflow-auto
        transition-all
        ${styles.con}
        ${isMaximize ? styles['con-maximize'] : ''}
        ${isCollapsed ? styles['con-close-menu'] : ''}
        ${isPhone ? `!left-0 !w-full` : ''}
      `,
    [isMaximize, isCollapsed, isPhone],
  );

  return (
    <div id="layout">
      {contextHolder}
      {permissions.length > 0 && menuList.length > 0 && <Menu />}

      <div className={styles.layout_right}>
        <div id="header" className={headerClassName}>
          <Header />
          {permissions.length > 0 && menuList.length > 0 && <Tabs aliveRef={keepaliveRef} />}
        </div>
        <div id="layout-content" className={contentClassName}>
          {isLoading && permissions.length === 0 && (
            <Skeleton active className="p-30px" paragraph={{ rows: 10 }} />
          )}
          {!isLoading && permissions.length === 0 && <Forbidden />}
          <KeepAlive aliveRef={keepaliveRef} activeCacheKey={pathname} max={10}>
            {permissions.length > 0 && (
              <motion.div
                key={pathname}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              >
                <ErrorBoundary>{outlet}</ErrorBoundary>
              </motion.div>
            )}
          </KeepAlive>
        </div>
      </div>
    </div>
  );
}

export default memo(Layout);
