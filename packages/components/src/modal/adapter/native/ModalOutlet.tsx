import { useEffect, useMemo, useSyncExternalStore } from 'react';
import { ModalIdContext } from './instance';
import { modalStore } from './store';
import type { ModalInstance } from './store';

/**
 * 全应用只该有一个挂载点. 跨文件计数静态查不出来, 所以在运行时兜住 ——
 * 出现第二个直接抛, 比默默渲染出两套弹窗好.
 */
let mounted = false;

function InstanceHost({ instance }: { instance: ModalInstance }) {
  const { id, Comp, props } = instance;

  // id 在本实例存续期间不变, 所以控制面算一次就够; 它是弹窗组件的 props, 身份要稳
  const control = useMemo(
    () => ({
      resolve: (value: unknown) => modalStore.settle(id, value),
      cancel: () => modalStore.settle(id, undefined),
    }),
    [id],
  );

  return (
    <ModalIdContext.Provider value={id}>
      <Comp {...props} resolve={control.resolve} cancel={control.cancel} />
    </ModalIdContext.Provider>
  );
}

/**
 * 命令式弹窗的挂载点. 它只是显示器 —— 事实来源在 store,
 * 所以挂载之前调用的 openModal 不会丢, 挂上来会补渲染.
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
