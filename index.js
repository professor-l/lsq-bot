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

const helpString = `
                Match commands: 
                !challenge,
                !accept, 
                !decline,
                !cancel, 
                !forefit,
                !queue,
                !lsqhelp (or !qhelp).
                See https://github.com/professor-l/lsq-bot#readme for more.
                `;

let GlobalQueue = new MatchQueue();


client.connect();

client.on("connected", (address, port) => {
    client.action(channel, "LsQ Bot connected. (( Source code: https://github.com/professor-l/lsq-bot. ))");
});

client.on("chat", (channel, user, message, self) => {
    if (message == "!qhelp" || message == "!lsqhelp")
        client.action(channel, helpString);
    
    if (message.substring(0, 11 == "!challenge ")) {
        http.get("http://tmi.twitch.tv/group/user/{}/chatters".format(channel), (response) => {

            let data = "";
            response.on("data", (chunk) => {
                data += chunk;
            });

            response.on("end", () => {
                let d = JSON.parse(data).chatters;
                let allUsers = d.vips.concat(d.moderators).concat(d.staff).concat(d.admins).concat(d.gloabl_mods).concat(d.viewers);

                for (let i = 0; i < allUsers.length; i++) {
                    if (allUsers[i] == message.substring(12)) {
                        client.action(channel, GlobalQueue.addChallenge(user["display-name"], allUsers[i]));

                        GlobalQueue.timeouts.push(setTimeout(() => {
                            let index = 0;
                            for (let j = 0; j < GlobalQueue.challenges.length; j++) {
                                if (GlobalQueue.challenges[j][0] == user["display-name"] && GlobalQueue.challenges[j][1] == allUsers[i]) {
                                    let r = GlobalQueue.Queue.challenges.splice(j, 1);

                                    GlobalQueue.timeouts.splice(j, 1);

                                }
                            }
                        }, GlobalQueue.timeoutLength));

                        break;
                    }
                }
            });

        });
    }
});