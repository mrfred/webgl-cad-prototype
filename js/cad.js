// GLOBALS

var camera, scene, renderer;

var drawingElement;
var drawingStartPosition, drawingEndPosition;

var worldCoordinatesUtils;
var current3DWorldPosition;
var canvasMousePosition;

var dragMousePosition;
var dragCameraStartPosition;
var dragZoomCameraStartPosition;

var elementPreview;

// WorldCoordinatesUtils
function WorldCoordinatesUtils()
{
	this.planeZ = new THREE.Plane( new THREE.Vector3( 0, 0, 1 ), 0 );
	this.mv = new THREE.Vector3( 0, 0, 0.5 );
	this.projector = new THREE.Projector();
}

WorldCoordinatesUtils.prototype.getWorldCoordinates = function(mousePosition, worldPosition)
{	
	this.mv.x = mousePosition.x;
	this.mv.y = mousePosition.y;

	var raycaster = this.projector.pickingRay(this.mv, camera);
	var pos = raycaster.ray.intersectPlane(this.planeZ);

	worldPosition.x = pos.x;
	worldPosition.y = pos.y;
};

// DAT GUI
var ControlSettings = function() 
{
	this.moveSpeed = 1;
	this.zoomSpeed = 1;
};
var controlSettings;

// EDITOR MODES
// (1) Draw
// (2) Drag
// (3) Zoom
// (4) Drag Zoom
var editorMode;

// ADD EVENT HANDLER
document.addEventListener( 'mousemove', onMouseMove, false );
document.addEventListener( 'mousedown', onMouseDown, false );
document.addEventListener( 'mouseup', onMouseUp, false );
document.addEventListener( 'mousewheel', onDocumentMouseWheel, false );
document.addEventListener( 'DOMMouseScroll', onDocumentMouseWheel, false );

function onMouseDown( event )
{
	canvasMousePosition.x  = (event.clientX / window.innerWidth) * 2 - 1;
    canvasMousePosition.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // (1) DRAW MODE
	if (event.which == 1)
	{
		console.log('DRAW MODE');
		editorMode = 1;
		drawElement(canvasMousePosition);
		//draw2DElement(current3DWorldPosition.x, current3DWorldPosition.y);
	}
	// (2) DRAG MODE
	else if (event.which == 2)
	{
		console.log('DRAG MODE');
		editorMode = 2;

		dragCameraStartPosition.copy(camera.position);
		dragMousePosition.copy(canvasMousePosition);
	}

}

function drawElement(mousePosition)
{
	var worldPos = new THREE.Vector2(0, 0);

	if (drawingStartPosition == null)
	{		
		worldCoordinatesUtils.getWorldCoordinates(canvasMousePosition, worldPos);
		drawingStartPosition = new THREE.Vector3(worldPos.x, worldPos.y, 0);

		//draw2DElementPreview(worldPos);
	}
	else
	{
		worldCoordinatesUtils.getWorldCoordinates(canvasMousePosition, worldPos);
		drawingEndPosition = new THREE.Vector3(worldPos.x, worldPos.y, 0);
		
		draw2DRectangle(drawingStartPosition, drawingEndPosition);

		drawingStartPosition = null;
		drawingEndPosition = null;
	}
}

function onMouseMove( event )
{
	var worldPosition = new THREE.Vector2(0, 0);

	canvasMousePosition.x  = (event.clientX / window.innerWidth) * 2 - 1;
    canvasMousePosition.y = -(event.clientY / window.innerHeight) * 2 + 1;

    worldCoordinatesUtils.getWorldCoordinates(canvasMousePosition, worldPosition);
    updatePositionInfoPanel(worldPosition);
	
    if (editorMode == 1)
    {
    	// if (drawingStartPosition != null && drawingEndPosition == null)
    	// {
    	// 	var worldPos = new THREE.Vector2(0, 0);

    	// 	getWorldCoordinates(canvasMousePosition, worldPos);
    	// 	draw2DElementPreview(worldPos);
    	// }
    }
    else if (editorMode == 2)
    {
		moveOrthographicCamera();
    }
}

function onMouseUp( event )
{
	// releasing the middle mouse button quits the move mode
	if (event.which == 2)
	{
		editorMode = 1;
	}
}

function onDocumentMouseWheel(event)
{
	if (event.detail < 0)
		zoomOrthographicCamera('out');
	else
		zoomOrthographicCamera('in');
}

function updatePositionInfoPanel(worldPosition)
{
	$('#info_position').html(worldPosition.x + ' ' + worldPosition.y);
}

function moveOrthographicCamera()
{
	var delta = dragMousePosition.clone().sub(canvasMousePosition);

	var moveX = ((camera.right + (camera.left * -1)) / 2) * delta.x;
	var moveY = ((camera.bottom + (camera.top * -1)) / 2) * delta.y;

	moveX *= controlSettings.moveSpeed;
	moveY *= controlSettings.moveSpeed;

	//console.log('move: ' + moveX + ' ' + moveY);

	var cameraX = dragCameraStartPosition.x;
	var cameraY = dragCameraStartPosition.y;

	cameraX += moveX;
 	cameraY -= moveY;

 	camera.position.setX(cameraX);
 	camera.position.setY(cameraY);
 	//camera.updateProjectionMatrix()
}

function zoomOrthographicCamera(mode)
{
	var zoomX = ((window.innerWidth / 100) * controlSettings.zoomSpeed);
	var zoomY = ((window.innerHeight / 100) * controlSettings.zoomSpeed);

	if (mode == 'out')
	{
		camera.left -= zoomX;
		camera.right += zoomX;
		camera.top += zoomY;
		camera.bottom -= zoomY;
	}
	else if (mode == 'in')
	{
		camera.left += zoomX;
		camera.right -= zoomX;
		camera.top -= zoomY;
		camera.bottom += zoomY;
	}

	camera.updateProjectionMatrix();
}

// function draw2DElement(x, y)
// {
// 	if (drawingStartPosition == null)
// 	{
// 		drawingStartPosition = new THREE.Vector3(x, y, 0);
// 		//$('#startpos').html('(' + x + ', ' + y + ');');
// 		return;
// 	}

// 	//$('#endpos').html('(' + x + ', ' + y + ');');
// 	drawingEndPosition = new THREE.Vector3(x, y, 0);
// 	draw2DRectangle(drawingStartPosition, drawingEndPosition);

// 	drawingStartPosition = null;
// 	drawingEndPosition = null;
// }

function draw2DElementPreview(endVector)
{
	if (elementPreview == null)
	{

	}
}

function draw2DRectangle(startVector, endVector)
{
	var geometry;
	var material;
	var diff;
	var width, height;
	var position;

	diff = startVector.clone().sub(endVector);

	geometry = new THREE.CubeGeometry( diff.x, diff.y, 0);
	material = new THREE.MeshBasicMaterial( { color: 0xff0000, wireframe: true} );
	drawingElement = new THREE.Mesh(geometry , material);

	position = new THREE.Vector3(
		startVector.x - (diff.x / 2),
		startVector.y - (diff.y / 2),
		0);

	drawingElement.position = position;
	
	scene.add(drawingElement);
}

/**
 * initilization
 * @return {[type]} [description]
 */
function init() 
{
	// init DAT GUI
	initGui();

	// init global variables
	editorMode = 1;
	drawingStartPosition = null;
	drawingEndPosition = null;

	current3DWorldPosition = new THREE.Vector2(0, 0);
	dragMousePosition = new THREE.Vector2(0, 0);
	dragCameraStartPosition = new THREE.Vector2(0, 0);
	dragZoomCameraStartPosition = new THREE.Vector2(0, 0);

	canvasMousePosition = new THREE.Vector2(0, 0);

	//camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 10000 );
	//camera.position.z = 1000;

	// init three.js stuff
	camera = new THREE.OrthographicCamera( 
		window.innerWidth / - 2, window.innerWidth / 2,
		window.innerHeight / 2, window.innerHeight / - 2,
		 0, 10000 );

	scene = new THREE.Scene();
	renderer = new THREE.WebGLRenderer();

	renderer.setSize( window.innerWidth, window.innerHeight );
	document.body.appendChild( renderer.domElement );

	worldCoordinatesUtils = new WorldCoordinatesUtils();

	// draw grid
	drawGrid();

	// GO!!
	animate();
}

function initGui()
{
	// init gui
	controlSettings = new ControlSettings();
	var gui = new dat.GUI();
	var controlsFolder = gui.addFolder('Controls');

	controlsFolder.add(controlSettings, 'moveSpeed', 0.1, 10);
	controlsFolder.add(controlSettings, 'zoomSpeed', 0.1, 10);
}

/**
 * draws a grid
 * @return {[type]} [description]
 */
function drawGrid()
{
	var gridXY = new THREE.GridHelper(1000, 100);
	
	gridXY.position.set( 0,0,0 );
	gridXY.rotation.x = Math.PI/2;
	gridXY.setColors( new THREE.Color(0x0000FF), new THREE.Color(0xCEE3F6) );
	
	scene.add(gridXY);
}

function createPointer()
{

}

function animate()
{
    requestAnimationFrame( animate );
	render();	
	update();
}

function update()
{

}

function render()
{
	renderer.render( scene, camera );
}

/**
 * the function generates a z-plane and an 
 * orthogonal vector with the mouse coordinates.
 * The point where vector and z-plane intersects 
 * represents the world coordinates.
 * 
 *    vector
 * 	  __|_____
 *   /  |    /
 *  /   x   / z-plane
 * /_______/
 * 
 * @param  {[type]} event         [description]
 * @param  {[type]} mousePosition [description]
 * @return {[type]}               [description]
 */
// function getWorldCoordinates(event, mousePosition)
// {
// 	var planeZ = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
	
// 	var mv = new THREE.Vector3(
// 	    (event.clientX / window.innerWidth) * 2 - 1,
// 	    -(event.clientY / window.innerHeight) * 2 + 1,
// 	    0.5 );

// 	// var mv = new THREE.Vector3(
// 	//     event.pageX - this.offsetLeft,
// 	//     event.pageY - this.offsetTop,
// 	//     0.5 );

// 	var projector = new THREE.Projector();
// 	var raycaster = projector.pickingRay(mv, camera);
// 	var pos = raycaster.ray.intersectPlane(planeZ);

// 	mousePosition.x = pos.x;
// 	mousePosition.y = pos.y;
// }

function getWorldCoordinates(mousePosition, worldPosition)
{
	var planeZ = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
	
	var mv = new THREE.Vector3(
	    mousePosition.x,
	    mousePosition.y,
	    0.5 );

	var projector = new THREE.Projector();
	var raycaster = projector.pickingRay(mv, camera);
	var pos = raycaster.ray.intersectPlane(planeZ);

	worldPosition.x = pos.x;
	worldPosition.y = pos.y;
}