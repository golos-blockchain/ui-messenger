import max from 'lodash/max'

import { proxifyImageUrl } from 'app/utils/ProxifyUrl'

/**
 * Returns profile image if set, or default avatar image.
 */
export function getProfileImage(account, size = 48) {
    if (account && account.json_metadata) {
        try {
            const md = JSON.parse(account.json_metadata);
            if (md.profile) {
                let url = md.profile.profile_image;
                if (url && /^(https?:)\/\//.test(url)) {
                    size = size > 75 ? '200x200' : '75x75';
                    url = proxifyImageUrl(url, size);
                    return url;
                }
            }
        } catch (e) {
            console.error(e);
        }
    }
    return require('app/assets/images/user.png');
}

/**
 * Returns last data when account last seen website.
 */
export function getLastSeen(account) {
    const dates = [
        account.last_bandwidth_update, // all operations
        account.created,
    ];
    const last = account.last_seen || max(dates);
    return (!last || last.startsWith('19')) ? null : last;
}
