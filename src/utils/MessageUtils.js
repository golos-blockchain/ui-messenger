import truncate from 'lodash/truncate';

export function displayQuoteMsg(body) {
    body = truncate(body, { length: 50, omission: '...', });
    return body.split('\n').join(' ');
}

export function processDatedGroup(group, messages, for_each) {
    let deleteIt;
    
    if (group.nonce) {
        const idx = messages.findIndex(i => i.nonce === group.nonce);
        if (idx !== -1) {
            const { updated, fixIdx } = for_each(messages[idx], idx);
            if (!updated) {
                deleteIt = idx;
            } else {
                messages[idx] = updated;
            }
            if (deleteIt) {
                messages.splice(deleteIt, 1);
            }
        }
    } else {
        let inRange = false;
        for (let idx = 0; idx < messages.length; ++idx) {
            let msg = messages[idx];
            const date = msg.create_date;
            const rec_date = msg.receive_date;

            if (!inRange && date <= group.stop_date) {
                inRange = true;
            }
            if (date <= group.start_date && rec_date.startsWith('20')) {
                break;
            }
            if (inRange) {
                deleteIt = undefined;
                const { updated, fixIdx } = for_each(msg, idx);

                if (!updated) {
                    deleteIt = idx;
                } else {
                    messages[idx] = updated;
                }

                if (fixIdx !== undefined) {
                    idx = fixIdx;
                }

                if (deleteIt !== undefined) {
                    messages.splice(deleteIt, 1);
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
