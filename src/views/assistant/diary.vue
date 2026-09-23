<template>
    <div class="diary-page">
        <main class="diary-main">
            <div class="page-header">
                <h1>我的日记</h1>
                <el-button type="primary" :icon="Plus" @click="openEditor">写日记</el-button>
            </div>

            <!-- 日记编辑弹窗 -->
            <el-dialog v-model="editorVisible" :title="editingId ? '编辑日记' : '写日记'" width="560px">
                <el-form :model="editorForm" label-position="top">
                    <el-form-item label="标题">
                        <el-input v-model="editorForm.title" placeholder="请输入标题" maxlength="50" />
                    </el-form-item>
                    <el-form-item label="内容">
                        <el-input
                            v-model="editorForm.content"
                            type="textarea"
                            :rows="6"
                            placeholder="记录今天的点滴..."
                        />
                    </el-form-item>
                </el-form>
                <template #footer>
                    <el-button @click="editorVisible = false">取消</el-button>
                    <el-button type="primary" @click="saveDiary">保存</el-button>
                </template>
            </el-dialog>

            <!-- 日记列表 -->
            <div v-if="diaries.length" class="diary-list">
                <el-card v-for="diary in diaries" :key="diary.id" class="diary-card" shadow="hover">
                    <div class="diary-head">
                        <h3>{{ diary.title || '无标题' }}</h3>
                        <span class="date">{{ diary.date }}</span>
                    </div>
                    <p class="diary-content">{{ diary.content }}</p>
                    <div class="diary-actions">
                        <el-button text type="primary" size="small" @click="openEditor(diary)">编辑</el-button>
                        <el-button text type="danger" size="small" @click="removeDiary(diary.id)">删除</el-button>
                    </div>
                </el-card>
            </div>
            <el-empty v-else description="还没有日记，点击右上角开始记录吧" />
        </main>
    </div>
</template>

<script lang="ts" setup>
import { ref, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import NavBar from '@/components/NavBar.vue'

interface Diary {
    id: number
    title: string
    content: string
    date: string
}

const diaries = ref<Diary[]>([])
const editorVisible = ref(false)
const editingId = ref<number | null>(null)

const editorForm = reactive({
    title: '',
    content: ''
})

const openEditor = (diary?: Diary) => {
    editingId.value = diary?.id ?? null
    editorForm.title = diary?.title ?? ''
    editorForm.content = diary?.content ?? ''
    editorVisible.value = true
}

const saveDiary = () => {
    if (!editorForm.title.trim() && !editorForm.content.trim()) {
        ElMessage.warning('标题和内容不能都为空')
        return
    }

    if (editingId.value !== null) {
        const target = diaries.value.find(d => d.id === editingId.value)
        if (target) {
            target.title = editorForm.title
            target.content = editorForm.content
        }
        ElMessage.success('日记已更新')
    } else {
        diaries.value.unshift({
            id: Date.now(),
            title: editorForm.title,
            content: editorForm.content,
            date: new Date().toLocaleString('zh-CN')
        })
        ElMessage.success('日记已保存')
    }

    editorVisible.value = false
}

const removeDiary = async (id: number) => {
    const confirmed = await ElMessageBox.confirm('确定删除这篇日记吗？', '提示', {
        type: 'warning'
    }).catch(() => false)
    if (!confirmed) return

    diaries.value = diaries.value.filter(d => d.id !== id)
    ElMessage.success('已删除')
}
</script>

<style scoped>
.diary-page {
    height: 100%;
    background: #f5f7fa;
}

.diary-main {
    max-width: 860px;
    margin: 0 auto;
    padding: 32px 24px;
}

.page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
}

.page-header h1 {
    margin: 0;
    font-size: 24px;
    color: #303133;
}

.diary-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.diary-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.diary-head h3 {
    margin: 0;
    font-size: 16px;
    color: #303133;
}

.date {
    font-size: 13px;
    color: #909399;
}

.diary-content {
    margin: 12px 0;
    color: #606266;
    line-height: 1.7;
    white-space: pre-wrap;
    word-break: break-word;
}

.diary-actions {
    display: flex;
    justify-content: flex-end;
}
</style>
