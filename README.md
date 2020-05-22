# Project 2 Flack

Web Programming with Python and JavaScript

This application is an online messaging service using Flask, similar in spirit to Slack.  

When users visit the ***Flack*** for the first time, they are prompted to type in a *display name* that will eventually be associated with every message the user sends. The app uses *local storage* for storing *display name* on client side.  
The ***Flack*** allows creating and viewing channels in three groups or three topics - **Python**, **CSS** and **Javascript**. The user can switch between them using the *top navbar*.

Any user is able to create a new channel, so long as its name doesn’t conflict with the name of an existing channel in the group. To do this, click on **"create channel"** below the list of existing channels on the *left navbar*.  
Once a channel is selected, the user can see any messages that have already been sent in that channel, up to a maximum of 100 messages. The app stores the 100 most recent messages per channel in server-side memory in a global variable.

If the user is on a channel page, closes the web browser window, and goes back to the app, the ***Flack*** takes the user back to that channel. The *local storage* is used to store this data.

The users can delete their own messages from the chat with the option to select - *"Delete for you"* or *"Delete for everyone"*.  
Sending, receiving and deleting messages is done using **Websockets**.
