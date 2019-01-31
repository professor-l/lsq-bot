class MatchQueue {
    constructor() {
        this.queue = [];
        this.challenges = [];
    }

    // Adds challenge to challenge array
    // Callback includes a setTimeout to remove it
    // Returns string to be printed to chat
    addChallenge(challenger, defender, callback) {
        challenger = challenger;
        defender = defender;

        // If challenge already exists, don't add it
        for (let i = 0; i < this.challenges.length; i++) {
            if (this.challenges[i].challenger == challenger &&
                this.challenges[i].defender == defender) {
                    return challenger + " : You have already challenged " + defender + " to a match!"
            }
        }

        // Add the challenge
        this.challenges.push(new Challenge(challenger, defender, callback));

        // Return string
        return defender + " : " + challenger + " has challenged you to a match! You have 30 seconds to accept or decline their challenge.";
    }

    // Removes challenge between two users
    // Reason is "timeout", "cancelled", "declined", or "accepted"
    removeChallenge(user1, user2, reason) {
        user1 = user1;
        user2 = user2;

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
            return user1 + " 's challenge to " + user2 + " has expired.";
        if (reason == "cancelled")
            return user1 + " has cancelled their challenge to " + user2 + ".";
        if (reason == "declined")
            return user1 + " : " + user2 + " declined your challenge.";
        if (reason == "removed")
            return "A moderator has removed the challenge between " + user1 + " and " + user2 + ".";
    }

    // Add match between two players
    addMatch(challenger, defender) {

        // Lowercase to compare with user array
        challenger = challenger;
        defender = defender;

        // Make sure challenge exists
        let challengeExists = false;
        for (let i = 0; i < this.challenges.length; i++) {
            if (this.challenges[i].challenger == challenger &&
                this.challenges[i].defender == defender) {
                    challengeExists = true;
                    break;
                }
        }

        // Return string if challenge doesn't exist
        if (!challengeExists)
            return defender +  " : No challenge has been made to you from " + challenger + ".";

        // Add match to queue, return string
        this.queue.push(new Match(challenger, defender));
        return defender + " has accepted " + challenger + "'s challenge! Match queued in spot " + this.queue.length + ".";
    }

    addMatchAtIndex(challenger, defender, index) {
        
        // Lowercase to compare with user array
        challenger = challenger;
        defender = defender;

        if (challenger == defender)
            return "Matches need to be between two different people, silly!";

        this.queue.splice(index, 0, new Match(challenger, defender));

        return "Match added at index " + (index + 1) + " between " + challenger + " and " + defender + ". New queue: " + this.listQueue();

    }

    // Removes match between two users
    removeMatch(user1, user2, reason) {

        // Lowercase to compare with user array
        user1 = user1;
        user2 = user2;

        // Set index of match in queue
        let index = -1;

        for (let i = 0; i < this.queue.length; i++) {
            if ((this.queue[i].challenger == user1 && this.queue[i].defender == user2) || (this.queue[i].challenger == user2 && this.queue[i].defender == user1)) {
                    index = i;
                    break;
            }
        }

        // Returns appropriate string if match doesn't exist
        if (index == -1) {
            if (reason == "forfeit")
                return user1 + " : You have no match scheduled against " + user2 + ".";

            return user1 + " has no match scheduled against " + user2 + ".";
        }
        
        // Remove match from queue
        let m = this.queue.splice(index, 1)[0];

        // Return appropriate string
        if (reason == "forfeit")
            return user1 + " forfeited in their match against " + user2 + "! New queue: " + this.listQueue();

        return "The match between " + user1 + " and " + user2 + " has been cancelled. New queue: " + this.listQueue();
    }

    // Removes match at first index in queue, declares winner
    matchCompleted(winner, loser) {

        // Lowercase to compare wtih user array
        winner = winner;

        // Remove first (current) match from queue
        let match = this.queue.shift();

        // Return appropriate string
        return winner + " won their match against " + loser + "! " + this.congratsMessage();
    }

    // List matches in queue, formatted.
    listQueue() {
        let f = "";
        for (let i = 0; i < this.queue.length; i++) {
            f += (i + 1) + ". " + this.queue[i].challenger + " vs. " + this.queue[i].defender + " ";
        }
        return (f == "" ? "No current queue." : f);
    }



    congratsMessage() {
        let messages = [
            "Congratulations!",
            "Well done!",
            "Great job!",
            "You killed it!",
            "You're awesome!",
            "That one's in the books!",
        ];
        return messages[Math.floor(Math.random() * messages.length)];
    }
}

// Challenge class, complete with timeout function
class Challenge {
    constructor(challenger, defender, callback) {
        this.challenger = challenger;
        this.defender = defender;
        this.timeout = setTimeout(callback, 30000)
    }
}

// Match class
class Match {
    constructor(challenger, defender) {
        this.challenger = challenger;
        this.defender = defender;
    }
}

// Export MatchQueue class
module.exports = MatchQueue;