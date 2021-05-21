# vpaco

>页面配置化开发，让前端业务开发人员更聚焦于业务。

vpaco的核心是页面配置引擎，通过该引擎最终实现前端组件开发和业务开发的分离解藕，让专业的人做专业的事。

### 使用
安装
```bash
npm install vpaco --save
```

注册
```javascript
import Vue from 'vue'
import vpaco from 'vpaco'
import component1 from "./component"
import component2 from "./component2"
import page1 from "./page"
import page2 from "./page2"

Vue.use(vpaco)

vpaco.register({
    components: {
        component1,
        component2
    },

    pages: {
        page1,
        page2
    }
})
```

### 页面
```javascript
export default {
    layout: [
        {
            name: 'alias1',
            component: 'component1'
        },
        {
            name: 'alias2',
            component: 'component2'
        }
    ],

    config: function(vm) {
        const options = {
            alias1: {},
            alias2: {}
        }

        const methods = {

        }

        return {
            options,
            methods
        }
    }
}
```
#### register配置项
|    Name    | type |   Description   |
| :--------: | :--------: | :--------: |
| components    | Object  | 组件(页面layout中使用的组件) |
| pages    | Object  | 页面 |
| extensions    | Object  | 页面方法扩展 |

#### 页面内置属性
|    Name    | type |   Description   |   Parameters   |
| :--------: | :--------: | :--------: | :--------: |
| refs    | 属性  | 页面组件实例引用 |-|
| layoutRefs    | 属性  | layout中布局对象引用 |-|
| reloadPage    | 方法  | 刷新页面 |-|
| pushPage  | 方法| 页面替换 | (page, options) |
| popPage     | 方法| 页面返回，pushPage相反 | - |

#### layout布局对象配置项

|    Name    |   Description   | type |
| :--------: | :--------: |:--------: |
| class | 样式类 | String, Object|
| style    | 样式  | Object |
| hidden    | 是否隐藏  | Boolean |
| component        | 组件名称 |String|
| page  | 页面名称| String|

#### 页面config配置项

|    Name    |   Description   |
| :--------: | :--------: |
| options | 组件配置 |
| methods    | 页面方法  |
| setup    | 页面初始化钩子  |
| mounted    | 页面渲染完成钩子  |
| optionsChange    | 页面入参改变钩子  |
| destroy    | 页面销毁钩子  |

## License
[MIT](http://opensource.org/licenses/MIT)

Copyright (c) 2019-present, LIUJUN
