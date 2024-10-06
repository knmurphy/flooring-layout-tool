import { ref, watch } from 'vue'

export function useTheme() {
  const isDarkMode = ref(false) // Set to false for light theme by default

  const toggleTheme = () => {
    isDarkMode.value = !isDarkMode.value
    applyTheme()
  }

  const applyTheme = () => {
    if (isDarkMode.value) {
      document.documentElement.classList.add('dark')
      document.body.setAttribute('data-theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      document.body.removeAttribute('data-theme')
    }
  }

  // Apply theme on initial load
  watch(isDarkMode, applyTheme, { immediate: true })

  return {
    isDarkMode,
    toggleTheme,
    applyTheme
  }
}
