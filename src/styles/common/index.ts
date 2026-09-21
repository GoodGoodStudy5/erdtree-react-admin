/**
 * 全局 CSS 的加载编排: 顺序就是下面的行序, 全仓只有这一处.
 *
 * 收进一处而不散在 main.tsx, 是因为行号只在同一个打包 chunk 内有效 —— 那几条 import 最终被
 * 合进同一份 index.css, 分散摆放并没有换来额外的控制力, 却让人以为位置有意义.
 *
 * 第三方的 uno.css 与 nprogress 也列在其中: 它们与项目样式的先后是真需求, 漏掉一条这份编排
 * 就不完整. 两个方向都有 —— 覆盖层 (antd.less 等) 要压过同特异性的 uno 工具类, 排在 uno 之后;
 * 角色层 (roles.less) 要让调用点的 uno 类盖得过它, 排在 uno 之前.
 *
 * 组件自己的 less 不在这里 —— 那些跟着组件走, 由组件树引入, 落在本编排之后.
 *
 * 下面的次序照搬收拢之前 main.tsx 里的相对次序, 未作调整.
 */

// antd 表单覆盖
import './form.less';

// 浏览器基线与全局工具类
import './base.less';

// 元素角色. 排在 uno 之前, 调用点才盖得过它
import './roles.less';

// 字体定义. 文件住在 assets 因为它是资源, 但 @font-face 属于全局 CSS, 次序一并在此交代
import '@/assets/fonts/font.less';

// 第三方
import 'uno.css';
import 'nprogress/nprogress.css';

// 项目自己的全局层
import './scrollbar.less';
import './theme-color.less';
import './antd.less';
