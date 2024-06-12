const renderPart = (part, params) => {
    if (typeof(part) === 'function') {
        return part(params)
    }
    return part
}

const delay = (msec) => new Promise(resolve => setTimeout(resolve, msec))

export {
    renderPart,
    delay
}
