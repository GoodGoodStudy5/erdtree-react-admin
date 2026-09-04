import type { BaseFormData } from '#/form';
import type { PagePermission } from '#/public';
import { Button, message, Popconfirm } from 'antd';
import { useMemo, useCallback } from 'react';
import { useEffectOnActive } from 'keepalive-for-react';
import { openModal } from '@south/components';
import { searchList, tableColumns } from './model';
import { MenuEditModal } from './MenuEditModal';
import { getMenuPage, deleteMenu, batchDeleteMenu } from '@/servers';
import { $t, i18n } from '@/locales';

// 当前行数据
interface RowData {
  id: string;
  type: number;
  label: string;
  labelEn: string;
}

function MenuPage() {
  const [isFetch, setFetch] = useState(false);
  const [isLoading, setLoading] = useState(false);
  const [searchData, setSearchData] = useState<BaseFormData>({});
  const [page, setPage] = useState(INIT_PAGINATION.page);
  const [pageSize, setPageSize] = useState(INIT_PAGINATION.pageSize);
  const [total, setTotal] = useState(0);
  const [tableData, setTableData] = useState<BaseFormData[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [messageApi, contextHolder] = message.useMessage();
  const { permissions } = useCommonStore();

  // 权限前缀
  const permissionPrefix = '/authority/menu';

  // 权限
  const pagePermission: PagePermission = {
    page: checkPermission(permissionPrefix, permissions),
    create: checkPermission(`${permissionPrefix}/create`, permissions),
    update: checkPermission(`${permissionPrefix}/update`, permissions),
    delete: checkPermission(`${permissionPrefix}/delete`, permissions),
  };

  /** 获取表格数据 */
  const getPage = useCallback(async () => {
    const params = { ...searchData, page, pageSize };

    try {
      setLoading(true);
      const res = await getMenuPage(params);
      const { code, data } = res;
      if (Number(code) !== 200) return;
      const { items, total } = data;
      setTotal(total || 0);
      setTableData(items || []);
    } finally {
      setFetch(false);
      setLoading(false);
    }
  }, [page, pageSize, searchData]);

  useEffect(() => {
    if (isFetch) getPage();
  }, [getPage, isFetch]);

  // 首次进入自动加载接口数据
  useEffect(() => {
    if (pagePermission.page) getPage();
  }, [pagePermission.page]);

  // 每次进入调用
  useEffectOnActive(() => {
    getPage();
  }, []);

  /**
   * 点击搜索
   * @param values - 表单返回数据
   */
  const onSearch = (values: BaseFormData) => {
    setSearchData(values);
    setFetch(true);
  };

  /**
   * 点击新增
   * @param record - 当前行数据
   */
  const onCreate = async (record?: RowData) => {
    // 在某个菜单下新增时, 默认落到它的下一层
    let type = record?.id ? record?.type : undefined;
    if (type && type < 3) type = type + 1;
    if (await openModal(MenuEditModal, { parentId: record?.id, type })) getPage();
  };

  /**
   * 点击编辑
   * @param id - 唯一值
   */
  const onUpdate = async (id: string) => {
    if (await openModal(MenuEditModal, { id })) getPage();
  };

  /**
   * 点击删除
   * @param id - 唯一值
   */
  const onDelete = async (id: string) => {
    try {
      setLoading(true);
      const { code, message } = await deleteMenu(id);
      if (Number(code) === 200) {
        messageApi.success(message || $t('public.successfullyDeleted'));
        getPage();
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * 批量删除
   */
  const onBatchDelete = async () => {
    if (selectedRowKeys.length === 0) {
      messageApi.warning($t('public.selectAtLeastOne'));
      return;
    }
    try {
      setLoading(true);
      const { code, message } = await batchDeleteMenu(selectedRowKeys as string[]);
      if (Number(code) === 200) {
        messageApi.success(message || $t('public.successfullyDeleted'));
        setSelectedRowKeys([]);
        getPage();
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * 处理分页
   * @param page - 当前页数
   * @param pageSize - 每页条数
   */
  const onChangePagination = useCallback((page: number, pageSize: number) => {
    setPage(page);
    setPageSize(pageSize);
    setFetch(true);
  }, []);

  /**
   * 渲染操作
   * @param _ - 当前值
   * @param record - 当前行参数
   */
  const optionRender = useCallback(
    (_: unknown, record: object) => {
      return (
        <div className="flex flex-wrap gap-5px">
          {pagePermission.create === true && (record as RowData)?.type <= 2 && (
            <Button type="primary" onClick={() => onCreate(record as RowData)}>
              {$t('systems:menu.addChildMenu')}
            </Button>
          )}
          {pagePermission.update === true && (
            <UpdateBtn onClick={() => onUpdate((record as RowData).id)} />
          )}
          {pagePermission.delete === true && (
            <DeleteBtn
              name={
                i18n.language === 'zh' ? (record as RowData).label : (record as RowData).labelEn
              }
              handleDelete={() => onDelete((record as RowData).id)}
            />
          )}
        </div>
      );
    },
    [
      pagePermission.create,
      pagePermission.update,
      pagePermission.delete,
      i18n.language,
      onCreate,
      onUpdate,
      onDelete,
    ],
  );

  // 缓存列配置
  const columns = useMemo(() => tableColumns(optionRender), [optionRender]);

  return (
    <BaseContent isPermission={pagePermission.page}>
      {contextHolder}
      <BaseCard>
        <BaseSearch
          list={searchList()}
          data={searchData}
          isLoading={isLoading}
          handleFinish={onSearch}
        />
      </BaseCard>

      <BaseCard className="mt-10px">
        <BaseTable
          isLoading={isLoading}
          isCreate={pagePermission.create}
          columns={columns}
          dataSource={tableData}
          getPage={getPage}
          onCreate={onCreate}
          rowSelection={{
            selectedRowKeys,
            onChange: (selectedRowKeys: React.Key[]) => setSelectedRowKeys(selectedRowKeys),
          }}
          leftContent={
            selectedRowKeys.length > 0 && pagePermission.delete ? (
              <Popconfirm
                title={$t('public.kindTips')}
                description={$t('public.batchDeleteConfirmMessage', { name: '' })}
                onConfirm={onBatchDelete}
                okText={$t('public.confirm')}
                cancelText={$t('public.cancel')}
              >
                <Button danger>
                  {$t('public.batchDelete')} ({selectedRowKeys.length})
                </Button>
              </Popconfirm>
            ) : undefined
          }
        />

        <BasePagination
          disabled={isLoading}
          current={page}
          pageSize={pageSize}
          total={total}
          onChange={onChangePagination}
        />
      </BaseCard>
    </BaseContent>
  );
}

export default MenuPage;
