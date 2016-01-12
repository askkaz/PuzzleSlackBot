/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
          ______     ______     ______   __  __     __     ______
          /\  == \   /\  __ \   /\__  _\ /\ \/ /    /\ \   /\__  _\
          \ \  __<   \ \ \/\ \  \/_/\ \/ \ \  _"-.  \ \ \  \/_/\ \/
          \ \_____\  \ \_____\    \ \_\  \ \_\ \_\  \ \_\    \ \_\
           \/_____/   \/_____/     \/_/   \/_/\/_/   \/_/     \/_/


This is a sample Slack bot built with Botkit.

This bot demonstrates many of the core features of Botkit:

* Connect to Slack using the real time API
* Receive messages based on "spoken" patterns
* Reply to messages
* Use the conversation system to ask questions
* Use the built in storage system to store and retrieve information
  for a user.

# RUN THE BOT:

  Get a Bot token from Slack:

    -> http://my.slack.com/services/new/bot

  Run your bot from the command line:

    token=<MY TOKEN> node bot.js

# USE THE BOT:

  Find your bot inside Slack to send it a direct message.

  Say: "Hello"

  The bot will reply "Hello!"

  Say: "who are you?"

  The bot will tell you its name, where it running, and for how long.

  Say: "Call me <nickname>"

  Tell the bot your nickname. Now you are friends.

  Say: "who am I?"

  The bot will tell you your nickname, if it knows one for you.

  Say: "shutdown"

  The bot will ask if you are sure, and then shut itself down.

  Make sure to invite your bot into other channels using /invite @<my bot>!

# EXTEND THE BOT:

  Botkit is has many features for building cool and useful bots!

  Read all about it here:

    -> http://howdy.ai/botkit

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
//AVOID HEROKU BINDING ERROR
var http = require('http'); 
http.createServer(function (req, res) { 
  if (req.method == 'POST') {
        console.log("POST");
        var body = '';
        console.log(JSON.stringify(req.headers));
        req.on('data', function (data) {
            body += data;
            console.log("Partial body: " + body);
        });
        req.on('end', function () {
            console.log("Body: " + body);
        });
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.end('post received');
    }
    else
    {
        console.log("GET");
        //var html = '<html><body><form method="post" action="http://localhost:3000">Name: <input type="text" name="name" /><input type="submit" value="Submit" /></form></body>';
        //var html = fs.readFileSync('index.html');
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.end("hello");
    }
}).listen(process.env.PORT || 5000);
//END AVOIDANCE

var Botkit = require('./lib/Botkit.js')
var os = require('os');
var http = require('follow-redirects').http;
var cheerio = require('cheerio');
var StringDecoder = require('string_decoder').StringDecoder;


function getOneAcross(def,cons, cb){
  var options = {
    host: 'www3.oneacross.com',
    path: '/cgi-bin/search_banner.cgi?c0='+encodeURIComponent(def)+'&p0='+ encodeURIComponent(cons)+'&s=+Go%21+'
  };
  console.log(def);
  console.log(cons);
  var result ='';
  var req = http.get(options, function(res) {
    console.log('STATUS: ' + res.statusCode);
    console.log('HEADERS: ' + JSON.stringify(res.headers));
    // Buffer the body entirely for processing as a whole.
    var bodyChunks = [];
    res.on('data', function(chunk) {
      // You can process streamed parts here...
      bodyChunks.push(chunk);
    });
    res.on('end', function() {
      var body = Buffer.concat(bodyChunks);
      $ = cheerio.load(body);
      var words = [];
      $('tt').each(function(i, elem) {
        // var thisWord = $(this).text();
        var starEmoji = ":star:";
        var stars = 0;
        $(this).parent().siblings().first().children().each(function(i, elem) {
          if ($(this).attr('src')=="/images/smallstarblack.gif"){
            stars++;
          }
        });
        // console.log(thisWord + ' ' + stars);

        words.push(starEmoji.repeat(stars) + $(this).text());
      });
      cb(words);
    })
  });
  req.on('error', function(e) {
    console.log('ERROR: ' + e.message);
    return "fail";
  });

  return result;
}

function getNutrimatic(query, cb){
  var options = {
    host: 'www.nutrimatic.org',
    path: '/?q='+query
  };
  console.log(query);
  var result ='';
  var req = http.get(options, function(res) {
    console.log('STATUS: ' + res.statusCode);
    console.log('HEADERS: ' + JSON.stringify(res.headers));
    //console.log('Body: ' + res.body);
    // Buffer the body entirely for processing as a whole.
    var body ='';
    res.setEncoding('utf8');
    res.on('data', function(chunk) {
      // You can process streamed parts here...
      //var textChunk = decoder.write(chunk);
      body = body.concat(chunk);
      //console.log(chunk);
    });
    res.on('end', function() {
      //console.log(body);
      // var body = Buffer.concat(bodyChunks);
      $ = cheerio.load(body);
      //console.log(body);
      var words = [];
      $('span').each(function(i, elem) {
        words.push($(this).text());
      });
      cb(words);
    })
  });
  req.on('error', function(e) {
    console.log('ERROR: ' + e.message);
    return "fail";
  });

  return result;
}

var controller = Botkit.slackbot({
  debug: false,
});

var bot = controller.spawn(
  {
    token:process.env.token
  }
).startRTM();


controller.hears(['hello','hi'],'direct_message,direct_mention,mention',function(bot,message) {

  bot.api.reactions.add({
    timestamp: message.ts,
    channel: message.channel,
    name: 'robot_face',
  },function(err,res) {
    if (err) {
      bot.botkit.log("Failed to add emoji reaction :(",err);
    }
  });


  controller.storage.users.get(message.user,function(err,user) {
    if (user && user.name) {
      bot.reply(message,"Hello " + user.name+"!!");
    } else {
      bot.reply(message,"Hello.");
    }
  });
})

controller.hears(['call me (.*)'],'direct_message,direct_mention,mention',function(bot,message) {
  var matches = message.text.match(/call me (.*)/i);
  var output = '';
  for (var i = 0; i < matches.length; i++) {
    output = output.concat(i, matches[i]);
  }
  var name = matches[1];
  controller.storage.users.get(message.user,function(err,user) {
    if (!user) {
      user = {
        id: message.user,
      }
    }
    user.name = name;
    controller.storage.users.save(user,function(err,id) {
      bot.reply(message,"Got it. I will call you " + output + " from now on.");
    })
  })
});

controller.hears(['what is my name','who am i'],'direct_message,direct_mention,mention',function(bot,message) {

  controller.storage.users.get(message.user,function(err,user) {
    if (user && user.name) {
      bot.reply(message,"Your name is " + user.name);
    } else {
      bot.reply(message,"I don't know yet!");
    }
  })
});


controller.hears(['shutdown'],'direct_message,direct_mention,mention',function(bot,message) {

  bot.startConversation(message,function(err,convo) {
    convo.ask("Are you sure you want me to shutdown?",[
      {
        pattern: bot.utterances.yes,
        callback: function(response,convo) {
          convo.say("Bye!");
          convo.next();
          setTimeout(function() {
            process.exit();
          },3000);
        }
      },
      {
        pattern: bot.utterances.no,
        default:true,
        callback: function(response,convo) {
          convo.say("*Phew!*");
          convo.next();
        }
      }
    ])
  })
})


controller.hears(['uptime','identify yourself','who are you','what is your name'],'direct_message,direct_mention,mention',function(bot,message) {

  var hostname = os.hostname();
  var uptime = formatUptime(process.uptime());

  bot.reply(message,':robot_face: I am a bot named <@' + bot.identity.name +'>. I have been running for ' + uptime + ' on ' + hostname + ".");

})

function formatUptime(uptime) {
  var unit = 'second';
  if (uptime > 60) {
    uptime = uptime / 60;
    unit = 'minute';
  }
  if (uptime > 60) {
    uptime = uptime / 60;
    unit = 'hour';
  }
  if (uptime != 1) {
    unit = unit +'s';
  }

  uptime = uptime + ' ' + unit;
  return uptime;
}

controller.hears(['hello','hi'],'direct_message,direct_mention,mention',function(bot,message) {

  bot.api.reactions.add({
    timestamp: message.ts,
    channel: message.channel,
    name: 'robot_face',
  },function(err,res) {
    if (err) {
      bot.botkit.log("Failed to add emoji reaction :(",err);
    }
  });


  controller.storage.users.get(message.user,function(err,user) {
    if (user && user.name) {
      bot.reply(message,"Hello " + user.name+"!!");
    } else {
      bot.reply(message,"Hello.");
    }
  });
})



//ONE ACROSS
controller.hears(['!OA (.*) ([a-zA-Z0-9?]*)'],'direct_message,direct_mention,mention,ambient',function(bot,message) {
  var matches = message.text.match(/!OA (.*) ([a-zA-Z0-9?]*)/i);
  
  var definition = matches[1];
  var constraint = matches[2];

  controller.storage.users.get(message.user,function(err,user) {
    if (!user) {
      user = {
        id: message.user,
      }
    }
    controller.storage.users.save(user,function(err,id) {
      function processWords(words){
        if (words[words.length-1]=='B???'){
          words.pop();
          words.pop();
        }
        bot.reply(message,"Results: " + words.join(', '));
      }
      getOneAcross(definition, constraint, processWords);
    })
  })
});

//NUTRIMATIC
controller.hears(['!NM (.*)'],'direct_message,direct_mention,mention,ambient',function(bot,message) {
  var matches = message.text.match(/!NM (.*)/i);
  //console.log(matches);
  var query = matches[1];
  //console.log(query);
  query = query.replace(/&lt;/g,"<");
  query = query.replace(/&gt;/g,">");
  query = query.replace(/ /g,"%20");
  query = query.replace(/\*/g,"%2A");
  //query = query.replace(/"/g,"%22");
  //query = encodeURI(query);
  query = query.replace(/&amp;/g,"%26");
  query = query.replace(/&amp;/g,"%26");
  query = query.replace(/#/g,"%23");
  query = query.replace(/“/g,'"');
  query = query.replace(/”/g,'"');
  console.log(query);
  controller.storage.users.get(message.user,function(err,user) {
    if (!user) {
      user = {
        id: message.user,
      }
    }
    controller.storage.users.save(user,function(err,id) {
      function processQuery(query){
        numResults = 5;
        random_num = Math.random();
        if (random_num < 0.01) {
          bot.reply(message,"All your base are belong to us.");
        } else if (random_num < 0.02) {
          bot.reply(message,"Please welcome your new bot masters.");
        }

        if (query.length < numResults){
          numResults = query.length;
        }
        if (numResults > 0) {
          bot.reply(message,"Top five results: " + query.slice(0,numResults).join(', '));
        }
        else {
          bot.reply(message,"No good results. Ask Ricky.");
        }
      }
      getNutrimatic(query, processQuery);
    })
  })
});

