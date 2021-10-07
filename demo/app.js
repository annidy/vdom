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

// 模拟只
const newVnode = h('div', {id: 'container'}, [
    h('span', {style: {fontWeight: 'normal', fontStyle: 'italic'}}, 'This is italic'),
    ' and this is still text',
    h('a', {props:{href: './bar'}}, 'bar')
])
setTimeout(() => {
    patch(vnode, newVnode)
}, 5000)