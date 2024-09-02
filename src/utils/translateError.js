import tt from 'counterpart'
import { Asset } from 'golos-lib-js/lib/utils'

const getErrorData = (errPayload, errName, depth = 0) => {
    //console.error('getErrorData', errPayload)
    if (depth > 50) {
        throw new Error('getErrorData - infinity loop detected...')
    }
    if (!errPayload) {
        return null
    }
    console.error(errPayload.name)
    if (errPayload.name === errName) {
        let { stack } = errPayload
        stack = stack && stack[0]
        return stack ? stack.data : null
    }
    const { error, data } = errPayload
    if (error) {
        return getErrorData(error, errName, ++depth)
    }
    if (data) {
        if (data.error) {
            return getErrorData(data.error, errName, ++depth)
        }
        if (Array.isArray(data.stack)) {
            for (const s of data.stack) {
                const res = getErrorData(s, errName, ++depth)
                if (res) {
                    return res
                }
            }
        }
    }
    return null
}

export function translateError(string, errPayload) {
    if (typeof(string) != 'string') return string
    switch (string) {
        case 'Account not found':
            return tt('g.account_not_found')
        case 'Incorrect Password':
            return tt('g.incorrect_password')
        case 'Posting Not Memo Please':
            return tt('g.posting_not_memo')
        case 'Username does not exist':
            return tt('g.username_does_not_exist')
        case 'Account is frozen':
            return tt('loginform_jsx.account_frozen')
        case 'Account name should be longer.':
            return tt('g.account_name_should_be_longer')
        case 'Account name should be shorter.':
            return tt('g.account_name_should_be_shorter')
        case 'Account name should start with a letter.':
            return tt('g.account_name_should_start_with_a_letter')
        case 'Account name should have only letters, digits, or dashes.':
            return tt('g.account_name_should_have_only_letters_digits_or_dashes')
        case 'vote currently exists, user must be indicate a desire to reject witness':
            return tt('g.vote_currently_exists_user_must_be_indicate_a_to_reject_witness')
        case 'Only one Steem account allowed per IP address every 10 minutes':
            return tt('g.only_one_APP_NAME_account_allowed_per_ip_address_every_10_minutes')
        case 'Cannot increase reward of post within the last minute before payout':
            return tt('g.cannot_increase_reward_of_post_within_the_last_minute_before_payout')
        default:
            break
    }

    if (string.includes(
        'Account exceeded maximum allowed bandwidth per vesting share'
    )) {
        string = tt('chain_errors.exceeded_maximum_allowed_bandwidth')
        return string
    }

    if (string.includes(
        'Account does not have sufficient funds'
    )) {
        string = tt('donate_jsx.insufficient_funds') + '.'

        let errData
        try {
            errData = getErrorData(errPayload, 'insufficient_funds')
            if (errData && errData.required) {
                let { required, exist } = errData
                string += ' ' + tt('chain_errors.insufficient1')
                string += Asset(required).floatString
                exist = Asset(exist)
                if (exist.gt(0)) {
                    string += tt('chain_errors.insufficient2')
                    string += exist.floatString
                    string += tt('chain_errors.insufficient3')
                } else {
                    string += '.'
                }
                return string
            }
        } catch (err) {
            console.error('getErrorData', err)
        }
    }

    if (string.includes(
        'Too low golos power'
    )) {
        let errData
        try {
            errData = getErrorData(errPayload, 'logic_exception')
            if (errData && errData.r) {
                string = tt('messages.too_low_gp')
                string += Asset(errData.r).floatString
                string += tt('messages.too_low_gp2')
                return string
            }
        } catch (err) {
            console.error('getErrorData', err)
        }
    }

    if (string.includes('You should be moder')) {
        string = tt('messages.you_not_moder')
        return string
    }

    return string
}
