import { execSync } from 'node:child_process';

type EnvConfigs = Record<string, string>;

// env数据
interface ViteEnv {
  VITE_SERVER_PORT: number;
  VITE_PROXY: [string, string][];
}

/**
 * 处理转化env
 * @param envConfigs
 */
export function handleEnv(envConfigs: EnvConfigs): ViteEnv {
  const { VITE_SERVER_PORT, VITE_PROXY } = envConfigs;

  const proxy: [string, string][] = VITE_PROXY ? JSON.parse(VITE_PROXY.replace(/'/g, '"')) : [];

  const res: ViteEnv = {
    VITE_SERVER_PORT: Number(VITE_SERVER_PORT) || 8080,
    VITE_PROXY: proxy,
  };

  return res;
}

/**
 * JS模块分包: 按用途归堆, 不按包名逐个分.
 *
 * <p>逐个分时 chunk 数等于依赖数 (含传递依赖), 实测出到 102 个文件. 每个只有几 KB, 分开缓存
 * 那点收益远抵不过 102 次请求的连接开销 -- 首屏慢在请求数, 不在字节数.
 *
 * <p>echarts 与 wangeditor 单独成包而不并入 vendor: 两者各自上兆, 且只有个别页面用得到.
 * 独立成包后它们跟着引用方按需加载, 不进首屏.
 *
 * @param id - 模块标识符
 */
export function splitJSModules(id: string) {
  // pnpm 把包名与版本拼进目录名, 形如 react@19.2.3 或 @ant-design+icons@6.3.2_react@19.2.8
  const pnpmName = id.includes('.pnpm') ? '.pnpm/' : '';
  const dir = id.split(`node_modules/${pnpmName}`)[1]?.split('/')[0] ?? '';

  // 图标数据集保持逐个分: 它们由 utils/icons 异步注册, 合成一包等于一次要下 9.2MB
  if (dir.startsWith('@iconify-json')) return dir;

  // 首屏必经的三堆: 框架 / 组件库 / 其余小包
  if (/^(react|react-dom|react-router|react-router-dom|scheduler)@/.test(dir))
    return 'vendor-react';
  if (/^(antd@|@ant-design|@rc-component|rc-)/.test(dir)) return 'vendor-antd';

  // 按需加载的大块头, 各自独立
  if (/^(echarts|zrender)@/.test(dir)) return 'vendor-chart';
  if (/^@wangeditor/.test(dir)) return 'vendor-editor';

  return 'vendor';
}

/**
 * 构建标识: 产物按它分目录, 一次发布的文件收在一起.
 *
 * <p>取云效注入的 {@code CI_COMMIT_ID} —— 它已是 8 位短 commit, 不必再截.
 *
 * <p>本地构建回落到 git 短 hash, 取不到再回落 local. 本地产物不上传, 目录名只要不与线上撞.
 */
export function resolveBuildId(): string {
  const fromCi = process.env.CI_COMMIT_ID;
  if (fromCi) return fromCi;

  try {
    return execSync('git rev-parse --short=8 HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    return 'local';
  }
}
