GameState = {
    Menu : 'Menu',
    IdleAnimation : 'IdleAnimation',
    Playing : 'Playing',
    LineAnimating : 'LineAnimating',
    NewGameAnimation : 'NewGameAnimation',
	GameOverAnimation : 'GameOverAnimation',
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
	Block7 : 7,
	Block0 : 8
}
MusicState = {
	Mute : 'Muted',
	Sound : 'Effects',
	Music : 'Music'
}
IdleAnimationState = {
	Stopped : 'Stopped',
	Running : 'Running',
	Stopping : 'Stopping'
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
var showDebugInfo = true;

var musicState = MusicState.Music;
var backgroundMusic;
var pieceSnapSound;
var lineClearSound;
//var levelUpSound;
//var tetrisSound;

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
var minPieceDropTime = 65;
var maxPieceDropTime = 1000;
var pieceDropTime = maxPieceDropTime;
var timeSinceLastStep = 0;
var inputMoveTime = minPieceDropTime;
var timeSinceLastInput = 0;
var highestDificultyLevel = 20;
var linesPerLevel = 10;
var startLevel = 1;

//animation
var timeSinceAnimationStarted = 0;//shared across all animations
var lineAnimDurration = 1000;
var lineAnimFlickerCount = 2;
var newGameAnimDurration = 1000;
var gameOverAnimDurration = 1000;
var idleDropSpeed = 5;
var idleDropStartY = 0;//spawn Y offset of pieces - so all pieces move at y axis like they are on a moving grid
var idleAnimationState = IdleAnimationState.Stopped;
var idleDropRate = 65;
var idleStoppingDropRate = 0;
var idleSpawnRate = 500;
var idleRotateRate = 1000;
var idleTimeSinceDrop = 0;
var idleTimeSinceSpawn = 0;
var idleTimeSinceRotate = 0;
var idlePieces = [];
var idlePieceBlocks = [];
var idlePiecePos = [];

//game variables
var blockSize = 26;
var boardWidth = 10;
var boardHeight = 20;
var boardPos = new Point(50,100);
var boardSlots = Create2DArray(boardWidth);
clearBoard();
var linesToClear = [];
var pieceSettledCount = 0;//number of ticks the active piece has settled

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
	
	//setup game for first run
	//systems
	
	//game objects
	
	//start clock
	lastTickTime = window.performance.now();
	tick();
	rootTimerObject = setInterval(function(){tick();}, tickDelay);
	
	gameState = GameState.Menu;
	runIdleAnimation();
}

function runIdleAnimation()
{
	idleAnimationState = IdleAnimationState.Running;
}

function stopIdleAnimation()
{
	idleAnimationState = IdleAnimationState.Stopping;
}

function runNewGameAnimation()
{
	stopIdleAnimation();
	gameState = GameState.NewGameAnimation;
	gamePaused = false;
	timeSinceAnimationStarted=0;
}

function loadAssets()
{
	backgroundImage = new Image();
	backgroundImage.src = 'assets/pics/Background2.jpg';
	block0Image = new Image();
	block0Image.src = 'assets/pics/block0.jpg';
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
	
	//sounds
	backgroundMusic = new Audio('assets/audio/tetrisMusic.mp3');
	backgroundMusic.loop = true;
	backgroundMusic.volume = 0.1;
	pieceSnapSound = new Audio('assets/audio/drop.wav');
	pieceSnapSound.volume = 0.1;
	lineClearSound = new Audio('assets/audio/moneySound.wav');
	//levelUpSound = new Audio('assets/audio/drop.wav');
	//tetrisSound = new Audio('assets/audio/drop.wav');
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
		else if(keysPressed[index]==113)//F2
			currentGameInput.NewGamePressed = true;
	}
	
	if(currentGameInput.DownPressed)   gameInput.DownUnHandled = true;
	if(currentGameInput.LeftPressed && !gameInput.LeftPressed)   gameInput.LeftUnHandled = true;
	if(currentGameInput.RightPressed && !gameInput.RightPressed) gameInput.RightUnHandled = true;
	if(currentGameInput.PausePressed && !gameInput.PausePressed) gamePause();
	if(currentGameInput.SoundKeyPressed && !gameInput.SoundKeyPressed) toggleSound();
	if(currentGameInput.RotLeftPressed && !gameInput.RotLeftPressed) gameInput.RotLeftUnHandled = true;
	if(currentGameInput.RotRightPressed && !gameInput.RotRightPressed) gameInput.RotRightUnHandled = true;
	if(currentGameInput.DropPressed && !gameInput.DropPressed) gameInput.DropUnHandled = true;
	if(currentGameInput.NewGamePressed && !gameInput.NewGamePressed) newGamePressed();
	
	gameInput.updatePressed(currentGameInput);
}

function newGamePressed()
{
	resetScore();
    backgroundMusic.pause();
    backgroundMusic.currentTime = 0;
	runNewGameAnimation();
}

function gamePause()
{
	if(gameState==GameState.Playing || gameState==GameState.LineAnimating)
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

function tick()
{
	var now = window.performance.now();
	var timeDif = now-lastTickTime;
	lastTickTime = window.performance.now();
	
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
	var moved = dX!=0 || dY!=0;
	for(var i=0; i<4; i++)
	{
		var slot = new Point(pieceSlot.X+pieceBlocks[i].X+dX,pieceSlot.Y+pieceBlocks[i].Y+dY);
		
		valid = valid && (slot.X>=0 && slot.X<boardWidth && slot.Y>=0 && slot.Y<boardHeight);
		valid = valid && boardSlots[slot.X][slot.Y]==BoardSlot.Empty;
	}
	if(valid)
	{
		if(moved)
		{
			pieceSettledCount = 0;
			pieceSlot.X = pieceSlot.X+dX;
			pieceSlot.Y = pieceSlot.Y+dY;
		}
	}
	return valid;
}

function movePieceIgnoreBoardBlocks(dX,dY)
{
	var valid = true;
	for(var i=0; i<4; i++)
	{
		var slot = new Point(pieceSlot.X+pieceBlocks[i].X+dX,pieceSlot.Y+pieceBlocks[i].Y+dY);
		
		valid = valid && (slot.X>=0 && slot.X<boardWidth && slot.Y>=0 && slot.Y<boardHeight);
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
	var rotateArea = 2;
	if(pieceSlotType==7)
	{
		//square
		return
	}
	else if(pieceSlotType==1)
	{
		//line rotate around 4
		rotateArea = 3;
	}
	
	for(var i=0; i<4; i++)
	{
		if(clockwise)
		{
			var x = rotateArea-pieceBlocks[i].Y;
			var y = pieceBlocks[i].X;
		}
		else
		{
			var x = pieceBlocks[i].Y;
			var y = rotateArea-pieceBlocks[i].X;
		}
		
		pieceBlocks[i].X = x;
		pieceBlocks[i].Y = y;
	}
	
	var minX = 0;
	var minY = 0;
	var maxX = boardWidth-1;
	var maxY = boardHeight-1;
	for(var i=0; i<4; i++)
	{
		var slot = new Point(pieceSlot.X+pieceBlocks[i].X,pieceSlot.Y+pieceBlocks[i].Y);
		
		if(slot.X<minX)minX = slot.X;
		else if(slot.X>maxX)maxX = slot.X;
		if(slot.Y<minY)minY = slot.Y;
		else if(slot.Y>maxY)maxY = slot.Y;
	}
	var xShift = 0;
	var yShift = 0;
	if(minX<0)xShift = -1*minX;
	else if(maxX>boardWidth-1)xShift = -1*(maxX-(boardWidth-1));
	if(minY<0)yShift = -1*minY;
	else if(maxY>boardHeight-1)yShift = -1*(maxY-(boardHeight-1));
	
	if(!movePiece(xShift,yShift))
	{
		rotatePiece(!clockwise);
	}
}

function rotatePieceSimple(blocks)
{
	var rotateArea = 2;//all blocks - f different size pieces
	//this is clockwise only for simplicity
	for(var i=0; i<4; i++)
	{
		var x = rotateArea-blocks[i].Y;
		var y = blocks[i].X;
		blocks[i].X = x;
		blocks[i].Y = y;
	}
	return blocks;
}

function dropPiece()
{
	while(movePiece(0,1));
	snapPiece();
	timeSinceLastStep = 0;
}

function lockInPiece()
{
	for(var i=0; i<4; i++)
	{
		var slot = new Point(pieceSlot.X+pieceBlocks[i].X,pieceSlot.Y+pieceBlocks[i].Y);
		boardSlots[slot.X][slot.Y] = pieceSlotType;
	}
}

function snapPiece()
{
	lockInPiece();
	scorePiecePlacement();
	var linesCleared = checkAndClearLines();
	playPieceSnapSound();
	if(linesCleared==0)
	{
		if(!spawnNewPiece())
		{
			//game over
			gameOver();
		}
	}
}

function gameOver()
{
	stopwatch.stop();
	toggleMusicPause();
	lockInPiece();
	runGameOverAnimation();
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
			linesToClear.push(y);
			linesCleared++;
		}
	}
	if(linesCleared>0)
	{
		scoreLinesClear(linesCleared);
		runClearLineAnimation();
	}
	return linesCleared;
}

function setLineSlot(lineY, type)
{
	for (var x = 0; x < boardWidth; x++)
	{
		boardSlots[x][lineY]=type;
	}
}

function clearLine(clearY)
{
	//move down - replace to block/blank
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
	if(gamePaused || gameState==GameState.GameOver || gameState==GameState.GameOverAnimation)
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
	stopwatch.stop();
	stopwatch.reset();
	score = 0;
	level = startLevel;
	updateDropTimeForLevel();
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
		backgroundMusic.play();
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
	if(lines>=4)
	{
		if(musicState!=MusicState.Mute)
		//	tetrisSound.play();
			lineClearSound.play();
	}
	else
	{
		if(musicState!=MusicState.Mute)
			lineClearSound.play();
	}
}

function playPieceSnapSound()
{
	if(musicState!=MusicState.Mute)
		pieceSnapSound.play();
}

function playLevelUpSound()
{
	//if(musicState!=MusicState.Mute)
		//levelUpSound.play();
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
	if(level > highestDificultyLevel)
		level = highestDificultyLevel;
	if(level < oldLevel)
		level = oldLevel;//for start level
	if(level>oldLevel)
	{
		playLevelUpSound();
		updateDropTimeForLevel();
	}
}

function updateDropTimeForLevel()
{
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
	pieceSlot = new Point(Math.ceil(boardWidth/2)-2,0);
	pieceBlocks = getBlocksForPiece(pieceSlotType);
	
	//tweak blocks to center and up as necisarry
	movePieceIgnoreBoardBlocks(0,-1);
	if(pieceSlotType == BoardSlot.Block7)
	{//block
		movePieceIgnoreBoardBlocks(1,0);
	}
	
	return movePiece(0,0);
}

function getBlocksForPiece(type)
{
	var blocks = [4];
	if(type==BoardSlot.Block1)
	{//line
		blocks[0] = new Point(0,1);
		blocks[1] = new Point(1,1);
		blocks[2] = new Point(2,1);
		blocks[3] = new Point(3,1);
	}
	else if(type==BoardSlot.Block2)
	{//T
		blocks[0] = new Point(1,2);
		blocks[1] = new Point(0,1);
		blocks[2] = new Point(1,1);
		blocks[3] = new Point(2,1);
	}
	else if(type==BoardSlot.Block3)
	{//L
		blocks[0] = new Point(0,2);
		blocks[1] = new Point(0,1);
		blocks[2] = new Point(1,1);
		blocks[3] = new Point(2,1);
	}
	else if(type==BoardSlot.Block4)
	{//backwards L
		blocks[0] = new Point(2,2);
		blocks[1] = new Point(0,1);
		blocks[2] = new Point(1,1);
		blocks[3] = new Point(2,1);
	}
	else if(type==BoardSlot.Block5)
	{//Z
		blocks[0] = new Point(0,0);
		blocks[1] = new Point(1,0);
		blocks[2] = new Point(1,1);
		blocks[3] = new Point(2,1);
	}
	else if(type==BoardSlot.Block6)
	{//backwards Z
		blocks[0] = new Point(0,1);
		blocks[1] = new Point(1,1);
		blocks[2] = new Point(1,0);
		blocks[3] = new Point(2,0);
	}
	else if(type==BoardSlot.Block7)
	{//square
		blocks[0] = new Point(0,0);
		blocks[1] = new Point(0,1);
		blocks[2] = new Point(1,0);
		blocks[3] = new Point(1,1);
	}
	return blocks;
}

function pieceTickDown()
{
	if(!movePiece(0,1))
	{
		if(pieceSettledCount>=1)
		{
			snapPiece();
			pieceSettledCount = 0;
		}
		pieceSettledCount++;
	}
}

function runGameOverAnimation()
{
	gameState = GameState.GameOverAnimation;
	timeSinceAnimationStarted = 0;
}

function stopGameOverAnimation()
{
	gameState=GameState.GameOver;
	runIdleAnimation();
}

function runClearLineAnimation()
{
	gameState=GameState.LineAnimating;
	timeSinceAnimationStarted=0;
	stopwatch.stop();
}

function updateLineClearAnimation()
{
	var animationBlockType;
	if(timeSinceAnimationStarted<lineAnimDurration*1/4)
		animationBlockType = BoardSlot.Block0;
	else if(timeSinceAnimationStarted<lineAnimDurration*2/4)
		animationBlockType = BoardSlot.Empty;
	else if(timeSinceAnimationStarted<lineAnimDurration*3/4)
		animationBlockType = BoardSlot.Block0;
	else
		animationBlockType = BoardSlot.Empty;
	for (i = 0; i < linesToClear.length; i++)
	{
		setLineSlot(linesToClear[i],animationBlockType);
	}
}

function stopClearLineAnimation()
{
	for (i = 0; i < linesToClear.length; i++)
	{
		clearLine(linesToClear[i]);
	}
	linesToClear = [];
	
	//continue game
	gameInput.clearKeys();
	gameState = GameState.Playing;
	stopwatch.start();
	if(!spawnNewPiece())
	{
		//game over
		gameOver();
	}
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
				pieceTickDown();
			}
		}
		else if(gameState==GameState.LineAnimating || gameState==GameState.NewGameAnimation || gameState==GameState.GameOverAnimation)
		{
			timeSinceAnimationStarted+=time;
			if(gameState==GameState.LineAnimating)
			{
				//clear lines and return to game
				updateLineClearAnimation();
				if(timeSinceAnimationStarted>=lineAnimDurration)
				{
					stopClearLineAnimation();
				}
			}
			else if(gameState==GameState.NewGameAnimation && timeSinceAnimationStarted>=newGameAnimDurration)
			{
				//clear lines and return to game
				gameStart();
			}
			else if(gameState==GameState.GameOverAnimation && timeSinceAnimationStarted>=gameOverAnimDurration)
			{
				stopGameOverAnimation();
			}
		}
	}
}

function drawInfo(context)
{
	var xPos = boardPos.X + boardWidth * blockSize + 15;
	var yPos = boardPos.Y + 25;
	var ySeperation = 25;
	context.font = '20pt Calibri';
	context.fillStyle = 'black';

	var line = 0;
	context.fillText("Score:"+score,                    xPos,yPos+ySeperation*line++);
	context.fillText("Level:"+level,                    xPos,yPos+ySeperation*line++);
	context.fillText("Lines:"+totalLinesCleared,        xPos,yPos+ySeperation*line++);
	context.fillText("Tetris:"+tetrises,                xPos,yPos+ySeperation*line++);
	context.fillText("Time:"+stopwatch.formattedTime(), xPos,yPos+ySeperation*line++);
	line++;
	line++;
	context.fillText("Controls:",                       xPos,yPos+ySeperation*line++);
	context.fillText("   New Game: F2",                 xPos,yPos+ySeperation*line++);
	context.fillText("   Move: Arrows",                 xPos,yPos+ySeperation*line++);
	context.fillText("   Rotate: Z, X",                 xPos,yPos+ySeperation*line++);
	context.fillText("   Drop: Space",                  xPos,yPos+ySeperation*line++);
	context.fillText("   Mute: M",                      xPos,yPos+ySeperation*line++);
	context.fillText("   Pause: Esc",                   xPos,yPos+ySeperation*line++);
	
	if(showDebugInfo)
	{
		line++;
		line++;
		context.fillText("FPS:"+lastIntervalFPS,            xPos,yPos+ySeperation*line++);
		//context.fillText("FPS:"+lastIntervalFPS+" - "+framesThisInterval,xPos,yPos+ySeperation*line++);
		context.fillText("State:"+gameState,                xPos,yPos+ySeperation*line++);
		context.fillText("Sound:"+musicState,               xPos,yPos+ySeperation*line++);
		context.fillText("Keys:"+keysPressed,               xPos,yPos+ySeperation*line++);
		context.fillText("Input:"+gameInput,                xPos,yPos+ySeperation*line++);
		context.fillText("Idle:"+idleAnimationState,        xPos,yPos+ySeperation*line++);
		context.fillText("  idles:"+idlePieces.length,      xPos,yPos+ySeperation*line++);
	}
}

function draw(time)
{
	var context = canvas.getContext("2d");
	context.clearRect (0,0,gameWidth,gameHeight);

	
	//canvas background
	context.fillStyle = "rgb(112, 146, 190)";
	context.fillRect(0,0,gameWidth,gameHeight);
	
	if(idleAnimationState!=IdleAnimationState.Stopped)//this block is kept seperate because the idle animation can run behind the others
	{
		drawIdleAnimation(time,context);
	}
	
	//render game
	//background
	context.shadowColor="black";
	context.shadowBlur=20;
	context.fillStyle="lightgray";
	context.fillRect (boardPos.X,boardPos.Y,boardWidth*blockSize,boardHeight*blockSize);
	context.shadowBlur=0;
	context.beginPath();
	context.strokeStyle="black";
	context.rect (boardPos.X,boardPos.Y,boardWidth*blockSize,boardHeight*blockSize);
	context.stroke();
	//context.drawImage(backgroundImage, boardPos.X,boardPos.Y);
	
	if(gameState==GameState.NewGameAnimation)
	{
		var blockNo = 0;
		var totalBlocks = boardWidth*boardHeight;
		var animationProgress = timeSinceAnimationStarted/newGameAnimDurration;
		for (var y = 0; y < boardHeight; y++)
		{
			for (var x = 0; x < boardWidth; x++)
			{
				var blockPos = getSlotPos(x,y);
				blockNo++;
				var img;
				if(blockNo/totalBlocks<animationProgress)
					img = getBlockImage(BoardSlot.Empty);
				else
					img = getBlockImage(BoardSlot.Block0);
				
				if(img!=null)
					context.drawImage(img, blockPos.X,blockPos.Y, blockSize, blockSize);
			}
		}
	}
	else if(gameState==GameState.GameOverAnimation || gameState==GameState.GameOver)
	{
		var blockNo = 0;
		var totalBlocks = boardWidth*boardHeight;
		var animationProgress = timeSinceAnimationStarted/gameOverAnimDurration;
		for (var y = boardHeight-1; y >= 0; y--)
		{
			for (var x = boardWidth-1; x >= 0; x--)
			{
				var blockPos = getSlotPos(x,y);
				blockNo++;
				if(blockNo/totalBlocks<animationProgress)
					boardSlots[x][y] = BoardSlot.Block0;
				var img = getBlockImage(boardSlots[x][y]);
				if(img!=null)
					context.drawImage(getBlockImage(boardSlots[x][y]), blockPos.X,blockPos.Y, blockSize, blockSize);
			}
		}
		if(gameState==GameState.GameOver)
			drawBigCenterString(45,"Game Over", context);
	}
	else if(gameState==GameState.Playing || gameState==GameState.LineAnimating)
	{
		drawBoard(context);
		
		if(!gamePaused)
		{
			drawNextPiece(context);
			if(gameState==GameState.Playing || gameState==GameState.GameOver || gameState==GameState.GameOverAnimation)
				drawActivePiece(context);
		}
		
		if(gamePaused)
			drawBigCenterString(72,"Paused", context);
	}
	
	drawInfo(context);
}

function drawIdleAnimation(time, context)
{
	//spawn
	if(idleAnimationState==IdleAnimationState.Running)
	{
		idleTimeSinceSpawn+=time;
		if(idleTimeSinceSpawn>=idleSpawnRate)
		{
			idleTimeSinceSpawn = 0;
			//spawn random background piece
			var x = Math.floor(Math.random()*(gameWidth/blockSize))*blockSize-blockSize
			var rndType = Math.floor(Math.random()*7)+1;
			var blocks = getBlocksForPiece(rndType);
			
			var turns = Math.floor(Math.random()*4);
			for (i = 0; i < turns; i++)
			{
				blocks = rotatePieceSimple(blocks);
			}
			
			idlePieces.push(rndType);
			idlePieceBlocks.push(blocks);
			idlePiecePos.push(new Point(x,-blockSize*4+idleDropStartY));
		}
	}
	//drop
	var dropRate = idleDropRate;
	if(idleAnimationState==IdleAnimationState.Stopping)
		dropRate = idleStoppingDropRate;
	idleTimeSinceDrop+=time;
	if(idleTimeSinceDrop>=dropRate)
	{
		idleTimeSinceDrop = 0;
		idleDropStartY += idleDropSpeed;//this should be a rolling start value so all pieces line up on a rolling grid
		idleDropStartY %= blockSize;
		var minY = gameHeight;
		for (i = 0; i < idlePieces.length; i++)
		{
			idlePiecePos[i].Y += idleDropSpeed;
			if(idlePiecePos[i].Y > gameHeight+blockSize*2)
			{
				//trim this idle piece since its off the screen
				idlePieces.splice(i,1);
				idlePieceBlocks.splice(i,1);
				idlePiecePos.splice(i,1);
				i--;
			}
		}
	}
	//turn random piece
	idleTimeSinceRotate+=time;
	if(idleTimeSinceRotate>=idleRotateRate)
	{
		idleTimeSinceRotate = 0;
		var i = Math.floor(Math.random()*idlePieces.length);
		if(idlePieces[i]!=7)//dont roate squares
			idlePieceBlocks[i] = rotatePieceSimple(idlePieceBlocks[i]);
	}
	//render
	for (i = 0; i < idlePieces.length; i++)
	{
		for (k = 0; k < idlePieceBlocks[i].length; k++)
		{
			var x = idlePiecePos[i].X + idlePieceBlocks[i][k].X * blockSize;
			var y = idlePiecePos[i].Y + idlePieceBlocks[i][k].Y * blockSize;
			context.drawImage(getBlockImage(idlePieces[i]), x, y, blockSize, blockSize);
		}
	}
	//check if clear
	if(idleAnimationState==IdleAnimationState.Stopping)
	{
		//check to stop
		if(idlePieces.length==0)
		{
			idleAnimationState = IdleAnimationState.Stopped;
		}
	}
}

function drawBigCenterString(size, text, context)
{
	//based on center of 10x20 grid so offset if different
	var loc = new Point(boardPos.X + ((boardWidth-10)*blockSize)/2,boardPos.Y+boardHeight*blockSize/2+size/2)
	context.save();
	context.font=size+"px verdana";
	context.shadowColor="black";
	context.strokeStyle="black";
	context.shadowBlur=7;
	context.lineWidth=5;
	context.strokeText(text,loc.X,loc.Y);
	context.shadowBlur=0;
	context.fillStyle="white";
	context.fillText(text,loc.X,loc.Y);
	context.restore();
}

function drawActivePiece(context)
{
	for(var i=0; i<4; i++)
	{
		var pos = getSlotPos(pieceSlot.X+pieceBlocks[i].X,pieceSlot.Y+pieceBlocks[i].Y);
		context.drawImage(getBlockImage(pieceSlotType), pos.X,pos.Y, blockSize, blockSize);
	}
}

function drawNextPiece(context)
{
	var xShift = 0;
	var yShift = 0;
	if(nextPieceSlotType==BoardSlot.Block5 || nextPieceSlotType==BoardSlot.Block6 || nextPieceSlotType==BoardSlot.Block7)
	{//shfit z and square blocks down one
		yShift=1;
	}
	if(nextPieceSlotType==BoardSlot.Block7)
	{//shift square 1 to right
		xShift=1;
	}
	for(var i=0; i<4; i++)
	{
		var renderPreviewSlot = new Point(3+xShift,-4+yShift);
		var pos = getSlotPos(renderPreviewSlot.X+nextPieceBlocks[i].X,renderPreviewSlot.Y+nextPieceBlocks[i].Y);
		context.drawImage(getBlockImage(nextPieceSlotType), pos.X,pos.Y, blockSize,blockSize);
	}
}

function drawBoard(context)
{
	for (var x = 0; x < boardWidth; x++)
	{
		for (var y = 0; y < boardHeight; y++)
		{
			var blockPos = getSlotPos(x,y);
			var img = getBlockImage(boardSlots[x][y]);
			if(img!=null)
				context.drawImage(getBlockImage(boardSlots[x][y]), blockPos.X,blockPos.Y, blockSize, blockSize);
		}
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
	if(slot==BoardSlot.Block0)return block0Image;
	return null;
}

function getSlotPos(slotX, slotY)
{
	return new Point(slotX*blockSize + boardPos.X, slotY*blockSize + boardPos.Y);
}