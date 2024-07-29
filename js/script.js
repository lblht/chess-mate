document.addEventListener("DOMContentLoaded", function() {
    var board = null;
    var game = new Chess();
    var showMoves = true; // Variable to control the visualization of possible moves
    var generateLegalMoves = true; // Variable to control the generation of legal/pseudo-legal moves

    function onDragStart(source, piece, position, orientation) {
        // do not pick up pieces if the game is over
        // or if it's not that side's turn
        if (game.in_checkmate() === true || game.in_draw() === true ||
            (game.turn() === 'w' && piece.search(/^b/) !== -1) ||
            (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
            return false;
        }
    }

    function onDrop(source, target) {
        // see if the move is legal
        var move = game.move({
            from: source,
            to: target,
            promotion: 'q', // NOTE: always promote to a queen for simplicity
        });

        // illegal move
        if (move === null) return 'snapback';

        updateStatus();
        board.position(game.fen()); // Update the board position after the move
    }

    function onMouseoverSquare(square, piece) {
        if (!showMoves) return;

        // get list of possible moves for this square
        var moves = game.moves({
            square: square,
            verbose: true,
            //legal: generateLegalMoves // Use the generateLegalMoves variable
        });

        // exit if there are no moves available for this square
        if (moves.length === 0) return;

        // highlight the square they moused over
        greySquare(square);

        // highlight the possible squares for this piece
        for (var i = 0; i < moves.length; i++) {
            greySquare(moves[i].to);
        }
    }

    function onMouseoutSquare(square, piece) {
        if (!showMoves) return;
        removeGreySquares();
    }

    function removeGreySquares() {
        $('#board .square-55d63').css('background', '');
    }

    function greySquare(square) {
        var squareEl = $('#board .square-' + square);

        var background = '#a9a9a9';
        if (squareEl.hasClass('black-3c85d') === true) {
            background = '#696969';
        }

        squareEl.css('background', background);
    }

    function updateStatus() {
        var status = '';

        var moveColor = 'White';
        if (game.turn() === 'b') {
            moveColor = 'Black';
        }

        // checkmate?
        if (game.in_checkmate() === true) {
            status = 'Game over, ' + moveColor + ' is in checkmate.';
        }

        // draw?
        else if (game.in_draw() === true) {
            status = 'Game over, drawn position';
        }

        // game still on
        else {
            status = moveColor + ' to move';

            // check?
            if (game.in_check() === true) {
                status += ', ' + moveColor + ' is in check';
            }
        }

        $('#status').html(status);
        $('#fen').html(game.fen());
        $('#pgn').html(game.pgn());
    }

    var config = {
        draggable: true,
        position: 'start',
        onDragStart: onDragStart,
        onDrop: onDrop,
        onMouseoutSquare: onMouseoutSquare,
        onMouseoverSquare: onMouseoverSquare,
        dropOffBoard: 'snapback',
        sparePieces: false
    };

    board = Chessboard('board', config);

    // Add event listener to the move visualization toggle button
    document.getElementById('toggle-move-visualization').addEventListener('click', function() {
        showMoves = !showMoves;
        if (!showMoves) {
            removeGreySquares();
        }
    });

    // Add event listener to the move generation toggle button
    document.getElementById('toggle-move-generation').addEventListener('click', function() {
        generateLegalMoves = !generateLegalMoves;
        var status = generateLegalMoves ? 'Legal moves' : 'Pseudo-legal moves';
        document.getElementById('move-generation-status').innerText = status;
    });

    updateStatus();
});
