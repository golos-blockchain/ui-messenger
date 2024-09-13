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
    let isDefault = false
    if (logo && /^(https?:)\/\//.test(logo)) {
        const size = '75x75'
        logo = proxifyImageUrlWithStrip(logo, size)
    } else {
        logo = require('app/assets/images/group.png')
        isDefault = true
    }
    return {url: logo, isDefault }
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

const opGroup = (op) => {
    let group = ''
    if (!op) return group
    const { extensions } = op
    if (extensions) {
        for (const ext of extensions) {
            if (ext && ext[0] === 0) {
                group = (ext[1] && ext[1].group) || group
            }
        }
    }
    return group
}

export {
    getGroupMeta,
    getGroupTitle,
    getGroupLogo,
    getMemberType,
    getRoleInGroup,
    opGroup,
}
