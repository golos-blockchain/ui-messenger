import truncate from 'lodash/truncate';

export function displayQuoteMsg(body) {
    body = truncate(body, { length: 50, omission: '...', });
    return body.split('\n').join(' ');
}

export function processDatedGroup(group, messages, for_each) {
    let deleteIt
    if (group.nonce) {
        const idx = messages.findIndex(i => i.get('nonce') === group.nonce);
        if (idx !== -1) {
            messages = messages.update(idx, (msg) => {
                const { updated, fixIdx } = for_each(msg, idx)
                if (!updated) {
                    deleteIt = idx
                }
                return updated || msg
            })
            if (deleteIt !== undefined) {
                messages = messages.delete(idx)
            }
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
                deleteIt = undefined
                messages = messages.update(idx, (msg) => {
                    const { updated, fixIdx } = for_each(msg, idx)
                    if (!updated) {
                        deleteIt = idx
                    }
                    if (fixIdx !== undefined) {
                        idx = fixIdx
                    }
                    return updated || msg
                })
                if (deleteIt !== undefined) {
                    messages = messages.delete(idx)
                }
            }
        }
    }
    return messages;
}

export function opDeleteContact(op) {
    let delete_contact
    if (!op) return delete_contact
    const { extensions } = op
    if (extensions) {
        for (const ext of extensions) {
            if (ext && ext[0] === 1) {
                delete_contact = ext[1] && ext[1].delete_contact
            }
        }
    }
    return delete_contact
}
