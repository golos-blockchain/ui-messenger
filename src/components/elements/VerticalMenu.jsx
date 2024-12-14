import React from 'react';
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'

import ExtLink from 'app/components/elements/ExtLink'
import Icon from 'app/components/elements/Icon'

export default class VerticalMenu extends React.Component {
    static propTypes = {
        items: PropTypes.arrayOf(PropTypes.object).isRequired,
        title: PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.object
        ]),
        className: PropTypes.string,
        hideValue: PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.element
        ]),
    };

    closeMenu = (e) => {
        // If this was not a left click, or if CTRL or CMD were held, do not close the menu.
        if(e.button !== 0 || e.ctrlKey || e.metaKey) return;

        // Simulate clicking of document body which will close any open menus
        document.body.click();
    }

    render() {
        const {items, title, description, className, hideValue} = this.props;
        return <ul className={'VerticalMenu menu vertical' + (className ? ' ' + className : '')}>
            {title && <li className="title">{title}</li>}
            {description && <li className="description">{description}</li>}
            {items.map((i, k) => {
                if(i.value === hideValue) return null
                const iconSize = i.iconSize || '1x'
                const target = i.target
                const LinkType = i.extLink ? ExtLink : Link
                const service = i.extLink || undefined
                return <li data-link={i.link} data-value={i.value} key={i.key ? i.key : i.value} onClick={i.link ? this.closeMenu : null}>
                    {i.link ? <LinkType to={i.link} target={target} onClick={i.onClick} onTouchStart={i.onTouchStart} onTouchEnd={i.onTouchEnd} service={service}>
                        {i.icon && <Icon name={i.icon} size={iconSize} />}{i.label ? i.label : i.value}
                        {i.data && <span>{i.data}</span>}
                        &nbsp; {i.addon}
                    </LinkType> :
                    <span>
                        {i.icon && <Icon name={i.icon} size={iconSize} />}{i.label ? i.label : i.value}
                    </span>
                    }
                </li>
            })}
        </ul>;
    }
}
