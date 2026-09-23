<template>
    <div class="knowledge-page">
        <NavBar />

        <main class="knowledge-main">
            <div class="page-header">
                <h1>知识库</h1>
                <el-button type="primary" :icon="Plus" @click="openEditor">添加知识</el-button>
            </div>

            <!-- 搜索 -->
            <el-input
                v-model="keyword"
                class="search"
                :prefix-icon="Search"
                placeholder="搜索知识标题或内容..."
                clearable
            />

            <!-- 知识编辑弹窗 -->
            <el-dialog v-model="editorVisible" :title="editingId ? '编辑知识' : '添加知识'" width="560px">
                <el-form :model="editorForm" label-position="top">
                    <el-form-item label="标题">
                        <el-input v-model="editorForm.title" placeholder="请输入标题" maxlength="50" />
                    </el-form-item>
                    <el-form-item label="分类">
                        <el-select v-model="editorForm.category" placeholder="选择分类" style="width: 100%">
                            <el-option
                                v-for="cat in categories"
                                :key="cat.value"
                                :label="cat.label"
                                :value="cat.value"
                            />
                        </el-select>
                    </el-form-item>
                    <el-form-item label="内容">
                        <el-input
                            v-model="editorForm.content"
                            type="textarea"
                            :rows="6"
                            placeholder="输入知识内容..."
                        />
                    </el-form-item>
                </el-form>
                <template #footer>
                    <el-button @click="editorVisible = false">取消</el-button>
                    <el-button type="primary" @click="saveKnowledge">保存</el-button>
                </template>
            </el-dialog>

            <!-- 知识列表 -->
            <div v-if="filteredList.length" class="knowledge-list">
                <el-card v-for="item in filteredList" :key="item.id" class="knowledge-card" shadow="hover">
                    <div class="knowledge-head">
                        <h3>{{ item.title }}</h3>
                        <el-tag size="small">{{ categoryLabel(item.category) }}</el-tag>
                    </div>
                    <p class="knowledge-content">{{ item.content }}</p>
                    <div class="knowledge-actions">
                        <el-button text type="primary" size="small" @click="openEditor(item)">编辑</el-button>
                        <el-button text type="danger" size="small" @click="removeKnowledge(item.id)">删除</el-button>
                    </div>
                </el-card>
            </div>
            <el-empty v-else description="暂无知识，点击右上角添加吧" />
        </main>
    </div>
</template>

<script lang="ts" setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'

interface Knowledge {
    id: number
    title: string
    category: string
    content: string
}

interface Category {
    label: string
    value: string
}

const categories: Category[] = [
    { label: '技术', value: 'tech' },
    { label: '生活', value: 'life' },
    { label: '学习', value: 'study' },
    { label: '其他', value: 'other' }
]

const knowledges = ref<Knowledge[]>([])
const keyword = ref('')
const editorVisible = ref(false)
const editingId = ref<number | null>(null)

const editorForm = reactive({
    title: '',
    category: '',
    content: ''
})

const filteredList = computed(() => {
    const kw = keyword.value.trim().toLowerCase()
    if (!kw) return knowledges.value
    return knowledges.value.filter(
        k =>
            k.title.toLowerCase().includes(kw) ||
            k.content.toLowerCase().includes(kw)
    )
})

const categoryLabel = (value: string) =>
    categories.find(c => c.value === value)?.label ?? '其他'

const openEditor = (item?: Knowledge) => {
    editingId.value = item?.id ?? null
    editorForm.title = item?.title ?? ''
    editorForm.category = item?.category ?? ''
    editorForm.content = item?.content ?? ''
    editorVisible.value = true
}

const saveKnowledge = () => {
    if (!editorForm.title.trim()) {
        ElMessage.warning('请输入标题')
        return
    }

    if (editingId.value !== null) {
        const target = knowledges.value.find(k => k.id === editingId.value)
        if (target) {
            target.title = editorForm.title
            target.category = editorForm.category
            target.content = editorForm.content
        }
        ElMessage.success('知识已更新')
    } else {
        knowledges.value.unshift({
            id: Date.now(),
            title: editorForm.title,
            category: editorForm.category,
            content: editorForm.content
        })
        ElMessage.success('知识已保存')
    }

    editorVisible.value = false
}

const removeKnowledge = async (id: number) => {
    const confirmed = await ElMessageBox.confirm('确定删除这条知识吗？', '提示', {
        type: 'warning'
    }).catch(() => false)
    if (!confirmed) return

    knowledges.value = knowledges.value.filter(k => k.id !== id)
    ElMessage.success('已删除')
}
</script>

<style scoped>
.knowledge-page {
    height: 100%;
    background: #f5f7fa;
}

.knowledge-main {
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

.search {
    margin-bottom: 24px;
}

.knowledge-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.knowledge-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.knowledge-head h3 {
    margin: 0;
    font-size: 16px;
    color: #303133;
}

.knowledge-content {
    margin: 12px 0;
    color: #606266;
    line-height: 1.7;
    white-space: pre-wrap;
    word-break: break-word;
}

.knowledge-actions {
    display: flex;
    justify-content: flex-end;
}
</style>
