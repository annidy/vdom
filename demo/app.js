const patch = snabbdom.patch
const h = snabbdom.h

const container = document.getElementById('container')

const vnode = h('div', {id: 'container'}, [
    h('span', {class:'class1', style: {fontWeight: 'bold'}}, 'This is bold'),
    ' and this is text',
    h('a', {props:{href: './foo'}}, 'fool')
])

console.log(vnode)
patch(container, vnode)