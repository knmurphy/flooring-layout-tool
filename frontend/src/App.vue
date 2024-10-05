<template>
  <v-app :theme="theme">
    <!-- Your app content -->
    <router-view></router-view>
  </v-app>
</template>

<script>
import { ref, watch } from 'vue'

export default {
  setup() {
    const theme = ref('light')

    watch(() => localStorage.getItem('darkMode'), (newValue) => {
      theme.value = newValue === 'true' ? 'dark' : 'light'
    })

    return { theme }
  }
}
</script>

<style scoped>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}
</style>