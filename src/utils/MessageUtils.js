import truncate from 'lodash/truncate';

export function displayQuoteMsg(body) {
    body = truncate(body, { length: 50, omission: '...', });
    return body.split('\n').join(' ');
}

export function processDatedGroup(group, messages, for_each) {
    if (group.nonce) {
        const idx = messages.findIndex(i => i.get('nonce') === group.nonce);
        if (idx !== -1) {
            messages = messages.update(idx, (msg) => {
                return for_each(msg, idx);
            });
        }
    } else {
        let inRange = false;
        for (let idx = 0; idx < messages.size; ++idx) {
            let msg = messages.get(idx);
            const date = msg.get('create_date');
            const rec_date = msg.get('receive_date');
            if (!inRange && date <= group.stop_date) {
                inRange = true;
            }
            if (date <= group.start_date && rec_date.startsWith('20')) {
                break;
            }
            if (inRange) {
                messages = messages.set(idx, for_each(msg, idx));
            }
        }
    }
    return messages;
}
