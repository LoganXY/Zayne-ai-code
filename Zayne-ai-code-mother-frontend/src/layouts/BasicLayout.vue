<script setup lang="ts">
import GlobalFooter from '@/components/GlobalFooter.vue'
import GlobalHeader from '@/components/GlobalHeader.vue'
</script>

<template>
  <a-layout class="basic-layout">
    <GlobalHeader />
    <a-layout-content class="layout-content">
      <div class="content-inner">
        <RouterView />
      </div>
    </a-layout-content>
    <GlobalFooter />
  </a-layout>
</template>

<style scoped>
.basic-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #f5f5f5;
}

.layout-content {
  flex: 1;
  padding: 24px;
}

.content-inner {
  max-width: 1200px;
  min-height: 100%;
  margin: 0 auto;
}

@media (max-width: 768px) {
  .layout-content {
    padding: 16px;
  }
}
</style>
