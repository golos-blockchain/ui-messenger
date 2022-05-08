const renderPart = (part, params) => {
    if (typeof(part) === 'function') {
        return part(params)
    }
    return part
}

export {
    renderPart
}
