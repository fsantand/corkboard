<script setup>
import { ref, computed } from 'vue'

const emit = defineEmits(['confirm', 'cancel'])

const activeTab = ref('file')
const urlInput = ref('')
const filePreview = ref(null)

const canConfirm = computed(() => {
  if (activeTab.value === 'file') return !!filePreview.value
  return urlInput.value.trim().length > 0
})

function onFileChange(e) {
  const file = e.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (ev) => {
    filePreview.value = ev.target.result
  }
  reader.readAsDataURL(file)
}

function onConfirm() {
  if (!canConfirm.value) return
  const src = activeTab.value === 'file' ? filePreview.value : urlInput.value.trim()
  emit('confirm', src)
}

function onKeydown(e) {
  if (e.key === 'Escape') emit('cancel')
}
</script>

<template>
  <div class="modal-overlay" @click.self="emit('cancel')" @keydown="onKeydown" tabindex="-1">
    <div class="modal">
      <h2 class="modal-title">Add Photo</h2>

      <div class="tabs">
        <button :class="['tab', { active: activeTab === 'file' }]" @click="activeTab = 'file'">
          Upload File
        </button>
        <button :class="['tab', { active: activeTab === 'url' }]" @click="activeTab = 'url'">
          From URL
        </button>
      </div>

      <div v-if="activeTab === 'file'" class="tab-content">
        <input type="file" accept="image/*" @change="onFileChange" />
        <div v-if="filePreview" class="preview-wrap">
          <img :src="filePreview" alt="preview" class="preview" />
        </div>
      </div>

      <div v-if="activeTab === 'url'" class="tab-content">
        <input
          type="text"
          v-model="urlInput"
          placeholder="https://example.com/image.jpg"
          class="url-input"
        />
        <div v-if="urlInput.trim()" class="preview-wrap">
          <img :src="urlInput.trim()" alt="preview" class="preview" />
        </div>
      </div>

      <div class="actions">
        <button class="btn btn-primary" :disabled="!canConfirm" @click="onConfirm">
          Add Photo
        </button>
        <button class="btn btn-secondary" @click="emit('cancel')">Cancel</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.modal {
  background: #fafafa;
  border-radius: 8px;
  padding: 24px;
  width: 360px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.modal-title {
  font-size: 18px;
  font-weight: 700;
  color: #2c3e50;
  margin: 0;
}

.tabs {
  display: flex;
  border-bottom: 2px solid #ddd;
}

.tab {
  flex: 1;
  padding: 8px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  color: #888;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  transition: color 0.15s, border-color 0.15s;
}

.tab.active {
  color: #2c3e50;
  border-bottom-color: #2c3e50;
}

.tab-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 80px;
}

.url-input {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 13px;
  outline: none;
  box-sizing: border-box;
}

.url-input:focus {
  border-color: #2c3e50;
}

.preview-wrap {
  width: 100%;
  max-height: 180px;
  overflow: hidden;
  border-radius: 4px;
  background: #eee;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview {
  max-width: 100%;
  max-height: 180px;
  object-fit: contain;
}

.actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-primary {
  background: #2c3e50;
  color: #fff;
}

.btn-primary:hover:not(:disabled) {
  background: #3d556b;
}

.btn-primary:disabled {
  background: #aaa;
  cursor: not-allowed;
}

.btn-secondary {
  background: #eee;
  color: #333;
}

.btn-secondary:hover {
  background: #ddd;
}
</style>
