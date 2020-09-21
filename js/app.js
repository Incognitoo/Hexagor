// #######
// Const
// #########

const TYPE_CAMP = 'camp';
const TYPE_EMPTY = 'empty';
const TYPE_FOREST = 'forest';
const TYPE_HEADQUARTER = 'headquarter';
const TYPE_MOUNTAIN = 'mountain';
const TYPE_TOWER = 'tower';
const TYPE_WATER = 'water';

const PLAYER_COLORS = [
	'#55efc4', // Green
	'#ffeaa7', // Yellow
	'#fab1a0', // Red
	'#0984e3', // Blue
	'#a29bfe', // Purple'
	'#fd79a8' // Pink
];

// #########
// Classes
// #########

class Hex {
	constructor(q, r) {
		this.q = q;
		this.r = r;
	}
}
class Point {
	constructor(x, y) {
		this.x = x;
		this.y = y;
	}
}
class Cube {
	constructor(x, y, z) {
		this.x = x;
		this.y = y;
		this.z = z;
	}
}
class Player {
	constructor(id, name)
	{
		this.id = id;
		this.name = name;
		this.color = PLAYER_COLORS[mt_rand(0, PLAYER_COLORS.length-1)];
		this.score = 0;
		this.money = 0;
		this.capturing = null;
		this.capturingDelay = null;
	}
}
class GridCell
{
	constructor(point, type, player = null)
	{
		this.point = point;
		this.type = type;
		this.player = player;
		this.deg = 0;
		this.capturing = false;
	}
}

// #########
// Utils
// #########

function mt_rand(min, max)
{
	var argc = arguments.length
	if (argc === 0) {
		min = 0
		max = 2147483647
	} else if (argc === 1) {
		throw new Error('Warning: mt_rand() expects exactly 2 parameters, 1 given')
	} else {
		min = parseInt(min, 10)
		max = parseInt(max, 10)
	}
	return Math.floor(Math.random() * (max - min + 1)) + min
}

function LighenDarkenColor(col, amt)
{
	var usePound = false;
	if (col[0] == "#") {
		col = col.slice(1);
		usePound = true;
	}
	var num = parseInt(col,16);
	var r = (num >> 16) + amt;
	if (r > 255) r = 255;
	else if  (r < 0) r = 0;
	var b = ((num >> 8) & 0x00FF) + amt;
	if (b > 255) b = 255;
	else if  (b < 0) b = 0;
	var g = (num & 0x0000FF) + amt;
	if (g > 255) g = 255;
	else if (g < 0) g = 0;
	return (usePound?"#":"") + (g | (b << 8) | (r << 16)).toString(16);
}

// ######
// Hexagon Utils
// #######

// return a point of an hexagon by coord, size and i (0-5)
function getHexPoint(coord, size, i = 0)
{
	var angle_deg = 60 * i - 30;
	var angle_rad = Math.PI / 180 * angle_deg;
	return new Point(coord.x + size * Math.cos(angle_rad),
			 coord.y + size * Math.sin(angle_rad));
}

// return 6 points of an hexagon by coord and size
function getHexPoints(coord, size)
{
	var points = [];
	for(var i = 0; i < 6; i++) {
		points.push(getHexPoint(coord, size, i));
	}
	return points;
}

function getHexHeightFromSize(size)
{
	var points = getHexPoints(new Point(100, 100), size);
	return points[2].y - points[5].y;
}

function getHexWidthFromSize(size)
{
	var points = getHexPoints(new Point(100, 100), size);
	return points[0].x - points[4].x;
}

// Calcul the hexagon size by init size and borderSize
function calculHexSize(size, borderSize)
{
	if(borderSize > 0) size = size - borderSize + 1;
	return size;
}

function pointToGrid(point, size)
{
	var x = (Math.sqrt(3)/3 * point.x - 1./3 * point.y) / size;
	var y = (2./3 * point.y) / size;
	return cube_to_axial(cube_round(axial_to_cube(new Point(x, y))));
}

function axial_to_cube(point)
{
	var x = point.x;
	var z = point.y;
	var y = -x-z;
	return new Cube(x, y, z);
}

function cube_round(cube)
{
	var rx = Math.round(cube.x);
	var ry = Math.round(cube.y);
	var rz = Math.round(cube.z);
	var x_diff = Math.abs(rx - cube.x);
	var y_diff = Math.abs(ry - cube.y);
	var z_diff = Math.abs(rz - cube.z);
	if( x_diff > y_diff && x_diff > z_diff) {
		rx = -ry-rz;
	} else if( y_diff > z_diff) {
		ry = -rx-rz;
	} else {
		rz  = -rx-ry;
	}
	return new Cube(rx, ry, rz);
}

function cube_to_axial(cube)
{
	var x = cube.x;
	var y = cube.z;
	return new Point(x, y);
}

// ## GRID ##
function generateEmptyGrid(size = 7)
{
	var grid = new Array(size);
	for(var x = 0; x < size; x++) {
		grid[x] = new Array(size);
		for(var y = 0; y < size; y++) {
			grid[x][y] = new GridCell(new Point(x, y), 'empty');
			for(var i = 0; i < size; i++) {
				if(i < size / 2) {
					if( (x == i && (y+1) < size / 2 - i) || (y == i && (x+1) < size / 2 - i) ) {
						grid[x][y] = null;
					}
				} else {
					if( (x == i && y > size / 2 + (size - i - 1)) || (y == i && x > size / 2 + (size - i - 1)) ) {
						grid[x][y] = null;
					}
				}
			}
		}
	}
	return grid;
}

function generateGrid(size = 7)
{
	var grid = new Array(size);
	for(var x = 0; x < size; x++) {
		grid[x] = new Array(size);
		for(var y = 0; y < size; y++) {
			let chance = Math.random() * 100;
			let type = TYPE_EMPTY;
			if(chance < 15) {
				type = TYPE_WATER;
			} else if(chance > 90) {
				type = TYPE_MOUNTAIN;
			}
			grid[x][y] = new GridCell(new Point(x, y), type);
			for(var i = 0; i < size; i++) {
				if(i < size / 2) {
					if( (x == i && (y+1) < size / 2 - i) || (y == i && (x+1) < size / 2 - i) ) {
						grid[x][y] = null;
					}
				} else {
					if( (x == i && y > size / 2 + (size - i - 1)) || (y == i && x > size / 2 + (size - i - 1)) ) {
						grid[x][y] = null;
					}
				}
			}
		}
	}
	return grid;
}

function randomForest(max = 10)
{
	// We count the number of existing forest, to know how many to add
	var forest = 0;
	for(var x = 0; x < grid.length; x++) {
		for(var y = 0; y < grid[x].length; y++) {
			if(grid[x][y] != null && grid[x][y].type == TYPE_FOREST) {
				forest++;
			}
		}
	}

	while(forest < max) {
		let positionFound = false;
		while(!positionFound) {
			var posX = mt_rand(0, grid.length-1);
			var posY = mt_rand(0, grid[0].length-1);
			if(grid[posX][posY] != null && grid[posX][posY].type == TYPE_EMPTY) {
				grid[posX][posY].type = TYPE_FOREST;
				forest++;
				positionFound = true;
			}
		}
	}
}

function randomCamp(max = 3)
{
	var camp = 0;
	for(var x = 0; x < grid.length; x++) {
		for(var y = 0; y < grid[x].length; y++) {
			if(grid[x][y] != null && grid[x][y].type == TYPE_CAMP) {
				camp++;
			}
		}
	}

	while(camp < max) {
		let positionFound = false;
		while(!positionFound) {
			var posX = mt_rand(0, grid.length-1);
			var posY = mt_rand(0, grid[0].length-1);
			if(grid[posX][posY] != null && grid[posX][posY].type == TYPE_EMPTY) {
				grid[posX][posY].type = TYPE_CAMP;
				camp++;
				positionFound = true;
			}
		}
	}
}

function addPlayer(player)
{
	let positionFound = false;
	while(!positionFound) {
			var posX = mt_rand(0, grid.length-1);
			var posY = mt_rand(0, grid[0].length-1);
			if(grid[posX][posY] != null && grid[posX][posY].player == null && grid[posX][posY].type == TYPE_EMPTY) {
				grid[posX][posY].type = TYPE_HEADQUARTER;
				grid[posX][posY].player = player;
				player.score += 1;
				positionFound = true;
			}
	}
}

function getNeighborByDirection(point, direction)
{
	var posX = point.x;
	var posY = point.y;
	switch(direction)
	{
		case 0: // Top Left
			posY = point.y - 1;
			break;
		case 1: // Top Right
			posX = point.x + 1;
			posY = point.y - 1;
			break;
		case 2: // Right
			posX = point.x + 1;
			break;
		case 3: // Bottom Right
			posY = point.y + 1;
			break;
		case 4: // Bottom Left
			posY = point.y + 1;
			posX = point.x - 1;
			break;
		default: // Left
			posX = point.x - 1;
	}

	if(typeof grid[posX] !== 'undefined'
		&& typeof grid[posX][posY] !== 'undefined') {
		return grid[posX][posY];
	}
	return null;
}

function howManyPlayerNearHere(point, playerId)
{
	var nearHere = 0;
	for(var dir = 0; dir < 6; dir++) {
		let nearCase = getNeighborByDirection(point, dir);
		if(nearCase != null && nearCase.player != null && nearCase.player.id == playerId) {
			nearHere++;
		}
	}
	return nearHere;
}

function checkAutoFill()
{
	var notFound = true;
	while(notFound) {
		notFound = false;
		for(var x = 0; x < grid.length; x++) {
			for(var y = 0; y < grid[x].length; y++) {
				if( grid[x][y] != null 
					&& grid[x][y].type != TYPE_WATER 
					&& grid[x][y].player == null) {
					if( howManyPlayerNearHere(new Point(x, y), 0) >= 5 ) {
						grid[x][y].player = players[0];
						players[0].score += 1;
						notFound = true;
					}
				}
			}
		}
	}
}

// ########
// Drawing
// ########

function drawHex(center, size, lineWidth, fillStyle = '#fff', strokeStyle = '#fff')
{
	ctx.save();
	var points = getHexPoints(center, size);

	ctx.beginPath();
	ctx.moveTo(points[0].x, points[0].y);
	for(var i = 1; i < 6; i++) {
		ctx.lineTo(points[i].x, points[i].y);
	}
	ctx.closePath();

	ctx.clip();

	ctx.shadowColor = '#000';
	ctx.shadowOffsetX = -(0.05 * size);
	ctx.shadowOffsetY = -(0.05 * size);
	ctx.shadowBlur = 20;

	ctx.fillStyle = fillStyle;
	ctx.fill();
	ctx.strokeStyle = (lineWidth == 0 ? fillStyle : strokeStyle);
	ctx.lineWidth = lineWidth;
	ctx.stroke();

	ctx.restore();
	ctx.save();
}

function drawStar(center, size, fillStyle = '#ffffff', strokeStyle = '#303030')
{
	var posX = center.x;
	var posY = center.y;

	var spikes = 5;
	var outerRadius = 0.6 * size;
	var innerRadius = (0.6 * size) / 2;
	var rot = Math.PI / 2 * 3;
	var step = Math.PI/spikes;

	ctx.beginPath();
	ctx.moveTo(posX,posY-outerRadius)
	for(i=0;i<spikes;i++){
		x=posX+Math.cos(rot)*outerRadius;
		y=posY+Math.sin(rot)*outerRadius;
		ctx.lineTo(x,y)
		rot+=step

		x=posX+Math.cos(rot)*innerRadius;
		y=posY+Math.sin(rot)*innerRadius;
		ctx.lineTo(x,y)
		rot+=step
	}
	ctx.lineTo(posX,posY-outerRadius);
	ctx.closePath();
	

	ctx.fillStyle = fillStyle;
	ctx.fill();

	ctx.strokeStyle = strokeStyle;
	ctx.lineWidth = .075 * size;
	ctx.stroke();
}

function drawLoader(center, size, deg = 0, fillStyle = '#aa3333', strokeStyle = '#b0b0b0')
{
	var posX = center.x;
	var posY = center.y;

	ctx.beginPath();
	ctx.arc( posX, posY, 0.5 * size, (Math.PI/180) * 270, (Math.PI/180) * (270 + 360) );

	ctx.strokeStyle = strokeStyle;
	ctx.lineWidth = .15 * size;
	ctx.stroke();

	ctx.beginPath();
	ctx.strokeStyle = fillStyle;
	ctx.lineWidth = .15 * size;
	ctx.arc( posX, posY, 0.5 * size, (Math.PI/180) * 270, (Math.PI/180) * (270 + deg) );
	ctx.stroke();
}

function drawMountain(center, size, fillStyle = '#303030')
{
	var width = size;
	var extraWidthLeft = 0.05 * size;
	var heightRight =  0.8 * size;
	var heightLeft = size;

	var posX = center.x - (width / 2);
	var posY = center.y + heightLeft/2-2;

	ctx.beginPath();
	ctx.moveTo(posX, posY);
	ctx.lineTo(posX + width*2/6+extraWidthLeft*1/2, posY - heightLeft);
	ctx.lineTo(posX + width*4/6+extraWidthLeft*2/2, posY);
	ctx.closePath();

	ctx.moveTo(posX + width*2/6, posY);
	ctx.lineTo(posX + width*4/6, posY - heightRight);
	ctx.lineTo(posX + width*6/6, posY);
	ctx.closePath();

	ctx.strokeStyle = fillStyle,
	ctx.lineWidth = 0.05 * size;
	ctx.stroke();
	
	ctx.beginPath();
	ctx.moveTo(posX, posY);
	ctx.lineTo(posX + width*1/6+extraWidthLeft*1/4, posY - heightLeft/2);
	ctx.lineTo(posX + width*2/6+extraWidthLeft*2/4, posY - heightLeft*2/3);
	ctx.lineTo(posX + width*3/6+extraWidthLeft*3/4, posY - heightLeft/2);
	ctx.lineTo(posX + width*4/6+extraWidthLeft*4/4, posY);

	ctx.moveTo(posX + width*2/6, posY);
	ctx.lineTo(posX + width*3/6, posY - heightRight/2);
	ctx.lineTo(posX + width*4/6, posY - heightRight*2/3);
	ctx.lineTo(posX + width*5/6, posY - heightRight/2);
	ctx.lineTo(posX + width*6/6, posY);
	ctx.closePath();

	ctx.fillStyle = fillStyle;
	ctx.fill(); 
}

function drawTree(center, size, color = '#303030')
{
	var posX = center.x;
	var posY = center.y;
	var trunkWidth = .08 * size;
	var trunkHeight = .2 * size;
	var treeHeight = .8 * size;
	var treeWidth = .5 * size;
	// Trunk
	ctx.beginPath();
	ctx.moveTo(posX , posY + trunkHeight/2);
	ctx.lineTo(posX , posY - trunkHeight/2);
	ctx.lineTo(posX + trunkWidth, posY - trunkHeight/2);
	ctx.lineTo(posX + trunkWidth, posY + trunkHeight/2);
	ctx.closePath();
	ctx.fillStyle = color;
	ctx.fill();
	// Tree
	ctx.beginPath();
	ctx.moveTo(posX+trunkWidth/2 , posY - trunkHeight/2);
	ctx.lineTo(posX+trunkWidth/2 - treeWidth / 2, posY );
	ctx.lineTo(posX+trunkWidth/2 - treeWidth / 2 + treeWidth * 2/ 8, posY - treeHeight/3 -1);
	ctx.lineTo(posX+trunkWidth/2 - treeWidth / 2 + treeWidth * 1/ 8, posY - treeHeight/3 );
	ctx.lineTo(posX+trunkWidth/2 - treeWidth / 2 + treeWidth * 3/ 8, posY - treeHeight*2/3 -1);
	ctx.lineTo(posX+trunkWidth/2 - treeWidth / 2 + treeWidth * 2/ 8, posY - treeHeight*2/3 );
	ctx.lineTo(posX+trunkWidth/2 , posY - treeHeight);
	ctx.lineTo(posX+trunkWidth/2 + treeWidth / 2 - treeWidth * 2/ 8, posY - treeHeight*2/3 );
	ctx.lineTo(posX+trunkWidth/2 + treeWidth / 2 - treeWidth * 3/ 8, posY - treeHeight*2/3 -1);
	ctx.lineTo(posX+trunkWidth/2 + treeWidth / 2 - treeWidth * 1/ 8, posY - treeHeight/3 );    
	ctx.lineTo(posX+trunkWidth/2 + treeWidth / 2 - treeWidth * 2/ 8, posY - treeHeight/3 -1);
	ctx.lineTo(posX+trunkWidth/2 + treeWidth / 2, posY);
	ctx.closePath();
	ctx.fillStyle = color;
	ctx.fill();
}

function drawTrees(center, size, color = '#303030')
{
	drawTree(center, size, color);
    drawTree(new Point(center.x - .4*size, center.y + .45*size), size, color);
    drawTree(new Point(center.x + .4*size, center.y + .45*size), size, color);
}

function drawWave(center, size, color = '#303030')
{
	var waves = 11;
	var waveHeight = .1*size;
	var waveDist = .1*size;

	var posX = center.x - (waves * waveDist / 2);
	var posY = center.y;

	ctx.beginPath();
	ctx.moveTo(posX, posY);
	for(var i = 1; i <= (waves % 2 ? waves + 1 : waves); i++) {
		ctx.lineTo(posX + i * waveDist, (i % 2 ? posY - waveHeight : posY));
	}
	ctx.strokeStyle = color;
	ctx.lineWidth = .05*size;
	ctx.stroke();
}

function drawWaves(center, size, color = '#303030')
{
	drawWave(new Point(center.x, center.y + .05*size), size, color);
	drawWave(new Point(center.x, center.y + .05*size - .25*size), size, color);
	drawWave(new Point(center.x, center.y + .05*size + .25*size), size, color);
}

function drawCamp(center, size, color = '#303030')
{
	var posX = center.x + size * .08;
	var posY = center.y + size * .27;

	var campHeight = size * .7;
	var woodStickWidth = size * .1;
	var woodStickIncl = size * .3;
	var dist = size * .2;

	ctx.beginPath();
	ctx.moveTo(posX - dist - woodStickWidth, posY);
	ctx.lineTo(posX - dist, posY);
	ctx.lineTo(posX - dist + woodStickIncl, posY - campHeight);
	ctx.lineTo(posX - dist - woodStickWidth + woodStickIncl, posY - campHeight);
	ctx.closePath();
	ctx.fillStyle = color;
	ctx.fill();

	ctx.beginPath();
	ctx.moveTo(posX + dist - woodStickWidth, posY);
	ctx.lineTo(posX + dist, posY);
	ctx.lineTo(posX + dist - woodStickIncl, posY - campHeight);
	ctx.lineTo(posX + dist - woodStickWidth - woodStickIncl, posY - campHeight);
	ctx.closePath();
	ctx.fillStyle = color;
	ctx.fill();
}

function drawRoundedRect(center, width, height, deep = 10, fillStyle = '#ffffff')
{
	ctx.beginPath();
	ctx.moveTo(center.x, center.y);

	// Right Top Corner
	ctx.lineTo(center.x + width - deep, center.y);
	ctx.quadraticCurveTo(center.x + width, center.y, center.x + width, center.y + deep);
	// Right Bottom Corner
	ctx.lineTo(center.x + width, center.y + height - deep);
	ctx.quadraticCurveTo(center.x + width, center.y + height, center.x + width - deep, center.y + height);
	// Left Bottom Corner
	ctx.lineTo(center.x + deep, center.y + height);
	ctx.quadraticCurveTo(center.x, center.y + height, center.x, center.y + height - deep);
	// Left Top Croner
	ctx.lineTo(center.x, center.y + deep);
	ctx.quadraticCurveTo(center.x, center.y, center.x + deep, center.y);

	ctx.fillStyle = fillStyle;
	ctx.fill();

	//ctx.stroke();
}

function drawTower(center, size, color = '#303030')
{
	var minWidth = 20;
	var maxWidth = 30;

	var posX = center.x - 10;
	var posY = center.y;

	ctx.beginPath();
	ctx.moveTo(posX, posY);
	ctx.lineTo(posX - (maxWidth - minWidth), posY - 10);
	ctx.lineTo(posX - (maxWidth - minWidth), posY - 20);
	ctx.lineTo(posX + maxWidth, posY - 20);
	ctx.lineTo(posX + maxWidth, posY - 10);
	ctx.lineTo(posX + minWidth, posY);
	ctx.lineTo(posX + minWidth, posY + 20);
	ctx.lineTo(posX + maxWidth, posY + 30);
	ctx.lineTo(posX - (maxWidth - minWidth), posY + 30);
	ctx.lineTo(posX, posY + 20);
	ctx.closePath();
	ctx.fillStyle = color;
	ctx.fill();
	ctx.strokeStyle = '#303030';
	ctx.stroke();
}

function drawPlayerHUD(center, player)
{
	var size = 60;
	var margin = 20;
	var point = new Point(size + margin, canvas.height - size - margin)

	// Drawing Money Block at the top center
	var moneyBlockWidth = 100;
	var moneyBlockRounded = 18;
	var moneyBlockHeight = 30;
	ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
	ctx.shadowBlur = 10;
	ctx.shadowOffsetY = 5;
	ctx.shadowOffsetX = 5;
	drawRoundedRect(new Point(canvas.width / 2 - moneyBlockWidth / 2, -moneyBlockRounded), moneyBlockWidth, moneyBlockHeight + moneyBlockRounded, moneyBlockRounded);

	ctx.shadowBlur = 0;
	ctx.shadowOffsetY = 0;
	ctx.shadowOffsetX = 0;
	ctx.fillStyle = '#555';
	ctx.font = '20px Helvetica, Arial';
	ctx.textAlign = 'center';
	ctx.fillText(player.money, canvas.width / 2, 20);


	// Hexagon of current player
	
	drawHex(point, size, 10, player.color, '#f0f0f0');

	// Rect with player's name
	var nameRectHeight = 35;
	var nameRectWidth = 175;
	ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
	ctx.shadowBlur = 10;
	ctx.shadowOffsetY = 5;
	ctx.shadowOffsetX = 5;
	drawRoundedRect(new Point(point.x, point.y - nameRectHeight / 2), nameRectWidth, nameRectHeight, nameRectHeight / 2);

	// Circle into the hexagon
	ctx.beginPath();
	ctx.arc(point.x, point.y, .5*size, 0, 2 * Math.PI);
	
	ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
	ctx.shadowBlur = 10;
	ctx.shadowOffsetY = 5;
	ctx.shadowOffsetX = 5;

	ctx.fillStyle = '#fff';
	ctx.fill();

	// Score into the circle
	ctx.fillStyle = '#555';
	ctx.font = '28px Helvetica, Arial';
	ctx.textAlign = 'center';

	ctx.shadowColor = '#000';
	ctx.shadowBlur = 0;
	ctx.shadowOffsetX = 0;
	ctx.shadowOffsetY = 0;

	ctx.fillText(player.score, point.x, point.y + 10);

	ctx.font = '22px Helvetica, Arial';
	ctx.fillText(player.name, point.x + nameRectWidth / 2, point.y + 8);
}

function drawGrid(center, size, grid)
{
	var startX = center.x;
	var startY = center.y;
	var hexWidth = getHexWidthFromSize(size);
	var hexHeight = getHexHeightFromSize(size);

	for(var x = 0; x < grid.length; x++) {
		for(var y = 0; y < grid[x].length; y++) {
			if(grid[x][y] != null) {
				let posX = startX + (x * hexWidth) + (y * hexWidth / 2);
				let posY = startY + (y * (hexHeight / 4 * 3));
				let point = new Point(posX, posY);

				if(grid[x][y].type == TYPE_WATER) {
					drawHex(point, size, borderSize, '#74b9ff');
					drawWaves(point, size, LighenDarkenColor('#74b9ff', -75))
				} else {
					var hexStyle = '#ffffff';
					var elemStyle = '#303030';
					if(grid[x][y].player != null) { 
						hexStyle = grid[x][y].player.color;
						elemStyle = '#ffffff';
					}
					drawHex(point, size, borderSize, hexStyle);
					if(grid[x][y].type == TYPE_HEADQUARTER) {
						drawStar(point, size * .8);
					} else if(grid[x][y].type == TYPE_MOUNTAIN) {
						drawMountain(point, size, elemStyle);
					} else if(grid[x][y].type == TYPE_FOREST) {
						drawTrees(point, size, elemStyle);
					} else if(grid[x][y].type == TYPE_CAMP) {
						drawCamp(point, size, elemStyle);
					} else if(grid[x][y].type == TYPE_TOWER) {
						drawTower(point, size, elemStyle);
					}

					if(grid[x][y].capturing) {
						drawLoader(point, size, grid[x][y].deg);
					}
				}
			}
		}
	}
}

// #########
// Canvas
// #########

var canvas = document.getElementById('canvas');
var ctx = canvas.getContext("2d");
var grid = null;

function canvasClear() {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function canvasResize() {
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	if(grid != null) drawGrid(new Point(0, 0), hexSize, grid);
}
window.addEventListener('resize', canvasResize, false);
canvasResize();
console.log('canvas inited!');

var size = 50;
var borderSize = 3;
var hexSize = calculHexSize(size, borderSize);
var gridOffset = new Point(-size * 2, size);
var maxForest = 10;
var maxCamp = 8;

var t0 = null;
var t1 = null;

grid = generateGrid(9);

randomForest(maxForest);
randomCamp(maxCamp);

var players = [];
players[0] = new Player(0, 'Tiger');
addPlayer(players[0]);

drawGrid(gridOffset, hexSize, grid);
drawPlayerHUD(gridOffset, players[0]);

// ########
// Game
// ########
function repeatOften() {
	canvasClear();

	for(var i = 0; i < players.length; i++) {
		if(players[i].capturing != null) {
			players[i].capturing.deg += players[i].capturingDelay;
			if(players[i].capturing.deg > 360) {
				playerCapture(players[i], players[i].capturing)
				clearCapturing(i);
				checkAutoFill();
			}
		}
	}

	drawGrid(gridOffset, hexSize, grid);
	drawPlayerHUD(gridOffset, players[0]);
	globalId = requestAnimationFrame(repeatOften);
}
var globalId = requestAnimationFrame(repeatOften);
console.log('game started!');

// Events
$('#canvas').click(function(e) {
	e.preventDefault();
	var offset = new Point(e.offsetX - gridOffset.x, e.offsetY - gridOffset.y);
	var coord = pointToGrid(offset, hexSize);
	if(typeof grid[coord.x] !== 'undefined' && typeof grid[coord.x][coord.y] !== 'undefined' && grid[coord.x][coord.y] != null) {
		//console.log('click on ', coord);
		var nearHere = howManyPlayerNearHere(coord, players[0].id);
		if( nearHere > 0 ) {
			if( grid[coord.x][coord.y].type != TYPE_WATER && grid[coord.x][coord.y].player == null
				|| (grid[coord.x][coord.y].player != null && (grid[coord.x][coord.y].type == TYPE_FOREST || grid[coord.x][coord.y].type == TYPE_CAMP || grid[coord.x][coord.y].type == TYPE_EMPTY)) ) {
				if( players[0].capturing != null ) clearCapturing(0);
				startCapturing(0, grid[coord.x][coord.y]);
			}
		}
	}
});

function startCapturing(playerId, gridCell)
{
	players[playerId].capturing = gridCell;
	if(gridCell.type == TYPE_MOUNTAIN) {
		players[playerId].capturingDelay = 4;
	} else {
		players[playerId].capturingDelay = 8;
	}
	
	players[playerId].capturing.capturing = true;
}

function playerCapture(player, gridCell)
{
	
	if(gridCell.player != null) {
		if(gridCell.type == TYPE_FOREST) {
			player.money += 50;
			gridCell.type = TYPE_EMPTY;
			randomForest(maxForest);
		} else if(gridCell.type == TYPE_CAMP) {
			player.money += 50;
			gridCell.type = TYPE_EMPTY;
			for(var dir = 0; dir < 6; dir++) {
				let cell = getNeighborByDirection(gridCell.point, dir);
				if(cell != null && cell.type != TYPE_WATER) {
					playerCapture(player, cell);
				}
			}
			randomCamp(maxCamp);
		}
	} else {
		gridCell.player = player;
		player.score += 1;
		player.money += 100;
		if(gridCell.type == TYPE_CAMP) {
			gridCell.type = TYPE_EMPTY;
			for(var dir = 0; dir < 6; dir++) {
				let cell = getNeighborByDirection(gridCell.point, dir);
				if(cell != null && cell.type != TYPE_WATER) {
					playerCapture(player, cell);
				}
			}
			randomCamp(maxCamp);
		}
	}
}

function clearCapturing(playerId)
{
	if(typeof players[playerId].capturing !== 'undefined') players[playerId].capturing.capturing = false;
	players[playerId].capturing.deg = 0;
	players[playerId].capturing = null;
	players[playerId].capturingDelay = 8;

}