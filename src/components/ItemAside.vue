<script setup>
import { ref, watch, nextTick } from 'vue'
import { useCorkboardStore } from '@/stores/corkboard'
import AddPhotoModal from './AddPhotoModal.vue'

const props = defineProps({
  item: {
    type: Object,
    default: null,
  },
})

const store = useCorkboardStore()
const collapsed = ref(false)
const showPhotoModal = ref(false)
const titleInputRef = ref(null)

watch(
  () => props.item?.id,
  (newId) => {
    if (newId && !props.item.title) {
      nextTick(() => titleInputRef.value?.focus())
    }
  },
)

function onPhotoConfirm(src) {
  store.updateItem(props.item.id, { photoSrc: src })
  showPhotoModal.value = false
}
</script>

<template>
  <aside class="item-aside" :class="{ collapsed }">
    <button
      class="aside-toggle"
      @click="collapsed = !collapsed"
      :title="collapsed ? 'Show details' : 'Hide details'"
    >
      {{ collapsed ? '❮' : '❯' }}
    </button>

    <div class="aside-body">
      <template v-if="item">
        <div class="aside-photo">
          <img v-if="item.photoSrc" :src="item.photoSrc" draggable="false" />
          <div v-else class="aside-photo-blank" />
        </div>

        <div class="aside-fields">
          <input
            ref="titleInputRef"
            class="aside-title"
            :value="item.title"
            @input="store.updateItem(item.id, { title: $event.target.value })"
            placeholder="Title..."
          />

          <div class="category-picker">
            <button
              v-for="cat in store.categories"
              :key="cat.id"
              class="cat-btn"
              :class="{ active: item.category === cat.id }"
              :style="{ '--cat-primary': cat.colorPrimary, '--cat-secondary': cat.colorSecondary }"
              @click="store.updateItem(item.id, { category: item.category === cat.id ? null : cat.id })"
            >
              {{ cat.icon }} {{ cat.label }}
            </button>
          </div>

          <textarea
            class="aside-description"
            :value="item.description"
            @input="store.updateItem(item.id, { description: $event.target.value })"
            placeholder="Add a description..."
          />

          <div class="photo-actions">
            <button class="add-photo-btn" @click="showPhotoModal = true">
              {{ item.photoSrc ? '↺ Change Photo' : '+ Add Photo' }}
            </button>
            <button
              v-if="item.photoSrc"
              class="remove-photo-btn"
              @click="store.updateItem(item.id, { photoSrc: null })"
            >
              ✕ Remove Photo
            </button>
          </div>
        </div>
      </template>

      <div v-else class="aside-empty">Hover or click a card to view its details</div>
    </div>

    <AddPhotoModal
      v-if="showPhotoModal"
      @confirm="onPhotoConfirm"
      @cancel="showPhotoModal = false"
    />
  </aside>
</template>

<style scoped>
.item-aside {
  position: fixed;
  right: 0;
  top: 0;
  bottom: 0;
  width: 30vw;
  background: #f5f0e8;
  border-left: 1px solid #d4c9b0;
  box-shadow: -4px 0 20px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: row;
  transition: width 0.25s ease;
  z-index: 2000;
  overflow: hidden;
}

.item-aside.collapsed {
  width: 32px;
}

.aside-toggle {
  flex-shrink: 0;
  width: 32px;
  border: none;
  background: #ece6d8;
  border-right: 1px solid #d4c9b0;
  cursor: pointer;
  font-size: 14px;
  color: #7a6e5a;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s, color 0.15s;
}

.aside-toggle:hover {
  background: #e0d8c8;
  color: #3d3020;
}

.aside-body {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.aside-photo {
  width: 100%;
  height: 180px;
  flex-shrink: 0;
  overflow: hidden;
  background: #e8e4dc;
}

.aside-photo img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.aside-photo-blank {
  width: 100%;
  height: 100%;
  background-image: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 8px,
    rgba(0, 0, 0, 0.03) 8px,
    rgba(0, 0, 0, 0.03) 9px
  );
}

.aside-fields {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.aside-title {
  width: 100%;
  border: none;
  border-bottom: 1px solid #ddd;
  background: transparent;
  font-size: 15px;
  font-weight: 700;
  color: #2c2c2c;
  padding: 2px 0 6px;
  outline: none;
  box-sizing: border-box;
  font-family: 'Permanent Marker', cursive;
}

.aside-title::placeholder {
  color: #bbb;
  font-weight: 400;
  font-family: 'Segoe UI', sans-serif;
}

.aside-description {
  width: 100%;
  min-height: 120px;
  border: 1px solid #e0d8c8;
  background: #fff;
  border-radius: 3px;
  resize: vertical;
  font-family: 'Segoe UI', sans-serif;
  font-size: 13px;
  line-height: 1.6;
  color: #444;
  outline: none;
  padding: 8px;
  box-sizing: border-box;
  transition: border-color 0.15s;
}

.aside-description:focus {
  border-color: #c0a880;
}

.aside-description::placeholder {
  color: #bbb;
}

.photo-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.add-photo-btn,
.remove-photo-btn {
  border: none;
  background: none;
  font-size: 12px;
  cursor: pointer;
  padding: 2px 0;
  text-decoration: underline;
  text-underline-offset: 2px;
  text-align: left;
}

.add-photo-btn {
  color: #7a6e5a;
}

.add-photo-btn:hover {
  color: #3d3020;
}

.remove-photo-btn {
  color: #b0392b;
}

.remove-photo-btn:hover {
  color: #e74c3c;
}

.aside-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: #b0a898;
  font-size: 13px;
  padding: 24px;
  line-height: 1.6;
}

.category-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.cat-btn {
  flex: 1;
  min-width: 60px;
  border: 2px solid transparent;
  border-radius: 20px;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  background: #e0d8c8;
  color: #7a6e5a;
  transition:
    background 0.15s,
    color 0.15s,
    border-color 0.15s;
}

.cat-btn:hover {
  opacity: 0.85;
}

.cat-btn.active {
  background: var(--cat-secondary);
  color: #fff;
  border-color: var(--cat-secondary);
}
</style>
