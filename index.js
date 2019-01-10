const tmi = require("tmi.js");
const http = require("http");
const fs = require("fs");
const MatchQueue = new require("./match-queue")

const channel = process.argv[2];

// Options 
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
        password: fs.readFileSync("oathkey.txt");
    },
    channels: [channel]
};

const client = new tmi.client(options);

const helpString = "See https://github.com/professor-l/lsq-bot#readme for detailed instructions."



let GlobalQueue = new MatchQueue();



client.connect();

client.on("connected", (address, port) => {
    client.action(channel, "LsQ Bot connected. (( Source code: https://github.com/professor-l/lsq-bot. ))");
});

function challengeCommand(challenger, defender) {
    ifUserExists(defender, 
        () => {
            client.action(channel, 
                GlobalQueue.addChallenge(challenger, defender, () => {
                    client.action(channel, GlobalQueue.removeChallenge(challenger,defender, "timeout"));
                })
            );
        }, 

        () => {
            client.action(channel, challenger + ": User \"" + defender + "\" is not in chat.");
        }
    );
}

function acceptedCommand(challenger, defender) {
    ifUserExists(challenger,
        () => {
            client.action(channel, 
                GlobalQueue.addMatch(challenger, defender)
            );
            GlobalQueue.removeChallenge(challenger, defender, "accepted");
        },

        () => {
            client.action(channel, defender + ": user \"" + challenger + "\" is not in chat.");
        }
    );
}

function declinedCommand(challenger, defender) {
    ifUserExists(challenger,
        () => {
            client.action(channel, 
                GlobalQueue.removeChallenge(challenger, defender, "declined")
            );
        },

        () => {
            client.action(channel, defender + ": user \"" + challenger + "\" is not in chat.");
        }
    );
}

function cancelledCommand(challenger, defender) {
    ifUserExists(challenger,
        () => {
            client.action(channel, 
                GlobalQueue.removeChallenge(challenger, defender, "cancelled")
            );
        },

        () => {
            client.action(channel, defender + ": user \"" + challenger + "\" is not in chat.");
        }
    );
}

function forfeittedCommand(forfeitter, user2) {
    ifUserExists(user2,
        () => {
            client.action(channel, 
                GlobalQueue.removeMatch(forfeitter, user2, "forfeit")
            );
        },

        () => {
            client.action(channel, forfeitter + ": user \"" + challenger + "\" is not in chat.");
        }
    );
}

client.on("chat", (chatChannel, user, message, self) => {
    if (message == "!help")
        client.action(channel, helpString);
    
    if (message.substring(0, 11) == "!challenge ") {    

        let challenger = user["display-name"];
        let defender = message.substring(11);

        challengeCommand(challenger, defender);
    }

    if (message.substring(0, 8) == "!accept " || message.substring(0, 17) == "!acceptchallenge ") {


        let defender = user["display-name"];
        let challenger = message.substring(message.indexOf(" ") + 1);

        acceptedCommand(challenger, defender);
    }

    if (message.substring(0, 9) == "!decline " || message.substring(0, 18) == "!declinechallenge ") {

        let defender = user["display-name"];
        let challenger = message.substring(message.indexOf(" ") + 1);

        declinedCommand(challenger, defender);
    }

    if (message.substring(0, 8) == "!cancel " || message.substring(0, 17) == "!cancelchallenge ") {

        let defender = user["display-name"];
        let challenger = message.substring(message.indexOf(" ") + 1);

        cancelledCommand(challenger, defender);
    }

    if (message.substring(0, 9) == "!forfeit " || message.substring(0, 14) == "!forfeitmatch ") {
        
        let forfeitter = user["display-name"];
        let user2 = message.substring(message.indexOf(" ") + 1);

        forfeittedCommand(forfeitter, user2);
    }

    if (message == "!queue") {
        client.action(channel, GlobalQueue.listQueue());
    }

});



function ifUserExists(username, ifTrue, ifFalse) {
    let url = "http://tmi.twitch.tv/group/user/" + channel.toLowerCase() + "/chatters";
    http.get(url, (response) => {
        let data = "";
        response.on("data", (chunk) => {
            data += chunk;
        });
        response.on("end", () => {
            let d = JSON.parse(data).chatters;
            let allUsers = d.vips.concat(d.moderators).concat(d.staff).concat(d.admins).concat(d.gloabl_mods).concat(d.viewers);

            for (let i = 0; i < allUsers.length; i++) {
                if (allUsers[i] == username.toLowerCase()) {
                    ifTrue();
                    return 1;
                }
            }

            ifFalse();
            return 0;
        });
    });
}