<template>
    <functional :render="render"></functional>
</template>
<script>
import functional from '../../utils/functional';
import { addRenderStack, getUid, removeRenderStackItem } from '../../utils';
export default {
    components: { functional },
    props: {
        render: Function,
        parentId: Number
    },
    data() {
        return {
            vpId: getUid(),
            pid: this.parentId
        };
    },

    created() {
        addRenderStack({
            id: this.vpId,
            pid: this.pid,
            type: 'render',
        });
    },
    destroyed() {
        removeRenderStackItem(this.vpId);
    }
};
</script>
