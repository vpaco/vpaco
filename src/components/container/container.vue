<template>
    <ContainerLayout :list="config.list" :class="config.class" :refs="refs" :style="config.style" :vpId="vpId"/>
</template>
<script>
import ContainerLayout from './containerLayout.vue';

export default {
    props: {
        config: Object,
        refs: Object,
        vpId: Number
    },
    components: { ContainerLayout }
};
</script>
