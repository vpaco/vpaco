import { getVue } from '../config';
import {addRenderStack, getUid, removeRenderStackItem} from './index';

export default function(component, name) {
    const Vue = getVue();
    return Vue.extend({
        props: {
            options: {
                type: Object
            },
            parentId: {
                type: Number
            },
            events: {
                type: Object
            },
            slots: {
                type: Object
            },
            vpIsPageComponent: Boolean,

            vpPageComponentName: String,

            vpComponentName: String,

            remoteComponent: Boolean
        },
        data() {
            return {
                vpId: getUid(),
                pid: this.parentId,
                vpComponentWrapper: true
            };
        },
        created() {
            if (this.pid === undefined) {
                let parent = this.$parent;
                do {
                    if (parent.vpId) {
                        break;
                    } else {
                        parent = parent.$parent;
                    }
                } while (parent);

                if (parent) {
                    this.pid = parent.vpId;
                } else {
                    this.pid = 0;
                }
            }
            addRenderStack({
                id: this.vpId,
                pid: this.pid,
                type: 'component',
                instance: this,
                name
            });
        },
        render(h) {
            const Component = component;
            const events = {},
                slots = {},
                childrenEl = [];

            Object.keys(this.options || {}).forEach(it => {
                if (it.startsWith('on') && typeof this.options[it] === 'function') {
                    events[it.slice(2)] = this.options[it];
                }
            });

            Object.keys(this.options && this.options.$on || {}).forEach(it => {
                events[it] = this.options.$on[it];
            });

            Object.keys(this.options && this.options.$slots || {}).forEach(it => {
                slots[it] = props => {
                    return this.options.$slots[it](h, props);
                };

                if (it === 'default') {
                    childrenEl.push(slots[it]());
                }

                childrenEl.push(
                  h('div', {
                      slot: it
                  })
                );
            });

            return h(Component, {
                props: this.options || {},
                scopedSlots: slots,
                on: events,
                style: this.options.$style,
                class: this.options.$class
            }, childrenEl);
        },

        mounted() {
            let comp = this.$children[0];
            if (component.methods) {
                Object.keys(component.methods).forEach(it => {
                    this[it] = component.methods[it].bind(comp);
                });
            }
        },
        destroyed() {
            removeRenderStackItem(this.vpId);
        }
    });
}
