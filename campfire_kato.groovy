#!/usr/bin/env groovy

final String CAMPFIRE_API_KEY = 'YOUR_API_KEY_HERE'
final String CAMPFIRE_SUBDOMAIN = 'YOUR_SUBDOMAIN_HERE'
final String CAMPFIRE_ROOM_ID = 'YOUR_CAMPFIRE_ROOM_ID'
final List<String> BLACKLISTED_SENDERS = [] // add user IDs here you wish to suppress

final String KATO_ROOM_ID = 'YOUR_KATO_ROOM_ID'

def xml = new groovy.util.XmlSlurper()

def auth = "${CAMPFIRE_API_KEY}:X".bytes.encodeBase64()

// Lazy lookup table of userId -> user name
Map<String, String> users = [:].withDefault {userId ->
	if (userId) {
		def url = "https://fullcontact.campfirenow.com/users/${userId}.xml"
		def conn = url.toURL().openConnection()
		conn.setRequestProperty("Authorization", "Basic ${auth}")

		return xml.parseText(conn.inputStream.text).name.toString()
	} else {
		return "?"
	}
}

Long lastMessage = 0
int requestNumber = 0
while (true) {
	def url = "https://${CAMPFIRE_SUBDOMAIN}.campfirenow.com/room/${CAMPFIRE_ROOM_ID}/recent.xml?limit=5&since_message_id=${lastMessage}"
	def conn = url.toURL().openConnection()
	conn.setRequestProperty("Authorization", "Basic ${auth}")
	
	def posted = 0
	xml.parseText(conn.inputStream.text).message.each { message ->
		if (requestNumber > 0) {
			if (!['TextMessage', 'PasteMessage'].contains(message.type.toString()))
				return
			
			def userId = message."user-id".toString()
			if (!userId || BLACKLISTED_SENDERS.contains(userId))
				return
				
			def post = "https://api.kato.im/rooms/${KATO_ROOM_ID}/simple".toURL().openConnection()
			post.doOutput = true
			post.requestMethod = "POST"
			def jsonbuilder = new groovy.json.JsonBuilder()
			jsonbuilder {
				from users[userId]
				text message.body.toString()
			}

			post.outputStream.write jsonbuilder.toString().bytes
			assert post.getResponseCode() == 204
			posted++
		}

		lastMessage = message.id.toLong()
	}
	
	if (posted > 0) {
		println "${new Date()}:	Posted ${posted} messages"
	}

	requestNumber++
	Thread.sleep(1000)
}
