<script setup lang="ts">
withDefaults(
  defineProps<{
    transparent?: boolean
  }>(),
  {
    transparent: false,
  },
)
</script>

<template>
  <a-layout-footer class="global-footer" :class="{ 'is-transparent': transparent }">
    <div class="footer-inner">原创 by 程序员 Zayne</div>
  </a-layout-footer>
</template>

<style scoped>
.global-footer {
  flex-shrink: 0;
  padding: 16px 24px;
  text-align: center;
  background: #fff;
  border-top: 1px solid #f0f0f0;
}

.global-footer.is-transparent {
  background: transparent;
  border-top: none;
}

.footer-inner {
  max-width: 1200px;
  margin: 0 auto;
  color: rgba(0, 0, 0, 0.45);
  font-size: 14px;
}
</style>
