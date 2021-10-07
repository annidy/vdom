
const VNODE_TYPE = Symbol('virtual-node')

function vnode(type, key, data, children, text, elm) {
    const element = {
        __type: VNODE_TYPE,
        type, key, data, children, text, elm
    }
    return element
}

function isVnode(vnode) {
    return vnode && vnode.__type === VNODE_TYPE
}

function isSameVnode(oldVnode, vnode) {
    return oldVnode.key === vnode.key && oldVnode.type === vnode.type
}

export default vnode
export {
    isVnode,
    isSameVnode,
    VNODE_TYPE
}