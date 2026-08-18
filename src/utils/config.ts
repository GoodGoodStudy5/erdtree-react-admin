import { $t } from '@/locales';

/** 浏览器标签标题的后缀, 取当前系统名 */
export const TITLE_SUFFIX = () => $t('public.currentName');
/** 页面水印的文案前缀, 后面拼当前登录人 */
export const WATERMARK_PREFIX = 'admin';
/** 登录令牌在 localStorage 中的键名 */
export const TOKEN = 'admin_token';
/** 界面语言在 localStorage 中的键名 */
export const LANG = 'lang';
/** 前端版本号在 localStorage 中的键名, 版本监控据此判断是否提示刷新 */
export const VERSION = 'admin_version';
/** 列表与详情中空值的占位显示 */
export const EMPTY_VALUE = '-';
/** 主题在 localStorage 中的键名 */
export const THEME_KEY = 'theme_key';

/** 分页初始值, 列表首次加载与重置查询时回到这里 */
export const INIT_PAGINATION = {
  page: 1,
  pageSize: 20,
};

/** 日期格式, 不含时间 */
export const DATE_FORMAT = 'YYYY-MM-DD';
/** 日期时间格式, 精确到秒 */
export const TIME_FORMAT = 'YYYY-MM-DD HH:mm:ss';
/** 时间选择器格式, 只含时分秒 */
export const TIME_PICKER_FORMAT = 'HH:mm:ss';

/** 表单必填校验, 提示文案由 antd 按字段标签自动生成 */
export const FORM_REQUIRED = [{ required: true }];

/** 新增弹窗标题 */
export const ADD_TITLE = (title?: string) => $t('public.createTitle', { title: title ?? '' });
/** 编辑弹窗标题, 带上被编辑对象的名称, 便于确认改的是哪一条 */
export const EDIT_TITLE = (name: string, title?: string) =>
  `${$t('public.editTitle', { title: title ?? '' })}${name ? `(${name})` : ''}`;

/** 密码校验规则: 6 到 30 位, 必须同时含字母与数字 */
export const PASSWORD_RULE = () => ({
  pattern: /^(?=.*\d)(?=.*[a-zA-Z])[\da-zA-Z~!@#$%^&*+\.\_\-*]{6,30}$/,
  message: $t('login.passwordRuleMessage'),
});

// 环境判断
const ENV = import.meta.env.VITE_ENV as string;
// 生成环境所用的接口
const URL = import.meta.env.VITE_BASE_URL as string;
/** 文件上传地址, 开发环境走本地代理前缀 */
export const FILE_API = `${ENV === 'development' ? '/api' : URL}/authority/file/upload-file`;
