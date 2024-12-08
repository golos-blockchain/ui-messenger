import React from 'react'
import tt from 'counterpart'
import AsyncSelect from 'react-select/async'
import { api } from 'golos-lib-js'

import Userpic from 'app/components/elements/Userpic'

class AccountName extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            defaultOptions: [],
            isLoading: false,
        }
        this.ref = React.createRef()
    }

    onAccountsLoad = (accs) => {
        const { onAccountsLoad } = this.props
        onAccountsLoad(accs)
    }

    lookupAccounts = async (value) => {
        try {
            //await new Promise(resolve => setTimeout(resolve, 2000))
            const { includeFrozen, filterAccounts } = this.props
            const accNames = await api.lookupAccountsAsync(value.toLowerCase(), 6, {
                include_frozen: includeFrozen,
                filter_accounts: [...filterAccounts],
            })
            const accs = await api.lookupAccountNamesAsync(accNames)
            this.onAccountsLoad(accs)
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

    onMenuOpen = async (e) => {
        const { current } = this.ref
        if (!current) { console.warn('No AsyncSelect ref'); return; }
        const target = current.inputRef
        if (!target) { console.warn('No inputRef'); return; }
        const { value } = target
        if (!value) {
            this.setState({
                isLoading: true,
                defaultOptions: []
            }, async () => {
                const defaultOptions = await this.lookupAccounts('')
                this.setState({
                    isLoading: false,
                    defaultOptions
                })
            })
        }
    }

    testIt = (e) => {
        e.preventDefault()
        console.log(this.state.dop)
        if (this.state.dop === true)
        this.setState({
            dop: []
        }); else this.setState({
            dop: true
        })
    }

    render() {
        const { onChange, className, ...rest } = this.props
        const { defaultOptions, isLoading } = this.state
        // isOptionSelected = false disables blue bg if opened not first time
        return <AsyncSelect
            placeholder={tt('g.name')}
            loadingMessage={() => tt('account_name_jsx.loading')}
            noOptionsMessage={() => tt('account_name_jsx.no_options')}

            loadOptions={this.lookupAccounts}
            isLoading={isLoading}
            defaultOptions={defaultOptions}
            cacheOptions={false}
            onMenuOpen={this.onMenuOpen}
            ref={this.ref}
            isOptionSelected={() => false}

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
