<template>
  <div class="app-wrapper">
    <NavBar />
    <router-view v-slot="{ Component }">
      <component :is="Component" class="page-root" />
    </router-view>
  </div>
</template>

<script lang="ts" setup>
import NavBar from '@/components/NavBar.vue'
</script>

<style scoped>
.app-wrapper {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
}

.page-root {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}
</style>
