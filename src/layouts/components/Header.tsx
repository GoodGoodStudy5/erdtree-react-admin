import type { MenuProps } from 'antd';
import { memo } from 'react';
import { App, Dropdown } from 'antd';
import { useCommonStore } from '@/hooks';
import { useMenuStore } from '@/stores';
import { globalModals } from '@/modals';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LogoutOutlined,
  FormOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import Avatar from '@/assets/images/avatar.png';
import styles from '../index.module.less';
import { Fullscreen, GlobalSearch, I18n, Theme } from '@/components';
import Nav from './Nav';
import { $t } from '@/locales';

type MenuKey = 'password' | 'logout';

function Header() {
  const [handleLogout] = useLogout();
  const { modal } = App.useApp();
  const { isCollapsed, isMaximize, username, nav } = useCommonStore();
  const toggleCollapsed = useMenuStore((state) => state.toggleCollapsed);

  // 下拉菜单内容
  const items: MenuProps['items'] = [
    {
      key: 'password',
      label: <span>{$t('public.changePassword')}</span>,
      icon: <FormOutlined className="mr-1" />,
    },
    {
      key: 'logout',
      label: <span>{$t('public.signOut')}</span>,
      icon: <LogoutOutlined className="mr-1" />,
    },
  ];

  /** 点击菜单 */
  const onClick: MenuProps['onClick'] = (e) => {
    switch (e.key as MenuKey) {
      case 'password':
        onUpdatePassword();
        break;

      case 'logout':
        onLogout();
        break;

      default:
        break;
    }
  };

  /** 改密码. 改成功后登出由这里决定, 弹窗只管改密码本身 */
  const onUpdatePassword = async () => {
    const isChanged = await globalModals.updatePassword.open();
    if (isChanged) handleLogout();
  };

  /** 退出登录 */
  const onLogout = () => {
    modal.confirm({
      title: $t('public.kindTips'),
      icon: <ExclamationCircleOutlined />,
      content: $t('public.signOutMessage'),
      onOk() {
        handleLogout();
      },
    });
  };

  /** 右侧内容 */
  const rightRender = (
    <div className="flex items-center">
      <GlobalSearch />
      <Fullscreen />
      <I18n />
      <Theme />
      <Dropdown className="min-w-50px" menu={{ items, onClick }}>
        <div
          className="ant-dropdown-link flex items-center cursor-pointer"
          onClick={(e) => e.preventDefault()}
        >
          <img
            src={Avatar}
            width={27}
            height={27}
            alt="Avatar"
            className="rounded-1/2 overflow-hidden object-cover bg-light-500"
          />
          <span className="ml-2 text-15px min-w-50px truncate">{username || 'south-admin'}</span>
        </div>
      </Dropdown>
    </div>
  );

  /** icon渲染 */
  const iconRender = (
    <div className="text-lg cursor-pointer" onClick={() => toggleCollapsed(!isCollapsed)}>
      {isCollapsed && <MenuUnfoldOutlined />}
      {!isCollapsed && <MenuFoldOutlined />}
    </div>
  );

  return (
    <>
      <header
        className={`
          border-bottom
          flex
          items-center
          justify-between
          px-6
          py-6px
          box-border
          transition-all
          ${styles['header-driver']}
          ${isMaximize ? styles.none : ''}
        `}
      >
        <div className="flex item-center">
          {iconRender}

          <Nav className="ml-15px" list={nav} />
        </div>

        {rightRender}
      </header>
    </>
  );
}

export default memo(Header);
