<script setup>
import { ref } from 'vue'
import { useCorkboardStore } from '@/stores/corkboard'
import AddPhotoModal from './AddPhotoModal.vue'

const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['close'])

const store = useCorkboardStore()
const showPhotoModal = ref(false)

function onPhotoConfirm(src) {
  store.updateItem(props.item.id, { photoSrc: src })
  showPhotoModal.value = false
}
</script>

<template>
  <div class="card-content" @pointerdown.stop>
    <input
      class="card-title"
      :value="item.title"
      @input="store.updateItem(item.id, { title: $event.target.value })"
      placeholder="Title..."
    />

    <textarea
      class="card-description"
      :value="item.description"
      @input="store.updateItem(item.id, { description: $event.target.value })"
      placeholder="Add a description..."
    />

    <div class="card-photo" v-if="item.photoSrc">
      <img :src="item.photoSrc" draggable="false" />
    </div>

    <div class="card-photo-actions">
      <button class="add-photo-btn" @click="showPhotoModal = true">
        {{ item.photoSrc ? '↺ Change Photo' : '+ Add Photo' }}
      </button>
    </div>

    <button class="close-btn" @click="emit('close')" title="Collapse">Collapse</button>

    <AddPhotoModal
      v-if="showPhotoModal"
      @confirm="onPhotoConfirm"
      @cancel="showPhotoModal = false"
    />
  </div>
</template>

<style scoped>
.card-content {
  width: 220px;
  background: #faf8f4;
  border-radius: 2px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  box-shadow: inset 0 0 4px rgba(0, 0, 0, 0.06);
}

.card-title {
  width: 100%;
  border: none;
  border-bottom: 1px solid #ddd;
  background: transparent;
  font-size: 14px;
  font-weight: 700;
  color: #2c2c2c;
  padding: 2px 0 4px;
  outline: none;
  box-sizing: border-box;
  cursor: text;
}

.card-title::placeholder {
  color: #bbb;
  font-weight: 400;
}

.card-description {
  width: 100%;
  min-height: 80px;
  border: none;
  background: transparent;
  resize: vertical;
  font-family: 'Segoe UI', sans-serif;
  font-size: 12px;
  line-height: 1.5;
  color: #444;
  outline: none;
  cursor: text;
  box-sizing: border-box;
}

.card-description::placeholder {
  color: #bbb;
}

.card-photo img {
  display: block;
  width: 100%;
  height: auto;
  max-height: 180px;
  object-fit: cover;
  border-radius: 2px;
  border: 1px solid #e0dbd0;
}

.card-photo-actions {
  display: flex;
}

.add-photo-btn {
  border: none;
  background: none;
  color: #7a6e5a;
  font-size: 11px;
  cursor: pointer;
  padding: 2px 0;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.add-photo-btn:hover {
  color: #3d3020;
}

.close-btn {
  border: none;
  background: none;
  color: #aaa;
  font-size: 11px;
  cursor: pointer;
  padding: 4px 0 0;
  text-align: center;
  width: 100%;
  border-top: 1px solid #e8e2d8;
  transition: color 0.15s;
}

.close-btn:hover {
  color: #555;
}
</style>
