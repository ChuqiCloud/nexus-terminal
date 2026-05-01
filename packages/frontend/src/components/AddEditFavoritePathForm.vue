<script setup lang="ts">
import { ref, watch, computed, type PropType } from 'vue';
import { useI18n } from 'vue-i18n';
import { useFavoritePathsStore, type FavoritePathItem } from '../stores/favoritePaths.store';

const props = defineProps({
  isVisible: {
    type: Boolean,
    required: true,
  },
  pathData: {
    type: Object as PropType<FavoritePathItem | null>,
    default: null,
  },
});

const emit = defineEmits(['close', 'saveSuccess']);

const { t } = useI18n();
const favoritePathsStore = useFavoritePathsStore();

const form = ref({
  id: '',
  path: '',
  name: '',
  scope: 'global' as 'global' | 'local',
});

const isEditMode = computed(() => !!props.pathData?.id);
const isLoading = ref(false);
const errorMessage = ref<string | null>(null);

watch(() => props.isVisible, (newValue) => {
  if (newValue) {
    errorMessage.value = null;
    if (props.pathData) {
      form.value = {
        id: props.pathData.id,
        path: props.pathData.path,
        name: props.pathData.name || '',
        scope: (props.pathData.scope as 'global' | 'local') || 'global',
      };
    } else {
      form.value = { id: '', path: '', name: '', scope: 'global' };
    }
  }
}, { immediate: true });

const validateForm = (): boolean => {
  if (!form.value.path.trim()) {
    errorMessage.value = t('favoritePaths.addEditForm.validation.pathRequired', 'Path is required.');
    return false;
  }
  errorMessage.value = null;
  return true;
};

const handleSubmit = async () => {
  if (!validateForm()) {
    return;
  }
  isLoading.value = true;
  errorMessage.value = null;
  try {
    if (isEditMode.value && form.value.id) {
      await favoritePathsStore.updateFavoritePath(form.value.id, {
        path: form.value.path,
        name: form.value.name || undefined,
        scope: form.value.scope,
      }, t);
    } else {
      await favoritePathsStore.addFavoritePath({
        path: form.value.path,
        name: form.value.name || undefined,
        scope: form.value.scope,
      }, t);
    }
    emit('saveSuccess');
    closeModal();
  } catch (error: any) {
    console.error('Error saving favorite path:', error);
    errorMessage.value = error.message || t('favoritePaths.addEditForm.errors.genericSaveError', 'Failed to save favorite path.');
  } finally {
    isLoading.value = false;
  }
};

const closeModal = () => {
  if (!isLoading.value) {
    emit('close');
  }
};
</script>

<template>
  <div
    v-if="isVisible"
    class="fixed inset-0 z-[60] flex items-center justify-center bg-[var(--overlay-bg-color)]"
    @click.self="closeModal"
  >
    <div class="bg-background text-foreground shadow-xl rounded-lg w-full max-w-md flex flex-col overflow-hidden m-4 p-6">
      <!-- Header -->
      <h2 class="m-0 mb-6 text-center text-xl font-semibold">
        {{ isEditMode ? t('favoritePaths.addEditForm.editTitle', '编辑书签') : t('favoritePaths.addEditForm.addTitle', '添加书签') }}
      </h2>

      <!-- Form Body -->
      <form @submit.prevent="handleSubmit" class="space-y-4 flex-grow overflow-y-auto">
        <div>
          <label for="favPath-name" class="block text-sm font-medium text-text-secondary mb-1">
            {{ t('favoritePaths.addEditForm.nameLabel', '名称（可选）') }}
          </label>
          <input
            id="favPath-name"
            type="text"
            v-model="form.name"
            :disabled="isLoading"
            class="w-full bg-input border border-border rounded-md px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            :placeholder="t('favoritePaths.addEditForm.namePlaceholder', 'My Documents')"
          />
        </div>
        <div>
          <label for="favPath-path" class="block text-sm font-medium text-text-secondary mb-1">
            {{ t('favoritePaths.addEditForm.pathLabel', '路径') }}
            <span class="text-danger ml-0.5">*</span>
          </label>
          <input
            id="favPath-path"
            type="text"
            v-model="form.path"
            required
            :disabled="isLoading"
            class="w-full bg-input border border-border rounded-md px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            :placeholder="t('favoritePaths.addEditForm.pathPlaceholder', '/example/folder/path')"
          />
        </div>

        <!-- Scope Selector -->
        <div>
          <label class="block text-sm font-medium text-text-secondary mb-1.5">
            {{ t('favoritePaths.addEditForm.scopeLabel', '记录位置') }}
          </label>
          <div class="flex gap-2">
            <button
              type="button"
              @click="form.scope = 'local'"
              :class="[
                'flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-sm border transition-colors',
                form.scope === 'local'
                  ? 'border-blue-500/50 bg-blue-500/10 text-blue-400'
                  : 'border-border bg-input text-text-secondary hover:border-border hover:bg-white/5'
              ]"
            >
              <i class="fas fa-server text-xs"></i>
              {{ t('favoritePaths.scopeLocalLabel', '仅当前服务器') }}
            </button>
            <button
              type="button"
              @click="form.scope = 'global'"
              :class="[
                'flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-sm border transition-colors',
                form.scope === 'global'
                  ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'
                  : 'border-border bg-input text-text-secondary hover:border-border hover:bg-white/5'
              ]"
            >
              <i class="fas fa-cloud text-xs"></i>
              {{ t('favoritePaths.scopeGlobalLabel', '全局共享') }}
            </button>
          </div>
        </div>

        <div v-if="errorMessage" class="text-danger text-sm p-2 bg-danger/10 rounded-md">
          {{ errorMessage }}
        </div>
      </form>

      <!-- Footer -->
      <div class="flex justify-end mt-8 pt-4 border-t border-border/50">
        <button
          type="button"
          @click="closeModal"
          :disabled="isLoading"
          class="py-2 px-5 rounded-lg text-sm font-medium transition-colors duration-150 bg-background border border-border/50 text-text-secondary hover:bg-border hover:text-foreground mr-3">
          {{ t('common.cancel', '取消') }}
        </button>
        <button
          type="submit"
          @click="handleSubmit"
          :disabled="isLoading || !form.path.trim()"
          class="py-2 px-5 rounded-lg text-sm font-semibold transition-colors duration-150 bg-primary text-white border-none shadow-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:bg-gray-400 disabled:opacity-70 disabled:cursor-not-allowed">
          {{ isLoading ? t('common.saving', '保存中...') : t('common.save', '保存') }}
        </button>
      </div>
    </div>
  </div>
</template>