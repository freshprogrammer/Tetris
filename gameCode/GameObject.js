function GameObject()
{
	this.X = 0;
	this.Y = 0;
	this.Width = 0;
	this.Height = 0;
	this.VectorX = 0;
	this.VectorY = 0;
	this.FixedLocation = true;
}

GameObject.prototype.update=function(time)
{
	
};

GameObject.prototype.move=function(dx, dy)
{
	this.X+=dx;
	this.Y+=dy;
	this.FacingDir.X = dx;
	this.FacingDir.Y = dy;
	this.VectorX = dx;
	this.VectorY = dy;
};

GameObject.prototype.moveToDelta=function(dx, dy)
{
	this.X+=dx;
	this.Y+=dy;
};

GameObject.prototype.toString=function()
{
	return '[GameObject at ('+this.X+','+this.Y+')]';
};
