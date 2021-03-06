GameState = {
    Menu : 'Menu',
    IdleAnimation : 'IdleAnimation',
    Playing : 'Playing',
    LineAnimating : 'LineAnimating',
    TetrisAnimating : 'TetrisAnimating',
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
var showDebugInfo = false;

var musicState = MusicState.Music;
var backgroundMusic;
var pieceSnapSound;
var pieceDropSound;
var pieceRotateSound;
var lineClearSound;
var levelUpSound;
var tetrisSound;

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
var tetrisAnimDurration = 1000;
var tetrisAnimBlocks = [];
var tetrisAnimPos = [];
var tetrisAnimStart = [];
var tetrisAnimVector = [];
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
var boardPos = new Point(52,100);
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
var scoresURL = 'http://freshprogramming.com/miniTools/jsTetris/tetrisScores.php';
var highScores = [];
var highScoresPos = 0;
var maxScoresOnScreen = 21;//+1 for 10 + "more" line

function gameBootstrap()
{	
	LoadScores();

	canvas = document.getElementById(canvasID);
	gameWidth = canvas.width;
	gameHeight = canvas.height;
	
	loadAssets();
	
	canvas.addEventListener('mousemove', function(evt) {mouseMove(evt);}, false);
	canvas.addEventListener('mousedown', function(evt) {mouseDown(evt);}, false);
	canvas.addEventListener('mouseup',   function(evt) {mouseUp(evt);}, false);
	document.addEventListener('keydown', function(evt) {keyDown(evt);}, false);
	document.addEventListener('keyup',   function(evt) {keyUp(evt);}, false);
	document.addEventListener('wheel',   function(evt) {mouseWheel(evt);}, false);
	
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

function LoadScores()
{
	var xhr = new XMLHttpRequest();
	xhr.open('GET', scoresURL, true);
	xhr.onreadystatechange = function()
	{
		var scoresData = "";
		if (xhr.readyState === 4)
			scoresData = xhr.responseText;
		
		if(scoresData=="")
		{//test data
			scoresData = `
tester,1500,25,3,"05:30",67.208.46.84,2016-10-29 00:00:01
tester,1200,25,2,"05:30",67.208.46.84,2016-11-01 00:00:02
tester,1500,25,3,"05:30",67.208.46.84,2016-11-02 00:00:03
tester,500 ,25,1,"05:30",67.208.46.84,2016-11-03 00:00:04
tester,5500,25,1,"05:30",67.208.46.84,2016-11-03 00:00:05
tester,10  ,25,1,"05:30",67.208.46.84,2016-11-03 00:00:06
tester,11  ,25,1,"05:30",67.208.46.84,2016-11-03 00:00:07
tester,20  ,25,1,"05:30",67.208.46.84,2016-11-03 00:00:08
tester,22  ,25,1,"05:30",67.208.46.84,2016-11-03 00:00:09
tester,21  ,25,1,"05:30",67.208.46.84,2016-11-03 00:00:10
tester,5   ,25,3,"05:30",67.208.46.84,2016-11-04 00:00:20
tester,4   ,25,3,"05:30",67.208.46.84,2016-11-04 00:00:00
tester,3   ,25,3,"05:30",67.208.46.84,2016-11-04 00:00:00
tester,2   ,25,3,"05:30",67.208.46.84,2016-11-04 00:00:00
tester,1   ,25,3,"05:30",67.208.46.84,2016-11-04 00:00:00
tester,0   ,25,3,"05:30",67.208.46.84,2016-11-04 00:00:00`;
		}
		
		highScores = [];
		scoresData = scoresData.trim();
		var scores = scoresData.split("\n")
		
		for (var i = 0; i < scores.length; i++)
		{
			var fields = scores[i].trim().split(",");
			var k = 0;
			var name   = fields[k++];
			var score  = +fields[k++];
			var lines  = +fields[k++];
			var tetris = +fields[k++];
			var time   = fields[k++];
			var ip     = fields[k++];
			var stamp  = fields[k++];
			
			var s = new TetrisScore(name,score,lines,tetris,time,ip,stamp);
			highScores.push(s);
			//console.log(s.toString());
		}
		highScores = SortHighScores(highScores);
	};
	xhr.send(null);
}

function UploadHighScore()
{
	var player = prompt("Please enter your name to save your score", "player 1");
	if(player!=null && player.length>0)
	{
		var scoreData = "?name="+player+"&score="+score+"&lines="+totalLinesCleared+"&tetris="+tetrises+"&time="+stopwatch.formattedTime();
		var xhr = new XMLHttpRequest();
		xhr.open('GET', scoresURL+scoreData, true);
		xhr.onreadystatechange = function()
		{
			LoadScores();
		};
		xhr.send(null);
	}
}

function SortHighScores(highScores)
{//sort desc
	var sortedScores = [];
	for (var i = 0; i < highScores.length; i++)
	{
		var added = false;
		for (var k = 0; k < sortedScores.length; k++)
		{
			if(sortedScores[k].Score < highScores[i].Score)
			{
				added = true;
				sortedScores.splice(k, 0, highScores[i]);
				break;
			}
		}
		if(!added)
		{
			sortedScores.push(highScores[i]);
		}
	}
	return sortedScores;
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
	pieceRotateSound = new Audio('assets/audio/rotate_block.wav');
	pieceRotateSound.volume = 0.6;
	pieceSnapSound = new Audio('assets/audio/block_hits_bottom.wav');
	pieceDropSound = new Audio('assets/audio/block_drop.wav');
	pieceDropSound.playbackRate = 2.0;
	pieceDropSound.volume = 0.4;
	lineClearSound = new Audio('assets/audio/clear_one_line.wav');
	lineClearSound.volume = 0.5;
	tetrisSound = new Audio('assets/audio/moneySound.wav');//too quiet already
	levelUpSound = new Audio('assets/audio/Tetris11LEVELUP.ogg');
	levelUpSound.volume = 0.5;
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

function mouseWheel(event)
{
	if(event.wheelDelta<0)
		scrollHighScores(1);
	else if(event.wheelDelta>0)
		scrollHighScores(-1);
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
	
	if(currentGameInput.DownPressed && !gameInput.DownPressed)   gameInput.DownUnHandled = true;
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
	else if(gameState==GameState.GameOver)
	{
		gameState=GameState.Menu;//maybe make this an animation
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
	gameInput.clearKeys();
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
	
	var rotated = true;
	if(!movePiece(xShift,yShift))
	{
		rotated = false;
		rotatePiece(!clockwise);
	}
	return rotated;
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
	snapPiece(true);
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

function snapPiece(dropped)
{
	lockInPiece();
	if(dropped)
		playPieceDropSound();
		else
		playPieceSnapSound();
	scorePiecePlacement();
	var linesCleared = checkAndClearLines();
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
		runClearLineAnimation(linesCleared);
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
			tetrisSound.play();
	}
	else
	{
		if(musicState!=MusicState.Mute)
			lineClearSound.play();
	}
}

function playPieceDropSound()
{
	if(musicState!=MusicState.Mute)
		pieceDropSound.play();
}

function playPieceSnapSound()
{
	if(musicState!=MusicState.Mute)
		pieceSnapSound.play();
}

function playLevelUpSound()
{
	if(musicState!=MusicState.Mute)
		levelUpSound.play();
}

function playRotateSound()
{
	if(musicState!=MusicState.Mute)
	{
		pieceRotateSound.currentTime = 0;
		pieceRotateSound.play();
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
			snapPiece(false);
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
	UploadHighScore();
}

function runClearLineAnimation(lines)
{
	if(lines>=4)
	{
		gameState=GameState.TetrisAnimating;
		//define variables for animation
		tetrisAnimBlocks = [];
		tetrisAnimPos = [];
		tetrisAnimStart = [];
		tetrisAnimVector = [];
		for (lineY = 0; lineY < linesToClear.length; lineY++)
		{
			for (var x = 0; x < boardWidth; x++)
			{
				tetrisAnimBlocks.push(boardSlots[x][linesToClear[lineY]]);
				tetrisAnimPos.push(getSlotPos(x,linesToClear[lineY]));
				tetrisAnimStart.push(getSlotPos(x,linesToClear[lineY]));
				tetrisAnimVector.push(new Point((Math.random()*1200)-600,Math.random()*600+200));
			}
		}
		//clear lines
		for (i = 0; i < linesToClear.length; i++)
		{
			setLineSlot(linesToClear[i],BoardSlot.Empty);
		}
	}
	else
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

function updateTetrisAnimation()
{
	var animationProgress = (timeSinceAnimationStarted*1.2)/tetrisAnimDurration;//go 20% past bottom
	for (i = 0; i < tetrisAnimBlocks.length; i++)
	{
		tetrisAnimPos[i].X = tetrisAnimVector[i].X*animationProgress;
		tetrisAnimPos[i].Y = -1*tetrisAnimVector[i].Y*Math.sin((tetrisAnimPos[i].X*Math.PI) / tetrisAnimVector[i].X);
		tetrisAnimPos[i].X += tetrisAnimStart[i].X;
		tetrisAnimPos[i].Y += tetrisAnimStart[i].Y;
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
					gameInput.DownPressed = false;
					if(!movePiece(0,1))
						snapPiece(false);
				}
				if(gameInput.LeftUnHandled)
					movePiece(-1,0);
				if(gameInput.RightUnHandled)
					movePiece(1,0);
				if(gameInput.RotRightUnHandled)
				{
					if(rotatePiece(false))
						playRotateSound();
				}
				if(gameInput.RotLeftUnHandled)
				{
					if(rotatePiece(true))
						playRotateSound();
				}
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
		else if(gameState==GameState.LineAnimating || gameState==GameState.TetrisAnimating || gameState==GameState.NewGameAnimation || gameState==GameState.GameOverAnimation)
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
			else if(gameState==GameState.TetrisAnimating)
			{
				//clear lines and return to game
				updateTetrisAnimation();
				if(timeSinceAnimationStarted>=tetrisAnimDurration)
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
	if(gameState==GameState.Menu || gameState==GameState.GameOver || gamePaused)
	{
		if(gameInput.LeftUnHandled)
		{
			scrollHighScores(-2);
		}
		if(gameInput.RightUnHandled)
		{
			scrollHighScores(2);
		}
		gameInput.handledInput();
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
		context.fillText("FPS:"+lastIntervalFPS,                       xPos,yPos+ySeperation*line++);
		//context.fillText("FPS:"+lastIntervalFPS+" - "+framesThisInterval,xPos,yPos+ySeperation*line++);
		context.fillText("State:"+gameState+(gamePaused?"-Paused":""), xPos,yPos+ySeperation*line++);
		context.fillText("Sound:"+musicState,                          xPos,yPos+ySeperation*line++);
		context.fillText("Keys:"+keysPressed,                          xPos,yPos+ySeperation*line++);
		context.fillText("Input:"+gameInput,                           xPos,yPos+ySeperation*line++);
		context.fillText("Idle:"+idleAnimationState,                   xPos,yPos+ySeperation*line++);
		context.fillText("  idles:"+idlePieces.length,                 xPos,yPos+ySeperation*line++);
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
	else if(gameState==GameState.Playing || gameState==GameState.LineAnimating || gameState==GameState.TetrisAnimating)
	{
		drawBoard(context);
		
		if(!gamePaused)
		{
			drawNextPiece(context);
			if(gameState==GameState.Playing || gameState==GameState.GameOver || gameState==GameState.GameOverAnimation)
				drawActivePiece(context);
		}
		
		if(gameState==GameState.TetrisAnimating)
		{
			//draw blocks
			for (i = 0; i < tetrisAnimBlocks.length; i++)
			{
				tetrisAnimPos[i]
				var img = getBlockImage(tetrisAnimBlocks[i]);
				if(img!=null)
					context.drawImage(img, tetrisAnimPos[i].X,tetrisAnimPos[i].Y, blockSize, blockSize);
			}
		}
		
		if(gamePaused)
			drawBigCenterString(72,"Paused", context);
	}
	
	drawInfo(context);
	drawHighScores(context);
}

function scrollHighScores(shift)
{
	var maxPos = highScores.length-maxScoresOnScreen+1;
	highScoresPos += shift;
	if(highScoresPos > maxPos)
		highScoresPos = maxPos;
	if(highScoresPos < 0)
		highScoresPos = 0;
}

function drawHighScores(context)
{
	var xPos = boardPos.X + boardWidth * blockSize + 220;
	var yPos = boardPos.Y + 25;
	var ySeperation = 25;
	context.font = '20pt Calibri';
	context.fillStyle = 'black';
	
	var maxPos = highScores.length-maxScoresOnScreen+1;
	var lineNo = 0;
	var scoresOnScreen = 0;
	context.fillText("HighScores", xPos, yPos);
	if(highScoresPos>0)
		context.fillText("  ↑ More ↑", xPos, yPos+ySeperation*(++lineNo));
	for (var i = highScoresPos; i < highScores.length; i++)
	{
		context.fillText("#"+(i+1)+":"+highScores[i].Name+" - "+highScores[i].Score, xPos, yPos+ySeperation*(++lineNo));//the y (i+1) is for header line above
		scoresOnScreen++;
		if(scoresOnScreen>=maxScoresOnScreen-(highScoresPos>0)-(highScoresPos<maxPos))
			break;
	}
	if(highScoresPos<maxPos)
		context.fillText("  ↓ More ↓", xPos, yPos+ySeperation*(++lineNo));
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
				context.drawImage(img, blockPos.X,blockPos.Y, blockSize, blockSize);
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
//TetrisScore
function TetrisScore(n,s,l,t,time,ip,stamp)
{
	this.Name   = n;
	this.Score  = s;
	this.Lines  = l;
	this.Tetris = t;
	this.Time   = time;
	this.IP     = ip;
	this.Stamp  = stamp;
}
TetrisScore.prototype.toString=function()
{
	return '[TetrisScore('+this.Name+'-'+this.Score+')]';
};