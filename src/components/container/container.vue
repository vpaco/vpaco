<template>
    <ContainerLayout :componentList="config.componentList" :refsUpdated="refsUpdated" :class="config.class" :style="config.style" />
</template>
<script>
import ContainerLayout from './containerLayout.vue';

export default {
    props: {
        config: Object,
        refsUpdated: Function
    },
    components: { ContainerLayout }
};
</script>
