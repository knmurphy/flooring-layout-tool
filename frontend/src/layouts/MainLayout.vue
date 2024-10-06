<template>
  <el-container class="layout-container">
    <el-header>
      <!-- Header content -->
    </el-header>
    <el-main style="padding: 0; height: calc(100vh - 60px);">
      <slot></slot>
    </el-main>
  </el-container>
</template>

<script>
import { defineComponent, onMounted } from 'vue'
import { useTheme } from '../composables/theme'

export default defineComponent({
  name: 'MainLayout',
  setup() {
    const { isDarkMode, toggleTheme, applyTheme } = useTheme()

    onMounted(() => {
      applyTheme() // Apply theme on component mount
    })

    return {
      isDarkMode,
      toggleTheme
    }
  }
})
</script>

<style scoped>
.layout-container {
  height: 100vh;
}
</style>
