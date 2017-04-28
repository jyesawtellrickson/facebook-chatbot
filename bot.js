//
// This is main file containing code implementing the Express server and functionality for the Express echo bot.
//
'use strict';
const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const path = require('path');
var messengerButton = "<html><head><title>Facebook Messenger Bot</title></head><body><h1>Facebook Messenger Bot</h1>This is a bot based on Messenger Platform QuickStart. For more details, see their <a href=\"https://developers.facebook.com/docs/messenger-platform/guides/quick-start\">docs</a>.<footer id=\"gWidget\"></footer><script src=\"https://widget.gomix.me/widget.min.js\"></script></body></html>";

// The rest of the code implements the routes for our Express server.
let app = express();
// Use bodyParser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

// Webhook validation
app.get('/webhook', function(req, res) {
  if (req.query['hub.mode'] === 'subscribe' &&
      req.query['hub.verify_token'] === process.env.VERIFY_TOKEN) {
    console.log("Validating webhook");
    res.status(200).send(req.query['hub.challenge']);
  } else {
    console.error("Failed validation. Make sure the validation tokens match.");
    res.sendStatus(403);          
  }
});

// Display the web page
app.get('/', function(req, res) {
  res.writeHead(200, {'Content-Type': 'text/html'});
  res.write(messengerButton);
  res.end();
});

// Message processing
app.post('/webhook', function (req, res) {
  console.log(req.body);
  var data = req.body;

  // Make sure this is a page subscription
  if (data.object === 'page') {
    
    // Iterate over each entry - there may be multiple if batched
    data.entry.forEach(function(entry) {
      var pageID = entry.id;
      var timeOfEvent = entry.time;

      // Iterate over each messaging event
      entry.messaging.forEach(function(event) {
        if (event.message) {
          receivedMessage(event);
        } else if (event.postback) {
          receivedPostback(event);   
        } else {
          console.log("Webhook received unknown event: ", event);
        }
      });
    });

    // Assume all went well.
    //
    // You must send back a 200, within 20 seconds, to let us know
    // you've successfully received the callback. Otherwise, the request
    // will time out and we will keep trying to resend.
    res.sendStatus(200);
  }
});

// Incoming events handling
function receivedMessage(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfMessage = event.timestamp;
  var message = event.message;

  console.log("Received message for user %d and page %d at %d with message:", 
    senderID, recipientID, timeOfMessage);
  console.log(JSON.stringify(message));

  var messageId = message.mid;

  var messageText = message.text;
  var messageAttachments = message.attachments;
  // open conversation with the user 
      // If we receive a text message, check to see if it matches a keyword
    // and send back the template example. Otherwise, just echo the text we received
  var foodTypeDict = {
    "mini-buffet": "mini-buffet-catering",
    "mini buffet": "mini-buffet-catering",
    "finger food": "finger-food-catering",
    "buffet": "buffet-catering",
    "canapes": "canapes-catering",
    "bento": "bento-packed-meal",
    "lunch": "bento-packed-meal",
    "dinner": "dinner-catering",
    "tingkat": "tingkat-catering",
    "cakes": "cake-delivery"
  }
  
  if (messageText) {
    messageText = messageText.toLowerCase();
    if (messageText=='generic'){
      sendGenericMessage(senderID);
    }
    // search through text message for keywords
    var regExp = new RegExp("(mini( |-)buffet|buffet|canapes|bento|lunch|dinner|tingkat|cakes|finger food)", "gi");
    var foodType = regExp.exec(messageText)
    if (foodType){
      sendTextMessage(senderID, 'Great choice!');
      sendTextMessage(senderID, 'Let me show you our most popular caterers with ' + foodType[1] + '...');
      sendVendorListMessage(senderID, 'https://www.caterspot.sg/l/' + foodTypeDict[foodType[1]])
    } else if (messageText.indexOf('hello')>=0){
      sendTextMessage(senderID, 'Hello there, what sort of food are you looking for?');
    } else if (messageText == 'thisone'){
      sendFoodCategoryMessage(senderID)
    } else if (messageText == 'testing'){
      sendProductMessage(senderID, 'https://www.caterspot.sg/caterers/cedele')
    } else{
      sendTextMessage(senderID, messageText);
    }
  } else if (messageAttachments) {
    sendTextMessage(senderID, "Message with attachment received");
  }
}

function receivedPostback(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfPostback = event.timestamp;

  // The 'payload' param is a developer-defined field which is set in a postback 
  // button for Structured Messages. 
  var payload = event.postback.payload;

  //console.log("Received postback for user %d and page %d with payload '%s' " + 
  //  "at %d", senderID, recipientID, payload, timeOfPostback);
  
  // When a postback is called, we'll send a message back to the sender to 
  // let them know it was successful
  if (payload) {
    // convert payload to usable format
    console.log(">>>>>>>>>>"+payload)
    payload = payload.split("&")
    for (var i = 0; i < payload.length; i++){
      payload[i] = payload[i].split("=")[1]
    }
    // If we receive a text message, check to see if it matches a keyword
    // and send back the template example. Otherwise, just echo the text we received.
    if (payload[1] == "vendor_list"){
      // message from vendor list, check which format it wants
      if (payload[0].substr(payload[0].length-7,7) == "/photos"){
        sendVendorPhotoMessage(senderID, payload[0]);
      } else if (payload[0].substr(payload[0].length-7,7) == "reviews"){
        sendVendorReviewMessage(senderID, payload[0]);
        //sendTextMessage(senderID, 'See more reviews at www.caterspot.sg'+payload[0]);
      } else{
        sendTextMessage(senderID, 'Let me show you their 4 most popular menu items.');
        sendVendorMenuMessage(senderID, payload[0]);
        sendTextMessage(senderID, 'Simply click on the item to see it on our site!');

      }
    } else{
      sendTextMessage(senderID, "Oops, bad programmers!");
    }
  } else {
    // sendTextMessage(senderID, "Postback called");
  }
}

//////////////////////////
// Sending helpers
//////////////////////////
function sendTextMessage(recipientId, messageText) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: messageText
    }
  };
  console.log(messageData)
  callSendAPI(messageData);
}

function sendGenericMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "generic",
          elements: [{
            title: "rift",
            subtitle: "Next-generation virtual reality",
            item_url: "https://www.oculus.com/en-us/rift/",               
            image_url: "http://messengerdemo.parseapp.com/img/rift.png",
            buttons: [{
              type: "web_url",
              url: "https://www.oculus.com/en-us/rift/",
              title: "Open Web URL"
            }, {
              type: "postback",
              title: "Call Postback",
              payload: "Payload for first bubble",
            }],
          }, {
            title: "touch",
            subtitle: "Your Hands, Now in VR",
            item_url: "https://www.oculus.com/en-us/touch/",               
            image_url: "http://messengerdemo.parseapp.com/img/touch.png",
            buttons: [{
              type: "web_url",
              url: "https://www.oculus.com/en-us/touch/",
              title: "Open Web URL"
            }, {
              type: "postback",
              title: "Call Postback",
              payload: "Payload for second bubble",
            }]
          }]
        }
      }
    }
  };  

  callSendAPI(messageData);
}


function callSendAPI(messageData) {
  request({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: process.env.PAGE_ACCESS_TOKEN },
    method: 'POST',
    json: messageData

  }, function (error, response, body) {
    console.log('sending')
    if (!error && response.statusCode == 200) {
      var recipientId = body.recipient_id;
      var messageId = body.message_id;

      console.log("Successfully sent message with id %s to recipient %s", 
        messageId, recipientId);
    } else {
      console.error("Unable to send message.");
      //console.error(response);
      //console.error(error);
    }
  });  
}

// Set Express to listen out for HTTP requests
var server = app.listen(process.env.PORT || 3000, function () {
  console.log("Listening on port %s", server.address().port);
});


function sendFoodCategoryMessage(recipientId) {
  return request('https://www.caterspot.sg/', function (error, response, body) {
    //console.log('error:', error); // Print the error if one occurred 
    //console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received 
    //console.log('body:', body); // Print the HTML for the Google homepage. 
    var html = body.replace(/&amp;/g,'&')
    var regExpPic = new RegExp("<span style=\"background-image: url[(]([^)]*)", "gi");
    var regExpTitle = new RegExp("</span>([^<]+)</a>", "gi");
    var regExpLink = new RegExp("<a href=\"([^\"]*)\"><span style=\"background-image: ", "gi");

    //var regExp = new RegExp("(?:\<a class=\"hidden-lg-up\" href=\")(.{0.20})\">", "gi");
    var pics, titles, links = []
    titles = executeRegex(html, regExpTitle)
    pics = executeRegex(html, regExpPic)
    links = executeRegex(html, regExpLink)
    
    var cat_elem = []
    for (var i = 0; i < Math.min(titles.length,5); i++){
      cat_elem.push({
            title: titles[i],
            item_url: links[i],               
            image_url: pics[i],
            buttons: [{
              type: "postback",
              title: "See "+titles[i], //could do categories, products, photos
              payload: "url="+links[i],
            }],
          })
    }
    // generate elements
    var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "generic",
          elements: cat_elem
        }
      }
    }
  };  
  console.log(messageData)
  callSendAPI(messageData);
  });
}


function sendVendorListMessage(recipientId, link) {
  request(link, function (error, response, body) {
    //console.log('error:', error); // Print the error if one occurred 
    //console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received 
    //console.log('body:', body); // Print the HTML for the Google homepage. 
    var html = body.replace(/&amp;/g,'&')
    // use regex :O
    // var regExp = new RegExp(".{10}(?=\<a class=\"hidden-lg-up\" href=\")", "gi");
    var regExp = new RegExp("\<a class=\"hidden-lg-up\" href=\"([^\">]*)", "gi");
    var regExpName = new RegExp("<a target=\"_blank\" class=\"hidden-md-down menu-page-link\" href=\".+?\">([^<]*)", "gi");
    var regExpRat = new RegExp("<span class=\"rating-score pull-left\">([^ <]*)", "gi");
    var regExpPic = new RegExp("<div class=\"carousel-cell img-holder\" style=\"background-image: url[^;]*;([^(&)]*)","gi")
    var regExpSub = new RegExp("<p class=\"card-desc\">([^<]*)</p>", "gi")

    var links, ratings, names, pics, subs = []
    links = executeRegex(html, regExp)
    names = executeRegex(html, regExpName)
    ratings = executeRegex(html, regExpRat)
    pics = executeRegex(html, regExpPic)
    subs = executeRegex(html, regExpSub)
    
    // rating - what happens if no reviews or avg. is integer
    // options to see menu
    // see photos 
    // see reviews
    var cat_elem = []
    for (var i = 0; i < Math.min(5, names.length); i++){
      cat_elem.push({
        title: names[i],
        subtitle: subs[i],
        item_url: "https://www.caterspot.sg/" + links[i],               
        image_url: pics[i],
        buttons: [{
          type: "postback",
          title: "Menu",
          payload: "url="+links[i]+"&previous=vendor_list"
        }, {
          type: "postback",
          title: "Photos",
          payload: "url="+links[i]+"/photos&previous=vendor_list"
        }, {
          type: "postback",
          title: "Reviews",
          payload: "url="+links[i]+"/reviews&previous=vendor_list"
        }],
      })
    }
    // generate elements
    var messageData = {
      recipient: {
        id: recipientId
      },
      message: {
        attachment: {
          type: "template",
          payload: {
            template_type: "generic",
            elements: cat_elem
          }
        }
      }
    };  
    console.log(messageData)
    console.log(cat_elem)
    callSendAPI(messageData);
  });
}


function sendCategoryMessage(recipientId, link) {
  request('https://www.caterspot.sg'+link, function (error, response, body) {
    //console.log('error:', error); // Print the error if one occurred 
    //console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received 
    //console.log('body:', body); // Print the HTML for the Google homepage. 
    var html = body
    // use regex :O
    var regExpHead = new RegExp("<div class=\"menu-headline-wrapper\"><h3>([^<]*)","gi");
    var regExpItem = new RegExp("<h4 class=\"media-heading\">([^<]*)","gi")
    var regExpCat = new RegExp("<div class=\"menu-category\" id=[^<]*<div class=\"menu-headline-wrapper\"><h3>([^<]*)","gi")
    var regExpCatLink = new RegExp("<div class=\"menu-category\" id=\"([^\"]*)","gi")
    var regExpItem2 = new RegExp("<div class=\"media\" data-attrs=\"([^(\<)]*)\" data-url","gi")
    
    //var regExp = new RegExp("(?:\<a class=\"hidden-lg-up\" href=\")(.{0.20})\">", "gi");
    var heads, items, items2, cats, catlinks = []
    heads = executeRegex(html, regExpHead)
    items = executeRegex(html, regExpItem)
    items2 = executeRegex(html, regExpItem2)
    cats = executeRegex(html, regExpCat)
    catlinks = executeRegex(html, regExpCatLink)
    for (var j = 0; j < items2.length; j++){
      items2[j] = JSON.parse(items2[j])
    }
    //pics = executeRegex(html, regExpPic)
    //subs = executeRegex(html, regExpSub)
    
    console.log(heads)
    console.log(items2)
    //console.log(items2)
    // options to see menu
    // see photos 
    // see reviews
    var cat_elem = []
    for (var i = 0; i < Math.min(cats.length,5); i++){
      cat_elem.push({
          "content_type":"text",
          "title": cats[i],
          "payload": "url="+catlinks[i]+"&previous=vendor_category"
        })
    }
    // generate elements
    var messageData = {
      "recipient": {
        "id": recipientId
      },
      "message": {
        "text": "Choose a category:",
        "quick_replies" : cat_elem
      }
    };  
    callSendAPI(messageData);
  });
}


function sendVendorMenuMessage(recipientId, link) {
  request('https://www.caterspot.sg'+link, function (error, response, body) {
    //console.log('error:', error); // Print the error if one occurred 
    //console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received 
    //console.log('body:', body); // Print the HTML for the Google homepage. 
    if (body){
      var html = body.replace(/&quot;/g,'"')
    }
    // use regex :O
    var regExpItem = new RegExp("<div class=\"media\" data-attrs=\"([^=]+)\" data-url","gi")
    var items= []
    items = executeRegex(html, regExpItem)
    for (var j = 0; j < items.length; j++){
      items[j] = JSON.parse(items[j])
    }

    //console.log(items)
    // options to see menu
    var cat_elem = []
    for (var i = 0; i < 4; i++){
      if (items[i]['photos'].length > 0){
        var img_url = items[i]['photos'][0]
        cat_elem.push({
            title: items[i]['name'],
            subtitle: items[i]['description'],
            default_action: {
              type: "web_url",
              url: 'https://www.caterspot.sg' + link + "?menu_item_id=" + items[i]['uuid']              
            },
            image_url: img_url
          })
      } else{
        var img_url = ''
        cat_elem.push({
            title: items[i]['name'],
            subtitle: items[i]['description'],
            default_action:{
              type: "web_url",
              url: 'https://www.caterspot.sg' + link + "?menu_item_id=" + items[i]['uuid']              
            }
          })
      }
      console.log(cat_elem[i]['default_action'])

    }
    console.log(cat_elem)
    // generate elements
    var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "list",
          top_element_style: "compact",
          elements: cat_elem
        }
      }
    }
  };
  callSendAPI(messageData);
  });
}


function sendVendorReviewMessage(recipientId, link) {
  request('https://www.caterspot.sg'+link, function (error, response, body) {
    //console.log('error:', error); // Print the error if one occurred 
    //console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received 
    //console.log('body:', body); // Print the HTML for the Google homepage. 
    if (body){
      var html = body.replace(/&quot;/g,'"')
    }
    // use regex :O
    var regExpItem = new RegExp("<h4 class=\"media-heading\">([^<]+)","gi")
    var regExpName = new RegExp("<ul class=\"meta\"><li>([^<]+)","gi")
    var regExpRating = new RegExp("<div class=\"rating-score pull-left\">([^ ]+)","gi")
    var reviews = executeRegex(html, regExpItem)
    var names = executeRegex(html, regExpName)
    var ratings = executeRegex(html, regExpRating)
    // options to see menu
    var cat_elem = []
    var i = 0;
    var num_reviews = 0
    while (i < reviews.length && num_reviews < 5){
      if (reviews[i].length > 2){
        sendTextMessage(recipientId, reviews[i]+ " - "+ratings[i]+"/5 - "+names[i].substr(0,names[i].length-5));
        num_reviews++;
      }
      i++;
    }
  });
}


function sendVendorPhotoMessage(recipientId, link) {
  request('https://www.caterspot.sg'+link, function (error, response, body) {
    //console.log('error:', error); // Print the error if one occurred 
    //console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received 
    //console.log('body:', body); // Print the HTML for the Google homepage. 
    var html = body.replace(/&amp;/g,'&')
    // use regex :O
    var regExpPhoto = new RegExp("\<li class=\"gallery-item col-xs-4 col-sm-3 col-md-2\" data-responsive=\"([^ ]*)", "gi");
    var regExpName = new RegExp("\<img alt=\"([^(from)]+)", "gi");
    //var regExpName = new RegExp("\<h4>([^<]+)", "gi");

    var photos = executeRegex(html, regExpPhoto)
    var names = executeRegex(html, regExpName)
    console.log(photos)
    console.log(names)
    
    // rating - what happens if no reviews or avg. is integer
    // options to see menu
    // see photos 
    // see reviews
    var cat_elem = []
    for (var i = 0; i < Math.min(5, names.length); i++){
      cat_elem.push({
        title: names[i],
        item_url: "https://www.caterspot.sg/",               
        image_url: photos[i]//,
        /*
        buttons: [{
          type: "postback",
          title: "Menu",
          payload: "url="+links[i]+"&previous=vendor_list"
        }, {
          type: "postback",
          title: "Photos",
          payload: "url="+links[i]+"/photos&previous=vendor_list"
        }, {
          type: "postback",
          title: "Reviews",
          payload: "url="+links[i]+"/reviews&previous=vendor_list"
        }],
        */
      })
    }
    // generate elements
    var messageData = {
      recipient: {
        id: recipientId
      },
      message: {
        attachment: {
          type: "template",
          payload: {
            template_type: "generic",
            elements: cat_elem
          }
        }
      }
    };  
    console.log(messageData)
    console.log(cat_elem)
    callSendAPI(messageData);
  });
}



function sendProductMessage(recipientId, link) {
  request(link, function (error, response, body) {
    //console.log('error:', error); // Print the error if one occurred 
    //console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received 
    //console.log('body:', body); // Print the HTML for the Google homepage. 
    if (body){
      var html = body.replace(/&quot;/g,'"')
    }
    // use regex :O
    var regExpItem = new RegExp("<div class=\"media\" data-attrs=\"([^=]+)\" data-url","gi")
    var items= []
    items = executeRegex(html, regExpItem)
    for (var j = 0; j < items.length; j++){
      items[j] = JSON.parse(items[j])
    }
    // rating - what happens if no reviews or avg. is integer
    console.log(items)
    //console.log(items2)
    // options to see menu
    // see photos 
    // see reviews
    var cat_elem = []
    for (var i = 0; i < 5; i++){
      if (items[i]['photos'].length > 0){
        var img_url = items[i]['photos'][0]
      } else{
        var img_url = ''
      }
      cat_elem.push({
            title: items[i]['name'],
            subtitle: items[i]['description'],
            item_url: link + "?menu_item_id=" + items[i]['uuid'],               
            image_url: img_url,
            buttons: [{
              type: "web_url",
              url: link,
              title: "See full menu"
            }, {
              type: "postback",
              title: "Other Caterers",
              payload: "url=www.caterspot.sg/caterers&previous=vendor_page"
            }],
          })
    }
    // generate elements
    var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "generic",
          elements: cat_elem
        }
      }
    }
  };
  callSendAPI(messageData);
  });
}


function executeRegex(html, regExp){
  // error if not found as [1]
  var ans = []
  var value = []
  while ((value = regExp.exec(html)) != null){
    ans.push(value[1])
  }
  return ans
}
