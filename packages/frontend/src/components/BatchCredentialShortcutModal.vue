<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { LoginCredentialBasicInfo } from '../stores/loginCredentials.store';

type BatchCredentialSelection = 'unset' | 'clear' | number;

const props = defineProps<{
  selectedCount: number;
  selectedTypes: string[];
  credentials: LoginCredentialBasicInfo[];
  selection: BatchCredentialSelection;
  isLoading: boolean;
  isSubmitting: boolean;
}>();

const emit = defineEmits<{
  (event: 'close'): void;
  (event: 'manage'): void;
  (event: 'apply'): void;
  (event: 'update:selection', value: BatchCredentialSelection): void;
}>();

const { t } = useI18n();

const hasMixedTypes = computed(() => props.selectedTypes.length > 1);
const modelSelection = computed({
  get: () => props.selection,
  set: (value: BatchCredentialSelection) => emit('update:selection', value),
});
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 bg-overlay flex justify-center items-center z-50 p-4"
      @click.self="emit('close')"
    >
      <div class="bg-background text-foreground p-6 rounded-lg shadow-xl border border-border w-full max-w-md">
        <div class="flex items-start justify-between gap-4 mb-5">
          <div>
            <h3 class="text-lg font-semibold">
              {{ t('connections.batchEdit.changeCredentialTitle', '更改所选连接的登录凭证') }}
            </h3>
            <p class="mt-1 text-sm text-text-secondary">
              {{ t('connections.batchEdit.credentialSelectionSummary', { count: selectedCount }, `已选择 ${selectedCount} 个连接`) }}
            </p>
          </div>
          <button
            @click="emit('close')"
            class="w-8 h-8 rounded-lg border border-border bg-background text-text-secondary hover:bg-border hover:text-foreground transition-colors inline-flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="isSubmitting"
            :title="t('common.cancel', '取消')"
          >
            <i class="fas fa-xmark"></i>
          </button>
        </div>

        <div class="space-y-4">
          <div
            v-if="hasMixedTypes"
            class="rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100"
          >
            <i class="fas fa-triangle-exclamation mr-1.5"></i>
            {{ t('connections.batchEdit.savedCredentialMixedType', '批量应用已保存凭证前，请先只选择同一种连接类型。') }}
          </div>

          <div class="rounded-lg border border-border bg-card px-3 py-2 text-sm text-text-secondary">
            <div class="flex items-center justify-between gap-3">
              <span>{{ t('connections.batchEdit.selectedTypes', '已选类型') }}</span>
              <span class="text-foreground font-medium">
                {{ selectedTypes.join(' / ') || '-' }}
              </span>
            </div>
          </div>

          <div>
            <label for="batch-credential-shortcut-select" class="block text-sm font-medium text-text-secondary mb-1">
              {{ t('connections.form.savedLoginCredential', '登录凭证') }}
            </label>
            <select
              id="batch-credential-shortcut-select"
              v-model="modelSelection"
              class="w-full px-3 py-2 border border-border rounded-md shadow-sm bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="isSubmitting || isLoading"
            >
              <option value="unset">{{ t('connections.form.selectLoginCredential', '请选择登录凭证') }}</option>
              <option value="clear">{{ t('connections.form.clearSavedCredential', '取消已保存凭证') }}</option>
              <option v-if="hasMixedTypes" disabled>
                {{ t('connections.batchEdit.savedCredentialTypeHint', '仅支持同类型连接批量应用') }}
              </option>
              <option v-if="!hasMixedTypes && isLoading" disabled>
                {{ t('common.loading', '加载中...') }}
              </option>
              <option
                v-for="credential in credentials"
                :key="credential.id"
                :value="credential.id"
              >
                {{ credential.name }} ({{ credential.username }})
              </option>
            </select>
            <p v-if="!hasMixedTypes && !isLoading && credentials.length === 0" class="mt-2 text-xs text-text-secondary">
              {{ t('connections.batchEdit.noCredentialForType', '当前类型暂无可用登录凭证。') }}
            </p>
          </div>

          <button
            @click="emit('manage')"
            class="text-sm text-primary hover:text-primary-hover inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="isSubmitting"
          >
            <i class="fas fa-key"></i>
            <span>{{ t('connections.form.manageLoginCredentials', '管理登录凭证') }}</span>
          </button>
        </div>

        <div class="flex justify-end items-center pt-5 mt-5 border-t border-border/60 space-x-3">
          <button
            type="button"
            @click="emit('close')"
            class="px-4 py-2 bg-transparent text-text-secondary border border-border rounded-md shadow-sm hover:bg-border hover:text-foreground focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition duration-150 ease-in-out"
            :disabled="isSubmitting"
          >
            {{ t('common.cancel', '取消') }}
          </button>
          <button
            type="button"
            @click="emit('apply')"
            class="px-4 py-2 bg-button text-button-text rounded-md shadow-sm hover:bg-button-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
            :disabled="selection === 'unset' || isSubmitting || (hasMixedTypes && selection !== 'clear')"
          >
            <i v-if="isSubmitting" class="fas fa-spinner fa-spin"></i>
            <i v-else class="fas fa-check"></i>
            <span>{{ t('connections.batchEdit.applyCredential', '应用凭证') }}</span>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
