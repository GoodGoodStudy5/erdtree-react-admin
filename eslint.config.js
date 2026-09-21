import tseslint from 'typescript-eslint';

import { base } from './eslint/base.js';
import { boundaries } from './eslint/boundaries.js';
import { conventions } from './eslint/conventions.js';

/**
 * 新增一条门禁时先问它管什么: 谁能碰谁进 boundaries, 碰的时候怎么写进 conventions,
 * 与本仓库判据无关的通用清单进 base.
 *
 * base 必须最先: 它装插件, 后两份只写规则.
 */
export default tseslint.config(...base, ...boundaries, ...conventions);
