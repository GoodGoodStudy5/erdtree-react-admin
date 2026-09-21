import { emptyText } from '@south/utils';

/**
 * 占位符: 「这一格没有值」与「值是零」是两回事.
 *
 * 值的口径 (`emptyText`) 在工具包里, 那一层只给字符不管表现; 灰度是全站一份, 因此收在这里.
 */
export function Dash() {
  return <span className="text-quaternary">{emptyText}</span>;
}
