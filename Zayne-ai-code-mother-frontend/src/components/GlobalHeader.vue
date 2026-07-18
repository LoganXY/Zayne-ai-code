<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { LogoutOutlined, MenuOutlined, UserOutlined } from '@ant-design/icons-vue'
import { type MenuProps, message } from 'ant-design-vue'
import { menuItems, type MenuItemConfig } from '@/config/menu'
import { SITE_TITLE } from '@/config/site'
import { useLoginUserStore } from '@/stores/loginUser.ts'
import { userLogout } from '@/api/userController.ts'

const loginUserStore = useLoginUserStore()

const props = withDefaults(
  defineProps<{
    items?: MenuItemConfig[]
  }>(),
  {
    items: () => menuItems,
  },
)

const route = useRoute()
const router = useRouter()

const selectedKeys = ref<string[]>([])
const drawerVisible = ref(false)

/**
 * 按登录用户角色过滤菜单
 * - access 为 admin 时，仅管理员可见
 */
const visibleMenuItems = computed(() => {
  return props.items.filter((item) => {
    if (item.access === 'admin') {
      return loginUserStore.loginUser.userRole === 'admin'
    }
    return true
  })
})

const menuOptions = computed<MenuProps['items']>(() =>
  visibleMenuItems.value.map((item) => ({
    key: item.key,
    label: item.label,
  })),
)

const syncSelectedKeys = () => {
  const matched = visibleMenuItems.value.find((item) => item.path === route.path)
  selectedKeys.value = matched ? [matched.key] : []
}

watch([() => route.path, visibleMenuItems], syncSelectedKeys, { immediate: true })

const navigateTo = (key: string) => {
  const target = visibleMenuItems.value.find((item) => item.key === key)
  if (target) {
    router.push(target.path)
  }
}

const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
  navigateTo(String(key))
}

const handleDrawerMenuClick: MenuProps['onClick'] = ({ key }) => {
  navigateTo(String(key))
  drawerVisible.value = false
}

/**
 * 用户注销
 */
const doLogout = async () => {
  const res = await userLogout()
  if (res.data.code === 0) {
    loginUserStore.setLoginUser({
      userName: '未登录',
    })
    message.success('退出登录成功')
    await router.push('/user/login')
  } else {
    message.error('退出登录失败，' + res.data.message)
  }
}
</script>

<template>
  <a-layout-header class="global-header">
    <div class="header-inner">
      <div class="header-left">
        <RouterLink class="brand" to="/">
          <img alt="logo" class="brand-logo" src="/logo.png" />
          <span class="brand-title">{{ SITE_TITLE }}</span>
        </RouterLink>

        <a-menu
          v-model:selected-keys="selectedKeys"
          class="desktop-menu"
          mode="horizontal"
          :items="menuOptions"
          @click="handleMenuClick"
        />
      </div>

      <div class="header-right">
        <a-button class="mobile-menu-btn" type="text" @click="drawerVisible = true">
          <MenuOutlined />
        </a-button>

        <a-dropdown v-if="loginUserStore.loginUser.id">
          <a class="user-info" @click.prevent>
            <a-avatar :src="loginUserStore.loginUser.userAvatar" :size="32" />
            <span class="user-name">{{ loginUserStore.loginUser.userName ?? '无名' }}</span>
          </a>
          <template #overlay>
            <a-menu>
              <a-menu-item key="profile" @click="router.push('/user/profile')">
                <UserOutlined />
                个人中心
              </a-menu-item>
              <a-menu-item key="logout" @click="doLogout">
                <LogoutOutlined />
                退出登录
              </a-menu-item>
            </a-menu>
          </template>
        </a-dropdown>

        <a-button v-else type="primary" href="/user/login">登录</a-button>
      </div>
    </div>

    <a-drawer v-model:open="drawerVisible" placement="left" title="导航菜单" :width="280">
      <a-menu
        v-model:selected-keys="selectedKeys"
        mode="inline"
        :items="menuOptions"
        @click="handleDrawerMenuClick"
      />
    </a-drawer>
  </a-layout-header>
</template>

<style scoped>
.global-header {
  position: sticky;
  top: 0;
  z-index: 100;
  width: 100%;
  padding: 0 24px;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

.header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1200px;
  height: 64px;
  margin: 0 auto;
}

.header-left {
  display: flex;
  flex: 1;
  align-items: center;
  min-width: 0;
}

.brand {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 12px;
  color: rgba(0, 0, 0, 0.88);
  text-decoration: none;
}

.brand-logo {
  width: 36px;
  height: 36px;
  object-fit: contain;
}

.brand-title {
  overflow: hidden;
  font-size: 18px;
  font-weight: 600;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.desktop-menu {
  flex: 1;
  min-width: 0;
  margin-left: 32px;
  border-bottom: none;
  background: transparent;
}

.desktop-menu :deep(.ant-menu-item) {
  transition:
    color 0.2s,
    background-color 0.2s;
}

.desktop-menu :deep(.ant-menu-item:hover) {
  color: #1677ff !important;
  background-color: #e6f4ff !important;
}

.desktop-menu :deep(.ant-menu-item-selected) {
  color: #1677ff;
  background-color: transparent;
}

.desktop-menu :deep(.ant-menu-item-selected:hover) {
  background-color: #e6f4ff !important;
}

.header-right {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 8px;
  margin-left: 16px;
}

.user-info {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: rgba(0, 0, 0, 0.88);
  cursor: pointer;
}

.user-name {
  max-width: 100px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.mobile-menu-btn {
  display: none;
}

@media (max-width: 768px) {
  .global-header {
    padding: 0 16px;
  }

  .brand-title {
    max-width: 140px;
    font-size: 16px;
  }

  .desktop-menu {
    display: none;
  }

  .mobile-menu-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
}

:deep(.ant-drawer .ant-menu-item:hover) {
  color: #1677ff !important;
  background-color: #e6f4ff !important;
}
</style>
