class MatchQueue {
    constructor() {
        this.queue = [];
        this.challenges = [];
        this.timeouts = [];
    }

    removeChallenge(index) {

        let c = this.challenges.splice(index, 1)[0];
        clearTimeout(this.timeouts[0]);
        this.timeouts.shift();

        return "{}: Your challenge to {} was cancelled or has expired.".format(c[0], c[1]);
    }

    addChallenge(challenger, defender) {

        this.challenges.push([challenger, defender]);
        this.timeouts.push(setTimeout(this.removeChallenge, 30000, 0))

        return "{}: You were challenged to a match by {}! You have 30 seconds to accept or decline, or the challenge will automatically time out.".format(defender, challenger);
    }

    addGame(challenger, defender) {
        this.queue.push([challenger, defender]);
        return "{} has accepted {}'s challenge! The match is currently at position {}.".format(defender, challenger, this.queue.length);
    }

    removeGame(index, forfeiter) {
        let m = this.queue.splice(index, 1);
        return "{} forfeited in their match against {}! New Queue: {}".format(m[forfeiter], m[forefeiter ? 0 : 1], this.list());
    }

    list() {
        let toReturn = "";

    }
}