/**
 * 启动时把各业务挂给 `@/modules` 的渲染插座.
 *
 * 住在 router: 门禁只允许本层与 main.tsx 碰 src/pages, 而这件事必须在任何页面渲染之前做完
 * —— 挂载文件若随页面按需加载, 没去过发票页的人就渲不出可点的发票号码.
 *
 * 取 eager: 挂载文件因此并进主包而不是各成一个 chunk, 启动不多发请求. 它们各自只有一个
 * 没被调用的加载器闭包, 所以抽屉这类重件仍留在各自页面的 chunk 里.
 */
import.meta.glob('/src/pages/**/*.mount.tsx', { eager: true });
