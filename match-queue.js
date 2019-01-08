class MatchQueue {
    constructor() {
        this.queue = [];
        this.challenges = [];
    }

    addChallenge(challenger, defender, callback) {
        for (let i = 0; i < this.challenges.length; i++) {

        }
        this.challenges.push(new Challenge(challenger, defender, callback));

        return "{}: {} has challenged you to a match! You have 30 seconds to accept or decline their challenge.".format(defender, challenger);
    }

    removeChallenge(challenger, defender) {
        let index = -1;

        for (let i = 0; i < this.challenges.length; i++) {
            if (this.challenges[i].challenger == challenger &&
                this.challenges[i].defender == defender) {
                    index = i;
                    break;
                }
        }

        if (index == -1)
            return "{} has not challenged {} to a match.".format(challenger, defender);

        let c = this.challenges.splice(index, 1)[0];
        clearTimeout(c.timeout);

        return "{}'s challenge to {} was cancelled or has expired.".format(challenger, defender);
    }

    addMatch(challenger, defender) {
        this.queue.push(new Match(challenger, defender));
        return "{} has accepted {}'s challenge! Match queued in spot {}.".format(defender, challenger, this.queue.length);
    }

    removeMatch(challenger, defender) {
        let index = -1;

        for (let i = 0; i < this.challenges.length; i++) {
            if (this.queue[i].challenger == challenger &&
                this.queue[i].defender == defender) {
                    index = i;
                    break;
            }
        }

        if (index == -1) {
            return "{} has no match scheduled against {}.".format(challenger, defender);
        }

        let m = this.queue.splice(index, 1)[0];
        return "The match between {} and {} has been cancelled!. New queue: {}".format(challenger, defender, this.listQueue());
    }

    matchCompleted(winner) {
        let match = this.queue.shift();
        if (match.challenger != winner && match.defender != winner) {
            return 0;
        }
        let loser = (match.defender == winner ? match.challenger : match.defender);
        return "{} won their match against {}! Congratulations!".format(winner, loser);
    }

    listQueue() {
        let f = "";
        for (let i = 0; i < this.queue.length; i++) {
            f += "{}. {} vs. {} ".format(i + 1, this.queue[i].challenger, this.queue[i].defender);
        }
        return f;
    }
}

class Challenge {
    constructor(challenger, defender, callback) {
        this.challenger = challenger;
        this.defender = defender;
        this.timeout = setTimeout(callback, 30000)
    }
}

class Match {
    constructor(challenger, defender) {
        this.challenger = challenger;
        this.defender = defender;
    }
}
