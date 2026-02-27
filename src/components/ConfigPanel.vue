<script setup>
import { ref } from 'vue'
import { useCorkboardStore } from '@/stores/corkboard'
import EmojiPicker from './EmojiPicker.vue'

defineProps({
  open: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['close'])

const store = useCorkboardStore()
const editingId = ref(null)
const emojiPickerForId = ref(null)

function startEdit(id) {
  editingId.value = id
  emojiPickerForId.value = null
}

function doneEdit() {
  editingId.value = null
  emojiPickerForId.value = null
}

function onAddCategory() {
  const id = store.addCategory()
  editingId.value = id
}

function onDeleteCategory(id) {
  if (editingId.value === id) editingId.value = null
  store.deleteCategory(id)
}

function onBgFileChange(e) {
  const file = e.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (ev) => {
    store.setBackground({ imageUrl: ev.target.result, type: 'image' })
  }
  reader.readAsDataURL(file)
}

function onBgUrlChange(e) {
  const url = e.target.value.trim()
  if (url) store.setBackground({ imageUrl: url, type: 'image' })
}

async function fetchAsDataURL(src) {
  const response = await fetch(src)
  const blob = await response.blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

function importBoard() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json,application/json'
  input.onchange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result)
        store.importBoard(data)
      } catch {
        alert('Invalid corkboard file.')
      }
    }
    reader.readAsText(file)
  }
  input.click()
}

function onClearBoard() {
  if (window.confirm('Clear all cards and connections? This cannot be undone.')) {
    store.clearBoard()
  }
}

async function exportBoard() {
  const items = await Promise.all(
    store.items.map(async (item) => {
      if (item.photoSrc && /^https?:\/\//.test(item.photoSrc)) {
        try {
          return { ...item, photoSrc: await fetchAsDataURL(item.photoSrc) }
        } catch {
          return item
        }
      }
      return item
    }),
  )

  const data = JSON.stringify(
    {
      items,
      connections: store.connections,
      categories: store.categories,
      background: store.background,
    },
    null,
    2,
  )
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'corkboard-export.json'
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div class="config-backdrop" :class="{ open }" @click.self="emit('close')" />

  <aside class="config-panel" :class="{ open }">
    <div class="panel-header">
      <span class="panel-title">⚙ Settings</span>
      <button class="close-btn" @click="emit('close')">✕</button>
    </div>

    <div class="panel-body">
      <!-- Background section -->
      <section class="panel-section">
        <h3 class="section-title">Background</h3>

        <div class="radio-group">
          <label class="radio-label">
            <input
              type="radio"
              name="bg-type"
              value="cork"
              :checked="store.background.type === 'cork'"
              @change="store.setBackground({ type: 'cork' })"
            />
            Cork texture
          </label>
          <label class="radio-label">
            <input
              type="radio"
              name="bg-type"
              value="color"
              :checked="store.background.type === 'color'"
              @change="store.setBackground({ type: 'color' })"
            />
            Solid color
          </label>
          <label class="radio-label">
            <input
              type="radio"
              name="bg-type"
              value="image"
              :checked="store.background.type === 'image'"
              @change="store.setBackground({ type: 'image' })"
            />
            Image
          </label>
        </div>

        <div v-if="store.background.type === 'color'" class="bg-color-row">
          <label class="field-label">Color</label>
          <input
            type="color"
            :value="store.background.color"
            @input="store.setBackground({ color: $event.target.value })"
          />
        </div>

        <div v-if="store.background.type === 'image'" class="bg-image-fields">
          <label class="field-label">Upload file</label>
          <input type="file" accept="image/*" @change="onBgFileChange" />
          <label class="field-label" style="margin-top: 8px">Or enter URL</label>
          <input
            type="text"
            class="text-input"
            placeholder="https://..."
            :value="store.background.type === 'image' ? store.background.imageUrl ?? '' : ''"
            @change="onBgUrlChange"
          />
        </div>

        <div class="brightness-row">
          <label class="field-label">Brightness</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            :value="store.background.brightness"
            @input="store.setBackground({ brightness: parseFloat($event.target.value) })"
          />
        </div>
      </section>

      <!-- Categories section -->
      <section class="panel-section">
        <h3 class="section-title">Categories</h3>

        <div class="category-list">
          <div v-for="cat in store.categories" :key="cat.id" class="category-row">
            <!-- View mode -->
            <template v-if="editingId !== cat.id">
              <span class="cat-icon">{{ cat.icon }}</span>
              <span class="cat-label">{{ cat.label || '(unnamed)' }}</span>
              <span class="cat-swatch" :style="{ background: cat.colorPrimary }" />
              <span class="cat-swatch" :style="{ background: cat.colorSecondary }" />
              <button class="icon-btn" title="Edit" @click="startEdit(cat.id)">✎</button>
              <button class="icon-btn icon-btn--danger" title="Delete" @click="onDeleteCategory(cat.id)">✕</button>
            </template>

            <!-- Edit mode -->
            <template v-else>
              <div class="cat-edit-row">
                <div class="emoji-wrap">
                  <button class="icon-edit-btn" @click="emojiPickerForId = emojiPickerForId === cat.id ? null : cat.id">
                    {{ cat.icon }}
                  </button>
                  <EmojiPicker
                    v-if="emojiPickerForId === cat.id"
                    @pick="(e) => store.updateCategory(cat.id, { icon: e })"
                    @close="emojiPickerForId = null"
                  />
                </div>
                <input
                  class="text-input cat-name-input"
                  :value="cat.label"
                  placeholder="Name..."
                  @input="store.updateCategory(cat.id, { label: $event.target.value })"
                />
                <input
                  type="color"
                  :value="cat.colorPrimary"
                  title="Primary color"
                  @input="store.updateCategory(cat.id, { colorPrimary: $event.target.value })"
                />
                <input
                  type="color"
                  :value="cat.colorSecondary"
                  title="Secondary color"
                  @input="store.updateCategory(cat.id, { colorSecondary: $event.target.value })"
                />
                <button class="icon-btn icon-btn--done" title="Done" @click="doneEdit">✓</button>
              </div>
            </template>
          </div>
        </div>

        <button class="add-cat-btn" @click="onAddCategory">+ Add Category</button>
      </section>

      <!-- Board data section -->
      <section class="panel-section">
        <h3 class="section-title">Board Data</h3>
        <div class="data-btns">
          <button class="btn" @click="importBoard">↑ Import</button>
          <button class="btn" @click="exportBoard">↓ Export</button>
        </div>
        <button class="btn btn--danger" @click="onClearBoard">✕ Clear Board</button>
      </section>
    </div>
  </aside>
</template>

<style scoped>
.config-backdrop {
  position: fixed;
  inset: 0;
  background: transparent;
  z-index: 9999;
  pointer-events: none;
}

.config-backdrop.open {
  pointer-events: auto;
}

.config-panel {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: 360px;
  background: #f5f0e8;
  border-right: 1px solid #d4c9b0;
  box-shadow: 4px 0 20px rgba(0, 0, 0, 0.2);
  z-index: 10000;
  display: flex;
  flex-direction: column;
  transform: translateX(-100%);
  transition: transform 0.25s ease;
}

.config-panel.open {
  transform: translateX(0);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 16px 12px;
  border-bottom: 1px solid #d4c9b0;
  flex-shrink: 0;
}

.panel-title {
  font-size: 15px;
  font-weight: 700;
  color: #2c2c2c;
  letter-spacing: 0.03em;
}

.close-btn {
  border: none;
  background: none;
  font-size: 16px;
  color: #7a6e5a;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 3px;
  transition: background 0.15s, color 0.15s;
}

.close-btn:hover {
  background: #e0d8c8;
  color: #3d3020;
}

.panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 0;
}

.panel-section {
  padding: 16px;
  border-bottom: 1px solid #e8e0d0;
}

.section-title {
  margin: 0 0 12px;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #9a8e7a;
}

/* Background */
.radio-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #4a4a4a;
  cursor: pointer;
}

.bg-color-row,
.bg-image-fields,
.brightness-row {
  margin-top: 10px;
}

.field-label {
  display: block;
  font-size: 11px;
  font-weight: 600;
  color: #9a8e7a;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 4px;
}

.text-input {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid #d4c9b0;
  border-radius: 3px;
  background: #fff;
  padding: 6px 8px;
  font-size: 13px;
  color: #2c2c2c;
  outline: none;
  transition: border-color 0.15s;
}

.text-input:focus {
  border-color: #c0a880;
}

.bg-image-fields input[type='file'] {
  font-size: 12px;
  color: #4a4a4a;
}

/* Categories */
.category-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 10px;
}

.category-row {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #ece6d8;
  border-radius: 4px;
  padding: 6px 8px;
  min-height: 36px;
}

.cat-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.cat-label {
  flex: 1;
  font-size: 12px;
  font-weight: 600;
  color: #3d3020;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cat-swatch {
  width: 14px;
  height: 14px;
  border-radius: 3px;
  flex-shrink: 0;
  border: 1px solid rgba(0, 0, 0, 0.15);
}

.icon-btn {
  border: none;
  background: none;
  font-size: 13px;
  color: #7a6e5a;
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 3px;
  line-height: 1;
  transition: background 0.1s, color 0.1s;
}

.icon-btn:hover {
  background: #d4c9b0;
  color: #2c2c2c;
}

.icon-btn--danger:hover {
  background: #f5c6c0;
  color: #c0392b;
}

.icon-btn--done {
  color: #1e8449;
}

.icon-btn--done:hover {
  background: #c8e6d0;
  color: #1e8449;
}

.cat-edit-row {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
}

.emoji-wrap {
  position: relative;
  flex-shrink: 0;
}

.icon-edit-btn {
  border: 1px solid #d4c9b0;
  background: #fff;
  border-radius: 4px;
  width: 30px;
  height: 30px;
  font-size: 15px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.1s;
}

.icon-edit-btn:hover {
  background: #f0ebe0;
}

.cat-name-input {
  flex: 1;
  min-width: 0;
}

input[type='color'] {
  width: 28px;
  height: 28px;
  border: 1px solid #d4c9b0;
  border-radius: 3px;
  padding: 1px;
  cursor: pointer;
  background: none;
  flex-shrink: 0;
}

.add-cat-btn {
  width: 100%;
  border: 1px dashed #c0b090;
  background: none;
  border-radius: 4px;
  padding: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #7a6e5a;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.add-cat-btn:hover {
  background: #ece6d8;
  color: #3d3020;
}

/* Board data */
.data-btns {
  display: flex;
  gap: 8px;
}

.btn {
  flex: 1;
  padding: 8px 14px;
  border: none;
  border-radius: 4px;
  background: #2c3e50;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
  letter-spacing: 0.03em;
  transition: background 0.15s;
}

.btn:hover {
  background: #3d556b;
}

.btn--danger {
  background: #922b21;
  margin-top: 8px;
  width: 100%;
}

.btn--danger:hover {
  background: #b03a2e;
}
</style>
