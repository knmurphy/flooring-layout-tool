<template>
  <el-config-provider :locale="locale" :size="size" :z-index="zIndex" :namespace="namespace">
    <MainLayout>
      <router-view></router-view>
    </MainLayout>
  </el-config-provider>
</template>

<script>
import { defineComponent } from 'vue'
import MainLayout from './layouts/MainLayout.vue'

export default defineComponent({
  name: 'App',
  components: {
    MainLayout
  }
})
</script>

<style>
body.dark-mode {
  background-color: #1c1c1c;
  color: #ffffff;
}
</style>