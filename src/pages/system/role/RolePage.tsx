import type { BaseFormData } from '#/form';
import type { PagePermission } from '#/public';
import { Button, Form, message, Spin } from 'antd';
import type { FormInstance } from 'antd';
import { useMemo, useCallback } from 'react';
import { useEffectOnActive } from 'keepalive-for-react';
import { searchList, createList, tableColumns } from './model';
import { getRolePage, getRoleById, createRole, updateRole, deleteRole } from '@/servers';
import { BaseDrawer } from '@/components';
import { $t } from '@/locales';

// 当前行数据
interface RowData {
  id: string;
  name: string;
}

// 初始化新增数据
const initCreate = {
  status: 1,
};

function RolePage() {
  const createFormRef = useRef<FormInstance>(null);
  const [isFetch, setFetch] = useState(false);
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [isLoading, setLoading] = useState(false);
  const [isCreateLoading, setCreateLoading] = useState(false);
  const [createTitle, setCreateTitle] = useState(ADD_TITLE());
  const [createId, setCreateId] = useState('');
  const [createData, setCreateData] = useState<BaseFormData>(initCreate);
  const [searchData, setSearchData] = useState<BaseFormData>({});
  const [page, setPage] = useState(INIT_PAGINATION.page);
  const [pageSize, setPageSize] = useState(INIT_PAGINATION.pageSize);
  const [total, setTotal] = useState(0);
  const [tableData, setTableData] = useState<BaseFormData[]>([]);
  const [messageApi, contextHolder] = message.useMessage();
  const [form] = Form.useForm();
  const { permissions, roles } = useCommonStore();

  // 权限前缀
  const permissionPrefix = '/authority/role';

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
      const { items, total } = await getRolePage(params);
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
    setPage(1);
    setSearchData(values);
    setFetch(true);
  };

  /** 点击新增 */
  const onCreate = () => {
    setCreateOpen(true);
    setCreateTitle(ADD_TITLE());
    setCreateId('');
    setCreateData(initCreate);
  };

  /**
   * 点击编辑
   * @param id - 唯一值
   */
  const onUpdate = async (id: string) => {
    try {
      setCreateOpen(true);
      setCreateTitle(EDIT_TITLE(id));
      setCreateId(id);
      setCreateLoading(true);
      setCreateData(await getRoleById(id));
    } finally {
      setCreateLoading(false);
    }
  };

  /**
   * 点击复制
   * @param id - 唯一值
   */
  const onCopy = async (id: string) => {
    try {
      setCreateOpen(true);
      setCreateTitle(ADD_TITLE());
      setCreateId('');
      setCreateLoading(true);
      const { id: _id, createdAt, updatedAt, ...rest } = await getRoleById(id);
      setCreateData(rest);
    } finally {
      setCreateLoading(false);
    }
  };

  /** 表单提交 */
  const createSubmit = () => {
    createFormRef?.current?.submit();
  };

  /** 关闭新增/修改弹窗 */
  const closeCreate = () => {
    setCreateOpen(false);
  };

  /**
   * 新增/编辑提交
   * @param values - 表单返回数据
   */
  const handleCreate = async (values: BaseFormData) => {
    try {
      setCreateLoading(true);
      const functions = () => (createId ? updateRole(createId, values) : createRole(values));
      await functions();
      messageApi.success($t('public.successfulOperation'));
      setCreateOpen(false);
      getPage();
    } finally {
      setCreateLoading(false);
    }
  };

  /**
   * 点击删除
   * @param id - 唯一值
   */
  const onDelete = async (id: string) => {
    try {
      setLoading(true);
      await deleteRole(id);
      messageApi.success($t('public.successfullyDeleted'));
      getPage();
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
          {pagePermission.update === true && (
            <UpdateBtn onClick={() => onUpdate((record as RowData).id)} />
          )}
          {pagePermission.create === true && (
            <Button type="primary" onClick={() => onCopy((record as RowData).id)}>
              {$t('public.copy')}
            </Button>
          )}
          {pagePermission.delete === true && (
            <DeleteBtn
              name={(record as RowData).name}
              handleDelete={() => onDelete((record as RowData).id)}
            />
          )}
        </div>
      );
    },
    [
      pagePermission.update,
      pagePermission.create,
      pagePermission.delete,
      onUpdate,
      onCopy,
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
        />

        <BasePagination
          disabled={isLoading}
          current={page}
          pageSize={pageSize}
          total={total}
          onChange={onChangePagination}
        />
      </BaseCard>

      <BaseDrawer
        width={600}
        title={createTitle}
        maskClosable={false}
        open={isCreateOpen}
        onClose={closeCreate}
        footer={
          <div className="flex justify-end gap-10px">
            <Button onClick={closeCreate}>{$t('public.cancel')}</Button>
            <Button type="primary" onClick={createSubmit}>
              {$t('public.confirm')}
            </Button>
          </div>
        }
      >
        <Spin spinning={isCreateLoading}>
          <BaseForm
            form={form}
            ref={createFormRef}
            list={createList(roles?.join(','))}
            data={createData}
            labelCol={{ span: 4 }}
            wrapperCol={{ span: 19 }}
            handleFinish={handleCreate}
          />
        </Spin>
      </BaseDrawer>
    </BaseContent>
  );
}

export default RolePage;
