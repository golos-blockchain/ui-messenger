import React from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import { LinkWithDropdown } from 'react-foundation-components/lib/global/dropdown'
import { withRouter } from 'react-router'
import golos from 'golos-lib-js'
import { fetchEx } from 'golos-lib-js/lib/utils'
import { Aes } from 'golos-lib-js/lib/auth/ecc'
import tt from 'counterpart'
import debounce from 'lodash/debounce';

import BackButtonController from 'app/components/elements/app/BackButtonController'
import AppUpdateChecker from 'app/components/elements/app/AppUpdateChecker'
import Icon from 'app/components/elements/Icon'
import Logo from 'app/components/elements/Logo'
import MarkNotificationRead from 'app/components/elements/MarkNotificationRead'
import NotifiCounter from 'app/components/elements/NotifiCounter'
import DialogManager from 'app/components/elements/common/DialogManager'
import AddImageDialog from 'app/components/dialogs/AddImageDialog'
import ChatError from 'app/components/elements/messages/ChatError'
import LetteredAvatar from 'app/components/elements/messages/LetteredAvatar'
import PageFocus from 'app/components/elements/messages/PageFocus'
import { renderStubs } from 'app/components/elements/Stub'
import Userpic from 'app/components/elements/Userpic'
import VerticalMenu from 'app/components/elements/VerticalMenu'
import Messenger from 'app/components/modules/messages/Messenger'
import MessagesTopCenter from 'app/components/modules/MessagesTopCenter'
import g from 'app/redux/GlobalReducer'
import transaction from 'app/redux/TransactionReducer'
import user from 'app/redux/UserReducer'
import { getRoleInGroup, opGroup } from 'app/utils/groups'
import { getProfileImage, } from 'app/utils/NormalizeProfile';
import { normalizeContacts, normalizeMessages } from 'app/utils/Normalizators';
import { fitToPreview } from 'app/utils/ImageUtils';
import { notificationSubscribe, notificationSubscribeWs, notifyWsPing,
    notificationShallowUnsubscribe, notificationTake, queueWatch, sendOffchainMessage } from 'app/utils/NotifyApiClient';
import { flash, unflash } from 'app/components/elements/messages/FlashTitle';
import { addShortcut } from 'app/utils/app/ShortcutUtils'
import { hideSplash } from 'app/utils/app/SplashUtils'
import { openAppSettings } from 'app/components/pages/app/AppSettings'
import { proxifyImageUrl } from 'app/utils/ProxifyUrl'

class Messages extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            contacts: [],
            messages: [],
            messagesCount: 0,
            selectedMessages: {},
            searchContacts: null,
            notifyErrors: 0,
        };
        this.cachedProfileImages = {};
        this.windowFocused = true;
        this.newMessages = 0;
        if (process.env.MOBILE_APP) {
            this.stopService()
        }
        this.composeRef = React.createRef()
    }

    getToAcc = () => {
        let { to } = this.props
        if (to) to = to.replace('@', '')
        return to
    }

    getGroupName = () => {
        const { the_group } = this.props
        return the_group ? the_group.name : ''
    }

    markMessages() {
        const { messages } = this.state;
        if (!messages.length) return;

        const { account, accounts, } = this.props;
        const to = this.getToAcc()

        let OPERATIONS = golos.messages.makeDatedGroups(messages, (message_object, idx) => {
            return message_object.toMark && !message_object._offchain;
        }, (group, indexes, results) => {
            const json = JSON.stringify(['private_mark_message', {
                from: accounts[to].name,
                to: account.name,
                ...group,
            }]);
            return ['custom_json',
                {
                    id: 'private_message',
                    required_posting_auths: [account.name],
                    json,
                }
            ];
        }, messages.length - 1, -1);

        this.props.sendOperations(account, accounts[to], OPERATIONS);
    }

    markMessages2 = debounce(this.markMessages, 1000);

    flashMessage() {
        ++this.newMessages;

        let title = this.newMessages;
        const plural = this.newMessages % 10;

        if (plural === 1) {
            if (this.newMessages === 11)
                title += tt('messages.new_message5');
            else
                title += tt('messages.new_message1');
        } else if ((plural === 2 || plural === 3 || plural === 4) && (this.newMessages < 10 || this.newMessages > 20)) {
            title += tt('messages.new_message234');
        } else {
            title += tt('messages.new_message5');
        }

        flash(title);
    }

    notifyErrorsClear = () => {
        if (this.state.notifyErrors)
            this.setState({
                notifyErrors: 0,
            });
    };

    notifyErrorsInc = (score) => {
        this.setState({
            notifyErrors: this.state.notifyErrors + score,
        });
    };

    checkLoggedOut = (username) => {
        if (this.props.username !== username) {
            console.log('Logged out, stopping notify taking.')
            return true
        }
        return false
    }

    onPause = () => {
        this.paused = true
        this.pausedTime = Date.now()
        const { username } = this.props
        const session = localStorage.getItem('X-Session')
        const notifyHost = $GLS_Config.notify_service.host
        if (username && session) {
            const lastTake = window.__lastTake || 0
            cordova.exec((winParam) => {
                console.log('pause ok', winParam)
            }, (err) => {
                console.error('pause err', err)
            }, 'CorePlugin', 'startService', [username, session, lastTake, notifyHost])
        }
    }

    onResume = () => {
        this.paused = false
        if (this.pausedTime) {
            const elapsed = Date.now() - this.pausedTime
            if (elapsed > 60*1000) {
                const { to, contacts, account, nodeError } = this.props
                if (contacts && account && !nodeError) {
                    this.props.fetchState(to)
                }
            }
        }
        this.stopService()
    }
    
    stopService = () => {
        cordova.exec((winParam) => {
            console.log('resume ok', winParam)
        }, (err) => {
            console.error('resume err', err)
        }, 'CorePlugin', 'stopService', [])
    }

    async watchGroup(to) {
        if (!to || to.startsWith('@')) {
            return true
        }

        const {username} = this.props
        if (!username) {
            console.log('watchGroup -', to, ' - no username')
            return false
        }
        try {
            await queueWatch(username, to)
            console.log('watchGroup - ', to)
            return true
        } catch (err) {
            console.error('watchGroup - ', to, err)
            this.notifyErrorsInc(30)
        }
        return false
    }

    async setCallback(username, removeTaskIds) {
        if (process.env.NO_NOTIFY) { // config-overrides.js, yarn run dev
            return
        }
        if (this.checkLoggedOut(username)) return
        if (this.paused) {
            setTimeout(() => {
                this.setCallback(username, removeTaskIds)
            }, 250)
            return
        }
        let subscribed = null
        try {
            subscribed = await notificationSubscribeWs(username, (err, event) => {
                for (const task of event.tasks) {
                    const { scope, data, timestamp } = task
                    const [ type, op ] = data
                    //alert(scope + ' ' + type + op +' ' + timestamp)
                    const isDonate = type === 'donate'
                    const toAcc = this.getToAcc()
                    const group = opGroup(op)
                    let updateMessage = group === this.state.to || (!group && (op.from === toAcc || 
                        op.to === toAcc))
                    const isMine = username === op.from;
                    if (type === 'private_message') {
                        if (op.update) {
                            this.props.messageEdited(op, timestamp, updateMessage, isMine);
                        } else if (this.nonce !== op.nonce) {
                            this.props.messaged(op, timestamp, updateMessage, isMine);
                            this.nonce = op.nonce
                            if (!isMine && !this.windowFocused) {
                                this.flashMessage();
                            }
                        }
                    } else if (type === 'private_delete_message') {
                        this.props.messageDeleted(op, updateMessage, isMine);
                    } else if (type === 'private_mark_message') {
                        this.props.messageRead(op, timestamp, updateMessage, isMine);
                    } else if (isDonate) {
                        this.props.messageDonated(op, updateMessage, isMine)
                    }
                }
            })
            console.log('WSS:', subscribed)
        } catch (ex) {
            console.error('notificationSubscribe', ex)
            this.notifyErrorsInc(15)
            setTimeout(() => {
                this.setCallback(username)
            }, 5000)
            return
        }
        this.notifyErrorsClear()
        const ping = async (firstCall = false) => {
            if (!firstCall) {
                try {
                    await notifyWsPing()
                    if (this.state.notifyErrors) {
                        // Queue can be cleared by Notify
                        setTimeout(() => {
                            this.setCallback(username)
                        }, 100)
                        return
                    }
                    this.notifyErrorsClear()
                } catch (err) {
                    console.error('Notify ping failed', err)
                    this.notifyErrorsInc(10)
                }
            }
            setTimeout(ping, 10000)
        }
        ping(true)
        this.watchGroup(this.props.to)
    }

    componentDidMount() {
        // Replacing shortcut (already added) with localized one
        if (process.env.MOBILE_APP) {
            addShortcut({
                id: 'the_settings',
                shortLabel: tt('app_settings.shortcut'),
                longLabel: tt('app_settings.shortcut_desc'),
                hash: '#app-settings'
            })
            document.addEventListener('pause', this.onPause)
            document.addEventListener('resume', this.onResume)
        }
        this.props.loginUser()
        this.checkUserAuth(true)
    }

    checkUserAuth = (initial) => {
        const checkAuth = () => {
            this.props.checkAuth(this.props.currentUser, this.isChat())
        }
        if (!initial || !localStorage.getItem('msgr_auth')) {
            checkAuth()
        } else {
            setTimeout(() => {
                checkAuth()
            }, 500)
        }
    }

    componentDidUpdate(prevProps) {
        const loggedNow = this.props.username !== prevProps.username && this.props.username
        if (this.props.to !== prevProps.to || (this.isChat() && loggedNow)) {
            this.checkUserAuth()
        }
        if (loggedNow) {
            this.props.fetchState(this.props.to);
            this.setCallback(this.props.username)
        } else if (this.props.to !== this.state.to) {
            this.watchGroup(this.props.to)
            this.props.fetchState(this.props.to)
            if (this.state.to) {
                this.leaveChat()
            }
        }
        if (this.props.messages.size !== prevProps.messages.size
            || this.props.messages_update !== prevProps.messages_update
            || this.props.to !== this.state.to
            || this.props.contacts.size !== prevProps.contacts.size
            || this.props.memo_private !== prevProps.memo_private) {
            const { contacts, messages, accounts, currentUser } = this.props;
            const anotherChat = this.props.to !== this.state.to;
            this.setState({
                to: this.props.to, // protects from infinity loop
            });
            /*if (!this.props.checkMemo(currentUser)) {
                return;
            }*/
            const anotherKey = this.props.memo_private !== prevProps.memo_private;
            const added = this.props.messages.size > this.state.messagesCount;
            let focusTimeout = prevProps.messages.size ? 100 : 1000;

            const updateData = async () => {
                const newContacts = contacts.size ?
                    await normalizeContacts(contacts, accounts, currentUser, this.cachedProfileImages) :
                    this.state.contacts
                const decoded = await normalizeMessages(messages, accounts, currentUser, prevProps.to)
                this.setState({
                    contacts: newContacts,
                    messages: decoded,
                    messagesCount: messages.size,
                }, () => {
                    hideSplash()
                    if (added)
                        this.markMessages2();
                    setTimeout(() => {
                        this.focusInput();
                    }, focusTimeout);
                })
            }
            updateData()
        }
    }
    
    componentWillUnmount() {
        if (process.env.MOBILE_APP) {
            document.addEventListener('pause', this.onPause)
            document.addEventListener('resume', this.onResume)
        }
    }

    onConversationSearch = async (query, event) => {
        if (!query) {
            this.setState({
                searchContacts: null
            });
            return;
        }
        const accountNames = await golos.api.lookupAccounts(query, 6);

        const accountsArr = await golos.api.getAccounts([...accountNames]);

        let contacts = [];
        for (let account of accountsArr) {
            if (account.memo_key === 'GLS1111111111111111111111111111111114T1Anm'
                || account.name === this.props.account.name) {
                continue;
            }
            account.contact = account.name;
            const { url, isDefault } = getProfileImage(account, this.cachedProfileImages)
            if (!isDefault) {
                account.avatar = url
            }
            contacts.push(account);
        }
        if (contacts.length === 0) {
            contacts = [{
                contact: tt('messages.search_not_found'),
                avatar: require('app/assets/images/user.png'),
                isSystemMessage: true
            }];
        }
        this.setState({
            searchContacts: contacts
        });

        if (this.searchHider) {
            clearTimeout(this.searchHider);
        }
        this.searchHider = setTimeout(() => {
            if (this.state.searchContacts) {
                this.setState({
                    searchContacts: null
                });
            }
        }, 10000);
    };

    leaveChat = () => {
        this.setState({
            replyingMessage: null,
            selectedMessages: {}
        }, () => {
            // if editing - cancel edit
            if (this.editNonce) {
                this.restoreInput()
                this.editNonce = undefined
            }
            this.focusInput();
        })
    }

    onCancelReply = (event) => {
        this.setState({
            replyingMessage: null,
        }, () => {
            // if editing - cancel edit at all, not just remove reply
            if (this.editNonce) {
                this.restoreInput();
                this.editNonce = undefined;
            }
            this.focusInput();
        });
    };

    onSendMessage = (message, event) => {
        if (!message.length) return;
        const { account, accounts, currentUser, messages, the_group } = this.props;
        const to = this.getToAcc()
        const private_key = currentUser.getIn(['private_keys', 'memo_private']);

        let editInfo;
        if (this.editNonce) {
            editInfo = { from: this.editFrom, nonce: this.editNonce }
        }

        this.props.sendMessage({
            senderAcc: account, memoKey: private_key, toAcc: accounts[to],
            group: this.isGroup() && the_group,
            body: message, editInfo, type: 'text', replyingMessage: this.state.replyingMessage,
            notifyAbort: this.notifyAbort
        })
        if (this.editNonce) {
            this.restoreInput();
            this.focusInput();
            this.editNonce = undefined;
        } else {
            this.setInput('');
        }
        if (this.state.replyingMessage)
            this.setState({
                replyingMessage: null,
            });
    };

    onMessageSelect = (message, idx, isSelected, event) => {
        if (message.receive_date.startsWith('19') || message.deleting) {
            this.focusInput();
            return;
        }
        if (isSelected) {
            this.presaveInput();
            const { account } = this.props;

            let selectedMessages = {...this.state.selectedMessages};

            let selectMessage = (msg, idx) => {
                const isMine = account.name === msg.from
                let canIEdit = isMine
                let canIDelete = true
                if (this.isGroup()) {
                    const { the_group } = this.props
                    const { amModer, amMember, amBanned } = getRoleInGroup(the_group, account.name)
                    if (amModer) {
                        canIEdit = true
                    } else if (amBanned || (the_group.privacy !== 'public_group' && !amModer && !amMember)) {
                        canIEdit = false
                    }
                    canIDelete = canIEdit
                }

                let isImage = false;
                let isInvalid = true;
                const { message } = msg;
                if (message) {
                    isImage = message.type === 'image';
                    isInvalid = !!message.invalid;
                }
                selectedMessages[msg.nonce] = {
                    editable: canIEdit && !isImage && !isInvalid,
                    deletable: canIDelete,
                    idx };
            };

            if (event.shiftKey) {
                let msgs = Object.entries(selectedMessages);
                if (msgs.length) {
                    const lastSelected = msgs[msgs.length - 1][1].idx;
                    const step = idx > lastSelected ? 1 : -1;
                    for (let i = lastSelected + step; i != idx; i += step) {
                        let message = this.state.messages[i];
                        selectMessage(message, i);
                    }
                }
            }

            selectMessage(message, idx);

            if (Object.keys(selectedMessages).length > 10) {
                this.props.showError(tt('messages.cannot_select_too_much_messages'));
                return;
            }

            this.setState({
                selectedMessages,
            });
        } else {
            let selectedMessages = {...this.state.selectedMessages};
            delete selectedMessages[message.nonce];

            this.setState({
                selectedMessages,
            }, () => {
                if (!Object.keys(selectedMessages).length) {
                    this.restoreInput();
                    this.focusInput();
                }
            });
        }
    };

    onPanelDeleteClick = (event) => {
        const { messages } = this.state;

        const { account, accounts, the_group } = this.props;
        const to = this.getToAcc()

        // TODO: works wrong if few messages have same create_time
        /*let OPERATIONS = golos.messages.makeDatedGroups(messages, (message_object, idx) => {
            return !!this.state.selectedMessages[message_object.nonce];
        }, (group, indexes, results) => {
            let from = '';
            let to = '';
            if (indexes.length === 1) {
                from = messages[indexes[0]].from;
                to = messages[indexes[0]].to;
            }
            const json = JSON.stringify(['private_delete_message', {
                requester: account.name,
                from,
                to,
                ...group,
            }]);
            return ['custom_json',
                {
                    id: 'private_message',
                    required_posting_auths: [account.name],
                    json,
                }
            ];
        }, messages.length - 1, -1);*/

        let OPERATIONS = [];
        for (let message_object of messages) {
            if (!this.state.selectedMessages[message_object.nonce]) {
                continue;
            }

            const extensions = []
            if (this.isGroup()) {
                extensions.push([0, {
                    group: the_group.name
                }])
            }

            const json = JSON.stringify(['private_delete_message', {
                requester: account.name,
                from: message_object.from,
                to: message_object.to,
                start_date: '1970-01-01T00:00:00',
                stop_date: '1970-01-01T00:00:00',
                nonce: message_object.nonce,
                extensions,
            }]);
            OPERATIONS.push(['custom_json',
                {
                    id: 'private_message',
                    required_posting_auths: [account.name],
                    json,
                }
            ]);
        }

        this.props.sendOperations(account, accounts[to], OPERATIONS, (err, errStr) => {
            this.props.showError(errStr, 10000)
        })

        this.setState({
            selectedMessages: {},
        }, () => {
            this.restoreInput();
            this.focusInput();
        });
    };

    onPanelReplyClick = (event) => {
        const nonce = Object.keys(this.state.selectedMessages)[0];
        let message = this.state.messages.filter(message => {
            return message.nonce === nonce;
        });
        // (additional protection - normally invalid messages shouldn't be available for select)
        if (!message[0].message)
            return;
        let quote = golos.messages.makeQuoteMsg({}, message[0]);
        this.setState({
            selectedMessages: {},
            replyingMessage: quote,
        }, () => {
            this.restoreInput();
            this.focusInput();
        });
    };

    onPanelEditClick = (event) => {
        const nonce = Object.keys(this.state.selectedMessages)[0];
        let message = this.state.messages.filter(message => {
            return message.nonce === nonce;
        });
        // (additional protection - normally invalid messages shouldn't be available for select)
        if (!message[0].message)
            return;
        this.setState({
            selectedMessages: {},
        }, () => {
            this.editNonce = message[0].nonce;
            this.editFrom = message[0].from
            if (message[0].message.quote) {
                this.setState({
                    replyingMessage: {quote: message[0].message.quote},
                });
            } else {
                this.setState({
                    replyingMessage: null,
                });
            }
            this.setInput(message[0].message.body);
            this.focusInput();
        });
    };

    onPanelCloseClick = (event) => {
        this.setState({
            selectedMessages: {},
        }, () => {
            this.restoreInput();
            this.focusInput();
        });
    };

    uploadImage = (imageFile, imageUrl) => {
        let sendImageMessage = (url, width, height) => {
            if (!url)
                return;

            const { account, accounts, the_group, currentUser, messages } = this.props;
            const to = this.getToAcc()
            const private_key = currentUser.getIn(['private_keys', 'memo_private']);
            this.props.sendMessage({
                senderAcc: account, memoKey: private_key, toAcc: accounts[to],
                group: this.isGroup() && the_group,
                body: url, type: 'image', meta: {width, height}, replyingMessage: this.state.replyingMessage,
                notifyAbort: this.notifyAbort
            });

            if (this.state.replyingMessage)
                this.setState({
                    replyingMessage: null,
                });
        };

        if (imageFile) {
            this.props.uploadImage({
                file: imageFile,
                progress: data => {
                    if (data.url) {
                        sendImageMessage(data.url, data.width, data.height);
                        this.focusInput();
                    }
                }
            });
        } else if (imageUrl) {
            let url = proxifyImageUrl(imageUrl);
            let img = new Image();
            img.onerror = img.onabort = () => {
                this.props.showError(tt('messages.cannot_load_image_try_again'));
            };
            img.onload = () => {
                sendImageMessage(url, img.width, img.height);
                this.focusInput();
            };
            img.src = url;
        }
    };

    onButtonImageClicked = (event) => {
        DialogManager.showDialog({
            component: AddImageDialog,
            onClose: (data) => {
                if (!data) {
                    this.focusInput();
                    return;
                }

                if (data.file) {
                    this.uploadImage(data.file);
                } else if (data.url) {
                    this.uploadImage(undefined, data.url);
                }
            },
        });
    };

    onImagePasted = (file, fileName) => {
        this.uploadImage(file);
    };

    onImageDropped = (acceptedFiles, rejectedFiles, event) => {
        const file = acceptedFiles[0];

        if (!file) {
            if (rejectedFiles.length) {
                DialogManager.alert(
                    tt('post_editor.please_insert_only_image_files')
                );
            }
            return;
        }

        this.uploadImage(file);
    };

    focusInput = (workOnMobile = false) => {
        if (!workOnMobile && window.IS_MOBILE_DEVICE) return;
        const input = document.getElementsByClassName('msgs-compose-input')[0];
        if (input) input.focus();
    };

    presaveInput = () => {
        if (this.presavedInput === undefined) {
            const input = document.getElementsByClassName('msgs-compose-input')[0];
            if (input) {
                this.presavedInput = input.value;
            }
        }
    };

    setInput = (value) => {
        if (this.composeRef.current) {
            this.composeRef.current.setInput(value)
        }
    };

    restoreInput = () => {
        if (this.presavedInput !== undefined) {
            this.setInput(this.presavedInput);
            this.presavedInput = undefined;
        }
    };
    
    _renderConversationTopLeft = () => {
        return [
            <Link to='/' key='logo'>
                <Logo />
            </Link>
        ]
    }

    _renderConversationTopRight = ({ isSmall }) => {
        if (isSmall) {
            const menuItems = this._renderMenuItems(isSmall)
            if (menuItems) {
                let content = <LinkWithDropdown
                    closeOnClickOutside
                    dropdownPosition="bottom"
                    dropdownAlignment="right"
                    dropdownContent={<VerticalMenu className={'VerticalMenu_nav-additional'} items={menuItems} />}
                >
                    <a href="#" onClick={e => e.preventDefault()}>
                        <div className='msgs-curruser-notify-sink' style={{ marginRight: '0.2rem' }}>
                            <div style={{ marginRight: '0.5rem' }}>
                            <Icon name="new/more" />
                            </div>
                            <div className='TopRightMenu__notificounter'>
                                <NotifiCounter fields='mention,donate,send,receive,fill_order,delegate_vs,new_sponsor,sponsor_inactive,nft_receive,nft_token_sold,nft_buy_offer,referral' />
                            </div>
                        </div>
                    </a>
                </LinkWithDropdown>
                return { content, flex: false }
            }
        }
        return null
    }

    _renderMessagesTopLeft = () => {
        let messagesTopLeft = [];
        // mobile only
        messagesTopLeft.push(<Link to='/' key='back-btn' className='msgs-back-btn'>
            <Icon name='chevron-left' />
        </Link>);
        return messagesTopLeft;
    };

    _renderMessagesTopCenter = ({ isSmall }) => {
        const { to } = this.props
        const toAcc = this.getToAcc()
        const { notifyErrors } = this.state

        return <MessagesTopCenter 
            isSmall={isSmall}
            to={to}
            toAcc={toAcc}
            notifyErrors={notifyErrors}
        />
    };

    _renderMenuItems = (isSmall) => {
        const { currentUser } = this.props
        if (!currentUser) {
            return null
        }

        const username = currentUser.get('username')
        const accountLink = `/@${username}`
        const mentionsLink = `/@${username}/mentions`
        const donatesLink = `/@${username}/donates-to`
        const walletLink = `/@${username}/transfers`

        const logout = (e) => {
            e.preventDefault()
            this.props.logout(username)
        }

        const openMyGroups = (e) => {
            e.preventDefault()
            this.props.showMyGroups()
        }

        let user_menu = [
            {link: '#', onClick: openMyGroups, icon: 'voters', value: tt('g.groups') + (isSmall ? (' @' + username) : '') },
            {link: accountLink, extLink: 'blogs', icon: 'new/blogging', value: tt('g.blog'), addon: <NotifiCounter fields='new_sponsor,sponsor_inactive,referral' />},
            {link: mentionsLink, extLink: 'blogs', icon: 'new/mention', value: tt('g.mentions'), addon: <NotifiCounter fields='mention' />},
            {link: donatesLink, extLink: 'wallet', icon: 'editor/coin', value: tt('g.rewards'), addon: <NotifiCounter fields='donate' />},
            {link: walletLink, extLink: 'wallet', icon: 'new/wallet', value: tt('g.wallet'), addon: <NotifiCounter fields='send,receive,fill_order,delegate_vs,nft_receive,nft_token_sold,nft_buy_offer' />},
            {link: '#', onClick: this.props.toggleNightmode, icon: 'editor/eye', value: tt('g.night_mode')},
            {link: '#', onClick: () => {
                    this.props.changeLanguage(this.props.locale)
                    if (!this.state.to) {
                        this.props.fetchState()
                    }
                }, icon: 'ionicons/language-outline', value:
                    this.props.locale === 'ru-RU' ? 'English' : 'Russian'},
        ]

        if (process.env.MOBILE_APP) {
            user_menu.push({link: '#', onClick: this.props.openSettings, icon: 'new/setting', value: tt('g.settings')})
        }

        user_menu.push({link: '#', icon: 'new/logout', onClick: logout, value: tt('g.logout')})

        return user_menu
    }

    _renderMessagesTopRight = ({ isSmall }) => {
        const menuItems = this._renderMenuItems(isSmall)

        if (!menuItems) return null

        const { currentUser } = this.props
        const username = currentUser.get('username')

        return (<LinkWithDropdown
                closeOnClickOutside
                dropdownPosition='bottom'
                dropdownAlignment='bottom'
                dropdownContent={<VerticalMenu className={'VerticalMenu_nav-profile'} items={menuItems} />}
            >
                <div className='msgs-curruser'>
                    <div className='msgs-curruser-notify-sink'>
                        <Userpic account={username} title={isSmall ? username : null} width={40} height={40} />
                        <div className='TopRightMenu__notificounter'>
                            <NotifiCounter fields='mention,donate,send,receive,fill_order,delegate_vs,new_sponsor,sponsor_inactive,nft_receive,nft_token_sold,nft_buy_offer,referral' />
                        </div>
                    </div>
                    {!isSmall ? <div className='msgs-curruser-name'>
                        {username}
                    </div> : null}
                </div>
            </LinkWithDropdown>);
    };

    isChat = () => {
        const { to } = this.props
        return to && to.startsWith('@')
    }

    isGroup = () => {
        const { to } = this.props
        return to && !to.startsWith('@')
    }

    _renderMessages = (messagesStub, { }) => {
        const { to, the_group, accounts } = this.props

        if (to) {
            const isGroup = this.isGroup()
            if (isGroup) {
                const noGroup = the_group === null
                const groupError = noGroup || (the_group && the_group.error)
                if (groupError) {
                    return <ChatError error={noGroup ? 404 : the_group.error}
                        isGroup={isGroup} />
                }
            } else if (!isGroup && !accounts[this.getToAcc()]) {
                return <ChatError error={404} isGroup={isGroup} />
            }
        }

        if (messagesStub && messagesStub.ui) {
            return messagesStub.ui
        }

        return false
    }

    handleFocusChange = isFocused => {
        this.windowFocused = isFocused;
        if (!isFocused) {
            if (this.newMessages) {
                flash();
            }
        } else {
            this.newMessages = 0;
            unflash();
        }
    }

    _renderError = (nodeError) => {
        let bbc 
        let settingsOpen
        let troubleshoot
        if (process.env.MOBILE_APP) {
            hideSplash()
            bbc = <BackButtonController goHome={true} />
            settingsOpen = <div>
                {tt('app_settings.node_error_NODE3')}
                <a href='#' onClick={this.props.openSettings}>{tt('g.settings')}</a>
            </div>
            troubleshoot = <AppUpdateChecker troubleshoot={true} style={{marginTop: '1rem'}} />
        }
        const NODE = nodeError.get('node') || 'node'
        const refresh = (e) => {
            e.preventDefault()
            const errMsg = document.getElementById('msgs-node-error')
            if (errMsg) {
                errMsg.style.display = 'none'
                setTimeout(() => {
                    errMsg.style.display = 'block'
                    this.props.fetchState(this.props.to)
                }, 1000)
            } else {
                this.props.fetchState(this.props.to)
            }
        }
        return (<div>
            {bbc}
            <Logo />
            <div id='msgs-node-error'>
                {tt('app_settings.node_error_NODE', { NODE } )}
                <a href='#' onClick={refresh}>{tt('g.refresh').toLowerCase()}</a>
                {tt('app_settings.node_error_NODE2')}
                {settingsOpen}
                {troubleshoot}
            </div>
        </div>)
    }

    render() {
        const { contacts, account, accounts, to, nodeError } = this.props;
        let bbc, auc
        if (process.env.MOBILE_APP) {
            bbc = <BackButtonController goHome={!to} />
            auc = <AppUpdateChecker dialog={true} />
        } else if (process.env.DESKTOP_APP) {
            auc = <AppUpdateChecker dialog={true} />
        }
        if (nodeError) {
            return this._renderError(nodeError)
        }
        if (!contacts || !account) return (<div>
                {bbc}
                {auc}
                <Messenger
                    contacts={[]}
                    conversationTopLeft={this._renderConversationTopLeft}
                    />
            </div>);
        const toAcc = this.getToAcc()

        const { username, the_group } = this.props
        const { composeStub, msgsStub } = renderStubs(the_group, to, username, accounts)

        return (
            <div>
                {bbc}
                {auc}
                <PageFocus onChange={this.handleFocusChange}>
                    {(focused) => (
                        <MarkNotificationRead fields='message,donate_msgs' account={account.name}
                            interval={focused ? 5000 : null}
                        />)}
                </PageFocus>
                {Messenger ? (<Messenger
                    account={this.props.account}
                    to={toAcc}
                    contacts={this.state.searchContacts || this.state.contacts}
                    conversationTopLeft={this._renderConversationTopLeft}
                    conversationTopRight={this._renderConversationTopRight}
                    conversationLinkPattern={contact => {
                        if (contact.kind === 'group') return '/*'
                        return '/@*'
                    }}
                    renderConversationAvatar={(contact, defaultRender) => {
                        if (contact.avatar) {
                            return defaultRender(contact.avatar)
                        }
                        return <span className='conversation-photo'>
                            <LetteredAvatar name={contact.contact} size={50} />
                        </span>
                    }}
                    onConversationSearch={this.onConversationSearch}
                    messages={this.state.messages}
                    messagesTopLeft={this._renderMessagesTopLeft()}
                    messagesTopCenter={this._renderMessagesTopCenter}
                    messagesTopRight={this._renderMessagesTopRight}
                    renderMessages={(...args) => this._renderMessages(msgsStub, ...args)}
                    replyingMessage={this.state.replyingMessage}
                    onCancelReply={this.onCancelReply}
                    onSendMessage={this.onSendMessage}
                    selectedMessages={this.state.selectedMessages}
                    onMessageSelect={this.onMessageSelect}
                    onPanelDeleteClick={this.onPanelDeleteClick}
                    onPanelReplyClick={this.onPanelReplyClick}
                    onPanelEditClick={this.onPanelEditClick}
                    onPanelCloseClick={this.onPanelCloseClick}
                    onButtonImageClicked={this.onButtonImageClicked}
                    onImagePasted={this.onImagePasted}
                    onImageDropped={this.onImageDropped}
                    composeRef={this.composeRef}
                    composeStub={composeStub}
                />) : null}
            </div>
        )
    }
}

export default withRouter(connect(
    (state, ownProps) => {
        const currentUser = state.user.get('current')
        const accounts = state.global.get('accounts')
        const contacts = state.global.get('contacts')
        const messages = state.global.get('messages')
        const nodeError = state.global.get('nodeError')

        const messages_update = state.global.get('messages_update')
        const username = state.user.getIn(['current', 'username'])

        let to = ownProps.match.params.to

        let memo_private = null
        if (currentUser) {
            memo_private = currentUser.getIn(['private_keys', 'memo_private'])
        }

        const locale = state.user.get('locale')

        let the_group = state.global.get('the_group')
        if (the_group && the_group.toJS) the_group = the_group.toJS()

        return {
            to,
            contacts: contacts,
            messages: messages,
            messages_update,
            the_group,
            account: currentUser && accounts && accounts.toJS()[currentUser.get('username')],
            currentUser,
            memo_private,
            accounts: accounts ?  accounts.toJS() : {},
            username,
            locale,
            nodeError
        }
    },
    dispatch => ({
        loginUser: () => dispatch(user.actions.usernamePasswordLogin()),

        checkAuth: (currentUser, memoNeed) => {
            if (!currentUser) {
                hideSplash()
                dispatch(user.actions.showLogin({
                    loginDefault: { cancelIsRegister: true, unclosable: true }
                }));
                return false;
            }
            if (memoNeed) {
                const private_key = currentUser.getIn(['private_keys', 'memo_private'])
                if (!private_key) {
                    hideSplash()
                    dispatch(user.actions.showLogin({
                        loginDefault: { username: currentUser.get('username'), authType: 'memo', }
                    }));
                    return false
                }
            }
            return true;
        },

        showMyGroups: () => dispatch(user.actions.showMyGroups()),

        fetchState: (to) => {
            const pathname = '/' + (to || '')
            dispatch({type: 'FETCH_STATE', payload: {
                location: {
                    pathname
                },
                fake: true
            }});
        },
        sendOperations: (senderAcc, toAcc, OPERATIONS, onError = null) => {
            if (!OPERATIONS.length) return;
            dispatch(
                transaction.actions.broadcastOperation({
                    type: 'custom_json',
                    trx: OPERATIONS,
                    successCallback: null,
                    errorCallback: (e, errStr) => {
                        if (onError) onError(e, errStr)
                        console.error(e)
                    }
                })
            );
        },
        sendMessage: async function({ senderAcc, memoKey, toAcc, group, body, editInfo = undefined, type = 'text', meta = {}, replyingMessage = null, notifyAbort }) {
            let message = {
                app: 'golos-messenger',
                version: 1,
                body,
            };
            if (type !== 'text') {
                message.type = type;
                if (type === 'image') {
                    message = { ...message, ...fitToPreview(600, 300, meta.width, meta.height), };
                } else {
                    throw new Error('Unknown message type: ' + type);
                }
            }
            let to = toAcc ? toAcc.name : ''
            if (replyingMessage) {
                if (group) {
                    to = replyingMessage.quote.from
                    if (to === senderAcc.name) to = ''
                }
                message = {...message, ...replyingMessage};
            }

            let data = null
            try {
                data = await golos.messages.encodeMsg({ group,
                    private_memo: !group && memoKey,
                    to_public_memo: !group && toAcc.memo_key,
                    msg: message,
                    nonce: editInfo ? editInfo.nonce : undefined,
                })
            } catch (err) {
                console.error(err)
                this.showError((err && err.message) || err.toString(), 10000)
            }

            const opData = {
                from: senderAcc.name,
                to,
                nonce: editInfo ? editInfo.nonce : data.nonce,
                from_memo_key: data.from_memo_key,
                to_memo_key: data.to_memo_key,
                checksum: data.checksum,
                update: editInfo ? true : false,
                encrypted_message: data.encrypted_message,
            }
            //alert(JSON.stringify(opData))

            if (group) {
                let requester

                if (editInfo && editInfo.from !== senderAcc.name) {
                    opData.from = editInfo.from
                    requester = senderAcc.name
                }

                opData.extensions = [[0, {
                    group: group.name,
                    requester
                }]]
            }

            if (!editInfo) {
                sendOffchainMessage(opData).catch(err => {
                    console.error('sendOffchainMessage', err)
                    if (notifyAbort) {
                        notifyAbort.abort()
                    }
                })
            }

            const json = JSON.stringify(['private_message', opData]);
            dispatch(transaction.actions.broadcastOperation({
                type: 'custom_json',
                operation: {
                    id: 'private_message',
                    required_posting_auths: [senderAcc.name],
                    json,
                },
                successCallback: null,
                errorCallback: (err, errStr) => {
                    if (err && err.message) {
                        if (err.message.includes('blocked by')) {
                            this.showError(tt(
                                'messages.blocked_BY', {
                                    BY: toAcc ? toAcc.name : ''
                                }
                            ), 10000)
                            return
                        }
                        if (err.message.includes('do not bother')) {
                            this.showError(tt(
                                'messages.do_not_bother_BY', {
                                    BY: toAcc ? toAcc.name : ''
                                }
                            ), 10000)
                            return
                        }
                    }
                    console.error(err)
                    this.showError(errStr, 10000)
                },
            }));
        },
        messaged: (message, timestamp, updateMessage, isMine) => {
            dispatch(g.actions.messaged({message, timestamp, updateMessage, isMine}));
        },
        messageEdited: (message, timestamp, updateMessage, isMine) => {
            dispatch(g.actions.messageEdited({message, timestamp, updateMessage, isMine}));
        },
        messageRead: (message, timestamp, updateMessage, isMine) => {
            dispatch(g.actions.messageRead({message, timestamp, updateMessage, isMine}));
        },
        messageDeleted: (message, updateMessage, isMine) => {
            dispatch(g.actions.messageDeleted({message, updateMessage, isMine}));
        },
        messageDonated: (op, updateMessage, isMine) => {
            dispatch(g.actions.messageDonated({op, updateMessage, isMine}))
        },
        uploadImage({ file, progress }) {
            this.showError(`${tt(
                'user_saga_js.image_upload.uploading'
            )}...`, 5000, 'progress');
            dispatch({
                type: 'user/UPLOAD_IMAGE',
                payload: {
                    file,
                    progress: data => {
                        if (data && data.error) {
                            try {
                                const error = JSON.parse(data.error).data.error;
                                this.showError(error.message || error);
                            } catch (ex) {
                                // unknown error format
                                this.showError(data.error);
                            }
                        } else if (data && data.message && typeof data.message === 'string') {
                            this.showError(data.message, 5000, 'progress');
                        }

                        progress(data);
                    },
                },
            });
        },
        showError(error, dismissAfter = 5000, key = 'error') {
            dispatch({
                type: 'ADD_NOTIFICATION',
                payload: {
                    message: error,
                    dismissAfter,
                    key,
                },
            });
        },
        changeLanguage: (currentLanguage) => {
            let language = 'en-US'
            if (currentLanguage === language)
                language = 'ru-RU'
            dispatch(user.actions.changeLanguage(language))
            localStorage.setItem('locale', language)
        },
        openSettings: (e) => {
            if (e) e.preventDefault()
            openAppSettings()
        },
        toggleNightmode: (e) => {
            if (e) e.preventDefault();
            dispatch(user.actions.toggleNightmode());
        },
        logout: async (username) => {
            dispatch(user.actions.logout());
        },
    }),
)(Messages))
