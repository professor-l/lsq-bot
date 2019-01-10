class MatchQueue {
    constructor() {
        this.queue = [];
        this.challenges = [];
    }

    // Adds challenge to challenge array
    // Callback includes a setTimeout to remove it
    // Returns string to be printed to chat
    addChallenge(challenger, defender, callback) {

        // If challenge already exists, don't add it
        for (let i = 0; i < this.challenges.length; i++) {
            if (this.challenges[i].challenger == challenger &&
                this.challenges[i].defender == defender) {
                    return "{}: You have already challenged {} to a match!"
            }
        }

        // Add the challenge
        this.challenges.push(new Challenge(challenger, defender, callback));

        // Return string
        return defender + ": " + challenger + " has challenged you to a match! You have 30 seconds to accept or decline their challenge.";
    }

    // Removes challenge between two users
    // Reason is "timeout", "cancelled", or "accepted"
    removeChallenge(user1, user2, reason) {
        // Get index of challenge in challenges array
        let index = -1;

        for (let i = 0; i < this.challenges.length; i++) {
            if ((this.challenges[i].challenger == user1 &&
                this.challenges[i].defender == user2) ||
                (this.challenges[i].challenger == user2 &&
                this.challenges[i].defender == user1)) {

                index = i;
                break;
            }
        }

        // If there was no challenge, return this string
        if (index == -1)
            return "No challenge between " + user1 + " and " + user2 + ".";

        // Remove challenge and clear its timeout
        let c = this.challenges.splice(index, 1)[0];
        clearTimeout(c.timeout);

        // Return strings that correspond with reason
        if (reason == "timeout") 
            return "The challenge between " + user1 + " and " + user2 + " has expired.";
        if (reason == "cancelled")
        return "The challenge between " + user1 + " and " + user2 + " has been cancelled.";
        if (reason == "accepted")
            return 0;
    }

    // Add match between two players
    addMatch(challenger, defender) {
        let challengeExists = false;
        for (let i = 0; i < this.challenges.length; i++) {
            if (this.challenges[i].challenger == challenger &&
                this.challenges[i].defender == defender) {
                    challengeExists = true;
                    break;
                }
        }
        if (!challengeExists)
            return defender + ": No challenge has been made to you from " + challenger + ".";

        this.queue.push(new Match(challenger, defender));
        return defender + " has accepted " + challenger + "'s challenge! Match queued in spot " + this.queue.length + ".";
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
            return challenger + " has no match scheduled against " + defender + ".";
        }

        let m = this.queue.splice(index, 1)[0];
        return "The match between " + challenger + " and " + defender + " has been cancelled!. New queue: " + this.listQueue();
    }

    matchCompleted(winner) {
        let match = this.queue.shift();
        if (match.challenger != winner && match.defender != winner) {
            return 0;
        }
        let loser = (match.defender == winner ? match.challenger : match.defender);
        return winner + " won their match against " + loser + "! Congratulations!";
    }

    listQueue() {
        let f = "";
        for (let i = 0; i < this.queue.length; i++) {
            f += (i + 1) + ". " + this.queue[i].challenger + " vs. " + this.queue[i].defender + ". ";
        }
        return (f == "" ? 0 : f);
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

module.exports = MatchQueue;