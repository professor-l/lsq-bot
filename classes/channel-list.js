const fs = require("fs");

class ChannelList {
    constructor(file) {
        this.file = file;
        this.channels = fs.readFileSync(this.file, "utf-8").split(",").map(c => c.trim());
    }

    add(channel) {
        fs.appendFile(this.file, ",\n" + channel, (err) => {
            if (err) throw err;
            this.channels.push(channel);
            console.log(channel + " added!");
        });
    }

    remove(channel) {
        let index = this.channels.indexOf(channel);
        if (index != -1) {

            fs.writeFile(this.file, this.channels.join(",\n"), (err) => {
                if (err) throw err;
                this.channels.splice(index, 1);
                console.log(channel + " removed!");
            })
        }
    }
}

module.exports = ChannelList;