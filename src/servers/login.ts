import { request } from '@/utils';

/** 登录接口入参 */
export interface LoginData {
  username: string;
  password: string;
}

// 用户数据
interface User {
  id: number;
  username: string;
  phone: string;
  email: string;
  roles: number[];
}

// 用户权限数据
interface Roles {
  id: string;
}

/** 登录接口返回: 令牌、用户信息、页面权限与角色 */
export interface LoginResult {
  token: string;
  user: User;
  permissions: string[];
  roles: Roles[];
}

/**
 * 登录
 * @param data - 请求数据
 */
export function login(data: LoginData) {
  return request.post<LoginResult>('/system/user/login', data);
}

/**
 * 修改密码
 * @param data - 请求数据
 */
export function updatePassword(data: object) {
  return request.post('/system/user/updatePassword', data);
}

/**
 * 忘记密码
 * @param data - 请求数据
 */
export function forgetPassword(data: object) {
  return request.post('/system/user/forgetPassword', data);
}
