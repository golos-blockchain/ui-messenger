import React from 'react'
import tt from 'counterpart'
import { IntlProvider } from 'react-intl'

tt.registerTranslations('en', require('app/locales/en.json'))
tt.registerTranslations('ru', require('app/locales/ru-RU.json'))

const localeWithoutRegionCode = 'ru'
tt.setLocale(localeWithoutRegionCode);
tt.setFallbackLocale('en');

class Translator extends React.Component {
    render() {
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

export default Translator
