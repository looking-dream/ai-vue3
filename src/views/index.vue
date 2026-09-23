<template>
    <div class="home">
        <!-- 助手介绍 -->
        <main class="hero">
            <div class="hero-text">
                <h1>你的 AI 智能助手</h1>
                <p class="desc">
                    随时随地为你解答问题、辅助写作、生成创意。
                    体验高效智能的 AI 服务。
                </p>
            </div>
            <img
                class="hero-img"
                src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=futuristic%20AI%20assistant%20robot%20illustration%2C%20friendly%20chatbot%20character%2C%20soft%20blue%20and%20purple%20gradient%20background%2C%20clean%20modern%20tech%20style%2C%20high%20quality%20digital%20art&image_size=portrait_4_3"
                alt="AI 助手"
            />
        </main>

        <!-- 功能特性 -->
        <section class="features">
            <div v-for="item in features" :key="item.title" class="feature-card">
                <h3>{{ item.title }}</h3>
                <p>{{ item.desc }}</p>
            </div>
        </section>
    </div>
</template>

<script lang="ts" setup>

interface Feature {
    title: string
    desc: string
}

// 静态数据无需响应式
const features: Feature[] = [
    { title: '智能问答', desc: '快速准确地解答各类问题，覆盖多领域知识' },
    { title: '写作辅助', desc: '帮你润色文案、生成大纲，提升写作效率' },
    { title: '创意生成', desc: '激发灵感，为你提供源源不断的创意想法' }
]
</script>

<style scoped>
.home {
    height: 100%;
    background: #f5f7fa;
}

.hero {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 48px;
    max-width: 1080px;
    margin: 0 auto;
    padding: 48px;
}

.hero-text h1 {
    font-size: 40px;
    margin: 0 0 16px;
    color: #303133;
}

.desc {
    font-size: 16px;
    line-height: 1.8;
    color: #606266;
    margin: 0 0 32px;
}

.hero-img {
    width: 420px;
    max-width: 100%;
    border-radius: 16px;
    object-fit: cover;
}

.features {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
    max-width: 1080px;
    margin: 0 auto;
    padding: 0 48px 72px;
}

.feature-card {
    background: #fff;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.feature-card h3 {
    margin: 0 0 8px;
    color: #303133;
}

.feature-card p {
    margin: 0;
    color: #606266;
    font-size: 14px;
    line-height: 1.6;
}

@media (max-width: 768px) {
    .hero {
        flex-direction: column;
        text-align: center;
    }

    .features {
        grid-template-columns: 1fr;
    }
}
</style>
