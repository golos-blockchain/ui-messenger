import React from 'react';
import PropTypes from 'prop-types'

import Icon from 'app/components/elements/Icon'
import VerticalMenu from 'app/components/elements/VerticalMenu'

export function findParent(el, class_name) {
    if (el.className && el.className.indexOf && el.className.indexOf(class_name) !== -1) return el;
    if (el.parentNode) return findParent(el.parentNode, class_name);
    return null;
}

export default class DropdownMenu extends React.Component {
    static propTypes = {
        items: PropTypes.arrayOf(PropTypes.object).isRequired,
        selected: PropTypes.string,
        children: PropTypes.object,
        className: PropTypes.string,
        title: PropTypes.string,
        href: PropTypes.string,
        el: PropTypes.string.isRequired,
        noArrow: PropTypes.bool
    };

    constructor(props) {
        super(props);
        this.state = {
            shown: false,
            selected: props.selected
        };
    }

    componentWillUnmount() {
        document.removeEventListener('click', this.hide);
    }

    toggle = (e) => {
        const {shown} = this.state
        if(shown) this.hide(e)
        else this.show(e)
    }

    show = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.setState({shown: true});
        document.addEventListener('click', this.hide);
    };

    hide = (e) => {
        // Do not hide the dropdown if there was a click within it.
        const inside_dropdown = !!findParent(e.target, 'VerticalMenu');
        if (inside_dropdown) return;

        e.preventDefault();
        this.setState({shown: false});
        document.removeEventListener('click', this.hide);
    };

    navigate = (e) => {
        const a = e.target.nodeName.toLowerCase() === 'a' ? e.target : e.target.parentNode;
        this.setState({show: false});
        if (a.host !== window.location.host) return;
        e.preventDefault();
        //browserHistory.push(a.pathname + a.search);
    };

    getSelectedLabel = (items, selected) => {
        const selectedEntry = items.find(i => i.value === selected)
        const selectedLabel = selectedEntry && selectedEntry.label ? selectedEntry.label : selected
        return selectedLabel
    }

    render() {
        const {el, items, selected, children, className, title, href, noArrow} = this.props;
        const hasDropdown = items.length > 0

        let entry = children || <span key='label'>
                {this.getSelectedLabel(items, selected)}
                {hasDropdown && !noArrow && <Icon name="dropdown-arrow" />}
            </span>

        if(hasDropdown) entry = <a key="entry" href={href || '#'} onClick={this.toggle}>{entry}</a>

        const menu = <VerticalMenu key="menu" title={title} items={items} hideValue={selected} className="VerticalMenu" />;
        const cls = 'DropdownMenu' + (this.state.shown ? ' show' : '') + (className ? ` ${className}` : '')
        return React.createElement(el, {className: cls}, [entry, menu]);
    }
}

