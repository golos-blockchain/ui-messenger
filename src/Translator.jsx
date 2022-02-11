import React from 'react'
import tt from 'counterpart'
import { IntlProvider } from 'react-intl'
import { connect } from 'react-redux'

tt.registerTranslations('en', require('app/locales/en.json'))
tt.registerTranslations('ru', require('app/locales/ru-RU.json'))


class Translator extends React.Component {
    render() {
        const { locale } = this.props
        const localeWithoutRegionCode = locale.split('-')[0]
        tt.setLocale(localeWithoutRegionCode);
        tt.setFallbackLocale('en');
        return (
            <IntlProvider
                key={localeWithoutRegionCode}
                locale={localeWithoutRegionCode}
                defaultLocale={localeWithoutRegionCode}
            >
                {this.props.children}
            </IntlProvider>
        );
    }
}

export default connect(
    (state, ownProps) => {
        const locale = state.user.get('locale')
        return {
            locale
        }
    }
)(Translator)
