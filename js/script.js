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
        pieceTheme: 'img/chesspieces/custom/{piece}.png',
        onChange: onChange,
    };
    board = Chessboard('board', config);
    var capturedPieces = [];
    var moveSound = new Audio('sounds/move.mp3');
    var captureSound = new Audio('sounds/capture.mp3');
    
    $(window).resize(board.resize)
    $('#gameContent').hide();
    $('#kingCapturedOverlay').hide();
    $('#joinGame').on('click', joinGame);
    $('#resetButton').on('click', resetGame);
    $('#resetOverlayButton').on('click', resetGame);
    $('#revertButton').on('click', revertTurn);

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
            game.turn("w");
            
            onSnapshot(gameRef, (docSnapshot) => {
                const gameData = docSnapshot.data();
                if (gameData) {
                    lastMove = gameData.lastMove;
                    game.load(gameData.fen);
                    board.position(gameData.fen);
                    game.turn(gameData.turn);
                    capturedPieces = gameData.capturedPieces;
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
            promotion: 'q'
        });
    
        if (move === null) return 'snapback';

    
        if (move.captured) {
            var capturedPiece = {
                type: move.captured,
                color: game.turn()
            };
            capturedPieces.push(capturedPiece);
        }
    
        updateGame();
    }
    
    function updateCapturedPieces() {
        $('#capturedWhite').empty();
        $('#capturedBlack').empty();
    
        capturedPieces.forEach(piece => {
            var pieceImage = `<img src="img/chesspieces/custom/${piece.color}${piece.type.toUpperCase()}.png" alt="${piece.color}${piece.type}">`;
            if (piece.color === 'w') {
                $('#capturedWhite').append(pieceImage);
            } else {
                $('#capturedBlack').append(pieceImage);
            }
        });
    }
    

    function updateStatus() {
        var status = '';
        var moveColor = game.turn() === 'b' ? 'black' : 'white';

        if (game.in_checkmate() === true) {
            status = 'Game over, ' + moveColor + ' is in checkmate.';
        } else if (game.in_draw() === true) {
            status = 'Game over, drawn position';
        } else {
            status = moveColor + ' to move';
        }

        if(checkKingCapture()) { 
            $('#status').html( `Status: ${checkKingCapture()}`); 
        }
        else { 
            $('#status').html( `Status: ${status}`); 
        }
        
        $('#lastMove').html(`Last move: ${lastMove}`);

        updateCapturedPieces();
    }

    function updateGame() {
        const history = game.history();
        const fen = game.fen();
        const turn = game.turn();
        const lastMove = history[history.length - 1] ? history[history.length - 1] : 'no moves made'

        updateDoc(gameRef, {fen, turn, lastMove, capturedPieces}
        ).then(() => {updateStatus();}
        ).catch(error => {console.error("Error updating document: ", error);});
    }

    function resetGame() {
        if (window.confirm('Are you sure you want to reset the game?')) {
            $('#kingCapturedOverlay').hide();
            lastMove = null;
            capturedPieces = [];
            game.reset();
            updateGame();
        }
    }

    function revertTurn() {
        if (window.confirm('Are you sure you want to revert the last turn?')) {
            // TODO
            alert("Not working yet :(");
        }
    }

    function showKingCapturedOverlay(message) {
        $('#kingCapturedMessage').text(message);
        $('#kingCapturedOverlay').show();
    }
    
    function checkKingCapture() {
        var boardState = game.board();
        var whiteKingCaptured = true;
        var blackKingCaptured = true;
    
        for (var row of boardState) {
            for (var square of row) {
                if (square) {
                    if (square.type === 'k' && square.color === 'w') {
                        whiteKingCaptured = false;
                    }
                    if (square.type === 'k' && square.color === 'b') {
                        blackKingCaptured = false;
                    }
                }
            }
        }
    
        if (whiteKingCaptured) {
            showKingCapturedOverlay('Black wins!');
            return 'white king captured';
        } else if (blackKingCaptured) {
            showKingCapturedOverlay('White wins!');
            return 'black king captured';
        } else {
            return null;
        }
    }
    

    function onChange(oldPosition, newPosition) {
        var capturedPiece = null;
        for (var square in oldPosition) {
          if (oldPosition[square] !== newPosition[square]) {
            if (newPosition[square]) {
              capturedPiece = oldPosition[square];
              console.log('Captured piece:', capturedPiece, 'from square:', square);
              break;
            }
          }
        }
  
        if (capturedPiece)  {
            captureSound.play();
        }
        else {
            moveSound.play();
        }
      }
      
    
    updateStatus();
});
