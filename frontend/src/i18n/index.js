import { createI18n } from 'vue-i18n'
import zhCN from './locales/zh-CN.json'
// 测试阶段：所有语言都指向简体中文文件，保证开发稳定性
// TODO: 开发完毕后，恢复为分别指向三个语言文件
// import zhTW from './locales/zh-TW.json'
// import en from './locales/en.json'

const i18n = createI18n({
  legacy: false,
  locale: localStorage.getItem('locale') || 'zh-CN',
  fallbackLocale: 'zh-CN',
  messages: {
    'zh-CN': zhCN,
    'zh-TW': zhCN, // 测试阶段：使用简体中文
    'en': zhCN     // 测试阶段：使用简体中文
  }
})

export default i18n
