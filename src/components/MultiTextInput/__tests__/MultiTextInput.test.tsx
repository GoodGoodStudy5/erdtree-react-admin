import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { MultiTextInput } from '../MultiTextInput';

/**
 * 受控壳: 交出去的值写回来.
 *
 * 表单项就是这么接的, 而这个控件受控 —— 不写回来的话它每渲染一次都会被「外部值是空」覆盖一次.
 */
function Controlled(props: { initial?: string[]; onChange?: (value: string[]) => void }) {
  const [value, setValue] = useState(props.initial);

  return (
    <MultiTextInput
      value={value}
      onChange={(next) => {
        setValue(next);
        props.onChange?.(next);
      }}
    />
  );
}

/** 取那个文本框. 控件只有一个输入框, 面板里的条目都是只读文本 */
function inputOf() {
  return screen.getByRole('textbox') as HTMLInputElement;
}

/** 模拟粘贴: jsdom 不会替我们把剪贴板内容写进框里, 所以事件与文本各给各的 */
function pasteInto(input: HTMLInputElement, text: string) {
  fireEvent.paste(input, { clipboardData: { getData: () => text } });
}

/** 面板里当前列出的条目文案, 按顺序 */
function listedIn(container: HTMLElement) {
  return [...container.querySelectorAll('.multi-text-input-item-text')].map((el) => el.textContent);
}

describe('MultiTextInput', () => {
  it('粘贴 Excel 里竖着复制的一列, 交出切好的数组', () => {
    const onChange = vi.fn();

    render(<Controlled onChange={onChange} />);
    pasteInto(inputOf(), '4545784512\n12321312326\n4545121487');

    expect(onChange).toHaveBeenCalledWith(['4545784512', '12321312326', '4545121487']);
  });

  it('粘贴 Excel 里横着复制的一行, 同样切得开', () => {
    const onChange = vi.fn();

    render(<Controlled onChange={onChange} />);
    pasteInto(inputOf(), '4545784512\t12321312326');

    expect(onChange).toHaveBeenCalledWith(['4545784512', '12321312326']);
  });

  it('粘贴逗号分号混着全角的一串, 也切得开', () => {
    const onChange = vi.fn();

    render(<Controlled onChange={onChange} />);
    pasteInto(inputOf(), '45457,12321，4545;8888；7777');

    expect(onChange).toHaveBeenCalledWith(['45457', '12321', '4545', '8888', '7777']);
  });

  it('粘贴进来的内容接在已有文本后面, 不顶掉它', () => {
    const onChange = vi.fn();

    render(<Controlled initial={['4545']} onChange={onChange} />);
    const input = inputOf();

    // 光标停在末尾: 用户粘之前多半刚打完上一个号
    input.setSelectionRange(input.value.length, input.value.length);
    pasteInto(input, ' 8888 7777');

    expect(onChange).toHaveBeenCalledWith(['4545', '8888', '7777']);
  });

  it('手打遇分隔符当场落成一条', () => {
    const onChange = vi.fn();

    render(<Controlled onChange={onChange} />);
    const input = inputOf();

    fireEvent.change(input, { target: { value: '4545784512' } });
    expect(onChange).not.toHaveBeenCalled();

    fireEvent.change(input, { target: { value: '4545784512 ' } });
    expect(onChange).toHaveBeenCalledWith(['4545784512']);
  });

  it('没跟分隔符的尾巴, 失焦时结算进去', () => {
    const onChange = vi.fn();

    render(<Controlled onChange={onChange} />);
    const input = inputOf();

    fireEvent.change(input, { target: { value: '4545 8888' } });
    expect(onChange).toHaveBeenCalledWith(['4545']);

    fireEvent.blur(input);
    expect(onChange).toHaveBeenLastCalledWith(['4545', '8888']);
  });

  it('没跟分隔符的尾巴, 回车时也结算进去', () => {
    const onChange = vi.fn();

    render(<Controlled onChange={onChange} />);
    const input = inputOf();

    fireEvent.change(input, { target: { value: '4545' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onChange).toHaveBeenLastCalledWith(['4545']);
  });

  it('删掉清单里的一条, 交出剩下的, 框里的文本跟着少一条', () => {
    const onChange = vi.fn();

    render(<Controlled initial={['4545', '8888', '7777']} onChange={onChange} />);
    fireEvent.focus(inputOf());
    fireEvent.click(screen.getByRole('button', { name: '删除 8888' }));

    expect(onChange).toHaveBeenCalledWith(['4545', '7777']);
    expect(inputOf().value).toBe('4545 7777');
  });

  it('重复的值原样留着, 不去重', () => {
    const onChange = vi.fn();
    const { container } = render(<Controlled onChange={onChange} />);

    pasteInto(inputOf(), '4545 4545 8888');

    expect(onChange).toHaveBeenCalledWith(['4545', '4545', '8888']);
    expect(listedIn(container)).toEqual(['4545', '4545', '8888']);
  });

  it('外部传进来的数组在框里拼成一行文本', () => {
    render(<MultiTextInput value={['4545', '8888']} />);

    expect(inputOf().value).toBe('4545 8888');
  });

  it('外部改了值, 框里跟着改', () => {
    const { rerender } = render(<MultiTextInput value={['4545']} />);

    rerender(<MultiTextInput value={['4545', '8888']} />);
    expect(inputOf().value).toBe('4545 8888');
  });

  it('聚焦才出清单, 失焦就收', () => {
    const { container } = render(<Controlled initial={['4545', '8888']} />);

    expect(listedIn(container)).toEqual([]);

    fireEvent.focus(inputOf());
    expect(listedIn(container)).toEqual(['4545', '8888']);

    fireEvent.blur(inputOf());
    expect(listedIn(container)).toEqual([]);
  });

  it('粘贴当场展开清单, 不必先聚焦', () => {
    const { container } = render(<Controlled />);

    pasteInto(inputOf(), '4545 8888');
    expect(listedIn(container)).toEqual(['4545', '8888']);
  });

  it('面板头上带单位, 框里那个不带: 框里那一格挤, 面板头上不挤', () => {
    const { container } = render(<Controlled initial={['4545', '8888', '7777']} />);

    fireEvent.focus(inputOf());
    expect(screen.getByText('共 3 个')).toBeTruthy();
    expect(container.querySelector('.multi-text-input-count')?.textContent).toBe('3');
  });

  it('框里常驻一个计数, 收起清单也数得出有几条', () => {
    render(<Controlled initial={['4545', '8888', '7777']} />);

    expect(screen.getByText('3')).toBeTruthy();
  });

  it('一条都没有时不出计数: 空框上写个 0 是废话', () => {
    render(<Controlled />);

    expect(screen.queryByText('0')).toBeNull();
  });
});
