const renderPart = (part, params) => {
    if (typeof(part) === 'function') {
        return part(params)
    }
    return part
}

const delay = (msec) => new Promise(resolve => setTimeout(resolve, msec))

const maxDate = () => {
    return new Date(4294967295 * 1000)
}

const maxDateStr = () => {
    return maxDate().toISOString().split('.')[0]
}

const isBlockedByMe = (acc) => {
    return acc && acc.relations && acc.relations.me_to_them === 'blocking'
}

const isBlockingMe = (acc) => {
    return acc && acc.relations && acc.relations.they_to_me === 'blocking'
}

export {
    renderPart,
    delay,
    maxDate,
    maxDateStr,
    isBlockedByMe,
    isBlockingMe,
}
