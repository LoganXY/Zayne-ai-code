<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import GlobalFooter from '@/components/GlobalFooter.vue'
import GlobalHeader from '@/components/GlobalHeader.vue'

const route = useRoute()
const isHome = computed(() => route.path === '/')
const isChat = computed(() => route.path.startsWith('/app/chat'))
</script>

<template>
  <a-layout class="basic-layout" :class="{ 'is-home': isHome, 'is-chat': isChat }">
    <GlobalHeader :blend="isHome" />
    <a-layout-content class="layout-content">
      <div class="content-inner">
        <RouterView />
      </div>
    </a-layout-content>
    <GlobalFooter v-if="!isChat" :transparent="isHome" />
  </a-layout>
</template>

<style scoped>
.basic-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #f5f5f5;
}

/* 斜向：左上白 → 中间青绿/天蓝 → 右下白 */
.basic-layout.is-home {
  background:
    linear-gradient(
      135deg,
      #ffffff 0%,
      #f4fcf8 14%,
      #d8f5ea 32%,
      #c8eef6 48%,
      #d0e2fa 64%,
      #f2f6fc 82%,
      #ffffff 100%
    );
}

.basic-layout.is-home::before {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  content: '';
  opacity: 0.22;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  background-size: 160px 160px;
  mix-blend-mode: soft-light;
}

.basic-layout.is-home {
  position: relative;
}

.basic-layout.is-home .layout-content,
.basic-layout.is-home :deep(.global-footer) {
  position: relative;
  z-index: 1;
}

.layout-content {
  flex: 1;
  padding: 24px;
}

.basic-layout.is-home .layout-content {
  background: transparent;
}

.basic-layout.is-chat .layout-content {
  padding: 12px 20px 16px;
}

.content-inner {
  max-width: 1200px;
  min-height: 100%;
  margin: 0 auto;
}

.basic-layout.is-chat .content-inner {
  max-width: min(1680px, 100%);
}

@media (max-width: 768px) {
  .layout-content {
    padding: 16px;
  }

  .basic-layout.is-chat .layout-content {
    padding: 12px;
  }
}
</style>
