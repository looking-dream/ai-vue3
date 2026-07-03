<template>
    <div class="page">
    </div>
</template>
<script lang="ts" setup>
import { ref } from 'vue';

const formRef = ref();
const handleClick = () => {
    formRef.value.handleClick()
}
</script>
<style>
.page {
    max-width: 1280px;
    border: 1px solid #000;
}
</style>