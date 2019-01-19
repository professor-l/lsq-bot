const tmi = require("tmi.js");
const http = require("http");
const fs = require("fs");
const MatchQueue = new require("./classes/match-queue");
const UserChecker = new require("./classes/user-checker");

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
let Check = new UserChecker();



client.connect();

// Connected message
client.on("connected", (address, port) => {
    console.log("Connected to channels");
    let s = JSON.stringify(options.channels);
    console.log(s.substring(1, s.length - 1));
});


function congratsMessage() {
    let messages = [
        "Congratulations!",
        "Well done!",
        "Great job!",
        "You killed it!",
        "You're awesome!",
        "That one's in the books!",
    ];
    return messages[Math.floor(Math.random() * messages.length)];
}


function challengeCommand(challenger, defender) {
    // If defender exists, add challenge between them
    Check.exists(defender, 
        () => {
            client.action(channel, 
                GlobalQueue.addChallenge(challenger, defender, () => {
                    client.action(channel, GlobalQueue.removeChallenge(challenger,defender, "timeout"));
                })
            );
        }, 

        // Otherwise, alert chat
        () => {
            client.action(channel, challenger + ": User \"" + defender + "\" is not in chat.");
        }
    );
}

function acceptedCommand(challenger, defender) {
    Check.exists(challenger,
        // If user exists, add match, remove challenge
        () => {
            client.action(channel, 
                GlobalQueue.addMatch(challenger, defender)
            );
            GlobalQueue.removeChallenge(challenger, defender, "accepted");
        },

        // Otherwise, alert chat
        () => {
            client.action(channel, defender + ": user \"" + challenger + "\" is not in chat.");
        }
    );
}

function declinedCommand(challenger, defender) {
    Check.exists(challenger,
        // If user exists, decline challenge
        () => {
            client.action(channel, 
                GlobalQueue.removeChallenge(challenger, defender, "declined")
            );
        },

        // Otherwise, alert chat
        () => {
            client.action(channel, defender + ": user \"" + challenger + "\" is not in chat.");
        }
    );
}

function cancelledCommand(challenger, defender) {
    Check.exists(challenger,
        // If user exists, cancel challenge
        () => {
            client.action(channel, 
                GlobalQueue.removeChallenge(challenger, defender, "cancelled")
            );
        },

        // Otherwise, alert chat
        () => {
            client.action(channel, defender + ": user \"" + challenger + "\" is not in chat.");
        }
    );
}

function forfeittedCommand(forfeitter, user2) {
    Check.exists(user2,

        // If user exists, remove match
        () => {
            client.action(channel, 
                GlobalQueue.removeMatch(forfeitter, user2, "forfeit")
            );
        },

        // Otherwise, alert chat
        () => {
            client.action(channel, forfeitter + ": user \"" + challenger + "\" is not in chat.");
        }
    );
}



function won(u1, u2) {
    client.action(users[0] + " wins their match against " + users[1] + "! " + congratsMessage());
    unimplemented();
}

function winnerCommand(winner) {
    ifUserExists(winner,
        
        () => {
            let d = GlobalQueue.queue[0].defender;
            let c = GlobalQueue.queue[0].challenger;

            // If winner
            if (winner != c && winner != d) {
                client.action("User \"" + winner + "\" is not playing!");
                return 1;
            }

            else if (winner == c) won(c, d);

            else won(d, c);
        },

        () => {
            client.action("User \"" + winner + "\" is not in chat.");
        }

    );
}

function removeCommand(index) {
    if (index == NaN)
        return;

    if (index > GlobalQueue.queue.length)
        return;
    
    let c = GlobalQueue.queue[index].challenger;
    let d = GlobalQueue.queue[index].defender;
    client.action(channel, GlobalQueue.removeMatch(c, d, "cancel"));
}

client.on("chat", (chatChannel, user, message, self) => {

    let ch = chatChannel.substring(1);

    // Display help message
    if (message == "!help")
        client.action(channel, "See https://github.com/professor-l/lsq-bot#readme for detailed instructions.");
    
        
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
        client.action(channel, GlobalQueue.listQueue());
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
                
            },

            () => {
                client.action(channel, user["display-name"] + ": You are not a moderator.");
            }
        );
    }

});

function unimplemented() {
    setTimeout(() => {
        client.action(channel, "Databse feature unimplemented. Result not saved.");
    }, 1001);
}