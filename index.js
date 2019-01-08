const tmi = require("tmi.js");
const q = require("./match-queue")
const http = require("http");

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
        password: "oauth:ot5xe5agofx0nfa4kxl5l10vboncqm"
    },
    channels: ["Professor_L_Tetris"]
};

const channel = "Professor_L_Tetris";
const client = new tmi.client(options);

const helpString = "See https://github.com/professor-l/lsq-bot#readme for detailed instructions."

let GlobalQueue = new q.MatchQueue();

client.connect();

client.on("connected", (address, port) => {
    client.action(channel, "LsQ Bot connected. (( Source code: https://github.com/professor-l/lsq-bot. ))");
});

client.on("chat", (chatChannel, user, message, self) => {
    if (message == "!qhelp" || message == "!lsqhelp")
        client.action(channel, helpString);
    
    if (message.substring(0, 11 == "!challenge ")) {
        let defender = message.substring(12);
        
        ifUserExists(player, 
            () => {

            }, 

            () => {

            }
        );
        
        
    }
});

function ifUserExists(username, ifTrue, ifFalse) {
    http.get("http://tmi.twitch.tv/group/user/{}/chatters".format(channel), (response) => {
        let data = "";
        response.on("data", (chunk) => {
            data += chunk;
        });

        response.on("end", () => {

            let d = JSON.parse(data).chatters;
            let allUsers = d.vips.concat(d.moderators).concat(d.staff).concat(d.admins).concat(d.gloabl_mods).concat(d.viewers);

            for (let i = 0; i < allUsers.length; i++) {
                if (allUsers[i] == username) {
                    ifTrue();
                    return 1;
                }
            }

            ifFalse();
            return 0;
        });
    });
}