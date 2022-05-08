import React from 'react';

import './Toolbar.css';

export default function Toolbar(props) {
        const { title, leftItems, rightItems } = props;
        let rightPane = rightItems && (rightItems.content || rightItems)
        const rightFlex = rightItems && (rightItems.flex !== false)
        if (rightFlex) {
            rightPane = <div className='msgs-right-items'>{rightPane}</div>
        }
        return (
            <div className='msgs-toolbar'>
                <div className='msgs-left-items'>{ leftItems }</div>
                <h1 className='msgs-toolbar-title'>{ title }</h1>
                {rightPane}
            </div>
        );
}
