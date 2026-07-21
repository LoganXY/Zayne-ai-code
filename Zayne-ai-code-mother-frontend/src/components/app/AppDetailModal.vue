<script setup lang="ts">
import { DeleteOutlined, EditOutlined } from '@ant-design/icons-vue'
import { formatDateTime } from '@/utils/time'

withDefaults(
  defineProps<{
    open: boolean
    app?: API.AppVO | null
    creatorName?: string
    creatorAvatar?: string
    canManage?: boolean
    deleting?: boolean
  }>(),
  {
    app: null,
    creatorName: '无名',
    creatorAvatar: undefined,
    canManage: false,
    deleting: false,
  },
)

const emit = defineEmits<{
  'update:open': [value: boolean]
  edit: []
  delete: []
}>()

const onOpenChange = (value: boolean) => {
  emit('update:open', value)
}
</script>

<template>
  <a-modal
    :open="open"
    title="应用详情"
    :footer="null"
    :width="420"
    destroy-on-close
    @update:open="onOpenChange"
  >
    <div class="detail-body">
      <div class="detail-row">
        <span class="detail-label">创建者：</span>
        <div class="creator">
          <a-avatar :src="creatorAvatar" :size="28">
            {{ creatorName?.[0] || '无' }}
          </a-avatar>
          <span>{{ creatorName }}</span>
        </div>
      </div>
      <div class="detail-row">
        <span class="detail-label">创建时间：</span>
        <span class="detail-value">{{ formatDateTime(app?.createTime) }}</span>
      </div>
    </div>
    <div class="detail-actions">
      <a-button type="primary" @click="emit('edit')">
        <template #icon>
          <EditOutlined />
        </template>
        修改
      </a-button>
      <a-button danger :loading="deleting" :disabled="!canManage" @click="emit('delete')">
        <template #icon>
          <DeleteOutlined />
        </template>
        删除
      </a-button>
    </div>
  </a-modal>
</template>

<style scoped>
.detail-body {
  padding: 8px 0 4px;
}

.detail-row {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  font-size: 14px;
}

.detail-label {
  flex-shrink: 0;
  color: rgba(0, 0, 0, 0.45);
}

.detail-value {
  color: rgba(0, 0, 0, 0.88);
}

.creator {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: rgba(0, 0, 0, 0.88);
}

.detail-actions {
  display: flex;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}
</style>
