<template>
  <footer class="footer">
    <div class="container">
      <!-- 关于我们 -->
      <div class="footer-content">
        <div class="footer-section">
          <h3 class="footer-title">关于我们</h3>
          <ul class="footer-links">
            <li><router-link to="/about">平台介绍</router-link></li>
            <li><router-link to="/help">帮助中心</router-link></li>
            <li><router-link to="/forum">用户论坛</router-link></li>
          </ul>
        </div>
      </div>

      <!-- 版权信息 -->
      <div class="footer-bottom">
        <p>&copy; 2026 凤凰花开的路口 - 二手唱片购物平台. All rights reserved.</p>
      </div>
    </div>
  </footer>
</template>

<script setup>
// 页脚组件
</script>

<style scoped>
.footer {
  background-color: var(--color-text-primary);
  color: white;
  margin-top: auto;
  padding: var(--spacing-xxl) 0 var(--spacing-lg);
}

.footer-content {
  margin-bottom: var(--spacing-xl);
}

.footer-section {
  display: flex;
  flex-direction: column;
}

.footer-title {
  font-size: var(--font-size-lg);
  font-weight: bold;
  margin-bottom: var(--spacing-md);
  color: var(--color-primary-light);
}

.footer-links {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.footer-links li a {
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  font-size: var(--font-size-sm);
  transition: color var(--transition-base);
}

.footer-links li a:hover {
  color: var(--color-primary-light);
}

.footer-bottom {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: var(--spacing-lg);
  text-align: center;
  font-size: var(--font-size-sm);
  color: rgba(255, 255, 255, 0.6);
}

</style>
