/**
 * 建一个 `<a>` 交给浏览器下载: 进度, 取消与断点全是原生的, 字节不过 JS 内存.
 *
 * 跨源地址上浏览器会忽略 download 属性 (安全规则, 绕不开), 那时退化为新标签页打开, 由查看器
 * 自带的下载键落文件, 文件名取 URL 尾段. 同源与 blob:/data: 地址则直接按 fileName 落文件.
 * @param url - 文件地址
 * @param fileName - 期望的落地文件名, 只在浏览器允许的场合生效
 */
export function downloadFile(url: string, fileName?: string): void {
  const link = document.createElement('a');
  link.href = url;
  if (fileName) link.download = fileName;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  // 不挂进文档某些浏览器不响应 click
  document.body.appendChild(link);
  link.click();
  link.remove();
}
