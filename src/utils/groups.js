import { proxifyImageUrlWithStrip } from 'app/utils/ProxifyUrl'

const getGroupMeta = (json_metadata) => {
    let meta
    if (json_metadata) {
        meta = JSON.parse(json_metadata)
    }
    meta = meta || {} // node allows null, object, array... or empty json_metadata
    return meta
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
    getGroupMeta,
    getGroupLogo
}
