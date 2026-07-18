<template>
  <div id="userProfilePage">
    <a-card class="profile-card" :bordered="false">
      <template #title>
        <div class="page-title">个人中心</div>
      </template>
      <div class="page-desc">编辑你的基本信息，保存后会同步到右上角展示</div>

      <a-form
        class="profile-form"
        :model="formState"
        :label-col="{ span: 4 }"
        :wrapper-col="{ span: 16 }"
        autocomplete="off"
        @finish="handleSubmit"
      >
        <a-form-item label="账号">
          <a-input :value="loginUserStore.loginUser.userAccount" disabled />
        </a-form-item>

        <a-form-item
          label="用户名"
          name="userName"
          :rules="[{ required: true, message: '请输入用户名' }]"
        >
          <a-input v-model:value="formState.userName" placeholder="请输入用户名" allow-clear />
        </a-form-item>

        <a-form-item label="头像" name="userAvatar">
          <div class="avatar-field">
            <a-avatar :src="formState.userAvatar" :size="64">
              {{ formState.userName?.[0] ?? 'U' }}
            </a-avatar>
            <a-input
              v-model:value="formState.userAvatar"
              placeholder="请输入头像图片 URL"
              allow-clear
            />
          </div>
        </a-form-item>

        <a-form-item label="简介" name="userProfile">
          <a-textarea
            v-model:value="formState.userProfile"
            placeholder="介绍一下自己吧"
            :rows="4"
            :maxlength="200"
            show-count
            allow-clear
          />
        </a-form-item>

        <a-form-item :wrapper-col="{ offset: 4, span: 16 }">
          <a-space>
            <a-button type="primary" html-type="submit" :loading="submitting">保存</a-button>
            <a-button @click="resetForm">重置</a-button>
          </a-space>
        </a-form-item>
      </a-form>
    </a-card>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, reactive, ref } from 'vue'
import { message } from 'ant-design-vue'
import { updateMyUser } from '@/api/userController.ts'
import { useLoginUserStore } from '@/stores/loginUser.ts'

const loginUserStore = useLoginUserStore()
const submitting = ref(false)

const formState = reactive<API.UserUpdateMyRequest>({
  userName: '',
  userAvatar: '',
  userProfile: '',
})

const fillForm = () => {
  const user = loginUserStore.loginUser
  formState.userName = user.userName ?? ''
  formState.userAvatar = user.userAvatar ?? ''
  formState.userProfile = user.userProfile ?? ''
}

const resetForm = () => {
  fillForm()
}

/**
 * 提交表单
 */
const handleSubmit = async () => {
  if (!loginUserStore.loginUser.id) {
    message.error('请先登录')
    return
  }
  submitting.value = true
  try {
    const res = await updateMyUser({
      userName: formState.userName,
      userAvatar: formState.userAvatar,
      userProfile: formState.userProfile,
    })
    if (res.data.code === 0) {
      await loginUserStore.fetchLoginUser()
      fillForm()
      message.success('保存成功')
    } else {
      message.error('保存失败，' + res.data.message)
    }
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  if (!loginUserStore.loginUser.id) {
    await loginUserStore.fetchLoginUser()
  }
  fillForm()
})
</script>

<style scoped>
#userProfilePage {
  width: 100%;
}

.profile-card {
  max-width: 720px;
  margin: 0 auto;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.page-title {
  font-size: 18px;
  font-weight: 600;
}

.page-desc {
  margin: -8px 0 24px;
  color: rgba(0, 0, 0, 0.45);
  font-size: 14px;
}

.avatar-field {
  display: flex;
  align-items: center;
  gap: 16px;
}

@media (max-width: 768px) {
  .profile-form :deep(.ant-form-item-label) {
    padding-bottom: 4px;
  }

  .avatar-field {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
