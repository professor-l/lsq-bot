const tmi = require("tmi.js");
const http = require("http");
const fs = require("fs");
const MatchQueue = new require("./classes/match-queue");
const UserChecker = new require("./classes/user-checker");
const DataCommunicator = new require("./classes/data-communicator.js");

// Main channel (only channel to accept queueing/moderator commands)
const channel = process.argv[2];
const botName = "lsq_bot";

// Read comma-separated channels file
// Split by commas
// Strip leading/trailing spaces
const channelList = fs.readFileSync("input_files/channels.txt", "utf8").split(",").map(c => c.trim());

if (channelList.indexOf(channel) == -1) {
    console.log("Error: Channel is not in channels.txt. Try editing the file or choosing another channel.");
    process.exitCode = 1;
}

// Read oath password fromfile
const pw = fs.readFileSync("input_files/oathkey.txt", "utf8");

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
        username: "lsq_bot",
        password: pw
    },
    channels: channelList
};

const client = new tmi.client(options);

let GlobalQueue = new MatchQueue();
let Check = new UserChecker(channel);
let DB = new DataCommunicator("db/data.json", 60000);



client.connect();

// Connected message
client.on("connected", (address, port) => {
    console.log("Connected to channels");
    let s = JSON.stringify(options.channels);
    console.log(s.substring(1, s.length - 1));
    client.action(channel, "is up and running again!");
});



function challengeCommand(challenger, defender) {
    
    if (challenger == defender) {
        client.say(channel, "You can't challenge yourself, silly!");
        return;
    }

    // If defender exists, add challenge between them
    Check.exists(defender, 
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
    Check.exists(challenger,
        // If user exists, add match, remove challenge
        () => {
            client.say(channel, 
                GlobalQueue.addMatch(challenger, defender)
            );
            GlobalQueue.removeChallenge(challenger, defender, "accepted");
        },

        // Otherwise, alert chat
        () => {
            client.say(channel, defender + " : user \"" + challenger + "\" is not in chat.");
        }
    );
}

function declinedCommand(challenger, defender) {
    Check.exists(challenger,
        // If user exists, decline challenge
        () => {
            client.say(channel, 
                GlobalQueue.removeChallenge(challenger, defender, "declined")
            );
        },

        // Otherwise, alert chat
        () => {
            client.say(channel, defender + " : user \"" + challenger + "\" is not in chat.");
        }
    );
}

function cancelledCommand(challenger, defender) {
    Check.exists(challenger,
        // If user exists, cancel challenge
        () => {
            client.say(channel, 
                GlobalQueue.removeChallenge(challenger, defender, "cancelled")
            );
        },

        // Otherwise, alert chat
        () => {
            client.say(channel, defender + " : user \"" + challenger + "\" is not in chat.");
        }
    );
}

function forfeittedCommand(forfeitter, user2) {
    client.say(channel, GlobalQueue.removeMatch(forfeitter, user2, "forfeit"));
}


// Congratulate and add statistics
function won(winner, loser) {
    client.say(channel, GlobalQueue.matchCompleted(winner, loser));
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
    index--;

    if (index == NaN)
        return;

    if (index >= GlobalQueue.queue.length)
        return;
    
    // Remove matches
    let c = GlobalQueue.queue[index].challenger;
    let d = GlobalQueue.queue[index].defender;
    client.say(channel, GlobalQueue.removeMatch(c, d, "cancel"));
}

function addAtIndexCommand(message) {

    let arr = message.trim().split(" ");

    if (arr.length < 2 || arr.length > 3 || (arr.length == 3 && parseInt(arr[2]) == NaN))
        return;
    
    arr[2] = parseInt(arr[2]) - 1 || GlobalQueue.queue.length;

    if (arr[2] < 0 || arr[2] > GlobalQueue.queue.length)
        client.say(channel, "Invalid index. Cannot add ")
   
    for (let i = 0; i < 2; i++) {
        if (arr[i][0] == "@")
            arr[i] = arr[i].substring(1);
        arr[i] = arr[i].toLowerCase();
        
        if (arr[i] == botName) {
            client.say(channel, "I don't play matches!");
            return;
        }
    }

    client.say(channel, GlobalQueue.addMatchAtIndex(arr[0], arr[1], arr[2]));

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

client.on("chat", (chatChannel, user, message, self) => {

    let ch = chatChannel.substring(1);

    if (message == "!pb") {
        let u = user["display-name"].toLowerCase();
        let pb = DB.getValue(u, "pb");
        client.say(chatChannel, u + " has a personal best of " + pb + ".");
    }

    else if (message.startsWith("!pb ")) {
        let u = message.substring(4).toLowerCase();
        if (u[0] == "@") u = u.substring(1);

        if (u.indexOf(" ") != -1)
            return;
        
        let pb = DB.getValue(u, "pb") || 0;
        if (pb)
            client.say(chatChannel, u + " has a personal best of " + pb + ".");
        else 
            client.say(chatChannel, "User \"" + u + "\" has not saved a personal best.");

    }
    
    else if (message.startsWith("!newpb ")) {
        let newpb = parseInt(message.substring(7));
        if (newpb != message.substring(7))
            return;
        
        if (newpb < 0)
            client.say("Your PB can't be negative, silly!");
        
        client.say(chatChannel, DB.addPB(user["display-name"].toLowerCase(), newpb));
    }
    
    else if (message == "!match")
        client.say(chatChannel, DB.match(user["display-name"].toLowerCase(), 3));
    
    else if (message.startsWith("!match ")) {
        let after = message.substring(7).split(" ");
        let u = user["display-name"].toLowerCase();
        if (after.length > 2 || after.length == 0) 
            return;
        
        if (after.length == 1) {
            let arg = parseInt(after[0]);

            if (arg != NaN) {
                if (arg > 10) arg = 10;
                client.say(chatChannel, DB.match(u, arg));
                return;
            }

            if (!DB.getValue(u, "pb")) {
                client.say(chatChannel, u + " : You haven't saved a pb!");
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
        
        client.say(chatChannel, DB.match(u, n));

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

        if (defender == botName) {
            client.say(channel, "You can't challenge me!");
            return;
        }

        challengeCommand(challenger, defender);
    }

    else if (message.startsWith("!accept ") || message.startsWith("!acceptchallenge ")) {


        let defender = user["display-name"];
        let challenger = message.substring(message.indexOf(" ") + 1);
        if (challenger[0] == "@")
            challenger = challenger.substring(1);

        acceptedCommand(challenger, defender);
    }

    else if (message.startsWith("!decline ") || message.startsWith("!declinechallenge")) {

        let defender = user["display-name"];
        let challenger = message.substring(message.indexOf(" ") + 1);
        if (challenger[0] == "@")
            challenger = challenger.substring(1);

        declinedCommand(challenger, defender);
    }

    else if (message.startsWith("!cancel ") || message.startsWith("!cancelchallenge ")) {

        let challenger = user["display-name"];
        let defender = message.substring(message.indexOf(" ") + 1);
        if (defender[0] == "@")
            defender = defender.substring(1);

        cancelledCommand(challenger, defender);
    }

    else if (message.startsWith("!forfeit ") || message.startsWith("!forfeitmatch ")) {
        
        let forfeitter = user["display-name"];
        let user2 = message.substring(message.indexOf(" ") + 1);
        if (user2[0] == "@")
            user2 = user2.substring(1);

        forfeittedCommand(forfeitter, user2);
    }

    else if (message == "!queue" || message == "!list" || message == "!matches") {
        client.say(channel, GlobalQueue.listQueue());
    }

    else if (message.startsWith("!winner ")) {

        let w = message.substring(8).toLowerCase();
        if (w[0] == "@")
            w = w.substring(1);

        Check.moderator(user["display-name"], 
        
            () => {
                winnerCommand(w);
            },

            () => {
                client.say(channel, user["display-name"] + " : you are not a moderator.");
            }
        );
    }

    else if (message.startsWith("!addresult ")) {
        Check.moderator(user["display-name"], 
        
            () => {
                let users = message.substring(11).trim().split(" ");
                if (users.length == 2) {
                    users = users.map((u) => {
                        u = u.toLowerCase();
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
        Check.moderator(user["display-name"], 
        
            () => {
                removeCommand(parseInt(message.substring(message.indexOf(" ") + 1)));
            },

            () => {
                client.say(channel, user["display-name"] + " : you are not a moderator.");
            }
            
        );
    }

    else if (message.startsWith("!add ") || message.startsWith("!addmatch ")) {
        Check.moderator(user["display-name"], 
        
            () => {
                addAtIndexCommand(message.substring(message.indexOf(" ") + 1));
            },

            () => {
                client.say(channel, user["display-name"] + " : you are not a moderator.");
            }
            
        );
    }

    else if (message.startsWith("!clear ")) {
        Check.moderator(user["display-name"], 

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
        Check.moderator(user["display-name"],
        
            clearAllCommand,

            () => {
                client.say(channel, user["display-name"] + " : you are not a moderator.");
            }
        
        );
    }

    else if (message == "!shoutout" || message == "!so") {

        if (!GlobalQueue.queue.length)
            return;
        
        let c = GlobalQueue.queue[0].challenger;
        let d = GlobalQueue.queue[0].defender;

        client.say(channel, "Like the current match? Follow the players at https://www.twitch.tv/" + c + " and https://www.twitch.tv/" + d + " respectively. Good luck to them!");
    }

});

function unimplemented() {
    setTimeout(() => {
        client.say(channel, "Databse feature unimplemented. No results or personal bests can be saved at this time.");
    }, 1001);
}