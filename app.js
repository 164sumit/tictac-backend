import express from "express";
import { Server } from "socket.io";
import { createServer } from "http";
import { log } from "console";
const port=3000
const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// // Send index file when there is a connection
// app.use(express.static(__dirname + '/public'));
// app.get('/', function (req, res) {
//     res.sendFile('index.html');
// });

/**
 * Player Class
 * @class This class holds information about a player
 */
class Player {
    /**
     * Constructs a Player
     * @param {String}  playerID    The id of the player
     * @param {Boolean} turn        Whether it is the players turn to move
     * @param {String}  type        "X" or "O"
     */
    constructor(playerID, turn, type) {
        /// Id of the player
        this.id = playerID;
        /// Whether it is the players turn
        this.turn = turn;
        /// The type of the player "X" or "O"
        this.type = type;
    }

    /**
     * Checks whether two players are equal
     * @param {Object}  rhs         The other player
     */
    equals(rhs) {
        return (this.id == rhs.id
            && this.turn == rhs.turn
            && this.type == rhs.type);
    }
}

/**
 * Game Class
 * @class This class holds information about the game
 */
class Game {
    /**
     * Constructs a Game
     * @param {String}  gameID      Id of the game
     */
    constructor(gameID) {
        this.randomNumber = Math.floor(Math.random() * 100);
        /// Id of the game
        this.id = gameID;
        /// Information about player1
        this.player1 = null;
        /// Information about player2
        this.player2 = null;
        /// Tic-tac-toe gameboard
        this.gameboard = {
            0: ""
            , 1: ""
            , 2: ""
            , 3: ""
            , 4: ""
            , 5: ""
            , 6: ""
            , 7: ""
            , 8: ""
        };
    }

    /**
     * Resets the gameboard and the turn of the players
     */
    reset() {
        // Reset gameboard
        this.gameboard = {
            0: ""
            , 1: ""
            , 2: ""
            , 3: ""
            , 4: ""
            , 5: ""
            , 6: ""
            , 7: ""
            , 8: ""
        };
        const randomNumber = Math.floor(Math.random() * 100);
        // Player1 starts the games
        // if (randomNumber % 2 === 0) {
        //     this.player1.turn = true;
        //     this.player2.turn = false;
        // } else {
        //     this.player1.turn = false;
        //     this.player2.turn = true;
        // }
        this.player1.turn = randomNumber % 2 == 0;
        this.player2.turn = randomNumber % 2 != 0;

    }

    /**
     * Adds a player to the game
     * @param {String}  playerID      Id of the player joining
     */
    addPlayer(playerID) {
        // Check which player to add (only two players per game)
        if (this.player1 == null) {
            // let turn=false;
            // if(this.randomNumber%2==0){
            //     turn=true;
            // }
            this.player1 = new Player(playerID, this.randomNumber%2!=0, "X");
            return "player1";
        } else {
            // let turn=true;
            // if(this.randomNumber%2==0){
            //     turn=false;
            // }
            this.player2 = new Player(playerID, this.randomNumber%2==0, "O");
            return "player2";
        }
    }

    /**
     * Checks if a move is valid. Valid if it is the players turn
     *      and the cell is empty.
     * @param {Object}  player      Player that made move
     * @param {String}  cell        The cell where move was made
     */
    checkValid(player, cell) {
        // Must check that player is one of the players
        if (player.turn && (this.player1.equals(player) || this.player2.equals(player))) {
            return this.gameboard[cell] == "";
        }

        return false;
    }

    /**
     * Updates gameboard and the turns of the players.
     * @param {String}  cell        Cell where move was made
     * @param {String}  type        Type of player that made move
     */
    updateBoard(cell, type) {
        this.gameboard[cell] = type;
        this.updateTurns();
    }

    /**
     * Updates the turns of the players
     */
    updateTurns() {
        this.player1.turn = !this.player1.turn;
        this.player2.turn = !this.player2.turn;
    }

    /**
     * Checks the status of the game
     * @return  Returns "win" or "tie" or "ongoing"
     */
    checkStatus() {
        let board = this.gameboard;
        // Check row 1
        if ((board[0] != "") && ((board[0] == board[1]) && (board[1] == board[2]))) {
            return "win";
        }
        // Check row 2
        if ((board[3] != "") && ((board[3] == board[4]) && (board[4] == board[5]))) {
            return "win";
        }
        // Check row 3
        if ((board[6] != "") && ((board[6] == board[7]) && (board[7] == board[8]))) {
            return "win";
        }
        // Check col 1
        if ((board[0] != "") && ((board[0] == board[3]) && (board[3] == board[6]))) {
            return "win";
        }
        // Check col 2
        if ((board[1] != "") && ((board[1] == board[4]) && (board[4] == board[7]))) {
            return "win";
        }
        // Check col 3
        if ((board[2] != "") && ((board[2] === board[5]) && (board[5] == board[8]))) {
            return "win";
        }
        // Check diag 1
        if ((board[0] != "") && ((board[0] === board[4]) && (board[4] == board[8]))) {
            return "win";
        }
        // Check diag 2
        if ((board[2] != "") && ((board[2] === board[4]) && (board[4] == board[6]))) {
            return "win";
        }

        // Check board full with no winner
        if ((board[0] != "") && (board[1] != "") && (board[2] != "") && (board[3] != "") &&
            (board[4] != "") && (board[5] != "") && (board[6] != "") && (board[7] != "") && (board[8] != "")) {
            return "tie";
        }

        // Game is ongoing
        return "ongoing";
    }
}

/// Contains the ids of games being played
var games = {};

// Called when socket connects.
io.sockets.on('connection', function (socket) {
    console.log("User Connected", socket.id);
    // socket.on("user",(id)=>{
    //     console.log(socket.id);
    // })
    socket.on("send_message",(data)=>{
        socket.in(data.roomId).emit("message",data);
        socket.emit("message",data);
    })
    // Called when user creates a game
    socket.on("create", function () {
        // Create lobby id
        let done = false;
        let gameID = Math.floor((Math.random() * 100)).toString();
        while (!done) {
            if (games[gameID] == null) {
                done = true;
            } else {
                gameID = Math.floor((Math.random() * 100)).toString();
            }
        }

        // Create game and add player
        games[gameID] = new Game(gameID);
        // games[gameID].addPlayer(socket.id);
        // console.log(games[gameID]);

        // Add socket to lobby and emit the gameID to the socket
        // socket.join(gameID);
        // socket.lobby = gameID;
        socket.emit('created', {
            id: gameID
        });

    });

    // Called when person attempts to join game
    socket.on('join', function (data) {
        // Check if the game exists
        let gameID = data;
        console.log(data);
        if (games[gameID] != null) {
            // Add player to the game
            games[gameID].addPlayer(socket.id);
            console.log(games[gameID]);
            // socket.emit("getuser",games[gameID].player1)
            // console.log(socket.id);
            // Join lobby
            socket.join(gameID);
            socket.lobby = gameID;
            if(games[gameID].player2!=null){

                // Emit data to first player.
                socket.in(gameID).emit('start', {
                    id: gameID, gameboard: games[gameID].gameboard,
                    player: games[gameID].player1
                });
    
                // Emit data to second player.
                socket.emit("start", {
                    id: gameID, gameboard: games[gameID].gameboard,
                    player: games[gameID].player2
                });
            }else{
                socket.emit( "waiting" );
            }

        } else {
            // Game does not exist. Emit a failure to socket.
            socket.emit("room-error");
        }
    });
    socket.on("players",(room)=>{
        setTimeout(() => {
            socket.emit("data", games[room]);
        }, 3000);
    })

    // Called when a move is made
    socket.on("move", function (data) {
        // Make sure it is a valid move
        console.log(data);
        let gameID = data.roomId;
        if(games[gameID]!=null){

            let valid = games[gameID].checkValid(data.player, data.cell);
            if (valid) {
                // Update board based on move
                games[gameID].updateBoard(data.cell, data.player.type);
    
                // Check status of the game
                let status = games[gameID].checkStatus();
                if (status == "ongoing") {
                    // Game is still continuing. Update both players
                    socket.in(gameID).emit('updateGame', {
                        id: gameID
                        , gameboard: games[gameID].gameboard
                    });
                    socket.emit("updateGame", {
                        id: gameID,
                        gameboard: games[gameID].gameboard
                    });
    
                } else if (status == "win") {
                    // Game is won. Emit win and loss
                    socket.emit("win", { gameboard: games[gameID].gameboard });
                    socket.in(gameID).emit("loss", { gameboard: games[gameID].gameboard });
                } else {
                    // Game is a tie. Emit a tie to both players.
                    socket.emit("tie", { gameboard: games[gameID].gameboard });
                    socket.in(gameID).emit("tie", {
                        gameboard: games[gameID].gameboard
                    });
                }
    
            } else {
                // Emit invalid move
                socket.emit("invalid");
            }
        }else{
            socket.emit("room-error");
        }
    });

    // Called when person calls for restart of game.
    socket.on("restart", function (data) {
        // Reset the game board
        let gameID = data.roomId;
        games[gameID].reset();
        console.log(games[gameID]);
        // Emit data to first player.
        socket.emit("start", {
            id: gameID, gameboard: games[gameID].gameboard, player: games[gameID].player1
        });

        // Emit data to second player.
        socket.in(gameID).emit('start', {
            id: gameID, gameboard: games[gameID].gameboard, player: games[gameID].player2
        });

    });

    //active players
    // socket.on()
    io.emit('activeConnections', io.engine.clientsCount);
    
    // Called when connection is lost
    socket.on("disconnect", () => {
        io.emit('activeConnections', io.engine.clientsCount);
        console.log("User Disconnected", socket.id);
      });
    // socket.on("disconnect", function () {
    //     // Remove the lobby and emit 'quit'
    //     if (socket.lobby != null) {
    //         socket.emit("quit");
    //         socket.in(socket.lobby.toString()).emit("quit");
    //         delete games[socket.lobby];
    //     }
    // });

});
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});