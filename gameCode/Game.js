GameState = {
    Menu : 'Menu',
    Playing : 'Playing',
    Animating : 'Animating'
}
BoardSlot = {
	Empty : 0,
	Block1 : 1,
	Block2 : 2,
	Block3 : 3,
	Block4 : 4,
	Block5 : 5,
	Block6 : 6,
	Block7 : 7
}

//scene and graphics 
var canvasID = "myCanvas";
var canvas;
var rootTimerObject;
var mousePos = new Point(0,0);
var tickDelay = 4;
var lastTickTime = 0;
var gameWidth;
var gameHeight;

var soundEnabled = true;

//fps tracking
var fpsInterval = 1000;
var framesThisInterval = 0;
var lastIntervalFPS = -1;
var lastIntervalEndTime = 0;

//input
var keysPressed = [];
var oneTimeKeys = [48];
var oneTimeKeysActive = [];
var gameInput = new GameInput();

//demo vairables
var demoX = 1;
var demoRight = true;

//tetris game timing
var minPieceDropTime = 50;
var maxPieceDropTime = 1000;
var pieceDropTime = maxPieceDropTime;
var timeSinceLastStep = 0;
var inputMoveTime = minPieceDropTime;
var timeSinceLastInput = 0;
var gameState = GameState.Menu;
var gamePaused = false;

//game variables
var blockSize = 26;
var boardWidth = 10;
var boardHeight = 20;
var boardPos = new Point(200,100);
var boardSlots = Create2DArray(boardWidth);
clearBoard();
var pieceSlotType = BoardSlot.Block7;
var pieceSlot = new Point(0,0);
var pieceBlocks = [4]
pieceBlocks[0] = new Point(1,0);
pieceBlocks[1] = new Point(1,1);
pieceBlocks[2] = new Point(1,2);
pieceBlocks[3] = new Point(1,3);

//scoring
var score = 0;
var totalLinesCleared = 0;
var level = 1;
var scoredTetrisLast = false;

function gameBootstrap()
{	
	canvas = document.getElementById(canvasID);
	gameWidth = canvas.width;
	gameHeight = canvas.height;
	
	loadAssets();
	
	canvas.addEventListener('mousemove', function(evt) {mouseMove(evt);}, false);
	canvas.addEventListener('mousedown', function(evt) {mouseDown(evt);}, false);
	canvas.addEventListener('mouseup',   function(evt) {mouseUp(evt);}, false);
	document.addEventListener('keydown', function(evt) {keyDown(evt);}, false);
	document.addEventListener('keyup',   function(evt) {keyUp(evt);}, false);
	
	gameStart();
}

function loadAssets()
{
	backgroundImage = new Image();
	backgroundImage.src = 'assets/pics/Background2.jpg';
	block1Image = new Image();
	block1Image.src = 'assets/pics/block1.jpg';
	block2Image = new Image();
	block2Image.src = 'assets/pics/block2.jpg';
	block3Image = new Image();
	block3Image.src = 'assets/pics/block3.jpg';
	block4Image = new Image();
	block4Image.src = 'assets/pics/block4.jpg';
	block5Image = new Image();
	block5Image.src = 'assets/pics/block5.jpg';
	block6Image = new Image();
	block6Image.src = 'assets/pics/block6.jpg';
	block7Image = new Image();
	block7Image.src = 'assets/pics/block7.jpg';
}

function mouseMove(event)
{
	mousePos = getMousePos(canvas, event);
}

function mouseDown(event)
{
	//console.log("mouseDown");
}

function mouseUp(event)
{
	//console.log("mouseUp");
}

function keyDown(event)
{
	//console.log("keyDown");
	var index = keysPressed.indexOf(event.keyCode);
	if (index <= -1) 
	{
		keysPressed.push(event.keyCode);
	}
}

function keyUp(event)
{
	var index = keysPressed.indexOf(event.keyCode);
	if (index > -1) 
	{
		keysPressed.splice(index, 1);
	}
	
	index = oneTimeKeysActive.indexOf(event.keyCode);
	if (index > -1) 
	{
		oneTimeKeysActive.splice(index, 1);
	}
	//console.log("keyUp");
}

function processInput(time)
{
	var currentGameInput = new GameInput();
	currentGameInput.clearKeys();
	for	(index = 0; index < keysPressed.length; index++) 
	{   
		if(keysPressed[index]==40)//down
			currentGameInput.DownPressed = true;
		else if(keysPressed[index]==37)//left
			currentGameInput.LeftPressed = true;
		else if(keysPressed[index]==39)//right
			currentGameInput.RightPressed = true;
		else if(keysPressed[index]==27)//Esc
			currentGameInput.PausePressed = true;
		else if(keysPressed[index]==77)//M key
			currentGameInput.SoundKeyPressed = true;
		else if(keysPressed[index]==90)//Z key
			currentGameInput.RotRightPressed = true;
		else if(keysPressed[index]==88)//X key
			currentGameInput.RotLeftPressed = true;
		else if(keysPressed[index]==32)//space
			currentGameInput.DropPressed = true;
	}
	
	if(currentGameInput.DownPressed)   gameInput.DownUnHandled = true;
	if(currentGameInput.LeftPressed && !gameInput.LeftPressed)   gameInput.LeftUnHandled = true;
	if(currentGameInput.RightPressed && !gameInput.RightPressed) gameInput.RightUnHandled = true;
	if(currentGameInput.PausePressed && !gameInput.PausePressed) gameInput.PauseUnHandled = true;
	if(currentGameInput.SoundKeyPressed && !gameInput.SoundKeyPressed) soundEnabled = !soundEnabled;
	if(currentGameInput.RotLeftPressed && !gameInput.RotLeftPressed) gameInput.RotLeftUnHandled = true;
	if(currentGameInput.RotRightPressed && !gameInput.RotRightPressed) gameInput.RotRightUnHandled = true;
	if(currentGameInput.DropPressed && !gameInput.DropPressed) gameInput.DropUnHandled = true;
	
	if(gameInput.PauseUnHandled)
	{
		gamePaused = !gamePaused;
		gameInput.PauseUnHandled = false;
		gameInput.clearKeys();//clear keys pressed while paused
	}
	gameInput.updatePressed(currentGameInput);
}

function gameStart()
{
	//setup game for first run
	//systems
	
	//game objects
	
	//start clock
	lastTickTime = window.performance.now();
	tick();
	rootTimerObject = setInterval(function(){tick();}, tickDelay);
	clearBoard();
	resetScore();
	gameState = GameState.Playing;
	
	spawnNewPiece();
}

function gameStop()
{
    clearInterval(rootTimerObject);
}

function renderDemo(context)
{
	if(demoRight)
		demoX++;
	else	
		demoX--;
		
	if(demoX == gameWidth)
		demoRight = false;
	else if(demoX == 1)
		demoRight = true;
	
	if(demoRight)
		demoX++;
	else	
		demoX--;
		
	if(demoX == gameWidth)
		demoRight = false;
	else if(demoX == 1)
		demoRight = true;

	var gWidth=50;
	// Create gradient
	var grd = context.createLinearGradient(demoX+gameWidth/2,0,demoX+gWidth/2,demoX);
	grd.addColorStop(0,"cyan");
	grd.addColorStop(1,"red");

	// Fill with gradient
	context.fillStyle = grd;
	context.fillRect(0,0,gameWidth,gameHeight);
	
	context.font = '40pt Calibri';
	context.fillStyle = 'black';
	context.fillText("Gradient X:"+demoX,demoX,90);
}

function tick()
{
	var now = window.performance.now();
	var timeDif = now-lastTickTime;
	
	framesThisInterval++;
	if(now-lastIntervalEndTime > fpsInterval)
	{
		//new fps interval
		lastIntervalFPS = framesThisInterval /(fpsInterval/1000);
		framesThisInterval = 0;
		lastIntervalEndTime = now;
	}
	lastIntervalEndTime
	
	update(timeDif);
	draw(timeDif);
	
	lastTickTime = window.performance.now();
}

function clearBoard()
{
	for (var x = 0; x < boardWidth; x++) 
	{
		for (var y = 0; y < boardHeight; y++) 
		{
			boardSlots[x][y]=BoardSlot.Empty;
		}
	}
}

function getRandomBlockPiece()
{
	return Math.floor(Math.random()*7)+1;
}

function movePiece(dX,dY)
{
	var valid = true;
	for(var i=0; i<4; i++)
	{
		var slot = new Point(pieceSlot.X+pieceBlocks[i].X+dX,pieceSlot.Y+pieceBlocks[i].Y+dY);
		
		valid = valid && (slot.X>=0 && slot.X<boardWidth && slot.Y>=0 && slot.Y<boardHeight);
		valid = valid && boardSlots[slot.X][slot.Y]==BoardSlot.Empty;
	}
	if(valid)
	{
		pieceSlot.X = pieceSlot.X+dX;
		pieceSlot.Y = pieceSlot.Y+dY;
	}
	return valid;
}

function rotatePiece(clockwise)
{
	var rotateArea = 3;
	if(pieceSlotType==7)
	{
		//square
		return
	}
	else if(pieceSlotType==1)
	{
		//line rotate around 4
		rotateArea = 4;
	}
	
	for(var i=0; i<4; i++)
	{
		if(clockwise)
		{
			var x = 2-pieceBlocks[i].Y;
			var y = pieceBlocks[i].X;
		}
		else
		{
			var x = pieceBlocks[i].Y;
			var y = 2-pieceBlocks[i].X;
		}
		
		pieceBlocks[i].X = x;
		pieceBlocks[i].Y = y;
	}
	if(!movePiece(0,0))
	{
		rotatePiece(!clockwise);
	}
}

function dropPiece()
{
	while(movePiece(0,1));
	snapPiece();
}

function snapPiece()
{
	for(var i=0; i<4; i++)
	{
		var slot = new Point(pieceSlot.X+pieceBlocks[i].X,pieceSlot.Y+pieceBlocks[i].Y);
		boardSlots[slot.X][slot.Y] = pieceSlotType;
	}
	scorePiecePlacement();
	var linesCleared = checkAndClearLines();
	if(soundEnabled)
		playBeepData();
	spawnNewPiece()
}

function checkAndClearLines()
{
	//todo - remove full lines
	var linesCleared = 0;
	for (var y = 0; y < boardHeight; y++)
	{
		var fullLine = true;
		for (var x = 0; x < boardWidth; x++)
		{
			if(boardSlots[x][y]==BoardSlot.Empty)
			{
				fullLine = false;
				break;
			}
		}
		if(fullLine)
		{
			clearLine(y);
			y--;//prevent skips
			linesCleared++;
		}
	}
	if(linesCleared>0)
		scoreLinesClear(linesCleared);
	totalLinesCleared+=linesCleared;
	level = Math.floor(totalLinesCleared/10)+1;
	return linesCleared;
}

function clearLine(clearY)
{
	//clear
	for (var x = 0; x < boardWidth; x++)
	{
		boardSlots[x][clearY]=BoardSlot.Empty;
	}
	//move down
	for (var y = clearY; y > 0; y--)
	{
		for (var x = 0; x < boardWidth; x++)
		{
			boardSlots[x][y]=boardSlots[x][y-1];
			boardSlots[x][y-1]=BoardSlot.Empty;
		}
	}
}

function resetScore()
{
	score = 0;
	level = 1;
	totalLinesCleared = 0;
	scoredTetrisLast = false;
}

function scorePiecePlacement()
{
	score+=10;
}

function scoreLinesClear(lines)
{
	var tetris = (lines==4);
	if(tetris && scoredTetrisLast)
		score+=1200;//back to back tetrises
	else
		score+=Math.pow(2,lines-1)*100;
	scoredTetrisLast = tetris;
}

function spawnNewPiece()
{
	pieceSlot = new Point(4,0);
	pieceSlotType = getRandomBlockPiece();
	if(pieceSlotType==1)
	{//line
		pieceBlocks[0] = new Point(1,0);
		pieceBlocks[1] = new Point(1,1);
		pieceBlocks[2] = new Point(1,2);
		pieceBlocks[3] = new Point(1,3);
	}
	if(pieceSlotType==2)
	{//T
		pieceBlocks[0] = new Point(1,0);
		pieceBlocks[1] = new Point(1,1);
		pieceBlocks[2] = new Point(1,2);
		pieceBlocks[3] = new Point(2,1);
	}
	if(pieceSlotType==3)
	{//L
		pieceBlocks[0] = new Point(1,0);
		pieceBlocks[1] = new Point(1,1);
		pieceBlocks[2] = new Point(1,2);
		pieceBlocks[3] = new Point(0,0);
	}
	if(pieceSlotType==4)
	{//backwards L
		pieceBlocks[0] = new Point(1,0);
		pieceBlocks[1] = new Point(1,1);
		pieceBlocks[2] = new Point(1,2);
		pieceBlocks[3] = new Point(2,0);
	}
	if(pieceSlotType==5)
	{//Z
		pieceBlocks[0] = new Point(0,0);
		pieceBlocks[1] = new Point(1,0);
		pieceBlocks[2] = new Point(1,1);
		pieceBlocks[3] = new Point(2,1);
	}
	if(pieceSlotType==6)
	{//backwards Z
		pieceBlocks[0] = new Point(0,1);
		pieceBlocks[1] = new Point(1,1);
		pieceBlocks[2] = new Point(1,0);
		pieceBlocks[3] = new Point(2,0);
	}
	if(pieceSlotType==7)
	{//square
		pieceBlocks[0] = new Point(0,0);
		pieceBlocks[1] = new Point(0,1);
		pieceBlocks[2] = new Point(1,0);
		pieceBlocks[3] = new Point(1,1);
	}
	
	
	return true;
}

function update(time)
{
	processInput(time);
	
	if(!gamePaused)
	{
		if(gameState==GameState.Playing)
		{
			//update game
			//step input
			timeSinceLastInput+=time;
			if(timeSinceLastInput>=inputMoveTime)
			{
				timeSinceLastInput = 0;
				//handle pressed keys
				if(gameInput.DownUnHandled)
				{
					if(!movePiece(0,1))
						snapPiece();
				}
				if(gameInput.LeftUnHandled)
					movePiece(-1,0);
				if(gameInput.RightUnHandled)
					movePiece(1,0);
				if(gameInput.RotRightUnHandled)
					rotatePiece(false);
				if(gameInput.RotLeftUnHandled)
					rotatePiece(true);
				if(gameInput.DropUnHandled)
					dropPiece();
				
				gameInput.handledInput();
			}
			
			//step Piece
			timeSinceLastStep+=time;
			if(timeSinceLastStep>=pieceDropTime)
			{
				timeSinceLastStep = 0;
					
				if(!movePiece(0,1))
					snapPiece();
			}
		}
	}
}

function drawFPS(context)
{
	var xPos = 5;
	var yPos = 25;
	var ySeperation = 25;
	var d = new Date();
	context.font = '20pt Calibri';
	context.fillStyle = 'black';

	//context.fillText("Date:"+d.toUTCString()+" - "+d.getMilliseconds(),xPos,yPos+ySeperation*0);
	context.fillText("FPS:"+lastIntervalFPS+" - "+framesThisInterval,xPos,yPos+ySeperation*0);
	context.fillText("Mouse X:"+mousePos.X+" Y:"+mousePos.Y,           xPos,yPos+ySeperation*1);

	context.fillText("Keys:"+keysPressed,           xPos,yPos+ySeperation*2);
	context.fillText("Input:"+gameInput,           xPos,yPos+ySeperation*3);
	context.fillText("paused:"+gamePaused,           xPos,yPos+ySeperation*4);
	context.fillText("Level:"+level,           xPos,yPos+ySeperation*5);
	context.fillText("Score:"+score,           xPos,yPos+ySeperation*6);
}

function draw(time)
{
	var context = canvas.getContext("2d");
	
	context.clearRect (0,0,gameWidth,gameHeight);

	
	// Create gradient
	var grd = context.createLinearGradient(5+gameWidth/2,0,5+150/2,5);
	grd.addColorStop(0,"cyan");
	grd.addColorStop(1,"red");

	// Fill with gradient
	context.fillStyle = grd;
	context.fillRect(0,0,gameWidth,gameHeight);
	//renderDemo(context);
	drawFPS(context);
	
	//render game
	//background
	context.drawImage(backgroundImage, boardPos.X,boardPos.Y);
	
	//draw board
	for (var x = 0; x < boardWidth; x++) 
	{
		for (var y = 0; y < boardHeight; y++) 
		{
			var blockPos = getSlotPos(x,y);
			var img = getBlockImage(boardSlots[x][y]);
			if(img!=null)
				context.drawImage(getBlockImage(boardSlots[x][y]), blockPos.X,blockPos.Y);
		}
	}
	
	//active piece
	for(var i=0; i<4; i++)
	{
		var piecePos = getSlotPos(pieceSlot.X+pieceBlocks[i].X,pieceSlot.Y+pieceBlocks[i].Y);
		context.drawImage(getBlockImage(pieceSlotType), piecePos.X,piecePos.Y);
	}
	
	if(gamePaused)
	{
		var size = 72;
		var loc = new Point(boardPos.X,boardPos.Y+boardHeight*blockSize/2+size/2)
		context.font=size+"px verdana";
		context.shadowColor="black";
		context.shadowBlur=7;
		context.lineWidth=5;
		context.strokeText("Paused",loc.X,loc.Y);
		context.shadowBlur=0;
		context.fillStyle="white";
		context.fillText("Paused",loc.X,loc.Y);
	}
}

function getBlockImage(slot)
{
	if(slot==BoardSlot.Block1)return block1Image;
	if(slot==BoardSlot.Block2)return block2Image;
	if(slot==BoardSlot.Block3)return block3Image;
	if(slot==BoardSlot.Block4)return block4Image;
	if(slot==BoardSlot.Block5)return block5Image;
	if(slot==BoardSlot.Block6)return block6Image;
	if(slot==BoardSlot.Block7)return block7Image;
	return null;
}

function getSlotPos(slotX, slotY)
{
	return new Point(slotX*blockSize + boardPos.X, slotY*blockSize + boardPos.Y);
}