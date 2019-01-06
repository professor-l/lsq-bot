const tmi = require("tmi.js");


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


client.connect();

client.on("connected", (address, port) => {
    client.action(channel, "LsQ Bot connected. (( Source code: https://github.com/professor-l/lsq-bot. ))");
});

client.on("chat", (channel, user, message, self) => {
    if (message == "!qhelp" || message == "!lsqhelp")
        printHelp();
});


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
function printHelp() {
    client.action(channel, helpString);
}