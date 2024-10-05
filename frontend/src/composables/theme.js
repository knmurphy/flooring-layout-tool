import { ref, watch } from 'vue'

export function useTheme() {
  const isDarkMode = ref(true)

  const toggleTheme = () => {
    isDarkMode.value = !isDarkMode.value
    applyTheme()
  }

  const applyTheme = () => {
    document.body.classList.toggle('dark-mode', isDarkMode.value)
  }

  watch(isDarkMode, applyTheme, { immediate: true })

  return {
    isDarkMode,
    toggleTheme
  }
}
