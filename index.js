const tmi = require("tmi.js");
const http = require("http");
const fs = require("fs");
const MatchQueue = new require("./classes/match-queue");
const UserChecker = new require("./classes/user-checker");
const DataCommunicator = new require("./classes/data-communicator");
const ChannelList = new require("./classes/channel-list");

// Main channel (only channel to accept queueing/moderator commands)
const channel = process.argv[2].toLowerCase();
const botName = "classictetrisbot";

// Read comma-separated channels file
// Split by commas
// Strip leading/trailing spaces

// Read oath password fromfile
const pw = fs.readFileSync("input_files/oathkey.txt", "utf8");

let GlobalQueue = new MatchQueue();
let Check = new UserChecker(channel);
let DB = new DataCommunicator("db/data.json", 60000);
let ChannelsObject = new ChannelList("db/channels.txt");

let shoutoutTimeout;

// Options object
const options = {
    options: {
        debug: true
    },
    connection: {
        cluster: "aws",
        reconnect: true 
    },
    identity: {
        username: "classictetrisbot",
        password: pw
    },
    channels: ChannelsObject.channels.slice()
};

function commaSeparate(n) {
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}

const client = new tmi.client(options);

client.connect();

// Connected message
client.on("connected", (address, port) => {
    client.action(channel, "is up and running again!");
    console.log("Startup successful");
});

function summonCommand(user) {
    if (ChannelsObject.channels.indexOf(user) != -1)
        return user + " : I'm already in your channel!";

    client.join("#" + user).then(() => {

        ChannelsObject.add(user);
    });
    return user + " : this bot has been summoned to your channel!";
}

function leaveCommand(user) {
    client.part("#" + user).then(() => {
        ChannelsObject.remove(user);
        console.log("TEST");
    });
}

function matchCommand(chatChannel, user, n) {
    Check.users(chatChannel, (users) => {
        let all = DB.match(user);
        let matches = []

        for (let i = 0; i < all.length; i++) {
            if (matches.length >= n)
                break;
            if (users.indexOf(all[i][0]) != -1 && all[i][0] != user)
                matches.push(all[i]);
        }

        if (!matches.length) {
            client.say(chatChannel, "No other users with a PB are in chat :(");
            return;
        }

        let s = matches.map((upb) => {
            return upb[0] + " (" + commaSeparate(upb[1]) + ")"
        }).join(", ");

        client.say(chatChannel, "Best matches for " + user + " are " + s);

    });
}

function challengeCommand(challenger, defender) {
    
    if (challenger == defender) {
        client.say(channel, "You can't challenge yourself, silly!");
        return;
    }

    for (let i = 0; i < GlobalQueue.challenges.length; i++) {
        if (GlobalQueue.challenges[i].challenger == challenger) {
            client.say(channel, challenger + " : You have already challenged someone else to a match!");
            return;
        }
    }

    // If defender exists, add challenge between them
    Check.exists(channel, defender, 
        () => {
            client.say(channel, 
                GlobalQueue.addChallenge(challenger, defender, () => {
                    client.say(channel, GlobalQueue.removeChallenge(challenger, defender, "timeout"));
                })
            );
        }, 

        // Otherwise, alert chat
        () => {
            client.say(channel, challenger + " : User \"" + defender + "\" is not in chat.");
        }
    );
}

function acceptedCommand(challenger, defender) {

    client.say(channel, GlobalQueue.addMatch(challenger, defender));
    GlobalQueue.removeChallenge(challenger, defender, "accepted");

    
}

function declinedCommand(challenger, defender) {
    client.say(channel, GlobalQueue.removeChallenge(challenger, defender, "declined"));
}

function cancelledCommand(challenger, defender) {
    client.say(channel, GlobalQueue.removeChallenge(challenger, defender, "cancelled"));
}

function forfeittedCommand(forfeitter, user2) {
    client.say(channel, GlobalQueue.removeMatch(forfeitter, user2, "forfeit"));
    
}


// Congratulate and add statistics
function won(winner, loser) {
    client.say(channel, GlobalQueue.matchCompleted(winner, loser));

    setShoutoutTimeout();

    DB.addWin(winner);
    DB.addLoss(loser);
    
}

function winnerCommand(winner) {
        
    if (!GlobalQueue.queue.length) 
        return; 

    let d = GlobalQueue.queue[0].defender;
    let c = GlobalQueue.queue[0].challenger;

    // If winnerd
    if (winner != c && winner != d) {
        client.say(channel, winner + " is not playing a match. Current match is between " + c + " and " + d + " .");
        return;
    }

    if (winner == c) won(c, d);
    else won(d, c);
}

function removeCommand(index) {

    if (index == NaN)
        return;
    
    index--;

    if (index >= GlobalQueue.queue.length)
        return;
    
    // Remove matches
    let c = GlobalQueue.queue[index].challenger;
    let d = GlobalQueue.queue[index].defender;
    client.say(channel, GlobalQueue.removeMatch(c, d, "cancel"));

    resetShoutoutTimeout();
    
}

function addAtIndexCommand(message) {

    let arr = message.trim().split(" ");

    if (arr.length < 2 || arr.length > 3 || (arr.length == 3 && parseInt(arr[2]) == NaN))
        return;
    
    if (parseInt(arr[2]))
        arr[2] = parseInt(arr[2]) - 1;
    else
        arr[2] = GlobalQueue.queue.length;

    if (arr[2] < 0 || arr[2] > GlobalQueue.queue.length)
        client.say(channel, "Invalid index. Cannot add.")
   
    for (let i = 0; i < 2; i++) {
        if (arr[i][0] == "@")
            arr[i] = arr[i].substring(1);
        
        if (arr[i].toLowerCase() == botName) {
            client.say(channel, "I don't play matches!");
            return;
        }
    }

    client.say(channel, GlobalQueue.addMatchAtIndex(arr[0], arr[1], arr[2]));

    if (GlobalQueue.queue.length == 1) {
        setShoutoutTimeout();
    }
    
}

function clearAllCommand() {
    GlobalQueue.queue = [];
    client.say(channel, "You have exerted your power, and the queue has been cleared.");
    
}

function clearPlayerCommand(player) {
    let original = GlobalQueue.queue.length;
    for (let i = 0; i < GlobalQueue.queue.length; i++) {
        if (GlobalQueue.queue[i].defender == player || GlobalQueue.queue[i].challenger == player) {
            GlobalQueue.queue.splice(i, 1);
            i--;
        }
    }

    if (original == GlobalQueue.queue.length) {
        client.say(channel, "No matches were scheduled with \"" + player + "\". Queue unchanged.");
        return;
    }

    client.say(channel, "All matches with player \"" + player + "\" removed. New queue: " + GlobalQueue.listQueue());
    
}

function shoutoutCommand() {

    if (!GlobalQueue.queue.length)
        return;
    
    let c = GlobalQueue.queue[0].challenger;
    let d = GlobalQueue.queue[0].defender;

    client.say(channel, "Like the current match? Follow the players at https://www.twitch.tv/" + c + " and https://www.twitch.tv/" + d + " respectively. Good luck to them!");
}

function resetShoutoutTimeout() {
    clearTimeout(shoutoutTimeout);

    if (!GlobalQueue.queue.length)
        return;

    setShoutoutTimeout();
}

function setShoutoutTimeout() {
    shoutoutTimeout = new setTimeout(shoutoutCommand, 60 * 1000 * 3);
}

client.on("chat", (chatChannel, user, message, self) => {


    user["display-name"] = user["display-name"].toLowerCase();
    message = message.toLowerCase();

    let ch = chatChannel.substring(1);

    if (message == "!3" || message == "!321" || message == "!countdown") {
        Check.moderator(chatChannel, user["display-name"], 
        
            () => {
                setTimeout(() => {client.say(chatChannel, "3")}, 1000);
                setTimeout(() => {client.say(chatChannel, "2")}, 2000)
                setTimeout(() => {client.say(chatChannel, "1")}, 3000)
                setTimeout(() => {client.say(chatChannel, "Tetris!")}, 4000)
            },
            
            () => { console.log("B"); return; }
        );
    }

    if (message.toLowerCase() == "!summon")
        client.say(chatChannel, summonCommand(user["display-name"]));

    else if (message == "!pleaseleavemychannel") {
        if (user["display-name"] == ch) {
            client.say(chatChannel, "Byebye! If you want me back, just !summon me again from a channel I'm a part of. o/");
            leaveCommand(ch);
        }
        else
            client.say(chatChannel, "This isn't your channel >.>");
    }

    

    else if (message == "!pb") {
        let u = user["display-name"];
        let pb = commaSeparate(DB.getValue(u, "pb"));
        client.say(chatChannel, u + " has a personal best of " + pb + ".");
    }

    else if (message.startsWith("!pb ")) {
        let u = message.substring(4);
        if (u[0] == "@") u = u.substring(1);

        if (u.indexOf(" ") != -1 || parseInt(u))
            return;
        
        let pb = commaSeparate(DB.getValue(u, "pb"));

        client.say(chatChannel, u + " has a personal best of " + pb + ".");


    }
    
    else if (message.startsWith("!newpb ")) {
        newpb = parseInt(message.substring(7).replace(/,/g, ""));
        if (newpb != 0 && (!newpb)) {
           client.say(chatChannel, "Invalid PB.");
        }
        else if (newpb < 0)
            client.say(chatChannel, "Your PB can't be negative, silly!");
        else if (newpb > 1400000)
            client.say(chatChannel, "Mmm... I don't think so, @" + user["display-name"]);
        
        else {
            client.say(chatChannel, user["display-name"] + " has a new pb of " + commaSeparate(newpb) + "!");
            DB.addPB(user["display-name"], newpb);
        }
    }
    
    else if (message == "!match")
        matchCommand(chatChannel, user["display-name"], 3);

    else if (message.startsWith("!match ")) {
        let after = message.substring(7).split(" ");
        let u = user["display-name"];
        if (after.length > 2 || after.length == 0) 
            return;
        
        if (after.length == 1) {

            if (!DB.getValue(u, "pb")) {
                client.say(chatChannel, u + " : You haven't saved a pb!");
                return;
            }

            let arg = parseInt(after[0]);

            if (arg != NaN) {
                if (arg > 10) arg = 10;
                matchCommand(chatChannel, u, arg);
                return;
            }

            client.say(chatChannel, DB.match(u));

            return;
        }

        u = after[0];
        n = parseInt(after[1]);

        if (!DB.getValue(u, "pb")) {
            client.say(chatChannel, "User \"" + u + "\" has not saved a pb.");
        }

        if (n == NaN)
            return;
        
        matchCommand(chatChannel, u, n);

    }
    


    else if (message == "!record")
        client.say(chatChannel, DB.getRecord(user["display-name"]));
    
    else if (message.startsWith("!record ")) {

        let u = message.substring(message.indexOf(" ") + 1);
        if (u.indexOf(" ") != -1) return;
        if (u[0] == "@") u = u.substring(1);

        if (u.toLowerCase() == botName) {
            client.say(chatChannel, "Oh, me? I've got 999999 wins and no losses. A real maxout!");
            return;
        }
        
        client.say(chatChannel, DB.getRecord(u));
    }


    // Display help message

    else if (message == "!help")
        client.say(chatChannel, "See https://github.com/professor-l/lsq-bot#readme for detailed instructions.");
    

    
    else if (ch != channel.toLowerCase())
        return;
    
        
    else if (message.startsWith("!challenge ") || message.startsWith("!chal ")) {    

        let challenger = user["display-name"];
        let defender = message.substring(message.indexOf(" ") + 1);
        if (defender[0] == "@")
            defender = defender.substring(1);

        if (defender.toLowerCase() == botName) {
            client.say(channel, "You can't challenge me!");
            return;
        }

        challengeCommand(challenger, defender);
    }

    else if (message == "!accept" || message == "!acceptchallenge") {


        let defender = user["display-name"];
        let challenger;

        for (let i = 0; i < GlobalQueue.challenges.length; i++) {
            if (GlobalQueue.challenges[i].defender == defender) {
                challenger = GlobalQueue.challenges[i].challenger;
                break;
            }
        }

        if (!challenger) {
            client.say(channel, defender + " : No one has challenged you!");
        }

        acceptedCommand(challenger, defender);
    }

    else if (message == "!decline" || message == "!declinechallenge") {

        let defender = user["display-name"];
        let challenger;

        for (let i = 0; i < GlobalQueue.challenges.length; i++) {
            if (GlobalQueue.challenges[i].defender == defender) {
                challenger = GlobalQueue.challenges[i].challenger;
                break;
            }
        }

        if (!challenger) {
            client.say(channel, defender + " : No one has challenged you!");
        }

        declinedCommand(challenger, defender);
    }

    else if (message == "!cancel" || message == "!cancelchallenge" || message == "!cancelchal") {

        let challenger = user["display-name"];

        for (let i = 0; i < GlobalQueue.challenges.length; i++) {
            if (GlobalQueue.challenges[i].challenger == challenger) {
                cancelledCommand(challenger, GlobalQueue.challenges[i].defender);
                return;
            }
        }

        client.say(channel, challenger + " : You have not challenged anyone!");
        
    }

    else if (message.startsWith("!forfeit ") || message.startsWith("!forfeitmatch ")) {
        
        let forfeitter = user["display-name"];
        let user2 = message.substring(message.indexOf(" ") + 1);
        if (user2[0] == "@")
            user2 = user2.substring(1);

        forfeittedCommand(forfeitter, user2);
    }

    else if (message == "!queue" || message == "!list" || message == "!matches" || message == "!q") {
        client.say(channel, GlobalQueue.listQueue());
    }

    else if (message.startsWith("!winner ")) {

        let w = message.substring(8);
        if (w[0] == "@")
            w = w.substring(1);

        Check.moderator(channel, user["display-name"], 
        
            () => {
                winnerCommand(w);
            },

            () => {
                client.say(channel, user["display-name"] + " : you are not a moderator.");
            }
        );
    }

    else if (message.startsWith("!addresult ")) {
        Check.moderator(channel, user["display-name"], 
        
            () => {
                let users = message.substring(11).trim().split(" ");
                if (users.length == 2) {
                    users = users.map((u) => {
                        if (u[0] == "@") u = u.substring(1);
                        return u;
                    });
                    won(users[0], users[1]);
                }
            },

            () => {
                client.say(channel, user["display-name"] + " : you are not a moderator.");
            }
            
        );
    }

    else if (message.startsWith("!kill ") || message.startsWith("!removematch ")) {
        Check.moderator(channel, user["display-name"], 
        
            () => {
                removeCommand(parseInt(message.substring(message.indexOf(" ") + 1)));
            },

            () => {
                client.say(channel, user["display-name"] + " : you are not a moderator.");
            }
            
        );
    }

    else if (message.startsWith("!add ") || message.startsWith("!addmatch ")) {
        Check.moderator(channel, user["display-name"], 
        
            () => {
                addAtIndexCommand(message.substring(message.indexOf(" ") + 1));
            },

            () => {
                client.say(channel, user["display-name"] + " : you are not a moderator.");
            }
            
        );
    }

    else if (message == "!close") {
        Check.moderator(channel, user["display-name"], 
        
            () => {
                client.say(channel, GlobalQueue.closeChallenges());
            },

            () => {
                client.say(channel, user["display-name"] + " : you are not a moderator.");
            }

        );
    }

    else if (message == "!open") {
        Check.moderator(channel, user["display-name"], 
        
            () => {
                client.say(channel, GlobalQueue.openChallenges());
            },

            () => {
                client.say(channel, user["display-name"] + " : you are not a moderator.");
            }

        );
    }

    else if (message.startsWith("!clear ")) {
        Check.moderator(channel, user["display-name"], 

            () => {
                let u = message.substring(7);
                if (u[0] == "@") u[0] = u[0].substring(1);
                clearPlayerCommand(u);
            },

            () => {
                client.say(channel, user["display-name"] + " : you are not a moderator.");
            }
            
        );
    }

    else if (message == "!clear") {
        Check.moderator(channel, user["display-name"],
        
            clearAllCommand,

            () => {
                client.say(channel, user["display-name"] + " : you are not a moderator.");
            }
        
        );
    }

    else if (message == "!shoutout" || message == "!so") {
        Check.moderator(channel, user["display-name"],
        
            shoutoutCommand,

            () => {
                client.say(channel, user["display-name"] + " : you are not a moderator.");
            }
        );
    }

});
