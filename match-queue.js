class MatchQueue {
    constructor() {
        this.queue = [];
        this.challenges = [];
    }

    // Adds challenge to challenge array
    // Callback includes a setTimeout to remove it
    // Returns string to be printed to chat
    addChallenge(challenger, defender, callback) {
        challenger = challenger.toLowerCase();
        defender = defender.toLowerCase();

        // If challenge already exists, don't add it
        for (let i = 0; i < this.challenges.length; i++) {
            if (this.challenges[i].challenger == challenger &&
                this.challenges[i].defender == defender) {
                    return "{}: You have already challenged {} to a match!"
            }
        }

        // Add the challenge
        this.challenges.push(new Challenge(challenger.toLowerCase(), defender.toLowerCase(), callback));

        // Return string
        return defender + ": " + challenger + " has challenged you to a match! You have 30 seconds to accept or decline their challenge.";
    }

    // Removes challenge between two users
    // Reason is "timeout", "cancelled", "declined", or "accepted"
    removeChallenge(user1, user2, reason) {
        user1 = user1.toLowerCase();
        user2 = user2.toLowerCase();

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
            return user1 + "'s challenge to " + user2 + " has expired.";
        if (reason == "cancelled")
            return user1 + " has cancelled their challenge to " + user2 + ".";
        if (reason == "declined")
            return user1 + ": " + user2 + " declined your challenge.";
        if (reason == "removed")
            return "A moderator has removed the challenge between " + user1 + " and " + user2 + ".";
    }

    // Add match between two players
    addMatch(challenger, defender) {
        challenger = challenger.toLowerCase();
        defender = defender.toLowerCase();

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

        this.queue.push(new Match(challenger.toLowerCase(), defender.toLowerCase()));
        return defender + " has accepted " + challenger + "'s challenge! Match queued in spot " + this.queue.length + ".";
    }

    removeMatch(user1, user2, reason) {

        user1 = user1.toLowerCase();
        user2 = user2.toLowerCase();

        let index = -1;

        for (let i = 0; i < this.queue.length; i++) {
            if ((this.queue[i].challenger == user1 &&
                this.queue[i].defender == user2) || (this.queue[i].challenger == user2 && this.queue[i].defender == user1)) {
                    index = i;
                    break;
            }
        }

        if (index == -1) {
            if (reason == "forfeit")
                return user1 + ": Yoou have no match scheduled against " + user2 + ".";

            return user1 + " has no match scheduled against " + user2 + ".";
        }
        
        let m = this.queue.splice(index, 1)[0];

        if (reason == "forfeit")
            return user1 + " forfeited in their match against " + user2 + "!";

        return "The match between " + user1 + " and " + user2 + " has been cancelled. New queue: " + this.listQueue();
    }

    matchCompleted(winner) {
        winner = winner.toLowerCase();
        
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
        return (f == "" ? "No current queue." : f);
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