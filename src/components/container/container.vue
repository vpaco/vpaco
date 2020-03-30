<template>
    <ContainerLayout :componentList="config.componentList" :class="config.class" :refs="refs" :style="config.style" />
</template>
<script>
import ContainerLayout from './containerLayout.vue';

export default {
    props: {
        config: Object,
        refs: Object
    },
    components: { ContainerLayout }
};
</script>
