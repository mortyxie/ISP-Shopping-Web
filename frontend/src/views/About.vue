<template>
  <div class="about-page">
    <div class="container">
      <div class="about-content">
        <h1 class="page-title">{{ $t('about.title') }}</h1>
        
        <div class="about-section">
          <p class="intro">{{ $t('about.intro') }}</p>
        </div>

        <div class="about-section">
          <h2>{{ $t('about.whatWeDo.title') }}</h2>
          <p>{{ $t('about.whatWeDo.text') }}</p>
        </div>

        <div class="about-section">
          <h2>{{ $t('about.whyVinyl.title') }}</h2>
          <p>{{ $t('about.whyVinyl.text') }}</p>
        </div>

        <div class="about-section contact">
          <h2>{{ $t('about.contact.title') }}</h2>
          <p>{{ $t('about.contact.text') }}</p>
          <p class="email">contact@phoenixrecords.com</p>
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
.about-page {
  min-height: calc(100vh - 200px);
  padding: var(--spacing-xxl) 0;
  background: #FDC1A7;
}

.container {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 var(--spacing-lg);
}

.about-content {
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

.about-section {
  margin-bottom: var(--spacing-xl);
}

.about-section h2 {
  font-size: var(--font-size-xl);
  color: var(--color-primary);
  margin-bottom: var(--spacing-md);
  font-weight: 600;
}

.intro {
  font-size: var(--font-size-lg);
  color: var(--color-text-primary);
  line-height: 1.6;
  text-align: center;
  font-style: italic;
}

.about-section p {
  font-size: var(--font-size-base);
  color: var(--color-text-primary);
  line-height: 1.6;
}

.about-section ul {
  margin: var(--spacing-md) 0;
  padding-left: var(--spacing-xl);
}

.about-section li {
  font-size: var(--font-size-base);
  color: var(--color-text-primary);
  line-height: 1.8;
}

.contact {
  text-align: center;
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--color-border);
}

.email {
  font-size: var(--font-size-lg);
  font-weight: bold;
  color: var(--color-primary);
  margin-top: var(--spacing-sm);
}

@media (max-width: 768px) {
  .about-content {
    padding: var(--spacing-lg);
  }
}
</style>