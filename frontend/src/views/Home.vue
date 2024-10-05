<template>
  <div class="home">
    <h1>Welcome to the Flooring Layout Tool</h1>
    <button @click="openFileInput" class="load-pdf-btn">Load plans to draw on</button>
    <input 
      type="file" 
      ref="fileInput" 
      @change="handleFileSelect" 
      accept="application/pdf" 
      style="display: none;"
    >
  </div>
</template>

<script>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

export default {
  name: 'HomePage',
  setup() {
    const router = useRouter();
    const fileInput = ref(null);

    const openFileInput = () => {
      fileInput.value.click();
    };

    const handleFileSelect = (event) => {
      const file = event.target.files[0];
      if (file && file.type === 'application/pdf') {
        // Navigate to drawing workspace with the selected file
        router.push({ 
          name: 'DrawingWorkspace', 
          params: { fileId: Date.now().toString() },
          state: { file }
        });
      } else {
        alert('Please select a valid PDF file.');
      }
    };

    return {
      fileInput,
      openFileInput,
      handleFileSelect
    };
  }
};
</script>

<style scoped>
.home {
  text-align: center;
  margin-top: 50px;
}

.load-pdf-btn {
  padding: 10px 20px;
  font-size: 16px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.load-pdf-btn:hover {
  background-color: #45a049;
}
</style>
