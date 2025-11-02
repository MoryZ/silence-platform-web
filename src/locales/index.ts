import type { App } from 'vue';
import { createI18n } from 'vue-i18n';
import { ls } from '@/utils/stoarge';
import messages from './locale';

const i18n = createI18n({
  legacy: false,
  locale: (ls.get('lang') as string) || 'zh-CN',
  fallbackLocale: 'en-US',
  messages
});

/**
 * Setup plugin i18n
 *
 * @param app
 */
export function setupI18n(app: App) {
  app.use(i18n);
}

export const $t: any = i18n.global.t;

