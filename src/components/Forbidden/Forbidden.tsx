import { getFirstMenu, getMenuByKey } from '@/menus';
import { Button } from 'antd';
import { $t } from '@/locales';

/** 无权限占位, 提供回首页入口. 既作为 /403 页面, 也作为内容区的无权限替代 */
export function Forbidden() {
  const navigate = useNavigate();
  const { permissions, menuList } = useCommonStore();
  const { addTabs, setActiveKey } = useTabsStore.getState();

  /** 跳转首页 */
  const goIndex = () => {
    const firstMenu = getFirstMenu(menuList, permissions);
    navigate(firstMenu);
    const menuByKeyProps = { menus: menuList, permissions, key: firstMenu };
    const newItems = getMenuByKey(menuByKeyProps);
    if (newItems?.key) {
      setActiveKey(newItems.key);
      addTabs(newItems);
    }
  };

  return (
    <div className="text-center">
      <h1 className="animate-shake w-full text-6rem font-bold">403</h1>
      <p className="w-full text-20px font-bold mt-15px">{$t('public.notPermissionMessage')}</p>
      <Button className="mt-25px margin-auto" onClick={goIndex}>
        {$t('public.returnHome')}
      </Button>
    </div>
  );
}
