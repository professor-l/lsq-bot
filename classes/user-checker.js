const fs = require("fs");
const http = require("http");

class UserChecker {

    exists(channel, username, ifTrue, ifFalse) {
        username = username.toLowerCase();
        let url = "http://tmi.twitch.tv/group/user/" + this.channel + "/chatters";
        http.get(url, (response) => {
            let data = "";
            response.on("data", (chunk) => {
                data += chunk;
            });
            response.on("end", () => {
                let d = JSON.parse(data).chatters;
                let allUsers = d.vips.concat(d.moderators).concat(d.staff).concat(d.admins).concat(d.gloabl_mods).concat(d.viewers);

                if (allUsers.indexOf(username) != -1) {
                    ifTrue();
                    return 1;
                }

                ifFalse();
                return 0;
            });
        });
    }

    moderator(channel, username, ifTrue, ifFalse) {
        username = username.toLowerCase();
        let url = "http://tmi.twitch.tv/group/user/" + this.channel.toLowerCase() + "/chatters";
        http.get(url, (response) => {
            let data = "";
            response.on("data", (chunk) => {
                data += chunk;
            });
            response.on("end", () => {
                let mods = JSON.parse(data).chatters.moderators;

                if (mods.indexOf(username) != -1 || username == this.channel) {
                    ifTrue();
                    return 1;
                }
                ifFalse();
                return 0;
            });
        });
    }

}

module.exports = UserChecker;