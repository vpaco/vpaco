# vpaco

>轻量级业务开发框架，让业务开发更专注于业务本身，通过精简API完成项目搭建

### 快速上手

`install`
```bash
npm install vpaco --save
```

`register`
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
export default function({
    context,
    render,
    optionsChange,
    useState
}){

    const component1State = useState({

    })

    const page1State = useState({

    })
    
    optionsChange(()=>{
    
    })


    return(h=>
        <container>
            <component name='component1' props={component1State}/>
            <page name='page1' props={page1State}/>
        </container>
    )
}
```

## License
[MIT](http://opensource.org/licenses/MIT)

Copyright (c) 2023-present, LIUJUN
