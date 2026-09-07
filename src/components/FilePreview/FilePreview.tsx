import { Spin } from 'antd';
import { useEffect, useState } from 'react';

/** 能内嵌渲染的类型. 其余给降级提示 —— 塞进 iframe 只会显示成乱码或白屏 */
const RENDERABLE = 'application/pdf';

interface Props {
  url: string; // 归档对象的永久地址
  className?: string; // 外框样式, 尺寸由调用方定
}

/** 某个地址取回来的结果, 成功与失败互斥 */
interface Loaded {
  url: string;
  blobUrl?: string;
  error?: string;
}

/**
 * 归档文件的内嵌预览
 *
 * 不把地址直接交给 iframe: 归档对象一律 `Content-Disposition: attachment`, 直连会触发下载而不是渲染
 * (判据见后端 ADR-0025). 取回字节转成同源的 blob 地址之后, 渲染方式只由 MIME 类型决定。
 *
 * 整份字节过一遍内存是这条路的代价, 认下的 —— 它是预览不是下载, 下载仍走 `downloadFile` 交给浏览器。
 * @param props - 地址与外框样式
 */
export function FilePreview({ url, className }: Props) {
  const [loaded, setLoaded] = useState<Loaded>();
  // 地址换了就回到加载中, 不在 effect 里同步清状态
  const current = loaded?.url === url ? loaded : undefined;

  useEffect(() => {
    let cancelled = false;
    let created: string | undefined;

    fetch(url)
      .then(async (res) => {
        if (!res.ok) throw new Error(`取文件失败 (${res.status})`);
        return res.blob();
      })
      .then((blob) => {
        if (cancelled) return;
        if (!blob.type.startsWith(RENDERABLE)) throw new Error('这个文件不支持预览, 请下载后查看');
        created = URL.createObjectURL(blob);
        setLoaded({ url, blobUrl: created });
      })
      .catch((e: Error) => {
        if (!cancelled) setLoaded({ url, error: e.message });
      });

    return () => {
      cancelled = true;
      // 不释放的话, 抽屉每开一次泄漏一整份文件
      if (created) URL.revokeObjectURL(created);
    };
  }, [url]);

  if (current?.error) {
    return (
      <div className={`flex items-center justify-center ${className ?? ''}`}>{current.error}</div>
    );
  }
  if (!current?.blobUrl) {
    return (
      <div className={`flex items-center justify-center ${className ?? ''}`}>
        <Spin />
      </div>
    );
  }
  return <iframe title="文件预览" src={current.blobUrl} className={className} />;
}
