<template>
  <el-config-provider :namespace="namespace">
    <MainLayout>
      <router-view></router-view>
    </MainLayout>
  </el-config-provider>
</template>

<script>
import { defineComponent, computed } from 'vue'
import { useTheme } from './composables/theme'
import MainLayout from './layouts/MainLayout.vue'

export default defineComponent({
  name: 'App',
  components: {
    MainLayout
  },
  setup() {
    const { isDarkMode } = useTheme()
    const namespace = computed(() => isDarkMode.value ? 'ep' : undefined)

    return {
      namespace
    }
  }
})
</script>

<style>
/* Your global styles here */
</style>