class Tournament {
    constructor(rounds) {
        
        this.bracket = new Bracket([3, 3, 5]);

        for (let i = 0; i < this.bracket.matches.length; i++) {
            let p0 = this.bracket.matches[i].players[0];
            let p1 = this.bracket.matches[i].players[1]
        }
    }

    addPlayer(player) {
        for (let i = 0; i < this.bracket.matches.length; i++) {
            if (this.bracket.matches[i].round > 1)
                continue;

            let p0 = this.bracket.matches[i].players[0];
            let p1 = this.bracket.matches[i].players[1];

            if (p0.seed == player.seed) {
                this.bracket.matches[i].players[0] = player;
                return true;
            }

            else if (p1.seed == player.seed) {
                this.bracket.matches[i].players[1] = player;
                return true;
            }
        }

        return false;
    }

    print() {
        for (let i = 0; i < this.bracket.matches.length; i++) {
            let m = this.bracket.matches[i];

            if ( (!(m.players[0] && m.players[1])) || m.winner ) continue;

            let p0 = m.players[0].player + " (" + m.players[0].seed + ")";
            let p1 = m.players[1].player + " (" + m.players[1].seed + ")";

            console.log("MATCH: " + p0 + " vs. " + p1);
        }
    }
}

class Bracket {
    constructor(gamesPerRoundObject) {
        this.gamesCount = gamesPerRoundObject;

        this.rounds = this.gamesCount.length;

        this.final = new Match(null, [new Player("", 1), new Player("", 2)], this.rounds, this.gamesCount[this.gamesCount.length - 1]);
        this.matches = [this.final];

        this.winner = null;

        this.generate(this.final, this.rounds);
    }
    
    giveChildren(match, currentRound, games) {
        let subtractFrom = ((match.players[0].seed + match.players[1].seed - 1) * 2) + 1

        let s00 =  match.players[0].seed;
        let s01 = subtractFrom - match.players[0].seed;

        let s10 = match.players[1].seed;
        let s11 = subtractFrom - match.players[1].seed;

        let m1 = new Match(match, [new Player("", s00), new Player("", s01)], currentRound, games);
        let m2 = new Match(match, [new Player("", s10), new Player("", s11)], currentRound, games);

        this.matches.push(m1);
        this.matches.push(m2);

        match.clear();

        return [m1, m2];
    }

    generate(root, rounds, games) {
        if (rounds <= 1)
            return;

        let c = this.giveChildren(root, rounds - 1, games);

        this.generate(c[0], rounds - 1, this.gamesCount[rounds - 2]);
        this.generate(c[1], rounds - 1, this.gamesCount[rounds - 2]);
    }

    declareWinner(name, winnerScore, loserScore) {
        for (let i = 0; i < this.matches.length; i++) {
            if (!(this.matches[i].players[0] && this.matches[i].players[1])) 
                continue;

            if (this.matches[i].players[0].player == name || this.matches[i].players[1].player == name) {
                this.matches[i].declareWinner(name, winnerScore, loserScore);
                if (this.matches[i].round == this.rounds) {
                    if (this.matches.players[0].player == name)
                        this.winner = this.matches.players[0];
                    
                    else
                        this.winner = this.matches.players[1];
                }
                break;
            }
        }
        return false;
    }

}

class Match {
    constructor(parent, players, round, games) {
        this.parent = parent;
        this.players = players;
        this.round = round;

        this.games = []
        for (let i = 0; i < games; i++)
            this.games.push(new Game(this.players));

        this.winner = false;
        this.loser = false;
    }

    declareWinner(name, winnerScore, loserScore) {
        let score = [0, 0];

        for (let i = 0; i < this.games.length; i++) {
            if (!(this.games[i].winner)) {
                this.games[i].declareWinner(name, winnerScore, loserScore);
                score[this.players.indexOf(this.games[i].winner)]++;
                break;
            }
        }

        let index;

        if (score[0] == (this.games.length + 1) / 2) index = 0;
        else if (score[1] == (this.games.length + 1) / 2) index = 1;
        else return false;

        this.winner = this.players[index];
        this.winner.score = winnerScore || (loserScore + 1);

        this.loser = this.players[(!index) + 0];
        this.loser.score = loserScore;

        this.parent.addPlayer(this.winner);
        
        return true;
    }

    addPlayer(player) {

        let index = this.players[0] ? 1 : 0
        this.players[index] = player;

        for (let i = 0; i < this.games.length; i++)
            this.games[i].players[index] = player;
    }

    clear() {
        this.players = [null, null];
        for (let i = 0; i < this.games.length; i++)
            this.games[i].players = this.players;
    }
    
    isReady() {
        return (this.players[0] && this.players[1]);
    }

}

class Game {
    constructor(players) {
        this.players = players;
        
        this.winner = false;
        this.winnerScore = 0;
        this.loser = false;
        this.loserScore = 0;
    }

    declareWinner(name, winnerScore, loserScore) {
        this.winnerScore = winnerScore;
        this.loserScore = loserScore;

        if (this.players[0].player == name) this.winner = this.players[0];
        else if (this.players[1].player == name) this.winner = this.players[1];
        else return false;

        return this.winner;
    }
}

class Player {
    constructor(player, seed) {
        this.player = player || 0;
        this.seed = seed || 0;

        this.score = 0
    }
}

let a = new Tournament(3);
a.addPlayer(new Player("A", 1));
a.addPlayer(new Player("B", 2));
a.addPlayer(new Player("C", 3));
a.addPlayer(new Player("D", 4));
a.addPlayer(new Player("E", 5));
a.addPlayer(new Player("F", 6));
a.addPlayer(new Player("G", 7));
a.addPlayer(new Player("H", 8));