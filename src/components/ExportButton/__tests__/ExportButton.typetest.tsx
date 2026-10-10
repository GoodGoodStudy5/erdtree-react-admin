/**
 * 负向用例靠 @ts-expect-error: 本该报错却没报时 tsc 以 TS2578 失败.
 */
import { ExportButton } from '..';

function forbiddenButtonProps() {
  return (
    <>
      <ExportButton request={() => undefined} buttonProps={{ type: 'default' }} />
      <ExportButton
        request={() => undefined}
        buttonProps={{
          // @ts-expect-error 开窗不能被 onClick 换掉
          onClick: () => undefined,
        }}
      />
      <ExportButton
        request={() => undefined}
        buttonProps={{
          // @ts-expect-error href 会让按钮变成导航
          href: '/export',
        }}
      />
      <ExportButton
        request={() => undefined}
        buttonProps={{
          // @ts-expect-error htmlType 会把按钮变成提交
          htmlType: 'submit',
        }}
      />
      <ExportButton
        request={() => undefined}
        buttonProps={{
          // @ts-expect-error target 会把按钮变成导航
          target: '_blank',
        }}
      />
      <ExportButton
        request={() => undefined}
        buttonProps={{
          // @ts-expect-error 文案权威在一等 children
          children: '下载',
        }}
      />
    </>
  );
}

export { forbiddenButtonProps };
