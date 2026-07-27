<script setup lang="ts">
import { computed } from 'vue'
import { ArrowUpOutlined } from '@ant-design/icons-vue'
import type { SelectedElement } from '@/composables/useVisualEdit'

const props = withDefaults(
  defineProps<{
    modelValue: string
    placeholder?: string
    disabled?: boolean
    loading?: boolean
    selectedElement?: SelectedElement | null
  }>(),
  {
    placeholder: '描述你想创建的应用或网站…',
    disabled: false,
    loading: false,
    selectedElement: null,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
  submit: []
}>()

const canSubmit = computed(
  () => !props.disabled && !props.loading && props.modelValue.trim().length > 0,
)

const sendDisabled = computed(() => props.disabled || props.modelValue.trim().length === 0)

const onInput = (event: Event) => {
  emit('update:modelValue', (event.target as HTMLTextAreaElement).value)
}

const onSubmit = () => {
  if (!canSubmit.value) return
  emit('submit')
}

const onKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    onSubmit()
  }
}
</script>

<template>
  <div class="app-prompt-box" :class="{ 'is-disabled': disabled }">
    <!-- 已选中元素展示区域（单选模式） -->
    <div v-if="selectedElement" class="selected-element-tag">
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M1 1H11M1 1V11M1 1L11 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
      <span class="el-tag">{{ selectedElement.tagName }}</span>
      <span class="el-text">{{ selectedElement.text || '（无文本）' }}</span>
    </div>

    <textarea
      class="prompt-input"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled || loading"
      rows="3"
      @input="onInput"
      @keydown="onKeydown"
    />
    <a-button
      class="send-btn"
      type="primary"
      shape="circle"
      :loading="loading"
      :disabled="sendDisabled"
      @click="onSubmit"
    >
      <template #icon>
        <ArrowUpOutlined />
      </template>
    </a-button>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&display=swap');

.app-prompt-box {
  position: relative;
  padding: 16px 16px 52px;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 20px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
}

.app-prompt-box.is-disabled {
  opacity: 0.7;
}

.prompt-input {
  display: block;
  width: 100%;
  min-height: 72px;
  padding: 0;
  border: none;
  outline: none;
  resize: none;
  background: transparent;
  color: rgba(0, 0, 0, 0.88);
  font-size: 15px;
  line-height: 1.6;
  font-family: inherit;
}

.prompt-input::placeholder {
  color: rgba(0, 0, 0, 0.35);
}

.send-btn {
  position: absolute;
  right: 14px;
  bottom: 14px;
}

/* 单选元素标签 */
.selected-element-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px 4px 8px;
  margin-bottom: 10px;
  background: rgba(34, 197, 94, 0.08);
  border: 1px solid rgba(34, 197, 94, 0.35);
  border-radius: 20px;
  color: #16a34a;
  font-family: 'DM Mono', monospace;
  font-size: 12px;
  max-width: 100%;
  overflow: hidden;
}

.selected-element-tag svg {
  flex-shrink: 0;
  color: #22c55e;
}

.el-tag {
  flex-shrink: 0;
  font-weight: 500;
  background: #22c55e;
  color: #fff;
  padding: 0 5px;
  border-radius: 4px;
  font-size: 11px;
  line-height: 1.6;
}

.el-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #15803d;
}
</style>
