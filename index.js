const tmi = require("tmi.js");
const http = require("http");
const fs = require("fs");
const MatchQueue = new require("./classes/match-queue");
const UserChecker = new require("./classes/user-check");

// Main channel (only channel to accept queueing/moderator commands)
const channel = process.argv[2];

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



client.connect();

// Connected message
client.on("connected", (address, port) => {
    console.log("Connected to channels");
    let s = JSON.stringify(options.channels);
    console.log(s.substring(1, s.length - 1));
    client.action(channel, "is up and running again!");
});


function challengeCommand(challenger, defender) {
    // If defender exists, add challenge between them
    Check.exists(defender, 
        () => {
            client.say(channel, 
                GlobalQueue.addChallenge(challenger, defender, () => {
                    client.say(channel, GlobalQueue.removeChallenge(challenger,defender, "timeout"));
                })
            );
        }, 

        // Otherwise, alert chat
        () => {
            client.say(channel, challenger + ": User \"" + defender + "\" is not in chat.");
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
            client.say(channel, defender + ": user \"" + challenger + "\" is not in chat.");
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
            client.say(channel, defender + ": user \"" + challenger + "\" is not in chat.");
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
            client.say(channel, defender + ": user \"" + challenger + "\" is not in chat.");
        }
    );
}

function forfeittedCommand(forfeitter, user2) {
    Check.exists(user2,

        // If user exists, remove match
        () => {
            client.say(channel, 
                GlobalQueue.removeMatch(forfeitter, user2, "forfeit")
            );
        },

        // Otherwise, alert chat
        () => {
            client.say(channel, forfeitter + ": user \"" + challenger + "\" is not in chat.");
        }
    );
}


// Congratulate and notify chat that database is unimplemented
function won(winner, loser) {
    client.say(channel, GlobalQueue.matchCompleted(winner, loser));
    unimplemented();
}

function winnerCommand(winner) {
        
    let d = GlobalQueue.queue[0].defender;
    let c = GlobalQueue.queue[0].challenger;

    // If winnerd
    if (winner != c && winner != d) {
        client.say(channel, winner + " is not playing a match. Current match is between " + c + " and " + d + ".");
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

    if (arr.length != 3 || parseInt(arr[2]) == NaN)
        return;
    
    arr[2] = parseInt(arr[2]) - 1;
    
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

    if (ch != channel) {

        if (message.substring(0, 4) == "!pb ")
            unimplemented();
        
        if (message.substring(0, 7) == "!newpb ")
            unimplemented();
        
        if (message.substring(0, 7) == "!match ")
            unimplemented();

        return;
    }

    // Display help message
    if (message == "!help")
        client.say(channel, "See https://github.com/professor-l/lsq-bot#readme for detailed instructions.");
    
        
    else if (message.substring(0, 11) == "!challenge ") {    

        let challenger = user["display-name"];
        let defender = message.substring(11);

        challengeCommand(challenger, defender);
    }

    else if (message.substring(0, 8) == "!accept " || message.substring(0, 17) == "!acceptchallenge ") {


        let defender = user["display-name"];
        let challenger = message.substring(message.indexOf(" ") + 1);

        acceptedCommand(challenger, defender);
    }

    else if (message.substring(0, 9) == "!decline " || message.substring(0, 18) == "!declinechallenge ") {

        let defender = user["display-name"];
        let challenger = message.substring(message.indexOf(" ") + 1);

        declinedCommand(challenger, defender);
    }

    else if (message.substring(0, 8) == "!cancel " || message.substring(0, 17) == "!cancelchallenge ") {

        let defender = user["display-name"];
        let challenger = message.substring(message.indexOf(" ") + 1);

        cancelledCommand(challenger, defender);
    }

    else if (message.substring(0, 9) == "!forfeit " || message.substring(0, 14) == "!forfeitmatch ") {
        
        let forfeitter = user["display-name"];
        let user2 = message.substring(message.indexOf(" ") + 1);

        forfeittedCommand(forfeitter, user2);
    }

    else if (message == "!queue" || message == "!list" || message == "!matches") {
        client.say(channel, GlobalQueue.listQueue());
    }

    else {
        Check.moderator(user["display-name"], 

            () => {
                if (message.substring(0, 8) == "!winner ") {
                    winnerCommand(message.substring(8));
                }

                if (message.substring(0, 11) == "!addresult ") {

                    let users = message.substring(11).trim().split(" ");

                    if (users.length == 2) {
                        won(users[0], users[1]);
                    }
                }

                if (message.substring(0, 6) == "!kill " || message.substring(0, 13) == "!removematch ")
                    removeCommand(parseInt(message.substring(message.indexOf(" ") + 1)));
                
                if (message.substring(0, 5) == "!add " || message.substring(0, 10) == "!addmatch ")
                    addAtIndexCommand(message.substring(message.indexOf(" ") + 1));
                
                if (message == "!clear")
                    clearAllCommand();
                
                else if (message.substring(0, 7) == "!clear ") {
                    clearPlayerCommand(message.substring(7));
                }
            },

            () => {
                client.say(channel, user["display-name"] + ": You are not a moderator.");
            }
        );
    }

});

function unimplemented() {
    setTimeout(() => {
        client.say(channel, "Databse feature unimplemented. No results or personal bests can be saved at this time.");
    }, 1001);
}