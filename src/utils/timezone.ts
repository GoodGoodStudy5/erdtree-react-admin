import type { InternalAxiosRequestConfig } from 'axios';

/** 声明请求方时区的请求头. 后端据它把观察时刻换算成本地时刻 */
const TIME_ZONE_HEADER = 'X-Time-Zone';
/** 同一个声明的 Cookie 形态. 下载走普通导航, 带不了请求头, 而 Cookie 在导航上照样发 */
const TIME_ZONE_COOKIE = 'time_zone';

/**
 * 告诉后端本次请求按哪个时区呈现时刻.
 *
 * 值必须是 IANA 时区名: 偏移表达不了夏令时, 同一个 +08:00 在不同日期可能对应不同的时区规则.
 * 后端认不出时会落到它自己的默认值 UTC +0时
 *
 * 顺手把同一个值写进 Cookie: 两个载体同一处赋值, 于是永不互相矛盾. 后端头优先 Cookie 兜底
 * @param config - 请求配置
 */
export function attachTimeZone(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (config?.headers && zone) {
    config.headers[TIME_ZONE_HEADER] = zone;
  }
  if (zone) rememberTimeZone(zone);

  return config;
}

/**
 * 把时区记进 Cookie, 给带不了请求头的那些请求用 (导出的下载链接).
 *
 * IANA 时区名里的斜杠是合法的 cookie-octet, 不编码 —— 编了后端还得解一次.
 * `path=/` 才会随 `/api/bfs` 的请求一起发; 同站请求不受 SameSite 限制, 取 Lax 即可
 * @param zone - IANA 时区名
 */
function rememberTimeZone(zone: string) {
  document.cookie = `${TIME_ZONE_COOKIE}=${zone}; path=/; SameSite=Lax`;
}
