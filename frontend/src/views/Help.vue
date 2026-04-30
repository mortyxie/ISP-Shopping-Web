<template>
  <div class="help-page">
    <div class="container">
      <div class="help-content">
        <h1 class="page-title">{{ $t('help.title') }}</h1>

        <!-- FAQ Section -->
        <div class="help-section">
          <h2>{{ $t('help.faq.title') }}</h2>
          
          <div class="faq-item">
            <h3>{{ $t('help.faq.q1') }}</h3>
            <p>{{ $t('help.faq.a1') }}</p>
          </div>

          <div class="faq-item">
            <h3>{{ $t('help.faq.q2') }}</h3>
            <p>{{ $t('help.faq.a2') }}</p>
          </div>

          <div class="faq-item">
            <h3>{{ $t('help.faq.q3') }}</h3>
            <p>{{ $t('help.faq.a3') }}</p>
          </div>

          <div class="faq-item">
            <h3>{{ $t('help.faq.q4') }}</h3>
            <p>{{ $t('help.faq.a4') }}</p>
          </div>

          <div class="faq-item">
            <h3>{{ $t('help.faq.q5') }}</h3>
            <p>{{ $t('help.faq.a5') }}</p>
          </div>
        </div>

        <!-- Contact Section -->
        <div class="help-section contact">
          <h2>{{ $t('help.contact.title') }}</h2>
          <p>{{ $t('help.contact.text') }}</p>
          <div class="contact-options">
            <div class="contact-item">📧 {{ $t('help.contact.email') }}: support@phoenixrecords.com</div>
            <div class="contact-item">💬 {{ $t('help.contact.response') }}: 24-48 {{ $t('help.contact.hours') }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<style scoped>
.help-page {
  min-height: calc(100vh - 200px);
  padding: var(--spacing-xxl) 0;
  background: #FDC1A7;
}

.container {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 var(--spacing-lg);
}

.help-content {
  background: white;
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-xxl);
  box-shadow: var(--shadow-md);
  border: 2px solid var(--color-primary);
}

.page-title {
  font-size: var(--font-size-xxxl);
  color: var(--color-primary);
  text-align: center;
  margin-bottom: var(--spacing-xl);
  font-weight: bold;
}

.help-section {
  margin-bottom: var(--spacing-xl);
}

.help-section h2 {
  font-size: var(--font-size-xl);
  color: var(--color-primary);
  margin-bottom: var(--spacing-lg);
  font-weight: 600;
  padding-bottom: var(--spacing-xs);
  border-bottom: 2px solid var(--color-border);
}

.faq-item {
  margin-bottom: var(--spacing-lg);
}

.faq-item h3 {
  font-size: var(--font-size-lg);
  color: var(--color-text-primary);
  font-weight: 600;
  margin-bottom: var(--spacing-xs);
}

.faq-item p {
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
  line-height: 1.5;
}

.contact {
  text-align: center;
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--color-border);
}

.contact-options {
  margin-top: var(--spacing-lg);
}

.contact-item {
  font-size: var(--font-size-base);
  color: var(--color-text-primary);
  margin: var(--spacing-sm) 0;
}

@media (max-width: 768px) {
  .help-content {
    padding: var(--spacing-lg);
  }
}
</style>