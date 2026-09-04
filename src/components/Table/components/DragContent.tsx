import type { CheckboxList } from './TableFilter';
import { DndContext } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Icon } from '../../Icon';
import { Checkbox } from 'antd';
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

interface SortableItemProps {
  item: CheckboxList;
  index: number;
  /** 该字段的勾选还没确认生效 */
  isPending?: boolean;
  pendingColor?: string;
}

interface DragContentProps {
  list: CheckboxList[];
  /** 勾选与已生效状态不一致的字段 */
  pendingValues?: string[];
  pendingColor?: string;
  handleDragEnd: (list: CheckboxList[]) => void;
}

// 排序组件
function SortableItem(props: SortableItemProps) {
  const { item, isPending, pendingColor } = props;
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: item.value, // 每个可拖拽对象的唯一标识
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      className={`
        h-28px
        flex
        items-center
        pl-5px
        hover:bg-blue-100
        border-rd-5px
      `}
      style={style}
      {...attributes}
    >
      <div
        className="h-28px pr-5px cursor-move flex items-center justify-center drag-handle"
        {...listeners}
      >
        <Icon icon="icon-park-outline:drag" />
      </div>
      <Checkbox value={item.value} className="flex-1">
        <span style={isPending ? { color: pendingColor } : undefined}>{item.label}</span>
      </Checkbox>
    </div>
  );
}

// 拖拽组件
/** 列筛选面板里的可拖拽行, 拖动即调整列顺序 */
export function DragContent(props: DragContentProps) {
  const { list, pendingValues, pendingColor, handleDragEnd } = props;

  /** 拖拽结束操作 */
  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    // 计算拖拽后的新顺序
    const oldIndex = list.findIndex((item) => item.value === active.id);
    const newIndex = list.findIndex((item) => item.value === over.id);
    const newColumns = arrayMove(list, oldIndex, newIndex);
    handleDragEnd(newColumns);
  };

  return (
    <DndContext onDragEnd={onDragEnd}>
      <SortableContext
        items={list.map((item) => item.value)}
        strategy={verticalListSortingStrategy}
      >
        {list?.map((item, index) => (
          <SortableItem
            key={item.value}
            index={index}
            item={item}
            isPending={pendingValues?.includes(item.value)}
            pendingColor={pendingColor}
          />
        ))}
      </SortableContext>
    </DndContext>
  );
}
