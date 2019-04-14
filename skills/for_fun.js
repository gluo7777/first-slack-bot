// random functionality to mess around
const debug = require('debug')('willbot:fun')

/**
 * 
 * @param {String} message 
 */
function convertPronouns(message) {
    let message2 = message && message.replace(/(my|mine)/gi, 'your')
    return message2
}

module.exports = controller => {
    controller.hears(
        ['hello', '^hey (\\w+)', '^hello (\\w+)'],
        ['direct_message', 'direct_mention'],
        (bot, message) => {
            debug(`${message.user} wrote "${message.text}".`);
            if (message.match[1]) {
                bot.reply(message, `Who are you calling a "${message.match[1]}"!`);
            } else {
                bot.reply(message, `Don't talk to me!`);
            }
        })

    const TIMEOUT = 3000

    // base conversation with default path only
    controller.hears(
        ['^talk$'],
        ['direct_message', 'direct_mention'],
        (bot, message) => {
            debug({ bot })
            debug({ message })
            bot.startConversation(message, (err, convo) => {
                if (err) {
                    debug({ err })
                    bot.say('Unable to talk right now.')
                } else {
                    convo.say(`Starting conversation with <@${message.user}>!`)
                    convo.setTimeout(TIMEOUT) // 3 seconds for user to respond
                    convo.ask('So, <@${message.user}>, what do you want to talk about?', (response, convo) => {
                        const subject = convertPronouns(response.text)
                        convo.say(`Sorry, I don't wanna talk about ${subject}...`)
                        convo.next() // proceed to the next message in the conversation. This must be called at the end of each handler.
                    })
                }
                convo.on('end', convo => {
                    if (convo.status === 'timeout') {
                        bot.reply(message, `Sorry <@${message.user}>, but you took more than ${TIMEOUT} to respond.`)
                    }
                })
            })
        })

    // conversation with custom paths (thread)
    controller.hears(
        ['talk more'],
        ['direct_message', 'direct_mention'],
        (bot, message) => {
            console.info({ bot })
            console.info({ message })
            bot.createConversation(message, (err, convo) => {
                // first path
                convo.addMessage({
                    text: 'You picked first option!',
                    action: 'ask_anime'
                }, 'first_thread')

                // second path
                convo.addMessage({
                    text: 'You picked second option!'
                }, 'second_thread')

                // fall back path where neither first/second matched
                convo.addMessage({
                    text: `Alright we're ending the conversation...`,
                    action: 'default'
                }, 'bad_response')

                // create a question to start traversing paths
                convo.addQuestion('Do you watch anime?', [
                    {
                        /*pattern: 'yes',*/
                        pattern: bot.utterances.yes, /* Matches phrases like yes, yeah, yup, ok and sure. */
                        callback: (response, convo) => convo.gotoThread('first_thread')
                    },
                    {
                        pattern: bot.utterances.no, /* Matches phrases like no, nah, nope */
                        callback: (response, convo) => convo.gotoThread('second_thread')
                    },
                    {
                        default: true,
                        pattern: bot.utterances.quit,
                        callback: (response, convo) => convo.gotoThread('bad_response')
                    }
                ], {}, 'default')

                // in response to first path
                convo.addMessage({
                    text: `calm down...`,
                    action: 'stop'
                }, 'edgy_path')

                // mustache template variables
                convo.addMessage({
                    text: 'Wow, really? I like {{vars.anime_title}} too!',
                    action: 'completed'
                }, 'got_answer')

                convo.addMessage({
                    text: 'Wow, really? I like all of {{vars.anime_titles}} too! That\'s a lot of shows you\'ve watched.',
                    action: 'completed'
                }, 'got_answers')

                convo.addQuestion('So which anime do you like?', [
                    {
                        pattern: 'fuck off',
                        callback: (response, convo) => convo.gotoThread('edgy_path')
                    },
                    {
                        default: true,
                        callback: (response, convo) => {
                            const answer = response.text
                            if (answer.indexOf(',') !== -1) {
                                let lst = answer.split(',')
                                let last = lst.pop()
                                lst.push('and', last)
                                convo.setVar('anime_titles', lst)
                                convo.gotoThread('got_answers')
                            } else {
                                convo.setVar('anime_title', answer)
                                convo.gotoThread('got_answer')
                            }
                        }
                    }
                ], {}, 'ask_anime')

                // initiate conversation
                convo.activate()

                // capture end of conversation
                convo.on('end', convo => {
                    console.info({ convo })
                    console.info('conversation ended...')
                    if (convo.status === 'completed') {
                        bot.reply(message, 'It was nice talking to you!')
                        const history = convo.extractResponses();
                        console.info({ history });
                    } else if (convo.status === 'stopped') {
                        bot.reply(`Wow, you're so angtsy.`)
                    } else if (convo.status === 'timeout') {
                        bot.reply(`Dude, you took your time responding. I'm done talking.`)
                    }
                })
            })
        })
}