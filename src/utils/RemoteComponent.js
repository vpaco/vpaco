let index = 0;
export class RemoteComponent {
    fetch(url) {
        this.url = url;
        return fetch(url, {
            mode: 'cors',
            method: 'GET',
            headers: {
                'Access-Control-Allow-Origin': '*'
            }
        })
            .then(function (response) {
                return response.text();
            })
            .then(text => {
                this.runScript('!!' + text);
                return this.module && this.module.exports;
            });
    }

    parse(moduleContent){
        this.runScript('!!' + moduleContent);
        return this.module && this.module.exports;
    }

    removeScript (scriptElement) {
        document.body.removeChild(scriptElement);
    }

    runScript(text) {
        let module = {},
            name =  `vpFetch${index}`;
        index++;

        let scriptElement = document.createElement('script');
        scriptElement.innerHTML = `
        //# sourceURL=${this.url}
            (function(){
            document.currentScript.src = '${this.url}';
                let module = {}, exports = {}, require = (key)=>window[key];
                ${text}
                window['${name}'] = module;
            })()
        `;
        document.body.appendChild(scriptElement);
        this.removeScript(scriptElement);
        this.module = window[name];
        delete window[name];
    }
}
