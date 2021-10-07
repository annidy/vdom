
import {isArray} from '../utils'

function updateClassName(oldVnode, vnode) {
    const oldName = oldVnode.data.className
    const newName = vnode.data.className

    if (!oldName && !newName) return
    if (oldName === newName) return

    const elm = vnode.elm
    if (typeof newName === 'string' && newName) {
        elm.className = newName.toString()
    } else if (isArray(newName)) {
        elm.className = ''
        newName.forEach(v => {
            elm.classList.add(v) // https://developer.mozilla.org/zh-CN/docs/Web/API/Element/classList
        })
    } else {
        elm.className = ''
    }
}

export const classModule = {
    create: updateClassName,
    update: updateClassName
}

export default classModule