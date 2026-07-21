<script setup lang="ts">
import { computed } from 'vue'
import AppCard from './AppCard.vue'

const props = withDefaults(
  defineProps<{
    title: string
    apps: API.AppVO[]
    loading: boolean
    total: number
    pageNum: number
    pageSize: number
    keyword?: string
    variant: 'mine' | 'featured'
    showSearch?: boolean
  }>(),
  {
    keyword: '',
    showSearch: false,
  },
)

const emit = defineEmits<{
  'update:pageNum': [value: number]
  'update:keyword': [value: string]
  search: []
  'view-chat': [app: API.AppVO]
}>()

const keywordModel = computed({
  get: () => props.keyword ?? '',
  set: (value: string) => emit('update:keyword', value),
})

const onPageChange = (page: number) => {
  emit('update:pageNum', page)
}

const onSearch = () => {
  emit('search')
}

const onViewChat = (app: API.AppVO) => {
  emit('view-chat', app)
}
</script>

<template>
  <section class="app-card-list">
    <div class="header">
      <h2 class="title">{{ title }}</h2>
      <a-input-search
        v-if="showSearch"
        v-model:value="keywordModel"
        class="search"
        placeholder="按名称搜索"
        allow-clear
        @search="onSearch"
      />
    </div>

    <a-spin :spinning="loading">
      <a-empty v-if="!loading && apps.length === 0" description="暂无应用" />
      <a-row v-else :gutter="[16, 16]">
        <a-col v-for="app in apps" :key="app.id" :xs="24" :sm="12" :md="8">
          <AppCard :app="app" :variant="variant" @view-chat="onViewChat(app)" />
        </a-col>
      </a-row>
    </a-spin>

    <div v-if="total > pageSize" class="pagination">
      <a-pagination
        :current="pageNum"
        :page-size="pageSize"
        :total="total"
        :show-size-changer="false"
        @change="onPageChange"
      />
    </div>
  </section>
</template>

<style scoped>
.app-card-list {
  width: 100%;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.title {
  margin: 0;
  color: rgba(0, 0, 0, 0.88);
  font-size: 18px;
  font-weight: 600;
}

.search {
  width: 240px;
  max-width: 100%;
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

@media (max-width: 576px) {
  .header {
    flex-direction: column;
    align-items: stretch;
  }

  .search {
    width: 100%;
  }
}
</style>
