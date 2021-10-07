import htmlDomApi from './domApi'
import vnode, {isVnode, isSameVnode} from "./vnode";
import {isArray, isPrimitive} from './utils'

const hooks = ['create', 'update']
const emptyNode = vnode('', '', {}, [], undefined, undefined)

// 返回 key 和下标的映射
function createKeyToOldIdx(children, beginIdx, endIdx) {
    let i, key, ch
    const map = {}
    for (i = beginIdx; i <= endIdx; ++i) {
        ch = children[i]
        if (ch != null) {
            key = ch.key
            if (key !== undefined) map[key] = i
        }
    }
    return map
}

export default function init(modules = [], domApi) {
    const api = domApi || htmlDomApi

    const cbs = {}
    let i, j
    // 将modules中所有hooks拷贝到cbs里
    // cbs只有create和update有效，且两者的实现是一样的
    for (i = 0; i < hooks.length; ++i) {
        cbs[hooks[i]] = []
        for (j = 0; j < modules.length; ++j) {
            const hook = modules[j][hooks[i]]
            if (hook !== undefined) {
                cbs[hooks[i]].push(hook)
            }
        }
    }

    // elm 转 vnode
    function emptyNodeAt(elm) {
        return vnode(api.tagName(elm), undefined, 
                    {className: elm.className, id: elm.id},
                    [], undefined, elm)
    }



    function createElm(vnode) {
        let data = vnode.data || {}

        let children = vnode.children
        let type = vnode.type

        // comment特殊处理
        if (type === 'comment') {
            if (vnode.text == null) {
                vnode.text = ''
            }
            vnode.elm = api.createComment(vnode.text)
        } else if (type) {
            // NS = namespace
            const elm = vnode.elm = data.ns ?
                        api.createElementNS(data.ns, type) :
                        api.createElement(type)
            // hook
            for (let i = 0; i < cbs.create.length; ++i)
                cbs.create[i](emptyNode, vnode)
            
            if (isArray(children)) {
                children.forEach(ch => {
                    // 递归调用创建子elm
                    ch && api.appendChild(elm, createElm(ch))
                })
            } else if (isPrimitive(vnode.text)) {
                api.appendChild(elm, api.createTextNode(vnode.text))
            }

        } else {
            // 无type情况
            vnode.elm = api.createTextNode(vnode.text)
        }

        return vnode.elm
    }


    // 
    function removeVnode(parentElm, vnodes, startIdx, endIdx) {
        for(; startIdx <= endIdx; ++startIdx) {
            let ch = vnodes[startIdx]
            let listeners
            let rm
            let i
            if (ch != null) {
                if (ch.type) {
                    // 原始代码太复杂，换简单的方案
                    api.removeChild(api.parentNode(ch.elm), ch.elm)
                } else {
                    api.removeChild(parentElm, ch.elm)
                }
            }
        } 
    }

    function addVnodes(parentElm, beforeElm, vnodes, startIdx, endIdx) {
        for (; startIdx <= endIdx; ++startIdx) {
            const ch = vnodes[startIdx]
            if (ch != null) {
                api.insertBefore(parentElm, createElm(ch), beforeElm)
            }
        }
    }

    function updateChildren(parentElm, oldCh, newCh) {
        let oldStartIdx = 0, newStartIdx = 0
        let oldEndIdx = oldCh.length - 1
        let oldStartVnode = oldCh[0]
        let oldEndVnode = oldCh[oldEndIdx]
        let newEndIdx = newCh.length - 1
        let newStartVnode = newCh[0]
        let newEndVnode = newCh[newEndIdx]
        let oldKeyToIdx, idxInOld, elmToMove, before

        while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
            if (oldStartVnode == null) {
                oldStartVnode = oldCh[++oldStartIdx] // ? 0 = null
            } else if (oldEndVnode == null) {
                oldEndVnode = oldCh[--oldEndIdx]
            } else if (newStartVnode == null) {
                newStartVnode = newCh[++newStartIdx]
            } else if (newEndVnode == null) {
                newEndVnode = newCh[--newEndIdx]
            } else if (isSameVnode(oldStartIdx, newStartVnode)) { // 1. oldStart和newStart相同
                // 不移动dom，patch属性？ 
                patchVnode(oldStartVnode, newStartVnode)
                oldStartVnode = oldCh[++oldStartIdx]
                newStartVnode = newCh[++newStartIdx]
            } else if (isSameVnode(oldStartVnode, newEndVnode)) { // 3. 头等于尾，删掉所有后面的子节点？
                patchVnode(oldStartVnode, newEndVnode)

                api.insertBefore(parentElm, oldStartVnode.elm, api.nextSibling(oldEndVnode.elm)) // 头移到尾
                oldStartVnode = oldCh[++oldStartIdx]
                newEndVnode = newCh[--newEndIdx]
            } else if (isSameVnode(oldEndVnode, newStartVnode)) { // 4. 尾等于头
                patchVnode(oldEndVnode)
                
                api.insertBefore(parentElm, oldEndVnode.elm, oldStartVnode.elm)
                oldEndVnode = oldCh[--oldEndIdx]
                newStartVnode = newCh[++newStartIdx]
            } else {
                // 4 个vnode都不相同
                if (oldKeyToIdx === undefined) {
                    oldKeyToIdx = createKeyToOldIdx(oldCh ,oldStartIdx, oldEndIdx)
                }
                // 寻找一个key相同的oldCh的idx
                idxInOld = oldKeyToIdx[newStartVnode.key]
                if (idxInOld == null) {
                    // newStartVnode 不存在
                    api.insertBefore(parentElm, createElm(newStartVnode), oldStartVnode.elm)
                    newStartVnode = newCh[++newStartIdx]
                } else {
                    // 找到了
                    elmToMove = oldCh[idxInOld]
                    if (elmToMove.type !== newStartVnode.type) { // type 不同，不能patch
                        api.insertBefore(parentElm, createElm(newStartVnode), oldStartVnode.elm)
                    } else {
                        patchVnode(elmToMove, newStartVnode)
                        oldCh[idxInOld] = undefined
                        api.insertBefore(parentElm, elmToMove.elm, oldStartVnode.elm) // 节省一次创建调用
                    }
                    newStartVnode = newCh[++newStartIdx]
                }
            }
        }

        if (oldStartIdx > oldEndIdx) {
            before = newCh[newEndIdx+1] == null ? null : newCh[newEndIdx+1].elm
            addVnodes(parentElm, before, newCh, newStartIdx, newEndIdx)
        } else if (newStartIdx > newEndIdx) {
            // 删除多余的oldCh
            removeVnode(parentElm, oldCh, oldStartIdx, oldEndIdx)
        }
    }

    function patchVnode(oldVnode, vnode) {
        const elm = vnode.elm = oldVnode.elm
        let oldCh = oldVnode.children
        let ch = vnode.children

        if (oldVnode === vnode) return

        // hook
        if (vnode.data) {
            for (i = 0; i < cbs.update.length; ++i) cbs.update[i](oldVnode, vnode)
        }

        if (vnode.text === undefined) {
            if (oldCh && ch) {
                if (oldCh !== ch) {
                    // 先处理子节点
                    updateChildren(elm, oldCh, ch)
                }
            } 
            // 添加新子节点
            else if (ch) {
                if (oldVnode.text) api.setTextContent(elm, '')
                addVnodes(elm, null, ch, 0, ch.length - 1)
            }
            // 删除所有旧节点
            else if (oldCh) {
                removeVnode(elm, oldCh, 0, oldCh.length - 1)
            }
            // 默认vnode中，text和children只存在一个
            else if (oldVnode.text) {
                api.setTextContent(elm, '')
            }
        }
        // vnode有text
        else if (oldVnode.text !== vnode.text) {
            api.setTextContent(elm, vnode.text)
        }
    }

    return function patch(oldVnode, vnode) {
        let elm, parent
        let i

        // oldVnode是elm
        if (!isVnode(oldVnode)) {
            oldVnode = emptyNodeAt(oldVnode)
        }

        if (isSameVnode(oldVnode, vnode)) {
            patchVnode(oldVnode, vnode)
        }
        else {
            elm = oldVnode.elm
            parent = api.parentNode(elm)

            createElm(vnode)

            if (parent !== null) {
                api.insertBefore(parent, vnode.elm, api.nextSibling(elm))
                removeVnode(parent, [oldVnode], 0, 0)
            }
        }

        // 省略hook的调用

        return vnode
    }

}