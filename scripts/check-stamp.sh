#!/usr/bin/env sh
# check:full 的结论按提交记账, 让 pre-push 不重跑已经跑过的那次.
# 只认干净工作区: 带未提交改动跑出的结论不属于任何一个提交, 记下来也没法复用.
# 账本放 .git/ 下 —— 它跟着本地仓库走, clone 出来的副本天然没有账, 必须自己跑一次.

STAMP_FILE="$(git rev-parse --git-dir)/check-full.stamps"
KEEP=10

head_sha() {
  test -z "$(git status --porcelain -uall)" || return 1
  git rev-parse HEAD 2>/dev/null
}

case "$1" in
  save)
    sha=$(head_sha) || exit 0
    {
      echo "$sha"
      test -f "$STAMP_FILE" && grep -vxF "$sha" "$STAMP_FILE"
    } | head -n "$KEEP" > "$STAMP_FILE.tmp"
    mv "$STAMP_FILE.tmp" "$STAMP_FILE"
    ;;
  verify)
    sha=$(head_sha) || exit 1
    test -f "$STAMP_FILE" || exit 1
    grep -qxF "$sha" "$STAMP_FILE"
    ;;
  *)
    echo "用法: check-stamp.sh save|verify" >&2
    exit 2
    ;;
esac
