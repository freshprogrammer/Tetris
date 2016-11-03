GameState = {
    Menu : 'Menu',
    Playing : 'Playing',
    Animating : 'Animating',
	GameOver : 'GameOver'
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
MusicState = {
	Mute : 'Muted',
	Sound : 'Effects',
	Music : 'Music'
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

var backgroundMusic;
var musicState = MusicState.Music;

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

//tetris game system and timing
var gameState = GameState.Menu;
var gamePaused = false;
var minPieceDropTime = 75;
var maxPieceDropTime = 150;//1000;
var pieceDropTime = maxPieceDropTime;
var timeSinceLastStep = 0;
var inputMoveTime = minPieceDropTime;
var timeSinceLastInput = 0;
var highestDificultyLevel = 10;
var linesPerLevel = 10;

//game variables
var blockSize = 26;
var boardWidth = 10;
var boardHeight = 20;
var boardPos = new Point(200,100);
var boardSlots = Create2DArray(boardWidth);
clearBoard();

//piece & nextPiece
var nextPieceSlotType = BoardSlot.Block7;
var nextPieceBlocks = [4]
nextPieceBlocks[0] = new Point(1,0);
nextPieceBlocks[1] = new Point(1,1);
nextPieceBlocks[2] = new Point(1,2);
nextPieceBlocks[3] = new Point(1,3);
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
var tetrises = 0;
var scoredTetrisLast = false;
var stopwatch = new Stopwatch();

function gameBootstrap()
{	
	//testcode
	/*
	var test = "";
	var test2 = "";
	var xhr = new XMLHttpRequest();
	xhr.open('GET', 'http://freshprogramming.com/miniTools/jsTetris/tetrisScores.php', true);
	xhr.onreadystatechange = function() {
	  if (xhr.readyState === 4)  { 
		console.log(xhr.responseText);
	  }
	};
	xhr.send(null);*/

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
	if(currentGameInput.PausePressed && !gameInput.PausePressed) gamePause();
	if(currentGameInput.SoundKeyPressed && !gameInput.SoundKeyPressed) toggleSound();
	if(currentGameInput.RotLeftPressed && !gameInput.RotLeftPressed) gameInput.RotLeftUnHandled = true;
	if(currentGameInput.RotRightPressed && !gameInput.RotRightPressed) gameInput.RotRightUnHandled = true;
	if(currentGameInput.DropPressed && !gameInput.DropPressed) gameInput.DropUnHandled = true;
	
	gameInput.updatePressed(currentGameInput);
}

function gamePause()
{
	if(gameState==GameState.Playing || gameState==GameState.Animating)
	{
		gamePaused = !gamePaused;
		if(gamePaused)
			stopwatch.stop();
		else
			stopwatch.start();
		
		toggleMusicPause();
		gameInput.clearKeys();//clear keys pressed while paused
	}
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
	stopwatch.reset();
	stopwatch.start();
	
	playBackgroundMusic();
	
	spawnNewPiece();//double to preload preview piece
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
	playPieceSnapSound();
	if(!spawnNewPiece())
	{
		//game over
		gameOver();
	}
}

function gameOver()
{
	stopwatch.stop();
	gamePaused = true;
	gameState = GameState.GameOver;
	toggleMusicPause();
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

function toggleSound()
{
	if(gamePaused)
		return;
	
	if(musicState==MusicState.Mute)musicState = MusicState.Music;
	else if(musicState==MusicState.Music)musicState = MusicState.Sound;
	else if(musicState==MusicState.Sound)musicState = MusicState.Mute;
	
	if(musicState==MusicState.Music)
	{
		playBackgroundMusic();
	}
	else
	{
		backgroundMusic.pause();
	}
}

function resetScore()
{
	score = 0;
	level = 1;
	totalLinesCleared = 0;
	scoredTetrisLast = false;
	tetrises = 0;
}

function scorePiecePlacement()
{
	score+=10;
}

function playBackgroundMusic()
{
	if(musicState==MusicState.Music)
	{
		if(backgroundMusic==null)
		{
			backgroundMusic = new Audio('assets/audio/tetrisMusic.mp3');
			backgroundMusic.loop = true;
			backgroundMusic.volume = 0.1;
			backgroundMusic.play();
		}
		else
		{
			backgroundMusic.play();
		}
	}
}

function toggleMusicPause()
{
	if(musicState==MusicState.Music)
	{
		if(backgroundMusic!=null)
		{
			if(backgroundMusic.paused)
				backgroundMusic.play();
			else
				backgroundMusic.pause();
		}
	}
}

function playLineClearSound(lines)
{
	if(musicState!=MusicState.Mute)
	{
		var audio = new Audio('assets/audio/moneySound.wav');
		audio.play();
	}
}

function playPieceSnapSound()
{
	if(musicState!=MusicState.Mute)
	{
		var audio = new Audio('assets/audio/drop.wav');
		audio.volume = 0.1;
		audio.play();
	}
}

function playLevelUpSound()
{
	if(musicState!=MusicState.Mute)
	{
		//var audio = new Audio('assets/audio/drop.wav');
		//audio.play();
	}
}

function scoreLinesClear(lines)
{
	if(lines>0)
		playLineClearSound(lines)
	
	var tetris = (lines==4);
	if(tetris)tetrises++;
	if(tetris && scoredTetrisLast)
		score+=1200;//back to back tetrises
	else
		score+=Math.pow(2,lines-1)*100;
	scoredTetrisLast = tetris;
	
	totalLinesCleared+=lines;
	
	//level up
	var oldLevel = level;
	level = Math.floor(totalLinesCleared/linesPerLevel)+1;
	if(level>oldLevel)
		playLevelUpSound();
	pieceDropTime = maxPieceDropTime - ((maxPieceDropTime - minPieceDropTime)/(highestDificultyLevel-1)) * (level-1);
	if(pieceDropTime<minPieceDropTime)
		pieceDropTime = minPieceDropTime;
}

function getNextBlockPiece()
{
	var newPiece = nextPieceSlotType;
	nextPieceSlotType = Math.floor(Math.random()*7)+1;
	nextPieceBlocks = getBlocksForPiece(nextPieceSlotType);
	return newPiece;
}

function spawnNewPiece()
{
	pieceSlotType = getNextBlockPiece();
	pieceSlot = new Point(4,0);
	pieceBlocks = getBlocksForPiece(pieceSlotType);
	
	return movePiece(0,0);
}

function getBlocksForPiece(type)
{
	var blocks = [4];
	if(type==1)
	{//line
		blocks[0] = new Point(1,0);
		blocks[1] = new Point(1,1);
		blocks[2] = new Point(1,2);
		blocks[3] = new Point(1,3);
	}
	else if(type==2)
	{//T
		blocks[0] = new Point(1,0);
		blocks[1] = new Point(1,1);
		blocks[2] = new Point(1,2);
		blocks[3] = new Point(2,1);
	}
	else if(type==3)
	{//L
		blocks[0] = new Point(1,0);
		blocks[1] = new Point(1,1);
		blocks[2] = new Point(1,2);
		blocks[3] = new Point(0,0);
	}
	else if(type==4)
	{//backwards L
		blocks[0] = new Point(1,0);
		blocks[1] = new Point(1,1);
		blocks[2] = new Point(1,2);
		blocks[3] = new Point(2,0);
	}
	else if(type==5)
	{//Z
		blocks[0] = new Point(0,0);
		blocks[1] = new Point(1,0);
		blocks[2] = new Point(1,1);
		blocks[3] = new Point(2,1);
	}
	else if(type==6)
	{//backwards Z
		blocks[0] = new Point(0,1);
		blocks[1] = new Point(1,1);
		blocks[2] = new Point(1,0);
		blocks[3] = new Point(2,0);
	}
	else if(type==7)
	{//square
		blocks[0] = new Point(0,0);
		blocks[1] = new Point(0,1);
		blocks[2] = new Point(1,0);
		blocks[3] = new Point(1,1);
	}
	return blocks;
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
	context.font = '20pt Calibri';
	context.fillStyle = 'black';

	var line = 0;
	//context.fillText("FPS:"+lastIntervalFPS+" - "+framesThisInterval,xPos,yPos+ySeperation*line++);
	context.fillText("FPS:"+lastIntervalFPS+" - "+stopwatch.formattedTime(),     xPos,yPos+ySeperation*line++);
	context.fillText("Keys:"+keysPressed,        xPos,yPos+ySeperation*line++);
	context.fillText("Input:"+gameInput,         xPos,yPos+ySeperation*line++);
	context.fillText("State:"+gameState,         xPos,yPos+ySeperation*line++);
	context.fillText("Sound:"+musicState,        xPos,yPos+ySeperation*line++);
	line++;
	context.fillText("Level:"+level,             xPos,yPos+ySeperation*line++);
	context.fillText("Score:"+score,             xPos,yPos+ySeperation*line++);
	context.fillText("Tetris:"+tetrises,         xPos,yPos+ySeperation*line++);
	
	
	line = 0;
	var xPos = 500;
	context.fillText("Controls:",    xPos,yPos+ySeperation*line++);
	context.fillText("Move:Arrows",  xPos,yPos+ySeperation*line++);
	context.fillText("Rotate:Z, X",  xPos,yPos+ySeperation*line++);
	context.fillText("Drop:Space",   xPos,yPos+ySeperation*line++);
	context.fillText("Mute:M",       xPos,yPos+ySeperation*line++);
	context.fillText("Pause:Esc",    xPos,yPos+ySeperation*line++);
}

function draw(time)
{
	var context = canvas.getContext("2d");
	
	context.clearRect (0,0,gameWidth,gameHeight);

	
	// Create gradient
	var grd = context.createLinearGradient(0,0,0,gameHeight);
	grd.addColorStop(0,"white");
	grd.addColorStop(1,"black");

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
	
	//next piece
	for(var i=0; i<4; i++)
	{
		var renderPreviewSlot = new Point(11,4);
		var pos = getSlotPos(renderPreviewSlot.X+nextPieceBlocks[i].X,renderPreviewSlot.Y+nextPieceBlocks[i].Y);
		context.drawImage(getBlockImage(nextPieceSlotType), pos.X,pos.Y);
	}
	//active piece
	for(var i=0; i<4; i++)
	{
		var pos = getSlotPos(pieceSlot.X+pieceBlocks[i].X,pieceSlot.Y+pieceBlocks[i].Y);
		context.drawImage(getBlockImage(pieceSlotType), pos.X,pos.Y);
	}
	
	if(gameState==GameState.GameOver)
	{
		var size = 45;
		var loc = new Point(boardPos.X,boardPos.Y+boardHeight*blockSize/2+size/2)
		context.font=size+"px verdana";
		context.shadowColor="black";
		context.shadowBlur=7;
		context.lineWidth=5;
		context.strokeText("Game Over",loc.X,loc.Y);
		context.shadowBlur=0;
		context.fillStyle="white";
		context.fillText("Game Over",loc.X,loc.Y);
	}
	else if(gamePaused)
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