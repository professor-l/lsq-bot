lsq-bot
======

LsQ Bot (short for Elle's Queue Bot) is [queueing](https://xkcd.com/853/) bot designed to allow players in a Twitch chat to matchmake with and challenge one another. It was designed specifically for Tetris Deathmatch, but it's open source and thus available to whomever wishes to use (or tweak) it. It is built on [Node.js](https://nodejs.org). It is also **completely open source**, and released under the MIT License (see [LICENSE](https://github.com/professor-l/lsq-bot/blob/master/LICENSE.md)).

**Note that this bot is still in its debugging stage and is not ready for production use.  If you want to fork it, consider following the repository to be notified when beta testing has finished.**

## Commands

#### LsQ Bot supports the following commands:

  * Queueing
    * `!challenge <user>`- challenges the user to a match, if such a user exists and they have no pending challenge from you or someone else. You may only challenge one user at a time.
    * `!accept` (or `!acceptchallenge`) - accepts the challenge issued to you if one has been made, and adds the match to the queue.
    * `!decline` (or `!declinechallenge`) - declines the challenge issued to you if one has been made.
    * `!cancel` (or `!cancelchallenge`) - cancels challenge against user, if such a challenge has been made.
    * `!forfeit <user>` (or `!forfeitmatch <user>`) - forefits your match against user, if such a match has been scheduled. 
    * `!queue` (or `!q`, `!list`, `!matches`) - prints queue in order, numbered. If this is spammed, I will add a feature that only lets it be called every 15 seconds. Please be respectful.

  * Matchmaking **(temporarily disabled)**
    * `!pb <user>` - Outputs the personal best score of user, if said user has set a PB.
    * `!newpb <pb>` (or `!setpb <pb>`) - Sets a new personal best for you.
    * `!match <user> <number>` - Prints out the players, currently present in chat, who have PBs closest to user's. The quantity of players printed is equal to number (maximum is 10).  Both arguments are optional - `user` defaults to you, `number` defaults to 3.
    * `!record <user>` - Prints out the user's record and win percentage. If no user is specified, defaults to you.

#### For moderators, the following commands also exist:

  * `!winner <user>` - Removes the match at number 1 in the queue (the current match at any given time), and declares user the winner in chat with a congratulatory message. Also adds result to the statistics file. Used at the end of matches.
  * `!addresult <winner> <loser>` - Congratulates winner and adds inputted result to the statistics file. Used for matches not in queue.
  * `!removematch <index>` (or `!kill`) - Removes a match from the queue at the given index, without declaring a winner. Used at moderator's discretion.
  * `!add <user1> <user2> <index>` (or `!addmatch`) - Adds a match between user1 and user2 at the inputted index in the queue. IF no index is specified, the match is added to the end. This command may, for instance, be used for impromptu matches between top players.
  * `!clear <user>` (or `!clearqueue <user>`) - Clears all matches in which user is a participant. If no user is specified, this clears the entire queue, so be careful!
  * `!shoutout` (or `!so`) - Gives a shoutout to the players of the current match, linking their Twitch channels. (TODO: make automatic)
  
## For developers

If you intend to use this bot yourself, there are a few steps you need to take. It requires the installation of [Node.js](https://nodejs.org/). Once you have cloned this repository to your machine, navigate to the home directory in your terminal and run `npm install`. This will install the necessary packages to communicate with the Twitch chat.

Next, you must create a folder in the lsq-bot directory called `input-files`. Inside that folder, create `channels.txt` and `oathkey.txt`. `channels.txt` will have a comma-separated list of all the channels to include in your bot. Note that the matchmaking commands are supported for **one channel only**, but the personal best tracking can be accessed from any channel in the `channels.txt` file. This is something I may fix in later versions, but for now it fits my needs and I don't have the time to change it at the moment. 

In the `oathkey.txt` file, paste the oath key acquired from [this link](https://twitchapps.com/tmi/), making sure that you are signed in to the bot account on Twitch before you request the key. This will allow the bot to log into twitch and participate in chat.

Finally, create a `db` directory in the `lsq-bot` home directory, and inside that create a `data.json` file. This is where personal bests and match results will be stored.

The bot should be ready to go! To run, type `node index.js [channel]`, where `[channel]` is replaced by the main channel in which your bot will be running - the channel in which the queue will reside. Be sure to include that channel in `channels.txt`, or it won't work!