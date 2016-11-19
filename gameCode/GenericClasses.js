//functions
function Create2DArray(rows) 
{
	var arr = [];

	for (var i=0;i<rows;i++)
	{
		arr[i] = [];
	}

	return arr;
}
function getMousePos(canvas, evt) 
{
	var rect = canvas.getBoundingClientRect();
	return {
		X: evt.clientX - rect.left,
		Y: evt.clientY - rect.top
	};
}
function pad(num, size) 
{
	var s = "0000" + num;
	return s.substr(s.length - size);
}
//classes
//Point
function Point(x, y) {
    this.X = x;
    this.Y = y;
}
Point.prototype.toString=function()
{
	return '[Point('+this.X+','+this.Y+')]';
};
//GameInput
function GameInput()
{
	this.reset();
}
GameInput.prototype.reset=function()
{
	this.clearKeys();
};
GameInput.prototype.clearKeys=function()
{
	this.DownPressed = false;
	this.LeftPressed = false;
	this.RightPressed = false;
	this.PausePressed = false;
	this.SoundKeyPressed = false;
	this.RotLeftPressed = false;
	this.RotRightPressed = false;
	this.DropPressed = false;
	this.NewGamePressed = false;
	
	this.DownUnHandled = false;
	this.LeftUnHandled = false;
	this.RightUnHandled = false;
	this.PauseUnHandled = false;
	this.SoundKeyUnHandled = false;
	this.RotLeftUnHandled = false;
	this.RotRightUnHandled = false;
	this.DropUnHandled = false;
	this.NewGameUnHandled = false;
};
GameInput.prototype.handledInput=function()
{
	this.DownUnHandled = false;
	this.LeftUnHandled = false;
	this.RightUnHandled = false;
	this.PauseUnHandled = false;
	this.SoundKeyUnHandled = false;
	this.RotLeftUnHandled = false;
	this.RotRightUnHandled = false;
	this.DropUnHandled = false;
	this.NewGameUnHandled = false;
};
GameInput.prototype.updatePressed=function(otherInput)
{
	this.DownPressed = otherInput.DownPressed;
	this.LeftPressed = otherInput.LeftPressed;
	this.RightPressed = otherInput.RightPressed;
	this.PausePressed = otherInput.PausePressed;
	this.SoundKeyPressed = otherInput.SoundKeyPressed;
	this.RotLeftPressed = otherInput.RotLeftPressed;
	this.RotRightPressed = otherInput.RotRightPressed;
	this.DropPressed = otherInput.DropPressed;
	this.NewGamePressed = otherInput.NewGamePressed;;
};
GameInput.prototype.toString=function()
{
	var result = "";
	if(this.DownPressed) result+="Down,";
	if(this.LeftPressed) result+="Left,";
	if(this.RightPressed)result+="Right,";
	if(this.PausePressed)result+="Pause,";
	if(this.SoundKeyPressed)result+="Sound,";
	if(this.RotLeftPressed)result+="RotL,";
	if(this.RotRightPressed)result+="RotR,";
	if(this.DropPressed)result+="Drop,";
	if(this.NewGamePressed)result+="NwGm,";
	
	return result;
};
//Stopwatch
var	Stopwatch = function()
{
	// Private vars
	var	startAt	= 0;	// Time of last start / resume. (0 if not running)
	var	lapTime	= 0;	// Time on the clock when last stopped in milliseconds

	var	now	= function()
	{
		return (new Date()).getTime();
	};

	// Public methods
	// Start or resume
	this.start = function()
	{
		startAt	= startAt ? startAt : now();
	};

	// Stop or pause
	this.stop = function()
	{
		// If running, update elapsed time otherwise keep it
		lapTime	= startAt ? lapTime + now() - startAt : lapTime;
		startAt	= 0; // Paused
	};

	// Reset
	this.reset = function()
	{
		lapTime = startAt = 0;
	};

	// Duration - total ms
	this.time = function()
	{
		return lapTime + (startAt ? now() - startAt : 0);
	};

	// formatted time
	this.formattedTime = function()
	{
		return this.formatTime(this.time());
	};

	this.formatTime = function(time)
	{
		var h = m = s = ms = 0;
		var newTime = '';

		h = Math.floor( time / (60 * 60 * 1000) );
		time = time % (60 * 60 * 1000);
		m = Math.floor( time / (60 * 1000) );
		time = time % (60 * 1000);
		s = Math.floor( time / 1000 );
		ms = time % 1000;

		//newTime = pad(h, 2) + ':' + pad(m, 2) + ':' + pad(s, 2) + ':' + pad(ms, 3);
		
		m += h*60;
		newTime = pad(m, 2) + ':' + pad(s, 2);
		return newTime;
	}
};