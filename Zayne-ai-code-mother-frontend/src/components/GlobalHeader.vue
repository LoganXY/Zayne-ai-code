<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { MenuOutlined } from '@ant-design/icons-vue'
import type { MenuProps } from 'ant-design-vue'
import { menuItems, type MenuItemConfig } from '@/config/menu'
import { SITE_TITLE } from '@/config/site'

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

const menuOptions = computed<MenuProps['items']>(() =>
  props.items.map((item) => ({
    key: item.key,
    label: item.label,
  })),
)

const syncSelectedKeys = () => {
  const matched = props.items.find((item) => item.path === route.path)
  selectedKeys.value = matched ? [matched.key] : []
}

watch(() => route.path, syncSelectedKeys, { immediate: true })

const navigateTo = (key: string) => {
  const target = props.items.find((item) => item.key === key)
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

const handleLogin = () => {
  // TODO: 接入登录逻辑
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
        <a-button type="primary" @click="handleLogin">登录</a-button>
      </div>
    </div>

    <a-drawer
      v-model:open="drawerVisible"
      placement="left"
      title="导航菜单"
      :width="280"
    >
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
  transition: color 0.2s, background-color 0.2s;
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
