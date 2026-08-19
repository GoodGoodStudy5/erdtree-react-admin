import { useEffect, useMemo, useSyncExternalStore } from 'react';
import { ModalInstanceContext } from './instance';
import type { ModalInstanceApi } from './instance';
import { modalStore } from './store';
import type { ModalInstance } from './store';

/**
 * 全应用只该有一个挂载点. 跨文件计数静态查不出来, 所以在运行时兜住 ——
 * 出现第二个直接抛, 比默默渲染出两套弹窗好.
 */
let mounted = false;

function InstanceHost({ instance }: { instance: ModalInstance }) {
  const { id, Comp, props, visible, busy } = instance;

  const api = useMemo<ModalInstanceApi>(
    () => ({
      id,
      visible,
      busy,
      resolve: (value: unknown) => modalStore.settle(id, value),
      cancel: () => modalStore.settle(id, undefined),
      requestClose: (reason) => void modalStore.requestClose(id, reason),
      setBusy: (next: boolean) => modalStore.setBusy(id, next),
      registerGuard: (guard) => modalStore.registerGuard(id, guard),
      notifyClosed: () => modalStore.remove(id),
    }),
    [id, visible, busy],
  );

  return (
    <ModalInstanceContext.Provider value={api}>
      <Comp {...props} resolve={api.resolve} cancel={api.cancel} />
    </ModalInstanceContext.Provider>
  );
}

/**
 * 命令式弹窗的挂载点. 它只是显示器 —— 事实来源在 store,
 * 所以挂载之前调用的 open 不会丢, 挂上来会补渲染.
 */
export function ModalOutlet() {
  const instances = useSyncExternalStore(
    modalStore.subscribe,
    modalStore.getSnapshot,
    modalStore.getSnapshot,
  );

  useEffect(() => {
    if (mounted) {
      throw new Error('[@south/components] ModalOutlet 只能挂载一次, 请检查是否重复渲染');
    }
    mounted = true;
    return () => {
      mounted = false;
      // 挂载点没了, 未结算的 Promise 全部交出 undefined, 不留悬挂
      modalStore.discardAll();
    };
  }, []);

  return (
    <>
      {instances.map((instance) => (
        <InstanceHost key={instance.id} instance={instance} />
      ))}
    </>
  );
}
