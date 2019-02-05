let fs = require("fs");

class DataCommunicator {
    constructor() {

        this.data = this.readData();
        setInterval(() => {
            fs.writeFile("db/data.json", JSON.stringify(this.data, null, 2), (err) => {
                if (err) throw err;
            });
        }, 60000);
    }

    readData() {
        return JSON.parse(fs.readFileSync("db/data.json"));
    }

    addUser(user) {
        this.data[user] = {
            "pb": 0,
            "wins": 0,
            "losses": 0
        }
    }
    addPB(user, newValue) {
        if (!this.data[user])
            this.addUser(user);

        this.data[user]["pb"] = newValue;

        return user + " has a new pb of " + newValue + "!";
    }

    addWin(user) {
        if (!this.data[user])
            this.addUser(user);

        this.data[user]["wins"]++;
    }

    addLoss(user) {
        if (!this.data[user])
            this.addUser(user);

        this.data[user]["losses"]++;
    }

    getValue(user, variable) {
        if (!this.data[user]) 
            return 0;

        return this.data[user][variable];
    }

    match(user, n) {
        let pb = this.getValue(user, "pb");

        let pbs = [];
        let users = Object.keys(this.data);

        for (let i = 0; i < users.length; i++) {
            let u = users[i];
            if (this.data[u]["pb"] != 0) {
                let newPBObject = {};
                newPBObject[u] = this.data[u]["pb"];
                pbs.push(newPBObject);
            }
        }

        pbs.sort((u1, u2) => {
            let pb1 = u1[Object.keys(u1)[0]];
            let pb2 = u2[Object.keys(u2)[0]];

            if (Math.abs(pb1 - pb) < Math.abs(pb2 - pb))
                return -1;
            if (Math.abs(pb2 - pb) < Math.abs(pb1 - pb))
                return 1;
            return 0;
        });

        pbs = pbs.slice(1, Math.min(n + 1, users.length));

        let s = pbs.map(((pbObject) => {
            let u = Object.keys(pbObject)[0];
            return u + " (" + pbObject[u] +")";
        })).join(", ");
        

        return "Best matches for " + user + " are " + s;

    }

    getRecord(user) {
        if (!this.data[user])
            return user + " has no wins or losses!";
        
        let w = this.data[user]["wins"];
        let l = this.data[user]["losses"];
        if (w == 0 && l == 0)
            return user + " has no wins or losses!";
        
        let winSuffix = (w == 1) ? "" : "s";
        let lossSuffix = (l == 1) ? "" : "es";
        
        return user + " has " + w + " win" + winSuffix + " and " + l + " loss" + lossSuffix + ". That's a win percentage of " + Math.round((w / (l + w)) * 100) / 100 + "%.";
    }



    // Error security
    readQueue() {
        return JSON.parse(fs.readFileSync("queue.json"))["queue"];
    }

    writeQueue(queue) {
        fs.writeFile("queue.json", JSON.stringify(queue, null, 2), (err) => {
            if (err) throw err;
        });
    }
}

module.exports = DataCommunicator;