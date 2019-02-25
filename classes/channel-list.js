const fs = require("fs");

class ChannelList {
    constructor(file) {
        this.channels = fs.readFileSync(file, "utf-8").split(",").map(c => c.trim());
    }
}