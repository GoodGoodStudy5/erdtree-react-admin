import { addComponent } from '../Form/utils/componentMap';

// 自定义组件名
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
