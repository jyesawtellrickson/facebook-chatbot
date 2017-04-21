# Facebook Messenger Bot

This bot is built off the example project located in [Messenger Platform docs](https://developers.facebook.com/docs/messenger-platform/guides/quick-start).

It's a bot that helps users to discover catering options for their event. It can send a few different template types, helping the user to see caterers, menu options, reviews and photos. This project is not dependent on any external libraries and can easily be extended.

![](https://cdn.gomix.com/ca73ace5-3fff-4b8f-81c5-c64452145271%2FmessengerBotGIF.gif)

## Getting Started
To get started you need to:

- Set up your Facebook app on Facebook

- Configure your Facebook App

  The `Callback URL` you set when configuring your app on Facebook is your Gomix project's publish URL with '/webhook' appended. The publish URL is what loads when you click 'Show' and has the format 'https://project-name.gomix.me', so for this example we used 'https://messenger-bot.gomix.me/webhook' for the Callback URL.

  The `Verify Token` is a string you make up - it's just used to make sure it is your Facebook app that your server is interacting with. 

- Copy your app credentials into the `.env` file

For more detailed setup instructions, see [Messenger Platform Quick Start](https://developers.facebook.com/docs/messenger-platform/guides/quick-start).

## To Do
The bot still requires intelligence as it can only handle basic one-dimensional conversations at the moment. This should be improved by leveraging some AI Chat libraries. The content should also be made for free form.

Currenly there are many cases where no images are returned, these need to dealt with in such a way as to still communicate useful information to the user.

## Screenshots
The following are screenshots taken from the test application.

<img src="http://i.imgur.com/ByOcAno.png" width=250px><img src="http://i.imgur.com/9rErvBW.png" width=250px><img src="http://i.imgur.com/mrLJL9v.png" width=250px><img src="http://i.imgur.com/9aTv553.png" width=250px><img src="http://i.imgur.com/82c4fI5.png" width=250px>
