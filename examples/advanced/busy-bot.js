#!/usr/bin/env node
/**
 *   Wechaty - https://github.com/chatie/wechaty
 *
 *   @copyright 2016-2018 Huan LI <zixia@zixia.net>
 *
 *   Licensed under the Apache License, Version 2.0 (the "License");
 *   you may not use this file except in compliance with the License.
 *   You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 *   Unless required by applicable law or agreed to in writing, software
 *   distributed under the License is distributed on an "AS IS" BASIS,
 *   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *   See the License for the specific language governing permissions and
 *   limitations under the License.
 *
 */
const qrTerm = require('qrcode-terminal')

const {
  IoClient,
  Wechaty,
  config,
  log,
}             = require('wechaty')

console.log(`
=============== Powered by Wechaty ===============
-------- https://github.com/Chatie/wechaty --------

I'm the BUSY BOT, I can do auto response message for you when you are BUSY.

Send command to FileHelper to:

1. '#busy' - set busy mode ON
2. '#busy I'm busy' - set busy mode ON and set a Auto Reply Message
3. '#free' - set busy mode OFF
4. '#status' - check the current Busy Mode and Auto Reply Message.

Loading... please wait for QrCode Image Url and then scan to login.
`)

let bot
const fullName = `Pablo Diego José Francisco de Paula Juan Nepomuceno María de los Remedios Cipriano de la Santísima Trinidad Ruiz y Picasso`

const atReturnText = (text) => {
  const busyAnnouncement = ['喵', '我不会说人话']
  const isHidden = () => { return Math.random() * 10 > 9 ? 1 : 0 }
  if (/全名/i.test(text) || /真名/i.test(text) || /大名/i.test(text)) {
    return fullName
  }
  return busyAnnouncement[isHidden()]
}

const token = config.token

if (token) {
  log.info('Wechaty', 'TOKEN: %s', token)

  bot = Wechaty.instance({ profile: token })
  const ioClient = new IoClient({
    token,
    wechaty: bot,
  })

  ioClient.start().catch(e => {
    log.error('Wechaty', 'IoClient.init() exception: %s', e)
    bot.emit('error', e)
  })
} else {
  log.verbose('Wechaty', 'TOKEN: N/A')
  bot = Wechaty.instance()
}

bot
.on('scan', (qrcode, status) => {
  qrTerm.generate(qrcode, { small: true })
  console.log(`${status}: ${qrcode} - Scan QR Code of the url to login:`)
})
.on('logout'	, user => log.info('Bot', `${user.name()} logouted`))
.on('error'   , e => log.info('Bot', 'error: %s', e))

.on('login', async function(user) {
  const msg = `${user.name()} logined`

  log.info('Bot', msg)
  await this.say(msg)
})
.on('friendship', async friendship => {
  try {
    switch (friendship.type()) {
      case Friendship.Type.Receive:
        await friendship.accept()
        break
    }
  }
})

/**
 * Global Event: message
 */

let busyIndicator    = true

bot.on('message', async function(msg) {
  log.info('Bot', '(message) %s', msg)

  const filehelper = bot.Contact.load('filehelper')

  const sender   = msg.from()
  const receiver = msg.to()
  const text     = msg.text()
  const room     = msg.room()

  // if (msg.age() > 60) {
  //   log.info('Bot', 'on(message) skip age(%d) > 60 seconds: %s', msg.age(), msg)
  //   return
  // }

  if (!sender || !receiver) {
    return
  }

  if (/张吉/i.test(text)) {
    msg.say('张吉，出来挨打')
    return
  }

  if (/体脂称/i.test(text)) {
    msg.say('是秤！！！')
    return
  }

  if (/\@毕加索/.test(text)) {
    await msg.say(atReturnText(text))
    return
  }

  // if (receiver.id === 'filehelper') {
  //   if (text === '#status') {
  //     await filehelper.say('in busy mode: ' + busyIndicator)
  //     await filehelper.say('auto reply: ' + busyAnnouncement[0])

  //   } else if (text === '#free') {
  //     busyIndicator = false
  //     await filehelper.say('auto reply stopped.')

  //   }
  //   else if (/^#busy/i.test(text)) {

  //     busyIndicator = true
  //     await filehelper.say('in busy mode: ' + 'ON')

  //     const matches = text.match(/^#busy (.+)$/i)
  //     if (!matches || !matches[1]) {
  //       await filehelper.say('auto reply message: "' + busyAnnouncement[0] + '"')

  //     } else {
  //       // busyAnnouncement = matches[1]
  //       await filehelper.say('set auto reply to: "' + busyAnnouncement[0] + '"')

  //     }
  //   }

  //   return
  // }

  if (sender.type() !== bot.Contact.Type.Personal) {
    return
  }

  if (!busyIndicator) {
    return  // free
  }

  if (msg.self()) {
    return
  }

  /**
   * 1. Send busy anoncement to contact
   */

  if (!room) {
    await msg.say(atReturnText(text))
    return
  }

  /**
   * 2. If there's someone mentioned me in a room,
   *  then send busy annoncement to room and mention the contact who mentioned me.
   */
  const contactList = await msg.mention()
  const contactIdList = contactList.map(c => c.id)
  if (contactIdList.includes(this.userSelf().id)) {
    atReturnText(text)
    return
  }
  /**
   * 2. If there's someone mentioned me in a room,
   *  then send busy annoncement to room and mention the contact who mentioned me.
   */
  // const contactList = await msg.mention()
  // const contactIdList = contactList.map(c => c.id)
  // if (contactIdList.includes(this.userSelf().id)) {
  //   await msg.say(busyAnnouncement, sender)
  // }

})

bot.start()
.catch(e => console.error(e))
