import type { InternalAxiosRequestConfig } from 'axios';

/** 声明请求方时区的请求头. 后端据它把观察时刻换算成本地时刻 */
const TIME_ZONE_HEADER = 'X-Time-Zone';

/**
 * 告诉后端本次请求按哪个时区呈现时刻.
 *
 * 值必须是 IANA 时区名: 偏移表达不了夏令时, 同一个 +08:00 在不同日期可能对应不同的时区规则.
 * 后端认不出时会落到它自己的默认值 UTC +0时
 * @param config - 请求配置
 */
export function attachTimeZone(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (config?.headers && zone) {
    config.headers[TIME_ZONE_HEADER] = zone;
  }

  return config;
}
