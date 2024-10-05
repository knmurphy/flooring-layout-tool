<template>
  <div class="workspace" :class="{ 'dark-mode': isDarkMode }">
    <h2>Drawing Workspace</h2>
    <FloorPlan @toggle-dark-mode="toggleDarkMode" />
  </div>
</template>

<script>
import { ref } from 'vue';
import FloorPlan from '../components/FloorPlan.vue';

export default {
  name: 'DrawingWorkspace',
  components: {
    FloorPlan,
  },
  setup() {
    const isDarkMode = ref(true); // Start in dark mode by default

    const toggleDarkMode = () => {
      isDarkMode.value = !isDarkMode.value;
    };

    return { isDarkMode, toggleDarkMode };
  },
};
</script>

<style scoped>
.workspace {
  padding: 20px;
  height: calc(100vh - 40px);
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
  color: #000000;
  transition: background-color 0.3s, color 0.3s;
}

.workspace.dark-mode {
  background-color: #2c2c2c;
  color: #ffffff;
}

h2 {
  margin-bottom: 20px;
}
</style>
