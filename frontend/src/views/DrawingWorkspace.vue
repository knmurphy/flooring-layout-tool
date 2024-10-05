<template>
  <div class="workspace">
    <h2>Drawing Workspace</h2>
    <FloorPlan ref="floorPlan" />
    <div class="toolbar">
      <button @click="openFileInput" class="toolbar-btn">Load PDF</button>
      <input 
        type="file" 
        ref="fileInput" 
        @change="handleFileSelect" 
        accept="application/pdf" 
        style="display: none;"
      >
      <!-- Add other toolbar buttons here -->
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import FloorPlan from '../components/FloorPlan.vue';

export default {
  name: 'DrawingWorkspace',
  components: {
    FloorPlan,
  },
  setup() {
    const route = useRoute();
    const fileInput = ref(null);
    const floorPlan = ref(null);

    const openFileInput = () => {
      fileInput.value.click();
    };

    const handleFileSelect = (event) => {
      const file = event.target.files[0];
      if (file && file.type === 'application/pdf') {
        loadPDF(file);
      } else {
        alert('Please select a valid PDF file.');
      }
    };

    const loadPDF = (file) => {
      // We'll implement PDF loading logic here in the next step
      console.log('Loading PDF:', file.name);
      // For now, just pass the file to the FloorPlan component
      floorPlan.value.setPDFBackground(file);
    };

    onMounted(() => {
      // Check if a file was passed from the HomePage
      if (route.params.fileId && route.state && route.state.file) {
        loadPDF(route.state.file);
      }
    });

    return {
      fileInput,
      floorPlan,
      openFileInput,
      handleFileSelect,
    };
  },
};
</script>

<style scoped>
.workspace {
  padding: 20px;
  height: calc(100vh - 40px);
  display: flex;
  flex-direction: column;
}

h2 {
  margin-bottom: 20px;
}

.toolbar {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 10px;
}

.toolbar-btn {
  padding: 10px 20px;
  font-size: 14px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.toolbar-btn:hover {
  background-color: #45a049;
}
</style>

