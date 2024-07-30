import { db, auth, doc, updateDoc, onSnapshot, signInAnonymously, onAuthStateChanged } from './firebase.js';

document.addEventListener("DOMContentLoaded", function() {
    var board = null;
    var game = null;
    var gameId = null;
    var gameRef = null;
    var playerColor = null;
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
        pieceTheme: pieceTheme,
    };
    board = Chessboard('board', config);
    
    $(window).resize(board.resize)
    $('#gameContent').hide();
    $('#joinGame').on('click', joinGame);
    $('#resetButton').on('click', resetGame);

    // Authenticate anonymously
    signInAnonymously(auth).catch((error) => {
        console.error("Error signing in anonymously: ", error);
    });

    onAuthStateChanged(auth, (user) => {
        if (user) {
            // User is signed in anonymously
            console.log("Signed in as anonymous user:", user.uid);
        } else {
            // User is signed out
            console.log("User signed out");
        }
    });

    function joinGame() {
        gameId = $('#gameIdInput').val();
        
        if (gameId) {
            gameRef = doc(db, 'games', gameId);
            playerColor = $('#colorSelect').val();
            game = new Chess();
            
            onSnapshot(gameRef, (docSnapshot) => {
                const gameData = docSnapshot.data();
                if (gameData) {
                    game.load(gameData.fen);
                    board.position(gameData.fen);
                    updateStatus();
                }
            }, (error) => {console.error("Error getting document: ", error);});

            $('#gameContent').show();
            $('#introContent').hide();
            $('#gameId').html(`Game: ${gameId}`);
            
            board.orientation(playerColor === 'w' ? 'white' : 'black');
        } else {
            alert('Please enter game ID.');
        }
    }

    function pieceTheme(piece) {      
        return 'img/chesspieces/wikipedia/' + piece + '.png'
      }

    function onDragStart(source, piece, position, orientation) {
        if ((game.turn() === 'w' && playerColor === 'b' && piece.search(/^w/) !== -1) ||
            (game.turn() === 'b' && playerColor === 'w' && piece.search(/^b/) !== -1)) {
            return false;
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
            if (game.in_check() === true) {
                status += ', ' + moveColor + ' is in check';
            }
        }

        $('#status').html(`Status: ${status}`);
    }

    function updateGame() {
        const fen = game.fen();
        const turn = game.turn();

        updateDoc(gameRef, {fen, turn}
        ).then(() => {updateStatus();}
        ).catch(error => {console.error("Error updating document: ", error);});
    }

    function resetGame() {
        game.reset();
        updateGame();
    }

    updateStatus();
});
