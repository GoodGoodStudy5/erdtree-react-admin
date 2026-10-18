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

/** 点完到浏览器把 blob 拷进下载管理器之间, 地址和节点必须还活着 */
const REVOKE_AFTER_CLICK_MS = 40_000;

/**
 * 把已经在内存里的字节交给浏览器下载, 用完释放地址.
 * 返回的 Promise 在点完 a[download] 后结束, 不等文件写完盘. 调用方要等接手再 await, 不等就不管.
 */
export function downloadBlob(blob: Blob, fileName?: string): Promise<void> {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  if (fileName) link.download = fileName;
  link.hidden = true;
  // 不走 downloadFile: 那条路的 target=_blank 会把 blob 当成新标签打开, 当前页没有下载反应
  document.body.appendChild(link);
  return new Promise((resolve) => {
    // 先让出当前栈, 调用方若不 await 这一拍就能先收场
    setTimeout(() => {
      link.click();
      resolve();
      // 立刻摘掉节点或 revoke 时浏览器还没开始读字节, 落盘会拖成空白等待
      setTimeout(() => {
        link.remove();
        URL.revokeObjectURL(url);
      }, REVOKE_AFTER_CLICK_MS);
    });
  });
}
