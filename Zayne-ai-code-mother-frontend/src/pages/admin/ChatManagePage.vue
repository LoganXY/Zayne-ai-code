<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { message } from 'ant-design-vue'
import {
  listAllChatHistoryByPageForAdmin,
  remove,
} from '@/api/chatHistoryController.ts'
import {
  CHAT_MESSAGE_TYPE_OPTIONS,
  getChatMessageTypeText,
} from '@/constants/chatHistory.ts'
import { formatDateTime } from '@/utils/time.ts'

const columns = [
  {
    title: 'ID',
    dataIndex: 'id',
    width: 100,
  },
  {
    title: '消息内容',
    dataIndex: 'message',
    ellipsis: true,
  },
  {
    title: '消息类型',
    dataIndex: 'messageType',
    width: 100,
  },
  {
    title: '应用 ID',
    dataIndex: 'appId',
    width: 120,
  },
  {
    title: '用户 ID',
    dataIndex: 'userId',
    width: 120,
  },
  {
    title: '创建时间',
    dataIndex: 'createTime',
    width: 180,
  },
  {
    title: '操作',
    key: 'action',
    width: 100,
  },
]

const data = ref<API.ChatHistory[]>([])
const total = ref(0)
const loading = ref(false)

const searchParams = reactive<API.ChatHistoryQueryRequest>({
  pageNum: 1,
  pageSize: 10,
})

const fetchData = async () => {
  loading.value = true
  try {
    const res = await listAllChatHistoryByPageForAdmin({
      ...searchParams,
    })
    if (res.data.code === 0 && res.data.data) {
      data.value = res.data.data.records ?? []
      total.value = res.data.data.totalRow ?? 0
    } else {
      message.error('获取数据失败，' + res.data.message)
    }
  } finally {
    loading.value = false
  }
}

const pagination = computed(() => {
  return {
    current: searchParams.pageNum ?? 1,
    pageSize: searchParams.pageSize ?? 10,
    total: total.value,
    showSizeChanger: true,
    showTotal: (totalCount: number) => `共 ${totalCount} 条`,
  }
})

const doTableChange = (page: { current?: number; pageSize?: number }) => {
  searchParams.pageNum = page.current
  searchParams.pageSize = page.pageSize
  fetchData()
}

const doSearch = () => {
  searchParams.pageNum = 1
  fetchData()
}

const doReset = () => {
  searchParams.message = undefined
  searchParams.messageType = undefined
  searchParams.appId = undefined
  searchParams.userId = undefined
  searchParams.pageNum = 1
  fetchData()
}

const doDelete = async (id?: number | string) => {
  if (id == null) return
  try {
    const res = await remove({ id: id as unknown as number })
    if (res.data === true) {
      message.success('删除成功')
      if (data.value.length === 1 && (searchParams.pageNum ?? 1) > 1) {
        searchParams.pageNum = (searchParams.pageNum ?? 1) - 1
      }
      fetchData()
    } else {
      message.error('删除失败')
    }
  } catch {
    message.error('删除失败')
  }
}

onMounted(() => {
  fetchData()
})
</script>

<template>
  <div id="chatManagePage">
    <a-card class="page-card" :bordered="false">
      <template #title>
        <div class="page-title">对话管理</div>
      </template>

      <a-form class="search-form" layout="inline" :model="searchParams" @finish="doSearch">
        <a-form-item label="消息内容">
          <a-input
            v-model:value="searchParams.message"
            allow-clear
            placeholder="输入消息内容"
            style="width: 180px"
          />
        </a-form-item>
        <a-form-item label="消息类型">
          <a-select
            v-model:value="searchParams.messageType"
            allow-clear
            placeholder="选择类型"
            style="width: 140px"
            :options="[...CHAT_MESSAGE_TYPE_OPTIONS]"
          />
        </a-form-item>
        <a-form-item label="应用 ID">
          <a-input-number
            v-model:value="searchParams.appId"
            allow-clear
            placeholder="应用 ID"
            style="width: 160px"
          />
        </a-form-item>
        <a-form-item label="用户 ID">
          <a-input-number
            v-model:value="searchParams.userId"
            allow-clear
            placeholder="用户 ID"
            style="width: 140px"
          />
        </a-form-item>
        <a-form-item>
          <a-space>
            <a-button type="primary" html-type="submit">搜索</a-button>
            <a-button @click="doReset">重置</a-button>
          </a-space>
        </a-form-item>
      </a-form>

      <a-table
        class="chat-table"
        row-key="id"
        :columns="columns"
        :data-source="data"
        :loading="loading"
        :pagination="pagination"
        :scroll="{ x: 1000 }"
        @change="doTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'messageType'">
            <a-tag :color="record.messageType === 'ai' ? 'blue' : 'default'">
              {{ getChatMessageTypeText(record.messageType) }}
            </a-tag>
          </template>
          <template v-else-if="column.dataIndex === 'createTime'">
            {{ formatDateTime(record.createTime) }}
          </template>
          <template v-else-if="column.key === 'action'">
            <a-popconfirm
              title="确定删除该对话记录吗？"
              ok-text="确定"
              cancel-text="取消"
              @confirm="doDelete(record.id)"
            >
              <a-button type="link" danger size="small">删除</a-button>
            </a-popconfirm>
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<style scoped>
#chatManagePage {
  width: 100%;
}

.page-card {
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.page-title {
  font-size: 18px;
  font-weight: 600;
}

.search-form {
  margin-bottom: 16px;
}

.chat-table {
  margin-top: 8px;
}

:deep(.ant-table-thead > tr > th) {
  background: #fafafa;
  font-weight: 600;
}
</style>
