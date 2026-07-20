import { defineStore } from 'pinia'
import { reactive, ref } from 'vue'
import { message } from 'ant-design-vue'
import { listGoodAppVoByPage, listMyAppVoByPage } from '@/api/appController.ts'

export const useAppListStore = defineStore('appList', () => {
  const myApps = ref<API.AppVO[]>([])
  const myTotal = ref(0)
  const myLoading = ref(false)
  const myQuery = reactive<API.AppQueryRequest>({
    pageNum: 1,
    pageSize: 20,
    appName: undefined,
  })

  const goodApps = ref<API.AppVO[]>([])
  const goodTotal = ref(0)
  const goodLoading = ref(false)
  const goodQuery = reactive<API.AppQueryRequest>({
    pageNum: 1,
    pageSize: 20,
    appName: undefined,
  })

  async function fetchMyApps() {
    myLoading.value = true
    try {
      const res = await listMyAppVoByPage({ ...myQuery, pageSize: Math.min(myQuery.pageSize ?? 20, 20) })
      if (res.data.code === 0 && res.data.data) {
        myApps.value = res.data.data.records ?? []
        myTotal.value = res.data.data.totalRow ?? 0
      } else {
        message.error('获取我的作品失败，' + res.data.message)
      }
    } finally {
      myLoading.value = false
    }
  }

  async function fetchGoodApps() {
    goodLoading.value = true
    try {
      const res = await listGoodAppVoByPage({
        ...goodQuery,
        pageSize: Math.min(goodQuery.pageSize ?? 20, 20),
      })
      if (res.data.code === 0 && res.data.data) {
        goodApps.value = res.data.data.records ?? []
        goodTotal.value = res.data.data.totalRow ?? 0
      } else {
        message.error('获取精选案例失败，' + res.data.message)
      }
    } finally {
      goodLoading.value = false
    }
  }

  return {
    myApps,
    myTotal,
    myLoading,
    myQuery,
    goodApps,
    goodTotal,
    goodLoading,
    goodQuery,
    fetchMyApps,
    fetchGoodApps,
  }
})
