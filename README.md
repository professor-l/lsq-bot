lsq-bot
======

LsQ Bot (short for Elle's Queue Bot) is a [queueing](https://xkcd.com/853/) bot designed to allow players in a Twitch chat to matchmake with and challenge one another. It was designed specifically for Tetris Deathmatch, but it's open source and thus available to whomever wishes to use (or tweak) it. It is built on [Node.js](https://nodejs.org), and released under the MIT License (see [LICENSE](https://github.com/professor-l/lsq-bot/blob/master/LICENSE.md)).

## Commands

#### LsQ Bot supports the following commands:

  * Queueing
    * `!challenge <user>`- challenges the user to a match, if such a user exists, you have not yet challenged them, and no match between you and the user is already in the queue. Challenge expires after 30 seconds.
    * `!accept <user>` (or `!acceptchallenge <user>`) - accepts user's challenge if such a challenge has been made, and adds the match to the queue.
    * `!decline <user>` (or `!declinechallenge <user>`) - declines user's challenge if such a challenge has been made.
    * `!cancel <user>` (or `!cancelchallenge <user>`) - cancels challenge against user, if such a challenge has been made.
    * `!forfeit <user>` (or `!forfeitmatch <user>`) - forefits your match against user, if such a match has been scheduled. 
    * `!queue` (or `!list`, `!matches`) - prints queue in order, numbered. If this is spammed, I will add a feature that only lets it be called every 15 seconds. Please be respectful.

  * Matchmaking (unimplemented)
    * `!pb <user>` - Outputs the personal best score of user, if said user has set a PB.
    * `!newpb <pb>` (or `!setpb <pb>`) - Sets a new personal best for you.
    * `!match <user> <number>` - Prints out the players, currently present in chat, who have PBs closest to user's. The quantity of players printed is equal to number (maximum is 10).  Both arguments are optional - `user` defaults to you, `number` defaults to 3.

#### For moderators, the following commands also exist (unimplemented):
  * `!winner <user>` - Removes the match at number 1 in the queue (the current match at any given time), and declares user the winner in chat with a congratulatory message. Also adds result to statistics file. Used at the end of matches.
  * `!addresult <winner> <loser>` - Adds result to statistics file without 
  * `!removematch` (or `!kill`) - Removes a match from the queue, without declaring a winner. Used at moderator's discretion. Arguments are `<user1> <user2>` or `<index>` - either will work.
  * `!clear <user>` (or `!clearqueue <user>`) - Clears all matches in which user is a participant. If no user is specified, clears the entire queue, so be careful!
  
