<script setup lang="ts">
const diaryEntries = [
  '如果一个侮辱能让你崩溃，一个赞美能让你膨胀，你就是任何开口之人的奴隶',
  '之所以事与愿违，只是因为能力不够',
]
</script>

<template>
  <div class="about-view">
    <a-card class="about-card">
      <div class="author-section">
        <h1 class="author-name">Zayne</h1>
      </div>

      <a-divider />

      <div class="diary-section">
        <h2 class="diary-title">Diary</h2>
        <div v-for="(entry, index) in diaryEntries" :key="index" class="diary-entry">
          <span class="entry-index">{{ index + 1 }}</span>
          <p class="entry-text">{{ entry }}</p>
        </div>
      </div>
    </a-card>
  </div>
</template>

<style scoped>
.about-view {
  width: 100%;
}

.about-card {
  border-radius: 8px;
}

.author-section {
  text-align: center;
}

.author-name {
  margin: 0;
  font-size: 32px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.88);
}

.diary-title {
  margin: 0 0 24px;
  font-size: 20px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.88);
}

.diary-entry {
  display: flex;
  gap: 16px;
  padding: 20px;
  margin-bottom: 16px;
  background: #fafafa;
  border-radius: 8px;
  border-left: 3px solid #1677ff;
}

.diary-entry:last-child {
  margin-bottom: 0;
}

.entry-index {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  line-height: 28px;
  text-align: center;
  font-size: 14px;
  font-weight: 600;
  color: #1677ff;
  background: #e6f4ff;
  border-radius: 50%;
}

.entry-text {
  margin: 0;
  line-height: 1.8;
  font-size: 16px;
  color: rgba(0, 0, 0, 0.75);
}
</style>
