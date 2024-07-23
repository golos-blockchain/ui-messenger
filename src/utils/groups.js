import { proxifyImageUrlWithStrip } from 'app/utils/ProxifyUrl'

const getMemberType = (member_list, username) => {
    const mem = member_list.find(pgm => pgm.account === username)
    const { member_type } = (mem || {})
    return member_type
}

const getGroupMeta = (json_metadata) => {
    let meta
    if (json_metadata) {
        meta = JSON.parse(json_metadata)
    }
    meta = meta || {} // node allows null, object, array... or empty json_metadata
    return meta
}

const getGroupTitle = (meta, name, maxLength = 20) => {
    const title = meta.title || name
    let titleShr = title
    if (titleShr.length > maxLength) {
        titleShr = titleShr.substring(0, maxLength - 3) + '...'
    }
    return titleShr
}

const getGroupLogo = (json_metadata) => {
    const meta = getGroupMeta(json_metadata)

    let { logo } = meta
    if (logo && /^(https?:)\/\//.test(logo)) {
        const size = '75x75'
        logo = proxifyImageUrlWithStrip(logo, size)
    } else {
        logo = require('app/assets/images/user.png')
    }
    return logo
}

export {
    getMemberType,
    getGroupMeta,
    getGroupTitle,
    getGroupLogo,
}
