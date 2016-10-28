//scene and graphics 
var canvasID = "myCanvas";
var canvas;
var rootTimerObject;
var mousePos = new Point(0,0);
var tickDelay = 4;
var lastTickTime = 0;
var gameWidth;
var gameHeight;

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
var maxPieceDropTime = 500;
var pieceDropTime = maxPieceDropTime;
var timeSinceLastStep = 0;

//game variables

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
	gameInput.clearKeys();
	for	(index = 0; index < keysPressed.length; index++) 
	{   
		if(48==keysPressed[index])
		{//0 key - toggle collision visibility
			var index2 =oneTimeKeysActive.indexOf(keysPressed[index]);
			if (index2 <=-1) 
			{
				collisionSystemRendered = !collisionSystemRendered;
				oneTimeKeysActive.push(keysPressed[index]);
			}
		}
		else if(keysPressed[index]==87 || keysPressed[index]==38)//w and up
			gameInput.UpPressed = true;
		else if(keysPressed[index]==83 || keysPressed[index]==40)//s and down
			gameInput.DownPressed = true;
		else if(keysPressed[index]==68 || keysPressed[index]==39)//d and right
			gameInput.RightPressed = true;
		else if(keysPressed[index]==65 || keysPressed[index]==37)//a and left
			gameInput.LeftPressed = true;
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

var blockSize = 26;
var boardWidth = 10;
var boardHeight = 20;
var boardPos = new Point(200,100);
var mousePos = new Point(0,0);
var pieceSlot = new Point(0,0);

function update(time)
{
	processInput(time);
	
	//update game
	timeSinceLastStep+=time;
	if(timeSinceLastStep>=pieceDropTime)
	{
		timeSinceLastStep = 0;
		if(pieceSlot.Y<boardHeight-1)
			pieceSlot.Y +=1;
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
}

function draw(time)
{
	var context = canvas.getContext("2d");
	
	context.clearRect (0,0,gameWidth,gameHeight);

	renderDemo(context);
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