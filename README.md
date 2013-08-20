Kato.im Campfire Integration
========

Kato.im is a great new team chat platform. Here are two scripts which you can use to mirror communications between one room in Campfire and one room in Kato to ease the process of switching to Kato.

I wrote these in a hurry, so please the use of both Groovy and Node.js. Contributions and upgrades are 100% welcome!

#####campfire_kato.groovy usage
    screen campfire_kato.groovy

Note: I tested this with [Groovy 2.1.6](http://dist.groovy.codehaus.org/distributions/groovy-binary-2.1.6.zip)

#####kato_campfire.js usage
    npm install nan
    npm install request
    npm install util
    npm install /path/to/ws
    screen
    node kato_campfire.js
    
Note: This requires [my patched version of the ws websockets library](https://github.com/danklynn/ws). Hopefully my pull request will be accepted into mainline soon and this will just work out of the box.
