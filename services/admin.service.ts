/**
 * 预留后台业务层：
 * 当前登录流程较轻量，直接走环境变量校验。
 * 后续如接入完整用户体系，可将后台权限判断统一收敛到该文件。
 */
export function isAdminRole(role: string): boolean {
  return role === "ADMIN" || role === "EDITOR";
}
