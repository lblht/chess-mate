import { db, auth, doc, updateDoc, onSnapshot, signInAnonymously, onAuthStateChanged } from './firebase.js';

document.addEventListener("DOMContentLoaded", function() {
    var board = null;
    var game = null;
    var gameId = null;
    var gameRef = null;
    var lastMove = null;
    var config = {
        draggable: true,
        position: 'start',
        onDragStart: onDragStart,
        onDrop: onDrop,
        dropOffBoard: 'snapback',
        sparePieces: false,
        moveSpeed: 'slow',
        snapbackSpeed: 300,
        snapSpeed: 100,
        pieceTheme: 'img/chesspieces/wikipedia/{piece}.png',
    };
    board = Chessboard('board', config);
    
    $(window).resize(board.resize)
    $('#gameContent').hide();
    $('#joinGame').on('click', joinGame);
    $('#resetButton').on('click', resetGame);

    signInAnonymously(auth).catch((error) => { console.error("Error signing in anonymously: ", error); });

    onAuthStateChanged(auth, (user) => {
        if (user) { console.log("Signed in as anonymous user:", user.uid); } 
        else { console.log("User signed out"); }
    });

    function joinGame() {
        gameId = $('#gameIdInput').val();
        
        if (gameId) {
            gameRef = doc(db, 'games', gameId);
            game = new Chess();
            
            onSnapshot(gameRef, (docSnapshot) => {
                const gameData = docSnapshot.data();
                if (gameData) {
                    lastMove = findLastMove(game.fen(), gameData.fen);
                    console.log(game.fen());
                    console.log(gameData.fen);
                    game.load(gameData.fen);
                    board.position(gameData.fen);
                    game.turn(gameData.turn);
                    updateStatus();
                }
            }, (error) => {console.error("Error getting document: ", error);});

            $('#gameContent').show();
            $('#introContent').hide();
            $('#gameId').html(`Game: ${gameId}`);
            
            board.orientation($('#colorSelect').val());
        } else {
            alert('Please enter game ID.');
        }
    }

    function onDragStart (source, piece, position, orientation) {
        if ((orientation === 'white' && piece.search(/^w/) === -1) ||
            (orientation === 'black' && piece.search(/^b/) === -1)) {
          return false
        }
      }

    function onDrop(source, target) {
        var move = game.move({
            from: source,
            to: target,
            promotion: 'q',
        });

        if (move === null) return 'snapback';

        updateGame();
    }

    function updateStatus() {
        var status = '';
        var moveColor = game.turn() === 'b' ? 'Black' : 'White';

        if (game.in_checkmate() === true) {
            status = 'Game over, ' + moveColor + ' is in checkmate.';
        } else if (game.in_draw() === true) {
            status = 'Game over, drawn position';
        } else {
            status = moveColor + ' to move';
        }

        $('#status').html( `Status: ${status}`);

        if(lastMove) {
            $('#lastMove').html(`Last move: from: ${lastMove.from} to ${lastMove.to}`);
        } else {
            $('#lastMove').html(`Last move: opponent's last move not detected`);
        }
    }

    function updateGame() {
        const fen = game.fen();
        const turn = game.turn();

        updateDoc(gameRef, {fen, turn}
        ).then(() => {updateStatus();}
        ).catch(error => {console.error("Error updating document: ", error);});
    }

    function resetGame() {
        if (window.confirm('Are you sure you want to reset the game?')) {
            lastMove = null;
            game.reset();
            updateGame();
        }
    }

    function findLastMove(fen1, fen2) {
        if(fen1 == fen2) return lastMove;

        const initialChess = new Chess(fen1);
        const finalChess = new Chess(fen2);
      
        const possibleMoves = initialChess.moves({ verbose: true });
      
        for (const move of possibleMoves) {
          initialChess.move(move);
          if (initialChess.fen() === fen2) {
            return move;
          }
          initialChess.undo();
        }
      
        return null;
      }
    
    updateStatus();
});
