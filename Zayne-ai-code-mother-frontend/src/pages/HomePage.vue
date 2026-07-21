<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import AppPromptBox from '@/components/app/AppPromptBox.vue'
import AppCardList from '@/components/app/AppCardList.vue'
import { useAppListStore } from '@/stores/appList.ts'
import { useAppChatStore } from '@/stores/appChat.ts'
import { addApp } from '@/api/appController.ts'

const router = useRouter()
const appList = useAppListStore()
const appChat = useAppChatStore()

const prompt = ref('')
const creating = ref(false)

const SUGGESTIONS = ['波普风电商页面', '企业网站', '电商运营后台', '暗黑话题社区'] as const

onMounted(() => {
  void appList.fetchMyApps().catch(() => {})
  void appList.fetchGoodApps().catch(() => {})
})

const fillSuggestion = (text: string) => {
  prompt.value = text
}

const onSubmit = async () => {
  const initPrompt = prompt.value.trim()
  if (!initPrompt) return

  creating.value = true
  try {
    const res = await addApp({ initPrompt })
    if (res.data.code === 0 && res.data.data != null) {
      const id = res.data.data
      appChat.prepareCreate(id, initPrompt)
      // 异步生成 AI 名称
      appChat.generateAndUpdateName(id)
      await router.push(`/app/chat/${id}`)
      void appList.fetchMyApps().catch(() => {})
    } else {
      message.error('创建失败，' + res.data.message)
    }
  } catch {
    // 401 由拦截器处理
  } finally {
    creating.value = false
  }
}

const onItemClick = (app: API.AppVO) => {
  if (app.id == null) return
  void router.push(`/app/chat/${app.id}`)
}

const onMyPageNumUpdate = (page: number) => {
  appList.myQuery.pageNum = page
  void appList.fetchMyApps().catch(() => {})
}

const onMyKeywordUpdate = (keyword: string) => {
  appList.myQuery.appName = keyword.trim() || undefined
}

const onMySearch = () => {
  appList.myQuery.pageNum = 1
  void appList.fetchMyApps().catch(() => {})
}

const onGoodPageNumUpdate = (page: number) => {
  appList.goodQuery.pageNum = page
  void appList.fetchGoodApps().catch(() => {})
}

const onGoodKeywordUpdate = (keyword: string) => {
  appList.goodQuery.appName = keyword.trim() || undefined
}

const onGoodSearch = () => {
  appList.goodQuery.pageNum = 1
  void appList.fetchGoodApps().catch(() => {})
}
</script>

<template>
  <div class="home-page">
    <section class="hero">
      <h1 class="hero-title">
        <span> AI 应用</span>
        <img class="hero-logo" src="/mascot-icon-circle.png" alt="" />
        <span>生成平台</span>
      </h1>
      <p class="hero-subtitle">与 AI 对话轻松创建应用和网站</p>

      <div class="prompt-wrap">
        <AppPromptBox v-model="prompt" :loading="creating" @submit="onSubmit" />
      </div>

      <div class="suggestions">
        <button
          v-for="item in SUGGESTIONS"
          :key="item"
          type="button"
          class="suggestion-tag"
          @click="fillSuggestion(item)"
        >
          {{ item }}
        </button>
      </div>
    </section>

    <section class="lists">
      <AppCardList
        title="我的作品"
        variant="mine"
        show-search
        :apps="appList.myApps"
        :loading="appList.myLoading"
        :total="appList.myTotal"
        :page-num="appList.myQuery.pageNum ?? 1"
        :page-size="appList.myQuery.pageSize ?? 20"
        :keyword="appList.myQuery.appName ?? ''"
        @update:page-num="onMyPageNumUpdate"
        @update:keyword="onMyKeywordUpdate"
        @search="onMySearch"
        @item-click="onItemClick"
      />

      <AppCardList
        title="精选案例"
        variant="featured"
        show-search
        :apps="appList.goodApps"
        :loading="appList.goodLoading"
        :total="appList.goodTotal"
        :page-num="appList.goodQuery.pageNum ?? 1"
        :page-size="appList.goodQuery.pageSize ?? 20"
        :keyword="appList.goodQuery.appName ?? ''"
        @update:page-num="onGoodPageNumUpdate"
        @update:keyword="onGoodKeywordUpdate"
        @search="onGoodSearch"
        @item-click="onItemClick"
      />
    </section>
  </div>
</template>

<style scoped>
.home-page {
  width: 100%;
}

.hero {
  padding: 48px 24px 40px;
  margin: 0 0 32px;
  text-align: center;
  background: transparent;
}

.hero-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  margin: 0 0 14px;
  color: rgba(0, 0, 0, 0.82);
  font-size: 42px;
  font-weight: 600;
  line-height: 1.15;
  letter-spacing: 0.12em;
}

.hero-title span {
  letter-spacing: 0.14em;
}

.hero-logo {
  width: 72px;
  height: 72px;
  flex-shrink: 0;
  object-fit: cover;
  border: 3px solid rgba(255, 255, 255, 0.95);
  border-radius: 50%;
  box-shadow:
    0 4px 16px rgba(26, 158, 143, 0.16),
    0 1px 3px rgba(0, 0, 0, 0.06);
}

.hero-subtitle {
  margin: 0 0 28px;
  color: rgba(0, 0, 0, 0.45);
  font-size: 16px;
  line-height: 1.5;
}

.prompt-wrap {
  max-width: 720px;
  margin: 0 auto;
}

.suggestions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
  max-width: 720px;
  margin: 16px auto 0;
}

.suggestion-tag {
  padding: 6px 14px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.72);
  color: rgba(0, 0, 0, 0.65);
  font-size: 13px;
  line-height: 1.4;
  cursor: pointer;
  transition:
    background 0.2s,
    border-color 0.2s,
    color 0.2s;
}

.suggestion-tag:hover {
  background: #fff;
  border-color: rgba(0, 0, 0, 0.16);
  color: rgba(0, 0, 0, 0.88);
}

.lists {
  display: flex;
  flex-direction: column;
  gap: 40px;
  padding: 0 4px 24px;
}

@media (max-width: 768px) {
  .hero {
    padding: 32px 16px 28px;
  }

  .hero-title {
    gap: 12px;
    font-size: 28px;
    letter-spacing: 0.08em;
  }

  .hero-title span {
    letter-spacing: 0.1em;
  }

  .hero-logo {
    width: 52px;
    height: 52px;
    border-width: 2px;
  }

  .hero-subtitle {
    margin-bottom: 20px;
    font-size: 14px;
  }
}
</style>
