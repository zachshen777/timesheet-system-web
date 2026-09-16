#!/usr/bin/env bash
# ============================================================================
# 开发机（测试环境）提交并推送代码到 GitHub
# 用法：bash push-both.sh "提交说明"          # 前后端一起提交推送
#       bash push-both.sh "提交说明" frontend # 只推前端
#       bash push-both.sh "提交说明" backend  # 只推后端
#
# 可选环境变量：
#       GIT_NAME / GIT_EMAIL  覆盖提交身份（默认 zachshen777 / 15052379214@163.com）
#       BRANCH                分支名（默认 master）
# ============================================================================
set -uo pipefail

BACKEND_REPO="${BACKEND_REPO:-/mnt/c/Users/Administrator/IdeaProjects/mytools}"
FRONTEND_REPO="${FRONTEND_REPO:-/mnt/d/vue_project/mytools-web}"
BRANCH="${BRANCH:-master}"
GIT_NAME="${GIT_NAME:-zachshen777}"
GIT_EMAIL="${GIT_EMAIL:-15052379214@163.com}"

MSG="${1:-}"
SCOPE="${2:-all}"
[ -n "$MSG" ] || { echo "用法：bash push-both.sh \"提交说明\" [all|backend|frontend]"; exit 1; }

FAILED=0
SUMMARY=""

# 补齐提交身份：repo 本地没配就读全局，都为空则用默认值写入本仓库
ensure_identity() {
  local repo="$1" n e
  n="$(git -C "$repo" config user.name 2>/dev/null || true)"
  e="$(git -C "$repo" config user.email 2>/dev/null || true)"
  if [ -z "$n" ] || [ -z "$e" ]; then
    git -C "$repo" config user.name "$GIT_NAME" || return 1
    git -C "$repo" config user.email "$GIT_EMAIL" || return 1
    echo "  已补齐 git 提交身份：$GIT_NAME <$GIT_EMAIL>（可用 GIT_NAME/GIT_EMAIL 覆盖）"
  fi
}

push_one() {
  local repo="$1" name="$2"
  echo ""
  echo "== $name =="
  [ -d "$repo/.git" ] || { echo "  [FAIL] 不是 git 仓库：$repo"; return 1; }

  ensure_identity "$repo" || { echo "  [FAIL] 设置 git 身份失败"; return 1; }

  git -C "$repo" add -A
  if git -C "$repo" diff --cached --quiet; then
    echo "  没有改动，跳过提交"
  else
    if ! git -C "$repo" commit -q -m "$MSG"; then
      echo "  [FAIL] 提交失败（上面有 git 的报错）"
      return 1
    fi
    echo "  已提交：$(git -C "$repo" log -1 --pretty='%h %s')"
  fi

  if git -C "$repo" push origin "$BRANCH"; then
    echo "  [OK] 已推送到 origin/$BRANCH"
    printf '  %s HEAD = %s\n' "$name" "$(git -C "$repo" rev-parse --short HEAD)"
    SUMMARY="$SUMMARY
  - $name: $(git -C "$repo" rev-parse --short HEAD)"
    return 0
  fi

  echo "  [FAIL] 推送失败"
  echo "         · 代理问题：git -C \"$repo\" config --unset http.proxy 后重试"
  echo "         · 认证问题：确认 GitHub 凭据/SSH key 可用"
  return 1
}

case "$SCOPE" in
  backend)  push_one "$BACKEND_REPO" "后端"     || FAILED=1 ;;
  frontend) push_one "$FRONTEND_REPO" "前端"    || FAILED=1 ;;
  all)      push_one "$BACKEND_REPO" "后端"     || FAILED=1
            push_one "$FRONTEND_REPO" "前端"    || FAILED=1 ;;
  *) echo "未知范围：$SCOPE（可选 all|backend|frontend）"; exit 1 ;;
esac

echo ""
if [ "$FAILED" -ne 0 ]; then
  echo "!! 有仓库操作失败，代码可能未全部推送 —— 修好后重跑本脚本"
  echo "   （生产机只需代码已在 GitHub 上，重跑是安全的）"
  exit 1
fi

echo "推送完成，已推送到 GitHub 的提交：$SUMMARY"
echo "接着到生产机执行： cd ~/mytools_src && bash deploy-from-git.sh all"
