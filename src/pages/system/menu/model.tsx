import { MENU_ACTIONS, MENU_STATUS, MENU_TYPES } from '@/utils';
import { eR } from '@south/utils';
import { getMenuList } from '@/servers';
import { Icon } from '@/components';
import { IconInput, StateSwitch } from './components';
import { $t } from '@/locales';

// 搜索数据
export const searchList = (): BaseSearchList[] => [
  {
    label: $t('systems:menu.label'),
    name: 'label',
    component: 'Input',
  },
  {
    label: $t('systems:menu.labelEn'),
    name: 'labelEn',
    component: 'Input',
  },
  {
    label: $t('system.state'),
    name: 'state',
    wrapperWidth: 100,
    component: 'Select',
    componentProps: {
      options: MENU_STATUS(),
    },
  },
];

/**
 * 表格数据
 * @param optionRender - 渲染操作函数
 */
export const tableColumns = (optionRender: TableOptions<object>): TableColumn[] => {
  return [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 100,
    },
    {
      title: $t('systems:menu.icon'),
      dataIndex: 'icon',
      width: 50,
      render: (text: string) => (
        <div className="text-center">
          {eR(text, (name) => (
            <Icon className="text-16px" icon={name} />
          ))}
        </div>
      ),
    },
    {
      title: $t('systems:menu.label'),
      dataIndex: 'label',
      width: 200,
    },
    {
      title: $t('systems:menu.labelEn'),
      dataIndex: 'labelEn',
      width: 200,
    },
    {
      title: $t('public.type'),
      dataIndex: 'type',
      width: 60,
      ellipsis: false,
      enum: MENU_TYPES(),
    },
    {
      title: $t('systems:menu.router'),
      dataIndex: 'router',
      width: 200,
    },
    {
      title: $t('system.status'),
      dataIndex: 'state',
      width: 80,
      render: (text: number, record) => <StateSwitch value={text} record={record} />,
    },
    {
      title: $t('systems:menu.sort'),
      dataIndex: 'order',
      width: 50,
    },
    {
      title: $t('systems:menu.rule'),
      dataIndex: 'rule',
      width: 150,
    },
    {
      title: $t('public.creationTime'),
      dataIndex: 'createdAt',
      width: 200,
    },
    {
      title: $t('public.updateTime'),
      dataIndex: 'updatedAt',
      width: 200,
    },
    {
      title: $t('public.operate'),
      dataIndex: 'operate',
      width: 210,
      fixed: 'right',
      render: (value: unknown, record: object) => optionRender(value, record),
    },
  ];
};

// 新增数据
export const createList = (id: string, type?: number): BaseFormList[] => [
  {
    label: $t('systems:menu.parentMenu'),
    name: 'parentId',
    component: 'ApiTreeSelect',
    componentProps: {
      api: getMenuList,
      fieldNames: { label: 'label', value: 'id' },
    },
  },
  {
    label: $t('systems:menu.label'),
    name: 'label',
    rules: FORM_REQUIRED,
    component: 'Input',
  },
  {
    label: $t('systems:menu.labelEn'),
    name: 'labelEn',
    rules: FORM_REQUIRED,
    component: 'Input',
  },
  {
    label: $t('public.type'),
    name: 'type',
    rules: FORM_REQUIRED,
    component: 'RadioGroup',
    componentProps: {
      options: MENU_TYPES(),
    },
  },
  {
    label: $t('systems:menu.router'),
    name: 'router',
    rules: [{ required: type !== 3 }],
    component: 'Input',
  },
  {
    label: $t('system.state'),
    name: 'state',
    rules: FORM_REQUIRED,
    component: 'Select',
    componentProps: {
      options: MENU_STATUS(),
    },
  },
  {
    label: $t('systems:menu.sort'),
    name: 'order',
    rules: FORM_REQUIRED,
    component: 'InputNumber',
  },
  {
    label: $t('systems:menu.rule'),
    name: 'rule',
    rules: [{ required: type === 3 }],
    component: 'Input',
  },
  {
    label: $t('systems:menu.icon'),
    name: 'icon',
    component: 'customize',
    render: IconInput,
  },
  {
    label: $t('system.permissionButton'),
    name: 'actions',
    hidden: !!id && type !== 3,
    component: 'CheckboxGroup',
    componentProps: {
      options: MENU_ACTIONS(),
    },
  },
];
