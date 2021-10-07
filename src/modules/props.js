
function filterKey(obj) {
    return Object.keys(obj).filter(k => {
        return k !== 'style' && k !== 'id' && k !== 'class'
    })
}

function updateProps(oldVnode, vnode) {
    let oldProps = oldVnode.data.props
    let props = vnode.data.props
    const elm = vnode.elm
    let key, cur, old

    if (!oldProps && !props) return
    if (oldProps === props) return
    oldProps = oldProps || {}
    props = props || {}

    // 删除复用节点里oldProps里存在的key
    filterKey(oldProps).forEach(key => {
        if (!props[key]) delete elm[key]
    })

    filterKey(props).forEach(key => {
        cur = props[key]
        old = oldProps[key]
        if (old !== cur && (key !== 'value' || elm[key] !== cur)) {
            elm[key] = cur
        }
    })
}

export const propsModule = {
    create: updateProps,
    update: updateProps
}
export default propsModule