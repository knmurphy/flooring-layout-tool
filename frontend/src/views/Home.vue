<template>
  <div class="home-page">
    <h1>Welcome to the Flooring Layout Tool</h1>
    <v-file-input
      v-model="selectedFile"
      label="Select PDF Floor Plan"
      accept="application/pdf"
      @change="handleFileSelect"
    ></v-file-input>
  </div>
</template>

<script>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

export default {
  name: 'HomePage',  // Changed from 'Home' to 'HomePage'
  setup() {
    const router = useRouter();
    const selectedFile = ref(null);

    const handleFileSelect = async () => {
      if (selectedFile.value) {
        const fileId = Date.now().toString();
        // Store the file in localStorage (you might want to use a more robust solution for larger files)
        localStorage.setItem(`pdf_${fileId}`, await fileToBase64(selectedFile.value));
        router.push({ name: 'DrawingWorkspace', params: { fileId } });
      }
    };

    const fileToBase64 = (file) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
      });
    };

    return {
      selectedFile,
      handleFileSelect
    };
  }
}
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
