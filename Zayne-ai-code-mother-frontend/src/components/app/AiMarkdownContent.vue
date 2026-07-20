<script setup lang="ts">
import { computed } from 'vue'
import { renderAiMarkdown } from '@/utils/markdown'

const props = defineProps<{
  content: string
}>()

const html = computed(() => renderAiMarkdown(props.content))
</script>

<template>
  <div class="ai-markdown" v-html="html" />
</template>

<style scoped>
.ai-markdown {
  color: rgba(0, 0, 0, 0.88);
  font-size: 14px;
  line-height: 1.65;
  word-break: break-word;
}

.ai-markdown :deep(p) {
  margin: 0 0 10px;
}

.ai-markdown :deep(p:last-child) {
  margin-bottom: 0;
}

.ai-markdown :deep(ul),
.ai-markdown :deep(ol) {
  margin: 0 0 10px;
  padding-left: 1.4em;
}

.ai-markdown :deep(li) {
  margin: 2px 0;
}

.ai-markdown :deep(pre.hljs-code-block) {
  margin: 12px 0;
  padding: 14px 16px;
  overflow-x: auto;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 10px;
  background: #f6f8fa;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6);
}

.ai-markdown :deep(pre.hljs-code-block:first-child) {
  margin-top: 4px;
}

.ai-markdown :deep(pre.hljs-code-block:last-child) {
  margin-bottom: 4px;
}

.ai-markdown :deep(pre.hljs-code-block code) {
  display: block;
  padding: 0;
  background: transparent;
  color: inherit;
  font-family:
    ui-monospace,
    SFMono-Regular,
    Menlo,
    Monaco,
    Consolas,
    'Liberation Mono',
    'Courier New',
    monospace;
  font-size: 13px;
  line-height: 1.55;
  white-space: pre;
  word-break: normal;
}

.ai-markdown :deep(:not(pre) > code) {
  padding: 1px 6px;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.06);
  font-family:
    ui-monospace,
    SFMono-Regular,
    Menlo,
    Monaco,
    Consolas,
    monospace;
  font-size: 0.92em;
}

.ai-markdown :deep(h1),
.ai-markdown :deep(h2),
.ai-markdown :deep(h3),
.ai-markdown :deep(h4) {
  margin: 12px 0 8px;
  font-weight: 600;
  line-height: 1.35;
}

.ai-markdown :deep(blockquote) {
  margin: 8px 0;
  padding: 4px 12px;
  border-left: 3px solid #d0d7de;
  color: rgba(0, 0, 0, 0.55);
}
</style>
