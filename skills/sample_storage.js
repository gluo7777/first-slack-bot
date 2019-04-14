async function saveUserKeyValue(userdb, user, key, value) {
    try {
        const entry = await userdb.get(user) || { id: user };
        entry[key] = value;
        const result = await userdb.save(entry);
        console.info('Successfully saved', result);
    } catch (error) {
        console.error('Received error while trying to save to database', error);
    }
}

module.exports = controller => {
    controller.hears([/^save ([A-Za-z_0-9]+) (.+)$/i], ['direct_message', 'direct_mention'], (bot, message) => {
        const userdb = controller.storage.users;
        const user = message.user, key = message.match[1], value = message.match[2];
        saveUserKeyValue(userdb, user, key, value);
        bot.reply(message, `Set ${key}=${value} for <@${message.user}>!`);
    })

    controller.hears([/^get ([A-Za-z_0-9]+)$/i], ['direct_message', 'direct_mention'], async (bot, message) => {
        try {
            const user = await controller.storage.users.get(message.user);
            let value = null;
            if (user) {
                value = user[message.match[1]];
            }
            if (value) {
                bot.reply(message, `The value of ${message.match[1]} is ${value}`);
            } else {
                bot.reply(message, `The value of ${message.match[1]} is not set.\nType @slack_bot_1 save ${message.match[1]} <value> to add it.`);
            }
        } catch (error) {
            console.error('Received error while trying to fetch from database', error);
        }
    })
}