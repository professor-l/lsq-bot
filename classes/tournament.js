class Tournament {
    constructor() {
        let n = Math.log2(players);

        if (parseInt(players.length.toString()) != n)
            return false;
        
        this.bracket = new Bracket(n);

        for (let i = 0; i < this.bracket.matches.length; i++) {
            let p0 = this.bracket.matches[i].players[0];
            let p1 = this.bracket.matches[i].players[1]
        }
    }
}

class Bracket {
    constructor(rounds) {
        this.rounds = rounds;
        this.final = new Match(null, [new Player("", 1), new Player("", 2)], this.rounds);
        this.matches = [this.final];

        this.generate(this.final, this.rounds);
    }
    // ADD THE ROUND FUNCTION TO GIVECHILDREN!
    giveChildren(match, currentRound) {
        let subtractFrom = ((match.players[0].seed + match.players[1].seed - 1) * 2) + 1
        let m1 = new Match(match, [new Player("", match.players[0].seed), new Player("", subtractFrom - match.players[0].seed)], currentRound);
        let m2 = new Match(match, [new Player("", match.players[1].seed), new Player("", subtractFrom - match.players[1].seed)], currentRound);

        this.matches.push(m1);
        this.matches.push(m2);

        return [m1, m2];
    }

    generate(root, rounds) {
        if (rounds <= 1)
            return;

        let c = this.giveChildren(root, rounds - 1);

        this.generate(c[0], rounds - 1);
        this.generate(c[1], rounds - 1);
    }

    print() {
        for (let i = 0; i < this.matches.length; i++) {
            console.log(this.matches[i].players[0].seed + " " + this.matches[i].players[1].seed + "   " + this.matches[i].round);
        }
    }

}

class Match {
    constructor(parent, players, round) {
        this.parent = parent;
        this.players = players;
        this.round = round;

        this.winner = false;
        this.loser = false;
    }

    winner(name, winnerScore, loserScore) {
        let index;

        if (this.players[0].player == name) index = 0;
        else if (this.players[1].player == name) index = 1;
        else return false;

        this.winner = this.players[index];
        this.winner.score = winnerScore || (loserScore + 1);

        this.loser = this.players[(!index) + 0];
        this.loser.score = loserScore;
        
        return true;
    }
    
    isReady() {
        return (this.players[0].name && this.players[1].name);
    }

}

class Player {
    constructor(player, seed) {
        this.player = player || 0;
        this.seed = seed || 0;

        this.score = 0
    }
}

let a = new Bracket(4);
a.print();