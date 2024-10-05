<template>
  <el-container class="layout-container">
    <el-header>
      <el-menu mode="horizontal" router>
        <el-menu-item index="/">Home</el-menu-item>
        <el-menu-item index="/drawing-workspace">Drawing Workspace</el-menu-item>
      </el-menu>
      <el-switch v-model="isDarkMode" active-text="Dark" inactive-text="Light" @change="toggleTheme" />
    </el-header>
    <el-main>
      <slot></slot>
    </el-main>
  </el-container>
</template>

<script>
import { defineComponent } from 'vue'
import { useTheme } from '../composables/theme'

export default defineComponent({
  name: 'MainLayout',
  setup() {
    const { isDarkMode, toggleTheme } = useTheme()

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
