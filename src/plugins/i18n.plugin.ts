import messages from '@intlify/unplugin-vue-i18n/messages';
import { get } from '@vueuse/core';
import type { Plugin } from 'vue';
import { createI18n } from 'vue-i18n';

const supportedLocales = Object.keys(messages);

function getDefaultLocale(): string {
  // 1. Check localStorage for saved preference
  const saved = localStorage.getItem('locale');
  if (saved && supportedLocales.includes(saved)) {
    return saved;
  }

  // 2. Detect from browser language
  for (const lang of navigator.languages ?? [navigator.language]) {
    // Exact match (e.g. "zh")
    const code = lang.toLowerCase();
    if (supportedLocales.includes(code)) {
      return code;
    }
    // Prefix match (e.g. "zh-CN" -> "zh")
    const prefix = code.split('-')[0];
    if (supportedLocales.includes(prefix)) {
      return prefix;
    }
  }

  return 'en';
}

const i18n = createI18n({
  legacy: false,
  locale: getDefaultLocale(),
  fallbackLocale: 'en',
  messages,
});

export const i18nPlugin: Plugin = {
  install: (app) => {
    app.use(i18n);
  },
};

export const translate = function (localeKey: string) {
  const hasKey = i18n.global.te(localeKey, get(i18n.global.locale));
  return hasKey ? i18n.global.t(localeKey) : localeKey;
};
