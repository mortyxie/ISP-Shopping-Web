/**
 * API / DB 使用英文成色字符串；界面通过 i18n `conditionGrade` 展示本地化文案。
 */
const CONDITION_TO_I18N_SUFFIX = {
  Mint: 'mint',
  'Near Mint': 'nearmint',
  Good: 'good'
}

/**
 * @param {(key: string) => string} t - vue-i18n 的 t
 * @param {string | null | undefined} condition - 如 "Mint", "Near Mint", "Good"
 * @returns {string}
 */
export function formatConditionLabel(t, condition) {
  if (condition == null || String(condition).trim() === '') return ''
  const trimmed = String(condition).trim()
  const suffix = CONDITION_TO_I18N_SUFFIX[trimmed]
  if (!suffix) return trimmed
  return t(`conditionGrade.${suffix}`)
}
