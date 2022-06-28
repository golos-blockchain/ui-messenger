import tt from 'counterpart'

export function translateError(string) {
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
            return string
    }
}
