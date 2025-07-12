import React from 'react';
import PropTypes from 'prop-types';

const icons = new Map([
    ['user', require('app/assets/icons/user.svg?raw')],
    // ['share', require('app/assets/icons/share.svg?raw')],
    // ['calendar', require('app/assets/icons/calendar.svg?raw')],
    // ['caret-down', require('app/assets/icons/caret-down.svg?raw')],
    // ['chevron-up-circle', require('app/assets/icons/chevron-up-circle.svg?raw')],
    // ['chevron-down-circle', require('app/assets/icons/chevron-down-circle.svg?raw')],
    ['chevron-left', require('app/assets/icons/chevron-left.svg?raw')],
    ['chevron-right', require('app/assets/icons/chevron-right.svg?raw')],
    // ['chatboxes', require('app/assets/icons/chatboxes.svg?raw')],
    ['cross', require('app/assets/icons/cross.svg?raw')],
    // ['chatbox', require('app/assets/icons/chatbox.svg?raw')],
    // ['trade', require('app/assets/icons/trade.svg?raw')],
    // ['facebook', require('app/assets/icons/facebook.svg?raw')],
    // ['twitter', require('app/assets/icons/twitter.svg?raw')],
    // ['github', require('app/assets/icons/github.svg?raw')],
    // ['linkedin', require('app/assets/icons/linkedin.svg?raw')],
    ['pencil', require('app/assets/icons/pencil.svg?raw')],
    // ['vk', require('app/assets/icons/vk.svg?raw')],
    // ['link', require('app/assets/icons/link.svg?raw')],
    ['clock', require('app/assets/icons/clock.svg?raw')],
    // ['copy', require('app/assets/icons/copy.svg?raw')],
    // ['extlink', require('app/assets/icons/extlink.svg?raw')],
    ['golos', require('app/assets/icons/golos.svg?raw')],
    ['dropdown-arrow', require('app/assets/icons/dropdown-arrow.svg?raw')],
    // ['printer', require('app/assets/icons/printer.svg?raw')],
    ['search', require('app/assets/icons/search.svg?raw')],
    // ['menu', require('app/assets/icons/menu.svg?raw')],
    // ['voter', require('app/assets/icons/voter.svg?raw')],
    ['voters', require('app/assets/icons/voters.svg?raw')],
    // ['empty', require('app/assets/icons/empty.svg?raw')],
    // ['flag1', require('app/assets/icons/flag1.svg?raw')],
    // ['flag2', require('app/assets/icons/flag2.svg?raw')],
    // ['reblog', require('app/assets/icons/reblog.svg?raw')],
    // ['pin', require('app/assets/icons/pin.svg?raw')],
    // ['photo', require('app/assets/icons/photo.svg?raw')],
    // ['line', require('app/assets/icons/line.svg?raw')],
    // ['video', require('app/assets/icons/video.svg?raw')],
    // ['eye', require('app/assets/icons/eye.svg?raw')],
    // ['eye_strike', require('app/assets/icons/eye_strike.svg?raw')],
    // ['eye_gray', require('app/assets/icons/eye_gray.svg?raw')],
    // ['location', require('app/assets/icons/location.svg?raw')],
    ['info_o', require('app/assets/icons/info_o.svg?raw')],
    // ['feedback', require('app/assets/icons/feedback.svg?raw')],
    // ['cog', require('app/assets/icons/cog.svg?raw')],
    // ['enter', require('app/assets/icons/enter.svg?raw')],
    // ['profile', require('app/assets/icons/profile.svg?raw')],
    // ['key', require('app/assets/icons/key.svg?raw')],
    ['reply', require('app/assets/icons/reply.svg?raw')],
    // ['replies', require('app/assets/icons/replies.svg?raw')],
    // ['wallet', require('app/assets/icons/wallet.svg?raw')],
    // ['home', require('app/assets/icons/home.svg?raw')],
    // ['lj', require('app/assets/icons/lj.svg?raw')],
    // ['arrow', require('app/assets/icons/arrow.svg?raw')],
    // ['envelope', require('app/assets/icons/envelope.svg?raw')],
    // ['male', require('app/assets/icons/male.svg?raw')],
    // ['female', require('app/assets/icons/female.svg?raw')],
    // ['money', require('app/assets/icons/money.svg?raw')],
    // ['tips', require('app/assets/icons/tips.svg?raw')],
    ['team', require('app/assets/icons/team.svg?raw')],
    // ['rocket', require('app/assets/icons/rocket.svg?raw')],
    // ['blockchain', require('app/assets/icons/blockchain.svg?raw')],
    // ['shuffle', require('app/assets/icons/shuffle.svg?raw')],
    // ['hf/hf1', require('app/assets/icons/hf/hf1.svg?raw')],
    // ['hf/hf2', require('app/assets/icons/hf/hf2.svg?raw')],
    // ['hf/hf3', require('app/assets/icons/hf/hf3.svg?raw')],
    // ['hf/hf4', require('app/assets/icons/hf/hf4.svg?raw')],
    // ['hf/hf5', require('app/assets/icons/hf/hf5.svg?raw')],
    // ['hf/hf6', require('app/assets/icons/hf/hf6.svg?raw')],
    // ['hf/hf7', require('app/assets/icons/hf/hf7.svg?raw')],
    // ['hf/hf8', require('app/assets/icons/hf/hf8.svg?raw')],
    // ['hf/hf9', require('app/assets/icons/hf/hf9.svg?raw')],
    // ['hf/hf10', require('app/assets/icons/hf/hf10.svg?raw')],
    // ['hf/hf11', require('app/assets/icons/hf/hf11.svg?raw')],
    // ['hf/hf12', require('app/assets/icons/hf/hf12.svg?raw')],
    // ['hf/hf13', require('app/assets/icons/hf/hf13.svg?raw')],
    // ['hf/hf14', require('app/assets/icons/hf/hf14.svg?raw')],
    // ['hf/hf15', require('app/assets/icons/hf/hf15.svg?raw')],
    // ['hf/hf16', require('app/assets/icons/hf/hf16.svg?raw')],
    // ['hf/hf17', require('app/assets/icons/hf/hf17.svg?raw')],
    // ['hf/hf18', require('app/assets/icons/hf/hf18.svg?raw')],
    // ['hf/hf19', require('app/assets/icons/hf/hf19.svg?raw')],
    // ['hf/hf20', require('app/assets/icons/hf/hf20.svg?raw')],
    // ['vote', require('app/assets/icons/vote.svg?raw')],
    // ['flag', require('app/assets/icons/flag.svg?raw')],
    // ['new/vk', require('app/assets/icons/new/vk.svg?raw')],
    // ['new/facebook', require('app/assets/icons/new/facebook.svg?raw')],
    // ['new/twitter', require('app/assets/icons/new/twitter.svg?raw')],
    // ['new/telegram', require('app/assets/icons/new/telegram.svg?raw')],
    ['new/home', require('app/assets/icons/new/home.svg?raw')],
    ['new/blogging', require('app/assets/icons/new/blogging.svg?raw')],
    // ['new/comment', require('app/assets/icons/new/comment.svg?raw')],
    ['new/answer', require('app/assets/icons/new/answer.svg?raw')],
    ['new/wallet', require('app/assets/icons/new/wallet.svg?raw')],
    ['new/setting', require('app/assets/icons/new/setting.svg?raw')],
    ['new/logout', require('app/assets/icons/new/logout.svg?raw')],
    // ['new/bell', require('app/assets/icons/new/bell.svg?raw')],
    // ['new/messenger', require('app/assets/icons/new/messenger.svg?raw')],
    ['new/more', require('app/assets/icons/new/more.svg?raw')],
    // ['new/like', require('app/assets/icons/new/like.svg?raw')],
    // ['new/upvote', require('app/assets/icons/new/upvote.svg?raw')],
    // ['new/downvote', require('app/assets/icons/new/downvote.svg?raw')],
    // ['new/add', require('app/assets/icons/new/add.svg?raw')],
    // ['new/search', require('app/assets/icons/new/search.svg?raw')],
    // ['new/wikipedia', require('app/assets/icons/new/wikipedia.svg?raw')],
    ['new/envelope', require('app/assets/icons/new/envelope.svg?raw')],
    // ['new/monitor', require('app/assets/icons/new/monitor.svg?raw')],
    ['new/mention', require('app/assets/icons/new/mention.svg?raw')],
    // ['editor/plus-18', require('app/assets/icons/editor/plus-18.svg?raw')],
    ['editor/coin', require('app/assets/icons/editor/coin.svg?raw')],
    // ['editor/share', require('app/assets/icons/editor/share.svg?raw')],
    // ['editor/info', require('app/assets/icons/editor/info.svg?raw')],
    // ['editor/plus', require('app/assets/icons/editor/plus.svg?raw')],
    // ['editor/cross', require('app/assets/icons/editor/cross.svg?raw')],
    ['editor/eye', require('app/assets/icons/editor/eye.svg?raw')],
    // ['editor/k', require('app/assets/icons/editor/k.svg?raw')],
    // ['editor-toolbar/bold', require('app/assets/icons/editor-toolbar/bold.svg?raw')],
    // ['editor-toolbar/italic', require('app/assets/icons/editor-toolbar/italic.svg?raw')],
    // ['editor-toolbar/header', require('app/assets/icons/editor-toolbar/header.svg?raw')],
    // ['editor-toolbar/strike', require('app/assets/icons/editor-toolbar/strike.svg?raw')],
    // ['editor-toolbar/link', require('app/assets/icons/editor-toolbar/link.svg?raw')],
    // ['editor-toolbar/quote', require('app/assets/icons/editor-toolbar/quote.svg?raw')],
    // ['editor-toolbar/bullet-list', require('app/assets/icons/editor-toolbar/bullet-list.svg?raw')],
    // ['editor-toolbar/number-list', require('app/assets/icons/editor-toolbar/number-list.svg?raw')],
    // ['editor-toolbar/picture', require('app/assets/icons/editor-toolbar/picture.svg?raw')],
    // ['editor-toolbar/video', require('app/assets/icons/editor-toolbar/video.svg?raw')],
    // ['editor-toolbar/search', require('app/assets/icons/editor-toolbar/search.svg?raw')],
    ['ionicons/ban', require('app/assets/icons/ionicons/ban.svg?raw')],
    ['ionicons/ban-outline', require('app/assets/icons/ionicons/ban-outline.svg?raw')],
    ['ionicons/checkmark-circle', require('app/assets/icons/ionicons/checkmark-circle.svg?raw')],
    ['ionicons/checkmark-sharp', require('app/assets/icons/ionicons/checkmark-sharp.svg?raw')],
    ['ionicons/gift', require('app/assets/icons/ionicons/gift.svg?raw')],
    ['ionicons/happy-outline', require('app/assets/icons/ionicons/happy-outline.svg?raw')],
    ['ionicons/image-outline', require('app/assets/icons/ionicons/image-outline.svg?raw')],
    ['ionicons/language-outline', require('app/assets/icons/ionicons/language-outline.svg?raw')],
    ['ionicons/lock-closed-outline', require('app/assets/icons/ionicons/lock-closed-outline.svg?raw')],
    ['ionicons/lock-open-outline', require('app/assets/icons/ionicons/lock-open-outline.svg?raw')],
    ['ionicons/trash-outline', require('app/assets/icons/ionicons/trash-outline.svg?raw')],
    ['ionicons/person', require('app/assets/icons/ionicons/person.svg?raw')],
    ['ionicons/person-add', require('app/assets/icons/ionicons/person-add.svg?raw')],
    // ['notification/comment', require('app/assets/icons/notification/comment.svg?raw')],
    // ['notification/donate', require('app/assets/icons/notification/donate.svg?raw')],
    // ['notification/transfer', require('app/assets/icons/notification/transfer.svg?raw')],
    // ['notification/mention', require('app/assets/icons/notification/mention.svg?raw')],
    // ['notification/message', require('app/assets/icons/notification/message.svg?raw')],
    // ['notification/order', require('app/assets/icons/notification/order.svg?raw')],
]);

const rem_sizes = {
    '0_75x': '0.75',
    '0_95x': '0.95',
    '1x': '1.12',
    '1_25x': '1.25',
    '1_5x': '1.5',
    '1_75x': '1.75',
    '2x': '2',
    '3x': '3.45',
    '4x': '4.60',
    '5x': '5.75',
    '10x': '10.0',
};

export default class Icon extends React.PureComponent {
    static propTypes = {
        name: PropTypes.string.isRequired,
        size: PropTypes.oneOf([
            '0_75x',
            '0_95x',
            '1x',
            '1_25x',
            '1_5x',
            '1_75x',
            '2x',
            '3x',
            '4x',
            '5x',
            '10x',
        ]),
    };

    render() {
        const { name, size, className } = this.props;
        let classes = 'Icon ' + name;
        let style;

        if (size) {
            classes += ' Icon_' + size;
            style = { width: `${rem_sizes[size]}rem` };
        }

        if (className) {
            classes += ' ' + className;
        }

        const passProps = { ...this.props };
        delete passProps.name;
        delete passProps.size;
        delete passProps.className;

        return (
            <span
                {...passProps}
                className={classes}
                style={style}
                dangerouslySetInnerHTML={{ __html: icons.get(name) }}
            />
        );
    }
}
