// GLOBALS
var dict = {};
var color;
var dispTurn = 0;
var possibleMoves;
var flipped = false;

// Light/darkmode switch code
const themeSwitch: any = document.querySelector('.theme-switch');
themeSwitch.checked = localStorage.getItem('switchedTheme') === 'true';

themeSwitch.addEventListener('change', function (e) {
  if(e.currentTarget.checked === true) {
    // Add item to localstorage
    localStorage.setItem('switchedTheme', 'true');
  } else {
    // Remove item if theme is switched back to normal
    localStorage.removeItem('switchedTheme');
  }
});

// Banner functions
function bannerWait() {
   let banner = document.getElementById("banner");
   let text = document.getElementById("bannerText");

   text.innerHTML = "Waiting for server...";
   banner.style.backgroundColor = "Orange";
   banner.style.display = "block";
}

function bannerClear() {
   document.getElementById("banner").style.display = "none";
}

function bannerWinner(id) {
   let banner = document.getElementById("banner");
   let text = document.getElementById("bannerText");

   text.innerHTML = "Winner! " + id;
   banner.style.backgroundColor = "Green";
   banner.style.display = "block";
}

// Websocket shit
var socket;
function connectSocket() {
	var ip = <HTMLInputElement>document.getElementById("server-ip").value;
	
	socket = new WebSocket("ws://"+ip);

	socket.onopen = function(e) {
  	console.log("[Open] Connection established");
	};


	socket.onmessage = function(event) {
  	    let msg = event.data;
        let jsonMsg = JSON.parse(msg);
        switch(jsonMsg.action) {
            case "new_client":
                // New connection established, recieve fundamental info
                let pieces = jsonMsg.data.pieces;
                let n;
                for(n in pieces) {
                    dict[pieces[n][0]] = pieces[n][1];
                }
                color = jsonMsg.data.client_type.color;
								crntTurn = -1;
								move_history = [];
								if(color == 1) flipped = true;

                document.getElementById("gmTitle").innerHTML = jsonMsg.data.name;
                bannerWait();
                console.log("New game established, waiting for board..");
                break;

            case "move":
                //shit changed. draw changed shit
                drawJSON(msg, socket);
                console.log("[Done] New board has been printed");
                break;

            case "invalid_message":
                // print error, client side
                console.error("[Error] A clientside error has occured: " + msg);
                break;

            case "winner":
                // TODO Actually display who won
                console.log("[Winner] " + jsonMsg.data.winner);
                drawJSON(msg, socket);
                bannerWinner("test");
                break;

            default:
                // print error, server side, lol
                console.error("[Error] A serverside error has occured, read previous output for details.");
        }
	}

	socket.onclose = function(event) {
 		if (event.wasClean) {
 	  	console.error(`[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`);
 		} else {
  		// e.g. server process killed or network down
  		// event.code is usually 1006 in this case
    	console.error('[close] Connection died');
  	}
	};

	socket.onerror = function(error) {
 		console.error(`[error] ${error}`);
	};
}

// Generate board code:
function genBoard(cols, rows) {
    // Get and clear the board
	let boardDiv = document.getElementById('board');
	
   while (boardDiv.firstChild) {
        boardDiv.removeChild(boardDiv.lastChild);
    }

    // Build board
    const container = document.getElementById("board");
  
    container.style.setProperty('--grid-rows', rows);
    container.style.setProperty('--grid-cols', cols);
    for (let c = 0; c < (rows * cols); c++) {
        let cell = document.createElement("div");
        cell.id = ("board-gridId-"+c);
		
		let offset = c;
        if (cols % 2 == 0)
            offset += Math.floor(c/cols);
        if(offset % 2 == 0) {
			cell.style.backgroundColor = "var(--grid-black)";
		} else {
			cell.style.backgroundColor = "var(--grid-white)";
		}
		
        container.appendChild(cell).className = "board-grid";
    }

		checkButtons();
}

function getId(x, y, rowLength) {
	return (y * rowLength) + x;
}

function getCoord(id, width) {
    let x = id % width;
    let y = Math.floor(id / width);
    return [x,y];
}

function getMove(from, to, width) {
    let from_coord = getCoord(from, width);
    let to_coord = getCoord(to, width);

    let data = 
        "{\"action\":\"move\",\"data\":{\"from\":"+ 
            JSON.stringify(from_coord) + 
        ",\"to\":" +
            JSON.stringify(to_coord) + 
        "}}";
    return data;
}

var crntTurn = -1;
var move_history = [];
var turn;
function drawJSON(jsonString, socket) {
	// Clear any banner
  bannerClear();
   
  // Start by reading the info
	let JSON_obj = JSON.parse(jsonString);

  var startHeight = parseInt(document.getElementById("board").offsetHeight);
  var startWidth = parseInt(document.getElementById("board").offsetWidth);
	
  let board = JSON_obj.data.board;
	possibleMoves = JSON_obj.data.moves;
	turn = JSON_obj.data.turn;

	//Display who's turn it is
	let display = document.getElementById("turnDisplay");
	
	if(turn == color) {
		display.innerHTML = "Your turn!";
		display.style.color = "green";
	} else {
		display.innerHTML = "Opponents turn..";
		display.style.color = "red";
	}

	//Display turn	
	crntTurn++;
	let counter = document.getElementById("turnCounter");
	counter.innerHTML = "Turn: " + crntTurn + "/" + crntTurn;

	move_history.push(board);
	dispTurn = crntTurn;

	let height = board.length;
	let width = board[0].length;
	
	drawBoard(board, width, height);	

  scaleBoard(startHeight, startWidth);

	if(flipped == true) flipBoard(180);
}

function surrender() {
	socket.send('{"action":"surrender"}');
}

function flipper() {
	if(flipped) {
		flipBoard(0);
		flipped = false;
	} else {
		flipBoard(180);
		flipped = true;
	}
}

function flipBoard(deg) {
	document.getElementById("board-container").style.transform = "rotate(" + deg + "deg)";
	Array.from(document.querySelectorAll<HTMLElement>(".board-grid"), e => e.style.transform = "rotate("+ deg + "deg)");
}

function goBack() {
	if(dispTurn > 0) {
		dispTurn--;

		let board = move_history[dispTurn];

		let height = board.length;
		let width = board[0].length;

		drawBoard(board, width, height);

		let counter = document.getElementById("turnCounter");
		counter.innerHTML = "Turn: " + dispTurn + "/" + crntTurn;

		if(flipped == true) flipBoard(180);
	}
}

function checkButtons() {
	if(dispTurn >= crntTurn) {
		let button = document.getElementById("fButton");
		button.style.color = "#999";
	} else {
		let button = document.getElementById("fButton");
		button.style.color = "white";
	}

	if(dispTurn <= 0) {
		let button = document.getElementById("bButton");
		button.style.color = "#999";
	} else {
		let button = document.getElementById("bButton");
		button.style.color = "white";
	}
}

function goBackSquared() {
	if(dispTurn < crntTurn) {
		dispTurn++;
	
		let board = move_history[dispTurn];

		let height = board.length;
		let width = board[0].length;

		drawBoard(board, width, height);

		if(flipped == true) flipBoard(180);

		let counter = document.getElementById("turnCounter");
		counter.innerHTML = "Turn: " + dispTurn + "/" + crntTurn;
	}
}

function drawBoard(board, width, height) {
	// Generate new, empty board
	genBoard(width, height);

	// Place icons into the board
	var x;
	for(x in board) {
		var y;
		for(y in board[x]) {
			let id = getId(parseInt(y), parseInt(x), width);
			let div = document.getElementById("board-gridId-"+id);

			let circle = document.createElement("div");
			div.appendChild(circle);

			circle.className = "circle";
			circle.id = "board-circleId-" + id;

			let piece = board[x][y];
			if(piece != null) {
				let iconName = dict[piece[0]];
            const icon = document.createElement("img");
            icon.src = "icons/" + iconName + ".svg";
            
            if(piece[1] === 0) {
               icon.style.webkitFilter = "invert(100%) drop-shadow(1px 1px 0px #555) drop-shadow(-1px 1px 0px #555) drop-shadow(1px -1px 0px #555) drop-shadow(-1px -1px 0px #555)";
            }
 
            icon.id = "board-pieceId-"+id;
            icon.className = "piece";
            div.appendChild(icon);
			}
		}
	}

	// Make possible moves, new function cause easier to read.
	if(turn == color && dispTurn == crntTurn) { 
		addOnClick(width, height); 
	}
}
	
function scaleBoard(startHeight, startWidth) {
	var board = document.getElementById("board");
	var dimensions = board.getBoundingClientRect();

	let wDiff = (startWidth - dimensions.width)* -1;
	let hDiff = (startHeight - dimensions.height)* -1;

	let scale = 1;
	if(wDiff > hDiff) {
		scale = 1/(dimensions.width / startWidth);
		if(scale < 1) board.style.transform = "scale(" + scale + ")";
	} else if(wDiff != hDiff) {
		scale = 1/(dimensions.height / startHeight);
		if(scale < 1) board.style.transform = "scale(" + scale + ")";
	}

	// Center after scaling
	let width = board.getBoundingClientRect().width;
	let container = document.getElementById("board-container");
	let cWidth = container.getBoundingClientRect().width;
	if(width < cWidth) {
		let x = (cWidth - width)/2;
		board.style.transform = board.style.transform + " translate(" + x/scale + "px)";
	}
}

function addOnClick(width, height) {
	let moves = {};
   for (let i = 0; i < possibleMoves.length; i++) {
      let from = possibleMoves[i].from;
      let to = possibleMoves[i].to;
      let id = getId(from[0],from[1],width);
      if (typeof moves[id] == 'undefined')
         moves[id] = [getId(to[0], to[1], width)];
      else
         moves[id].push(getId(to[0], to[1], width));
   }

   for(let [key, val] of Object.entries(moves)) {
      let from = document.getElementById("board-gridId-"+key);
      from.addEventListener("mousedown" , function() {
         // Clear all possible moves from board
         Array.from(document.querySelectorAll<HTMLElement>(".circle"), e => e.style.display = "none");

         for(let i = 0; i < val.length; i++) {
            let circleId = val[i];
            let display = document.getElementById("board-circleId-"+circleId).style.display;
				let circle = document.getElementById("board-circleId-"+circleId);
				
				if(display == "none" || display == "") {
   				let tmpPiece;
	   			tmpPiece = document.getElementById("board-pieceId-"+circleId);

               if(tmpPiece == null)
			   		draw("board-circleId-"+circleId, "block");
				   else { 
				      circle.style.backgroundColor = "rgb(255, 0, 0, 0.6)";
						draw("board-circleId-"+circleId, "block");
					}

					let data = getMove(key, val[i], width);
					circle.addEventListener("mousedown", function sendData() {
						console.log("[send] Sending move: " + data);
					   socket.send(data);
					});	
            } else {
					draw("board-circleId-"+circleId, "none");
				}
         }
      });      
   }
   for(let i = 0; i < width; i++) {
      for(let j = 0; j < height; j++) {
         let id = getId(i, j, width); 
         let gridPiece = document.getElementById("board-gridId-" + id);
         if (typeof moves[id] == 'undefined') {
            gridPiece.addEventListener('mousedown', function () {
   				Array.from(document.querySelectorAll<HTMLElement>(".circle"), e => e.style.display = "none");
   				Array.from(document.querySelectorAll<HTMLElement>(".circle"), e => recreateNode(e, true));	
   			});
         }
      }
   }
}

function recreateNode(el, withChildren) {
  if (withChildren) {
    el.parentNode.replaceChild(el.cloneNode(true), el);
  }
  else {
    var newEl = el.cloneNode(false);
    while (el.hasChildNodes()) newEl.appendChild(el.firstChild);
    el.parentNode.replaceChild(newEl, el);
  }
}

function draw(id, show) {
	let element = document.getElementById(id);
	element.style.display = show;
}
