<?php
	//globals
	$scoresFile = "scores.txt";

	Main();
	
	function Main()
	{
		HandleInput();
		
		BuildPage();
	}
	
	function HandleInput()
	{//assume this data is good
		$name = GetInput("name");
		$score = GetInput("score");
		$lines = GetInput("lines");
		$tetris = GetInput("tetris");
		$time = GetInput("time");
		
		//screw you if yotu put a special char in your name
		$name = str_replace(",",";",$name);
		$name = str_replace("\n"," ",$name);
		
		$valid = strlen($name)>0;
		$valid = $valid&&strlen($score)>0;
		$valid = $valid&&strlen($lines)>0;
		$valid = $valid&&strlen($tetris)>0;
		$valid = $valid&&strlen($time)>0;
		
		if($valid)
		{
			$ip = $_SERVER['REMOTE_ADDR'];
				
			$date = new DateTime();
			$stamp = date( "Y-m-d H:i:s");
			
			$scoreString = $name.",".$score.",".$lines.",".$tetris.",".$time.",".$ip.",".$stamp;
			AppendScore($scoreString);
		}
	}
	
	function BuildPage()
	{
		global $scoresFile;

		$data = '';
		if (file_exists($scoresFile)) {
			$data = file_get_contents($scoresFile);
		}
		
		echo $data;
	}
	
	function AppendScore($newScore)
	{
		$scores = ReadScores();
		$scores[]=$newScore;
		
		WriteScores($scores);
	}
	
	function ReadScores()
	{
		global $scoresFile;

		$data = '';
		if (file_exists($scoresFile)) {
			$data = file_get_contents($scoresFile);
		} else {
			file_put_contents($scoresFile, $data);
		}

		$scores = explode("\n", $data);
		return $scores;
	}
	
	function WriteScores($scores)
	{
        global $scoresFile;
		
		$data = implode("\n", $scores);
	    file_put_contents($scoresFile, $data);
	}
	
	function GetInput($name)
	{
		if(isset($_POST[$name]))
		{
			$input = $_POST[$name];
		}
		else if(isset($_GET[$name]))
		{
			$input = $_GET[$name];
		}
		else
		{
			$input = "";
		}
		return trim($input);
	}
?>