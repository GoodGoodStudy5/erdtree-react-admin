import type { ApiFn, BaseFormList } from '#/form';
import { getPartnerDemo } from '@/servers';
import { $t } from '@/locales';

// 搜索数据
export const searchList = (): BaseFormList[] => [
  {
    label: $t('public.date'),
    name: 'pay_date',
    component: 'RangePicker',
    componentProps: {
      allowClear: false,
    },
  },
  {
    label: $t('dashboard.gameID'),
    name: 'game_ids',
    wrapperWidth: 200,
    component: 'GameSelect',
  },
  {
    label: $t('dashboard.cooperativeCompany'),
    name: 'partners',
    wrapperWidth: 200,
    component: 'ApiSelect',
    componentProps: {
      api: getPartnerDemo as ApiFn,
      params: [
        '/platform/partner',
        {
          isAll: true,
        },
      ],
      fieldNames: {
        label: 'name',
        value: 'id',
      },
    },
  },
];
