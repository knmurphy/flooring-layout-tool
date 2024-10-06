<template>
  <div class="home-page">
    <el-row justify="center" align="middle" class="full-height">
      <el-col :xs="24" :sm="20" :md="16" :lg="12" :xl="8">
        <h1 class="home-title">Welcome to the Flooring Layout Tool</h1>
        <el-upload
          class="upload-demo"
          drag
          action="#"
          :auto-upload="false"
          :on-change="handleFileSelect"
          accept="application/pdf"
        >
          <el-icon class="el-icon--upload"><upload-filled /></el-icon>
          <div class="el-upload__text">
            Drop PDF file here or <em>click to upload</em>
          </div>
        </el-upload>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import { useRouter } from 'vue-router'
import { UploadFilled } from '@element-plus/icons-vue'
import { openDB } from 'idb'
import { ElMessage } from 'element-plus'

export default {
  name: 'HomePage',
  components: { UploadFilled },
  setup() {
    const router = useRouter()

    const handleFileSelect = async (file) => {
      if (file.raw) {
        const fileId = Date.now().toString();
        try {
          const db = await openDB('PDFStorage', 1, {
            upgrade(db) {
              db.createObjectStore('pdfs');
            },
          });
          await db.put('pdfs', file.raw, fileId);
          localStorage.setItem(`pdf_${fileId}`, file.raw.name); // Store only the filename
          router.push({ name: 'DrawingWorkspaceWithFile', params: { fileId } });
        } catch (error) {
          console.error('Error storing PDF:', error);
          ElMessage.error('Failed to store the PDF. Please try a smaller file.');
        }
      }
    }

    return {
      handleFileSelect
    }
  }
}
</script>

<style scoped>
.home-page {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.home-title {
  text-align: center;
  margin-bottom: 2rem;
  font-size: 2rem;
}

.upload-demo {
  width: 100%;
}

:deep(.el-upload-dragger) {
  width: 100%;
  height: 200px;
}

:deep(.el-icon--upload) {
  font-size: 48px;
  margin-bottom: 16px;
}

:deep(.el-upload__text) {
  font-size: 16px;
}
</style>
