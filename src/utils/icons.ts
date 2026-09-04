import { addCollection } from '@iconify/react';

/**
 * 注册离线图标集.
 *
 * <p>不走 api.iconify.design: 线上网络不可达时 {@code <Icon>} 会整片空白, 而图标遍布菜单与操作按钮.
 *
 * <p>动态 import 而非静态: 九个图标集合计 9.2MB, 静态 import 会把它们压进首屏关键路径 —— 页面要
 * 等这 9.2MB 下完才开始渲染. 改成动态后应用先出来, 图标随后补上, 代价是首屏图标闪一下空白.
 *
 * <p>图标集一个没删: 菜单图标存在后端数据表里, 可能引用任意前缀, 删哪个都可能让线上某处变空白.
 * 要精简得先查库里实际用到的前缀.
 */
export async function registerIcons(): Promise<void> {
  const collections = await Promise.all([
    import('@iconify-json/ant-design/icons.json'),
    import('@iconify-json/cil/icons.json'),
    import('@iconify-json/gg/icons.json'),
    import('@iconify-json/gridicons/icons.json'),
    import('@iconify-json/icon-park/icons.json'),
    import('@iconify-json/icon-park-outline/icons.json'),
    import('@iconify-json/ion/icons.json'),
    import('@iconify-json/mdi/icons.json'),
    import('@iconify-json/uil/icons.json'),
  ]);

  for (const collection of collections) {
    addCollection(collection.default);
  }
}
