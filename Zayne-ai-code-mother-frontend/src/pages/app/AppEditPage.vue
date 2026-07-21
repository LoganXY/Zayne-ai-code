<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { getAppVoById, updateApp, updateAppByAdmin } from '@/api/appController.ts'
import { useRouteAppId } from '@/composables/useRouteAppId.ts'
import { useLoginUserStore } from '@/stores/loginUser.ts'
import { getCodeGenTypeText } from '@/constants/codeGenType.ts'

const router = useRouter()
const loginUserStore = useLoginUserStore()

const loading = ref(false)
const submitting = ref(false)
const appId = ref<string>('')

const formState = reactive({
  appName: '',
  cover: '',
  priority: 0 as number,
  initPrompt: '',
  codeGenType: '',
  deployKey: '',
})

const isAdmin = computed(() => loginUserStore.loginUser.userRole === 'admin')

const routeAppId = useRouteAppId()

const codeGenTypeLabel = computed(() => getCodeGenTypeText(formState.codeGenType))

const fillForm = (app: API.AppVO) => {
  formState.appName = app.appName ?? ''
  formState.cover = app.cover ?? ''
  formState.priority = app.priority ?? 0
  formState.initPrompt = app.initPrompt ?? ''
  formState.codeGenType = app.codeGenType ?? ''
  formState.deployKey = app.deployKey ?? ''
}

const goBack = () => {
  if (window.history.length > 1) {
    router.back()
  } else if (isAdmin.value) {
    void router.replace('/admin/appManage')
  } else {
    void router.replace('/')
  }
}

const loadApp = async (id: string) => {
  if (!id) {
    message.error('应用 ID 无效')
    goBack()
    return
  }
  appId.value = id

  if (!loginUserStore.loginUser.id) {
    await loginUserStore.fetchLoginUser()
  }

  loading.value = true
  try {
    const res = await getAppVoById({ id })
    if (res.data.code !== 0 || !res.data.data) {
      message.error('获取应用失败，' + res.data.message)
      goBack()
      return
    }
    const app = res.data.data
    if (!isAdmin.value && app.userId !== loginUserStore.loginUser.id) {
      message.error('无权限')
      goBack()
      return
    }
    fillForm(app)
  } finally {
    loading.value = false
  }
}

const handleSubmit = async () => {
  if (!appId.value) return
  if (!formState.appName.trim()) {
    message.error('请输入应用名称')
    return
  }

  submitting.value = true
  try {
    if (isAdmin.value) {
      const res = await updateAppByAdmin({
        id: appId.value,
        appName: formState.appName.trim(),
        cover: formState.cover.trim() || undefined,
        priority: formState.priority,
      })
      if (res.data.code === 0) {
        message.success('保存成功')
        goBack()
      } else {
        message.error('保存失败，' + res.data.message)
      }
    } else {
      const res = await updateApp({
        id: appId.value,
        appName: formState.appName.trim(),
        cover: formState.cover.trim() || undefined,
      })
      if (res.data.code === 0) {
        message.success('保存成功')
        goBack()
      } else {
        message.error('保存失败，' + res.data.message)
      }
    }
  } finally {
    submitting.value = false
  }
}

watch(
  routeAppId,
  (id) => {
    void loadApp(id)
  },
  { immediate: true },
)
</script>

<template>
  <div id="appEditPage">
    <a-card class="edit-card" :bordered="false" :loading="loading">
      <template #title>
        <div class="page-title">编辑应用信息</div>
      </template>

      <div class="section-title">基本信息</div>
      <div class="page-desc">
        {{
          isAdmin
            ? '可修改应用名称、封面与优先级；提示词、生成类型、部署密钥不可修改'
            : '可修改应用名称与封面；提示词、生成类型、部署密钥不可修改'
        }}
      </div>

      <a-form
        class="edit-form"
        layout="vertical"
        :model="formState"
        autocomplete="off"
        @finish="handleSubmit"
      >
        <a-form-item
          label="应用名称"
          name="appName"
          :rules="[{ required: true, message: '请输入应用名称' }]"
        >
          <a-input
            v-model:value="formState.appName"
            placeholder="请输入应用名称"
            :maxlength="50"
            show-count
            allow-clear
          />
        </a-form-item>

        <a-form-item label="封面" name="cover">
          <a-input
            v-model:value="formState.cover"
            placeholder="请输入封面图片 URL"
            allow-clear
          />
        </a-form-item>

        <a-form-item v-if="isAdmin" label="优先级" name="priority">
          <a-input-number v-model:value="formState.priority" :min="0" style="width: 160px" />
        </a-form-item>

        <a-form-item label="初始提示词">
          <a-textarea
            :value="formState.initPrompt"
            :rows="4"
            :maxlength="1000"
            show-count
            disabled
          />
          <div class="field-hint">初始提示词不可修改</div>
        </a-form-item>

        <a-form-item label="生成类型">
          <a-input :value="codeGenTypeLabel" disabled />
          <div class="field-hint">生成类型不可修改</div>
        </a-form-item>

        <a-form-item label="部署密钥">
          <a-input :value="formState.deployKey || '-'" disabled />
          <div class="field-hint">部署密钥不可修改</div>
        </a-form-item>

        <a-form-item>
          <a-space>
            <a-button type="primary" html-type="submit" :loading="submitting">保存</a-button>
            <a-button @click="goBack">取消</a-button>
          </a-space>
        </a-form-item>
      </a-form>
    </a-card>
  </div>
</template>

<style scoped>
#appEditPage {
  width: 100%;
}

.edit-card {
  max-width: 720px;
  margin: 0 auto;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.page-title {
  font-size: 18px;
  font-weight: 600;
}

.section-title {
  margin-bottom: 8px;
  color: rgba(0, 0, 0, 0.88);
  font-size: 16px;
  font-weight: 600;
}

.page-desc {
  margin-bottom: 20px;
  color: rgba(0, 0, 0, 0.45);
  font-size: 14px;
}

.field-hint {
  margin-top: 6px;
  color: rgba(0, 0, 0, 0.45);
  font-size: 13px;
  line-height: 1.4;
}
</style>
