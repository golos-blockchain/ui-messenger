import { proxifyImageUrlWithStrip } from 'app/utils/ProxifyUrl'

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

const getMemberType = (member_list, username) => {
    const mem = member_list.find(pgm => pgm.account === username)
    const { member_type } = (mem || {})
    return member_type
}

const getRoleInGroup = (group, username) => {
    if (group.toJS) group = group.toJS()
    const { owner, member_list } = group
    const memberType = member_list && getMemberType(member_list, username)

    const amOwner = owner === username
    const amModer = amOwner || memberType === 'moder'
    const amPending = memberType === 'pending'
    const amMember = memberType === 'member'
    const amBanned = memberType === 'banned'

    return { amOwner, amModer, amPending, amMember, amBanned }
}

export {
    getGroupMeta,
    getGroupTitle,
    getGroupLogo,
    getMemberType,
    getRoleInGroup,
}