GameState = {
    Menu : 1,
    Playing : 2,
    Animating : 3
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

var soundEnabled = false;

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
var pieceDropTime = minPieceDropTime;
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
var mousePos = new Point(0,0);
var pieceSlot = new Point(0,0);

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
	blockImage = new Image();
	blockImage.src = 'assets/pics/block1.jpg';
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
	}
	
	if(currentGameInput.DownPressed && !gameInput.DownPressed)   gameInput.DownUnHandled = true;
	if(currentGameInput.LeftPressed && !gameInput.LeftPressed)   gameInput.LeftUnHandled = true;
	if(currentGameInput.RightPressed && !gameInput.RightPressed) gameInput.RightUnHandled = true;
	if(currentGameInput.PausePressed && !gameInput.PausePressed) gameInput.PauseUnHandled = true;
	
	if(gameInput.PauseUnHandled)
	{
		gamePaused = !gamePaused;
		gameInput.PauseUnHandled = false;
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
	gameState = GameState.Playing;
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

function movePiece(dX,dY)
{
	var newX = pieceSlot.X-dX;
	var newY = pieceSlot.Y-dY;
	
	if(newX>=0 && newX<boardWidth)
		pieceSlot.X = newX;
	if(newY>=0 && newY<boardHeight)
		pieceSlot.Y = newY;
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
					movePiece(0,-1);
				if(gameInput.LeftUnHandled)
					movePiece(1,0);
				if(gameInput.RightUnHandled)
					movePiece(-1,0);
				
				gameInput.handledInput();
			}
			
			//step Piece
			timeSinceLastStep+=time;
			if(timeSinceLastStep>=pieceDropTime)
			{
				timeSinceLastStep = 0;
				if(pieceSlot.Y<boardHeight-1)
				{
					movePiece(0,-1);
				}
				else
				{
					//snap to slot
					if(soundEnabled)
						playBeepData();
					pieceSlot.X++;
					pieceSlot.Y=0;
				}
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
	
	var piecePos = getSlotPos(pieceSlot.X,pieceSlot.Y);
	context.drawImage(blockImage, piecePos.X,piecePos.Y);
}

function getSlotPos(slotX, slotY)
{
	return new Point(slotX*blockSize + boardPos.X, slotY*blockSize + boardPos.Y);
}