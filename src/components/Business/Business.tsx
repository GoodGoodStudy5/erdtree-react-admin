// 显式引而不靠自动导入: 用例跑在没有那个插件的环境里, 靠自动导入的值在测试中是 undefined
import { lazy } from 'react';
import { addComponent } from '../Form/utils/componentMap';

/** 业务组件在表单注册表中的可选类型名 */
export type BusinessComponents = 'GameSelect' | 'PartnerSelect';

/** 组件注入 */
export function CreateBusiness() {
  addComponent(
    'GameSelect',
    lazy(() => import('./Selects/GameSelect').then((module) => ({ default: module.GameSelect }))),
  );
  addComponent(
    'PartnerSelect',
    lazy(() =>
      import('./Selects/PartnerSelect').then((module) => ({ default: module.PartnerSelect })),
    ),
  );
}
