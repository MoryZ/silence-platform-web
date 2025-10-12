import { locale } from 'dayjs';
import 'dayjs/locale/zh-cn';
import 'dayjs/locale/en';
import { ls } from '@/utils/stoarge';

/**
 * Set dayjs locale
 *
 * @param lang
 */
export function setDayjsLocale(lang: string = 'zh-CN') {
  const localMap: Record<string, string> = {
    'zh-CN': 'zh-cn',
    'en-US': 'en'
  };

  const l = lang || (ls.get('lang') as string) || 'zh-CN';

  locale(localMap[l]);
}
