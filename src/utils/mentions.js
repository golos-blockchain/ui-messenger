
export const accountNameRegEx = /^@[a-z0-9.-]+$/

// TODO: can be renderMsg which also supports links, and rendering
export function parseMentions(message) {
    let mentions = new Set()
    const { body } = message
    const lines = body.split('\n')
    for (const line of lines) {
        const words = line.split(' ')
        for (let word of words) {
            if (word.length > 3 && accountNameRegEx.test(word)) {
                mentions.add(word.slice(1))
            }
        }
    }
    return [...mentions]
}
