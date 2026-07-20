<script setup lang="ts">
import { computed } from 'vue'
import { ArrowUpOutlined } from '@ant-design/icons-vue'

const props = withDefaults(
  defineProps<{
    modelValue: string
    placeholder?: string
    disabled?: boolean
    loading?: boolean
  }>(),
  {
    placeholder: '描述你想创建的应用或网站…',
    disabled: false,
    loading: false,
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
</style>
