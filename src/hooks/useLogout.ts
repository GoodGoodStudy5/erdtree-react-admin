import { useShallow } from 'zustand/shallow';
import { cancelAllRequest } from '@/utils';

/**
 * 获取常用的状态数据
 */
export const useLogout = () => {
  const [, , removeToken] = useToken();
  const aliveRef = usePublicStore(useShallow((state) => state.aliveRef));
  const { closeAllTab, setActiveKey } = useTabsStore.getState();
  const { setPermissions, clearInfo } = useUserStore.getState();
  const { setMenuList } = useMenuStore.getState();
  const navigate = useNavigate();

  /** 退出登录 */
  const handleLogout = () => {
    cancelAllRequest();
    sessionStorage.removeItem('layout-bootstrap');
    clearInfo();
    closeAllTab();
    setActiveKey('');
    setMenuList([]);
    setPermissions([]);
    removeToken();
    aliveRef.current?.destroyAll(); // 清除keepalive缓存
    navigate('/login');
  };

  return [handleLogout] as const;
};
