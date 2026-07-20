<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { message } from 'ant-design-vue'
import {
  deleteAppByAdmin,
  listAppVoByPageByAdmin,
  updateAppByAdmin,
} from '@/api/appController.ts'
import { formatDateTime } from '@/utils/time.ts'

const columns = [
  {
    title: 'ID',
    dataIndex: 'id',
    width: 80,
  },
  {
    title: '名称',
    dataIndex: 'appName',
    ellipsis: true,
  },
  {
    title: '封面',
    dataIndex: 'cover',
    width: 80,
  },
  {
    title: '生成类型',
    dataIndex: 'codeGenType',
    width: 120,
  },
  {
    title: '优先级',
    dataIndex: 'priority',
    width: 90,
  },
  {
    title: '用户 ID',
    dataIndex: 'userId',
    width: 100,
  },
  {
    title: '创建时间',
    dataIndex: 'createTime',
    width: 180,
  },
  {
    title: '操作',
    key: 'action',
    width: 200,
  },
]

const data = ref<API.AppVO[]>([])
const total = ref(0)
const loading = ref(false)

const searchParams = reactive<API.AppQueryRequest>({
  pageNum: 1,
  pageSize: 10,
})

const fetchData = async () => {
  loading.value = true
  try {
    const res = await listAppVoByPageByAdmin({
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
  searchParams.appName = undefined
  searchParams.priority = undefined
  searchParams.codeGenType = undefined
  searchParams.userId = undefined
  searchParams.pageNum = 1
  fetchData()
}

const doEdit = (id?: number) => {
  if (id == null) return
  window.open(`/app/edit/${id}`, '_blank')
}

const doDelete = async (id?: number) => {
  if (id == null) return
  const res = await deleteAppByAdmin({ id })
  if (res.data.code === 0) {
    message.success('删除成功')
    if (data.value.length === 1 && (searchParams.pageNum ?? 1) > 1) {
      searchParams.pageNum = (searchParams.pageNum ?? 1) - 1
    }
    fetchData()
  } else {
    message.error('删除失败，' + res.data.message)
  }
}

const doFeature = async (id?: number) => {
  if (id == null) return
  const res = await updateAppByAdmin({ id, priority: 99 })
  if (res.data.code === 0) {
    message.success('已设为精选')
    fetchData()
  } else {
    message.error('精选失败，' + res.data.message)
  }
}

onMounted(() => {
  fetchData()
})
</script>

<template>
  <div id="appManagePage">
    <a-card class="page-card" :bordered="false">
      <template #title>
        <div class="page-title">应用管理</div>
      </template>

      <a-form class="search-form" layout="inline" :model="searchParams" @finish="doSearch">
        <a-form-item label="名称">
          <a-input
            v-model:value="searchParams.appName"
            allow-clear
            placeholder="输入应用名称"
            style="width: 160px"
          />
        </a-form-item>
        <a-form-item label="优先级">
          <a-input-number
            v-model:value="searchParams.priority"
            allow-clear
            placeholder="优先级"
            style="width: 120px"
          />
        </a-form-item>
        <a-form-item label="生成类型">
          <a-input
            v-model:value="searchParams.codeGenType"
            allow-clear
            placeholder="如 multi_file"
            style="width: 140px"
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
        class="app-table"
        row-key="id"
        :columns="columns"
        :data-source="data"
        :loading="loading"
        :pagination="pagination"
        :scroll="{ x: 1000 }"
        @change="doTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'cover'">
            <a-image
              v-if="record.cover"
              :src="record.cover"
              :width="40"
              :height="40"
              style="object-fit: cover; border-radius: 4px"
            />
            <span v-else>-</span>
          </template>
          <template v-else-if="column.dataIndex === 'codeGenType'">
            {{ record.codeGenType || '-' }}
          </template>
          <template v-else-if="column.dataIndex === 'priority'">
            <a-tag v-if="(record.priority ?? 0) >= 99" color="gold">精选</a-tag>
            <span v-else>{{ record.priority ?? 0 }}</span>
          </template>
          <template v-else-if="column.dataIndex === 'createTime'">
            {{ formatDateTime(record.createTime) }}
          </template>
          <template v-else-if="column.key === 'action'">
            <a-space>
              <a-button type="link" size="small" @click="doEdit(record.id)">编辑</a-button>
              <a-button
                v-if="(record.priority ?? 0) < 99"
                type="link"
                size="small"
                @click="doFeature(record.id)"
              >
                精选
              </a-button>
              <a-popconfirm
                title="确定删除该应用吗？"
                ok-text="确定"
                cancel-text="取消"
                @confirm="doDelete(record.id)"
              >
                <a-button type="link" danger size="small">删除</a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<style scoped>
#appManagePage {
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

.app-table {
  margin-top: 8px;
}

:deep(.ant-table-thead > tr > th) {
  background: #fafafa;
  font-weight: 600;
}
</style>
