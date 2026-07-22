export interface MenuItemConfig {
  key: string
  label: string
  path: string
  /** 需要的角色，不填则所有人可见 */
  access?: 'admin'
}

export const menuItems: MenuItemConfig[] = [
  {
    key: 'home',
    label: '首页',
    path: '/',
  },
  {
    key: 'about',
    label: '关于',
    path: '/about',
  },
  {
    key: 'userManage',
    label: '用户管理',
    path: '/admin/userManage',
    access: 'admin',
  },
  {
    key: 'appManage',
    label: '应用管理',
    path: '/admin/appManage',
    access: 'admin',
  },
  {
    key: 'chatManage',
    label: '对话管理',
    path: '/admin/chatManage',
    access: 'admin',
  },
]
