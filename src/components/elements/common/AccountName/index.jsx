import React from 'react'
import tt from 'counterpart'
import AsyncSelect from 'react-select/async'
import { api } from 'golos-lib-js'

import Userpic from 'app/components/elements/Userpic'

class AccountName extends React.Component {
    constructor(props) {
        super(props)
    }

    lookupAccounts = async (value) => {
        try {
            const { includeFrozen, filterAccounts } = this.props
            const accNames = await api.lookupAccountsAsync(value.toLowerCase(), 6, {
                include_frozen: includeFrozen,
                filter_accounts: [...filterAccounts],
            })
            const accs = await api.lookupAccountNamesAsync(accNames)
            return accs
        } catch (err) {
            console.error(err)
            return []
        }
    }

    onChange = (acc) => {
        const { onChange } = this.props
        if (onChange) {
            const e = { target: { value: acc.name, account: acc } }
            onChange(e, acc)
        }
    }

    render() {
        const { onChange, className, ...rest } = this.props
        return <AsyncSelect
            placeholder={tt('g.name')}
            loadingMessage={() => tt('account_name_jsx.loading')}
            noOptionsMessage={() => tt('account_name_jsx.no_options')}

            loadOptions={this.lookupAccounts}
            defaultOptions={true}
            cacheOptions={false}

            className={'AccountName ' + (className || ' ')}
            getOptionLabel={(option) => {
                return <span className='name-item'>
                    <Userpic account={option.name} width={24} height={24} />
                    <span className='title' style={{ verticalAlign: 'top' }}>{`${option.name}`}</span>
                </span>
            }}
            controlShouldRenderValue={false}
            onChange={this.onChange}
            {...rest}
        />
    }
}

AccountName.defaultProps = {
    includeFrozen: false,
    filterAccounts: [],
}

export default AccountName
