import type { LoginData } from '@/servers';
import type { FormProps } from 'antd';
import { Checkbox, message, Form, Button, Input } from 'antd';
import { I18n, Theme } from '@/components';
import { login, getMenuList, getUserRefreshPermissions } from '@/servers';
import { LOGIN_EXPIRED_MSG } from '@south/request';
import { setTitle, cancelAllRequest } from '@/utils';
import { encryption, decryption } from '@south/utils';
import { getFirstMenu } from '@/menus';
import Logo from '@/assets/images/logo.svg';
import { $t, i18n } from '@/locales';
import { router } from '@/router';

const CHECK_REMEMBER = 'remember_me';
const USER_USERNAME = 'login_username';
const USER_PASSWORD = 'login_password';

/**
 * 读取记住我的密码, 密钥变更或缓存被篡改时丢弃缓存并放弃回填
 * @param cache - 密码缓存密文
 */
function readRememberedPassword(cache: string): string | undefined {
  try {
    return decryption(cache)?.value;
  } catch {
    localStorage.removeItem(USER_PASSWORD);
    return undefined;
  }
}

function LoginPage() {
  const [form] = Form.useForm();
  const [getToken, setToken] = useToken();
  const [isLoading, setLoading] = useState(false);
  // 记住我勾选状态来自上次登录的缓存
  const [isRemember, setRemember] = useState(
    () => localStorage.getItem(CHECK_REMEMBER) !== 'false',
  );
  const [messageApi, contextHolder] = message.useMessage();
  const { search } = useLocation();
  const { permissions } = useCommonStore();
  const { setMenuList } = useMenuStore.getState();
  const { setThemeValue } = usePublicStore.getState();
  const { setPermissions, setUserInfo } = useUserStore.getState();
  const themeCache = (localStorage.getItem(THEME_KEY) || 'light') as ThemeType;

  useEffect(() => {
    if (!themeCache) {
      localStorage.setItem(THEME_KEY, 'light');
    }
    if (themeCache === 'dark') {
      document.body.className = 'theme-dark';
    }
    setThemeValue(themeCache === 'dark' ? 'dark' : 'light');
  }, [themeCache]);

  // 语言切换修改title
  useEffect(() => {
    setTitle($t('login.login'));
  }, [i18n.language]);

  /** 获取用户权限 */
  const getUserPermissions = async () => {
    try {
      setLoading(true);
      const { user, permissions } = await getUserRefreshPermissions({ refresh_cache: false });
      setUserInfo(user);
      setPermissions(permissions);
      handleGoMenu(permissions);
    } finally {
      setLoading(false);
    }
  };

  /** 获取菜单数据 */
  const getMenuData = async () => {
    const cached = useMenuStore.getState().menuList;
    if (cached?.length) return cached;
    let result: SideMenu[] = [];

    try {
      setLoading(true);
      const data = await getMenuList();
      setMenuList(data || []);
      result = data;
    } finally {
      setLoading(false);
    }

    return result;
  };

  /** 获取重定向路由 */
  const getRedirectUrl = () => {
    const key = '?redirect=';
    const start = search.includes(key) ? search.indexOf(key) + 10 : 0;
    const end = search.includes('&') ? search.indexOf('&') : search.length;

    return search.substring(start, end);
  };

  /**
   * 菜单跳转
   * @param permissions - 权限列表
   */
  const handleGoMenu = async (permissions: string[]) => {
    let menuData = useMenuStore.getState().menuList;
    if (!menuData?.length) {
      menuData = (await getMenuData()) as SideMenu[];
    }

    // 菜单仍为空（接口失败或返回空），无法确定跳转目标
    if (!menuData?.length) {
      return messageApi.error({ content: $t('login.notPermissions'), key: 'permissions' });
    }

    // 如果存在重定向
    if (search?.includes('?redirect=')) {
      const url = getRedirectUrl();
      if (url) {
        router.navigate(url);
        return;
      }
    }

    // 有权限则直接跳转
    const firstMenu = getFirstMenu(menuData, permissions);
    if (!firstMenu) {
      return messageApi.error({ content: $t('login.notPermissions'), key: 'permissions' });
    }
    router.navigate(firstMenu);
  };

  useEffect(() => {
    // 清除上一会话的残留请求
    cancelAllRequest();

    // 如果存在token，则直接进入页面
    if (getToken()) {
      // 如果不存在缓存则获取权限
      if (!permissions.length) {
        getUserPermissions();
      } else {
        // 有权限则直接跳转
        handleGoMenu(permissions);
      }
    }

    // 如果存在账号密码缓存，则自动填充
    const username = localStorage.getItem(USER_USERNAME);
    const password = localStorage.getItem(USER_PASSWORD);
    if (username && password) {
      form.setFieldsValue({ username, password: readRememberedPassword(password) });
    }

    // 读取权限过期提示（由请求拦截器在整页跳转前写入 localStorage）
    const expiredMsg = localStorage.getItem(LOGIN_EXPIRED_MSG);
    if (expiredMsg) {
      messageApi.error({ content: expiredMsg, key: 'permission-expired' });
      localStorage.removeItem(LOGIN_EXPIRED_MSG);
    }
  }, []);

  /**
   * 处理登录
   * @param values - 表单数据
   */
  const handleFinish: FormProps['onFinish'] = async (values: LoginData) => {
    try {
      setLoading(true);
      const { token, user, permissions } = await login(values);

      // 处理记住我逻辑
      const passwordObj = { value: values.password, expire: 0 };
      handleRemember(values.username, encryption(passwordObj));

      if (!permissions?.length || !token) {
        return messageApi.error({ content: $t('login.notPermissions'), key: 'permissions' });
      }

      setToken(token);
      setUserInfo(user);
      setPermissions(permissions);

      await handleGoMenu(permissions);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 处理失败
   * @param errors - 错误信息
   */
  const handleFinishFailed: FormProps['onFinishFailed'] = (errors) => {
    console.error('错误信息:', errors);
  };

  /** 点击记住我 */
  const onRemember = () => {
    setRemember(!isRemember);
    localStorage.setItem(CHECK_REMEMBER, isRemember ? 'false' : 'true');
  };

  /**
   * 记住我逻辑
   */
  const handleRemember = (username: string, password: string) => {
    if (isRemember) {
      localStorage.setItem(USER_USERNAME, username);
      localStorage.setItem(USER_PASSWORD, password);
    } else {
      localStorage.removeItem(USER_USERNAME);
      localStorage.removeItem(USER_PASSWORD);
    }
  };

  /** 点击忘记密码 */
  const onForgetPassword = () => {
    router.navigate(`/forget${search}`);
  };

  return (
    <>
      {contextHolder}
      <div
        className={`
          ${themeCache === 'dark' ? 'bg-black text-white' : 'bg-light-400'}
          w-screen
          h-screen
          relative
        `}
      >
        <div className="flex absolute top-5 right-5">
          <I18n />
          <Theme />
        </div>
        <div
          className={`
            ${themeCache === 'dark' ? 'bg-black bg-dark-200' : 'bg-white'}
            w-340px
            p-1.8rem
            rounded-10px
            box-border
            absolute
            left-1/2
            top-1/2
            -translate-x-1/2
            -translate-y-1/2
            shadow-[2px_5px_20px_rgba(0,0,0,0.1)]
          `}
        >
          <div className="pb-20px pt-10px flex items-center justify-center">
            <img className="mr-2 object-contain" width="32" height="32" src={Logo} alt="LOGO" />
            <span className="text-22px font-bold tracking-2px">{$t('login.systemLogin')}</span>
          </div>
          <Form
            form={form}
            layout="vertical"
            name="horizontal_login"
            autoComplete="on"
            onFinish={handleFinish}
            onFinishFailed={handleFinishFailed}
            initialValues={
              import.meta.env.VITE_SHOW_DEFAULT_ACCOUNT === 'true'
                ? { username: 'admin', password: 'admin123456' }
                : {}
            }
          >
            <div className="text-#AAA6A6 text-14px mb-8px">{$t('login.username')}</div>

            <Form.Item
              name="username"
              className="!mb-15px"
              rules={[
                {
                  required: true,
                  message: $t('public.pleaseEnter', { name: $t('login.username') }),
                },
              ]}
            >
              <Input
                allow-clear="true"
                placeholder={$t('public.pleaseEnter', { name: $t('login.username') })}
                autoComplete="username"
              />
            </Form.Item>

            <div className="text-#AAA6A6 text-14px mb-8px">{$t('login.password')}</div>

            <Form.Item
              name="password"
              className="!mb-15px"
              rules={[
                {
                  required: true,
                  message: $t('public.pleaseEnter', { name: $t('login.password') }),
                },
                PASSWORD_RULE(),
              ]}
            >
              <Input.Password
                placeholder={$t('public.pleaseEnter', { name: $t('login.password') })}
                autoComplete="current-password"
              />
            </Form.Item>

            <Button
              type="primary"
              htmlType="submit"
              className="w-full mt-15px mb-25px rounded-5px tracking-2px"
              loading={isLoading}
            >
              {$t('login.login')}
            </Button>
          </Form>

          <div className="flex justify-between items-center mb-5px px-1px">
            <Checkbox checked={isRemember} onChange={onRemember}>
              {$t('login.rememberMe')}
            </Checkbox>

            <div className="text-blue-500 cursor-pointer" onClick={onForgetPassword}>
              {$t('login.forgetPassword')}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default LoginPage;
