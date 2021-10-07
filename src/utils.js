
const isArray = Array.isArray

const isPrimitive = val => {
    const type = typeof val
    return type === 'number' || type === 'string'
}

const flattenArray = array => {
    // apply\call\bind区别
    // apply: 接受两个参数，第一个是this，第二个是参数数组.
    // call: 第一个是this，后面是参数列表.
    // bind: 类似call，但后面参数列表可以分次传入
    // 共同点：改变方法的this指针，当传入的this是null或undefined是则是window
    // 不同点：apply只允许两个参数，在...操作符出现前在某些场景下唯一可选

    return Array.prototype.concat.apply([], array)
}

export {
    isArray,
    isPrimitive,
    flattenArray
}