/**
 * Created by Dan Duda on 11/14/2015.
 */

(function($) {
    "use strict";

    var canvas;
    var ctx;
    var iconCanvas;
    var iconCtx;

    var dragging = false;
    var dragStartLocation;
    var snapshot;

    var gridSize = 20;

    var WALL_ICON = 0;
    var DOOR_ICON = 1;
    var ARCHWAY_ICON = 2;
    var SECRETDOOR_ICON = 3;
    var BLOCK_ICON = 4;
    var RUINS_ICON = 5;
    var TRAP_ICON = 6;
    var TREASURE_ICON = 7;
    var DESCRIPTION_ICON = 8;
    var ERASER_ICON = 9;
    var B_ICON = 10;
    var C_ICON = 11;

    var ICON_RECTANGLES = [
        { x: 13, y: 18, w: 48, h: 48, description: 'Wall', id: WALL_ICON },
        { x: 13, y: 78, w: 48, h: 48, description: 'Door', id: DOOR_ICON },
        { x: 13, y: 138, w: 48, h: 48, description: 'Archway', id: ARCHWAY_ICON },
        { x: 13, y: 198, w: 48, h: 48, description: 'Secret Door', id: SECRETDOOR_ICON },
        { x: 13, y: 258, w: 48, h: 48, description: 'Block', id: BLOCK_ICON },
        { x: 13, y: 318, w: 48, h: 48, description: 'Ruins', id: RUINS_ICON },
        { x: 13, y: 378, w: 48, h: 48, description: '', id: B_ICON },
        { x: 13, y: 438, w: 48, h: 48, description: '', id: C_ICON },
        { x: 13, y: 498, w: 48, h: 48, description: '', id: TRAP_ICON },
        { x: 13, y: 558, w: 48, h: 48, description: '', id: TREASURE_ICON },
        { x: 13, y: 618, w: 48, h: 48, description: '', id: DESCRIPTION_ICON },
        { x: 13, y: 678, w: 48, h: 48, description: 'Eraser', id: ERASER_ICON }
    ];

    var selectedIcon = ICON_RECTANGLES[WALL_ICON];

    $(function() {
        canvas = $('#graphCanvas')[0];
        ctx = canvas.getContext("2d");
        iconCanvas = $('#iconCanvas')[0];
        iconCtx = iconCanvas.getContext("2d");

        ctx.translate(0.5,0.5);
        ctx.strokeStyle = 'cornflowerblue';
        ctx.fillStyle = 'white';
        ctx.lineWidth = 1;
        ctx.lineCap = 'square';

        drawIcons();
        clearGraph();
        setCurrentMode();

        $('#btnClear').on('click', clearGraph);
        $('#lnkSave').on('click', function() {
            saveGraph(this, 'graph.png');
        });


        $(iconCanvas).on('click', selectIcon);

        $(canvas).on('mousedown', handleMouseDown);
        $(canvas).on('mousemove', handleMouseMove);
        $(canvas).on('mouseup', handleMouseUp);
        $(canvas).on('mouseout', handleMouseOut);
    });

    function handleMouseDown(event) {
        switch (selectedIcon.id) {
            case WALL_ICON:
                dragStart(event);
                break;
        }
    }

    function handleMouseUp(event) {
        var ddl = $('#ddlOrientation');

        switch (selectedIcon.id) {
            case WALL_ICON:
                dragStop(event);
                break;

            case DOOR_ICON:
                if (ddl.val() == 'Horizontal') {
                    drawHDoor(event);
                } else {
                    drawVDoor(event);
                }
                break;

            case ARCHWAY_ICON:
                if (ddl.val() == 'Horizontal') {
                    drawHArchway(event);
                } else {
                    drawVArchway(event);
                }
                break;

            case SECRETDOOR_ICON:
                if (ddl.val() == 'Horizontal') {
                    drawHSecretDoor(event);
                } else {
                    drawVSecretDoor(event);
                }
                break;

            case BLOCK_ICON:
                drawBlock(event);
                break;
        }

        takeSnapshot();
    }

    function handleMouseMove(event) {
        var ddl = $('#ddlOrientation');

        switch (selectedIcon.id) {
            case WALL_ICON:
                drag(event);
                break;

            case DOOR_ICON:
                restoreSnapshot();
                if (ddl.val() == 'Horizontal') {
                    drawHDoor(event);
                } else {
                    drawVDoor(event);
                }
                break;

            case ARCHWAY_ICON:
                restoreSnapshot();
                if (ddl.val() == 'Horizontal') {
                    drawHArchway(event);
                } else {
                    drawVArchway(event);
                }
                break;

            case SECRETDOOR_ICON:
                restoreSnapshot();
                if (ddl.val() == 'Horizontal') {
                    drawHSecretDoor(event);
                } else {
                    drawVSecretDoor(event);
                }
                break;

            case BLOCK_ICON:
                restoreSnapshot();
                drawBlock(event);
                break;
        }
    }

    function handleMouseOut() {
        restoreSnapshot();
    }

    function clearGraph() {
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        drawGridLines();
        takeSnapshot();
    }


    function saveGraph(link, fileName) {
        link.href = canvas.toDataURL();
        link.download = fileName;
    }


    function setCurrentMode() {
        var ddl = $('#ddlOrientation');
        $('#lblCurrent').text('Current mode: ' + selectedIcon.description);

        switch (selectedIcon.id) {
            case WALL_ICON:
            case BLOCK_ICON:
                ddl.hide();
                break;

            default:
                ddl.show();
                break;
        }

        takeSnapshot();
    }

    function drawGridLines() {
        ctx.save();

        ctx.strokeStyle = 'lightblue';
        ctx.lineWidth = 1;
        ctx.lineCap = 'square';

        ctx.beginPath();
        for (var col = 0; col < canvas.height; col += gridSize) {
            ctx.moveTo(0, col);
            ctx.lineTo(canvas.width, col);
        }
        for (var row = 0; row < canvas.width; row += gridSize) {
            ctx.moveTo(row, 0);
            ctx.lineTo(row, canvas.height);
        }
        ctx.stroke();

        ctx.restore();
    }

    function getCanvasCoordinates(event) {
        var x = event.clientX - canvas.getBoundingClientRect().left;
        var y = event.clientY - canvas.getBoundingClientRect().top;

        return { x: x, y: y };
    }

    function takeSnapshot() {
        snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
    }

    function restoreSnapshot() {
        ctx.putImageData(snapshot, 0, 0);
    }

    function getClosestSnapPoint(position) {
        var x = Math.round(position.x / gridSize) * gridSize;
        var y = Math.round(position.y / gridSize) * gridSize;

        return { x: x, y: y };
    }

    function drawLine(position, preview) {
        ctx.save();
        if (preview) {
            ctx.lineWidth = 2;
        }

        ctx.beginPath();

        var xDelta = Math.abs(position.x - dragStartLocation.x);
        var yDelta = Math.abs(position.y - dragStartLocation.y);

        ctx.moveTo(dragStartLocation.x, dragStartLocation.y);

        if (yDelta >= xDelta) {
            // draw vertical line
            ctx.lineTo(dragStartLocation.x, position.y);
        }
        else {
            // draw horizontal line
            ctx.lineTo(position.x, dragStartLocation.y);
        }

        ctx.stroke();
        ctx.restore();
    }

    function dragStart(event) {
        dragging = true;
        dragStartLocation = getClosestSnapPoint(getCanvasCoordinates(event));
        takeSnapshot();
    }

    function drag(event) {
        if (dragging === true) {
            restoreSnapshot();
            drawLine(getCanvasCoordinates(event), true);
        }
    }

    function dragStop(event) {
        dragging = false;
        restoreSnapshot();
        var snapPos = getClosestSnapPoint(getCanvasCoordinates(event));
        drawLine(snapPos, false);
    }


    /*
        Shape Drawing Functions
     */

    function drawHDoor(event) {
        var pt = getCanvasCoordinates(event);
        var col = Math.floor(pt.x / gridSize);
        var row = Math.floor(pt.y / gridSize);

        var offsetX = 0;
        var offsetY = 0;
        if (pt.y >= row * gridSize + 10) {
            // bottom of cell
            offsetX = col * gridSize;
            offsetY = row * gridSize + 10;
        } else {
            // top of cell
            offsetX = col * gridSize;
            offsetY = row * gridSize - 10;
        }

        ctx.beginPath();
        ctx.moveTo(offsetX, offsetY + 10);
        ctx.lineTo(offsetX + 5, offsetY + 10);
        ctx.moveTo(offsetX + 15, offsetY + 10);
        ctx.lineTo(offsetX + 20, offsetY + 10);
        ctx.stroke();

        ctx.strokeRect(offsetX + 5, offsetY + 5, 10, 10);
        ctx.fillRect(offsetX + 5, offsetY + 5, 10, 10);
    }

    function drawVDoor(event) {
        var pt = getCanvasCoordinates(event);
        var col = Math.floor(pt.x / gridSize);
        var row = Math.floor(pt.y / gridSize);

        var offsetX = 0;
        var offsetY = 0;
        if (pt.x >= col * gridSize + 10) {
            // right of cell
            offsetX = col * gridSize + 10;
            offsetY = row * gridSize;
        } else {
            // left of cell
            offsetX = col * gridSize - 10;
            offsetY = row * gridSize;
        }

        ctx.beginPath();
        ctx.moveTo(offsetX + 10, offsetY);
        ctx.lineTo(offsetX + 10, offsetY + 5);
        ctx.moveTo(offsetX + 10, offsetY + 15);
        ctx.lineTo(offsetX + 10, offsetY + 20);
        ctx.stroke();

        ctx.strokeRect(offsetX + 5, offsetY + 5, 10, 10);
        ctx.fillRect(offsetX + 5, offsetY + 5, 10, 10);
    }

    function drawHArchway(event) {
        var pt = getCanvasCoordinates(event);
        var col = Math.floor(pt.x / gridSize);
        var row = Math.floor(pt.y / gridSize);

        var offsetX = 0;
        var offsetY = 0;
        if (pt.y >= row * gridSize + 10) {
            // bottom of cell
            offsetX = col * gridSize;
            offsetY = row * gridSize + 10;
        } else {
            // top of cell
            offsetX = col * gridSize;
            offsetY = row * gridSize - 10;
        }

        ctx.beginPath();
        ctx.moveTo(offsetX, offsetY + 10);
        ctx.lineTo(offsetX + 5, offsetY + 10);
        ctx.moveTo(offsetX + 15, offsetY + 10);
        ctx.lineTo(offsetX + 20, offsetY + 10);
        ctx.moveTo(offsetX + 5, offsetY + 5);
        ctx.lineTo(offsetX + 5, offsetY + 15);
        ctx.moveTo(offsetX + 15, offsetY + 5);
        ctx.lineTo(offsetX + 15, offsetY + 15);
        ctx.stroke();

        ctx.fillRect(offsetX + 5, offsetY + 5, 10, 10);
    }

    function drawVArchway(event) {
        var pt = getCanvasCoordinates(event);
        var col = Math.floor(pt.x / gridSize);
        var row = Math.floor(pt.y / gridSize);

        var offsetX = 0;
        var offsetY = 0;
        if (pt.x >= col * gridSize + 10) {
            // right of cell
            offsetX = col * gridSize + 10;
            offsetY = row * gridSize;
        } else {
            // left of cell
            offsetX = col * gridSize - 10;
            offsetY = row * gridSize;
        }

        ctx.beginPath();
        ctx.moveTo(offsetX + 10, offsetY);
        ctx.lineTo(offsetX + 10, offsetY + 5);
        ctx.moveTo(offsetX + 10, offsetY + 15);
        ctx.lineTo(offsetX + 10, offsetY + 20);
        ctx.moveTo(offsetX + 5, offsetY + 5);
        ctx.lineTo(offsetX + 15, offsetY + 5);
        ctx.moveTo(offsetX + 5, offsetY + 15);
        ctx.lineTo(offsetX + 15, offsetY + 15);
        ctx.stroke();

        ctx.fillRect(offsetX + 5, offsetY + 5, 10, 10);
    }

    function drawHSecretDoor(event) {
        var pt = getCanvasCoordinates(event);
        var col = Math.floor(pt.x / gridSize);
        var row = Math.floor(pt.y / gridSize);

        var offsetX = 0;
        var offsetY = 0;
        if (pt.y >= row * gridSize + 10) {
            // bottom of cell
            offsetX = col * gridSize;
            offsetY = row * gridSize + 10;
        } else {
            // top of cell
            offsetX = col * gridSize;
            offsetY = row * gridSize - 10;
        }

        ctx.beginPath();
        ctx.moveTo(offsetX, offsetY + 10);
        ctx.lineTo(offsetX + 20, offsetY + 10);

        ctx.moveTo(offsetX + 2, offsetY + 15);
        var cp1x = offsetX + 7;
        var cp1y = offsetY - 15;
        var cp2x = offsetX + 13;
        var cp2y = offsetY + 35;
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, offsetX + 18, offsetY + 5);

        ctx.stroke();
    }

    function drawVSecretDoor(event) {
        var pt = getCanvasCoordinates(event);
        var col = Math.floor(pt.x / gridSize);
        var row = Math.floor(pt.y / gridSize);

        var offsetX = 0;
        var offsetY = 0;
        if (pt.x >= col * gridSize + 10) {
            // right of cell
            offsetX = col * gridSize + 10;
            offsetY = row * gridSize;
        } else {
            // left of cell
            offsetX = col * gridSize - 10;
            offsetY = row * gridSize;
        }

        ctx.beginPath();
        ctx.moveTo(offsetX + 10, offsetY);
        ctx.lineTo(offsetX + 10, offsetY + 20);

        ctx.moveTo(offsetX + 5, offsetY + 18);
        var cp1x = offsetX + 35;
        var cp1y = offsetY + 13; //13
        var cp2x = offsetX - 15;
        var cp2y = offsetY + 7; // 7
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, offsetX + 15, offsetY + 2);

        ctx.stroke();
    }

    function drawBlock(event) {
        var pt = getCanvasCoordinates(event);
        var col = Math.floor(pt.x / gridSize);
        var row = Math.floor(pt.y / gridSize);

        var offsetX = col * gridSize;
        var offsetY = row * gridSize;
        for (var i = 4; i < 20; i += 4) {
            ctx.beginPath();
            ctx.moveTo(offsetX, i + offsetY);
            ctx.lineTo(i + offsetX, offsetY);
            ctx.stroke();
            ctx.closePath();

            ctx.beginPath();
            ctx.moveTo(i + offsetX, offsetY + 20);
            ctx.lineTo(offsetX + 20, i + offsetY);
            ctx.stroke();
            ctx.closePath();
        }

        ctx.beginPath();
        ctx.moveTo(offsetX, offsetY + 20);
        ctx.lineTo(offsetX + 20, offsetY);
        ctx.stroke();
        ctx.closePath();
    }







    /*
     Icon Bar Functions
     */

    function selectIcon(event) {
        var x = event.clientX - iconCanvas.getBoundingClientRect().left;
        var y = event.clientY - iconCanvas.getBoundingClientRect().top;

        if (x >= 13 && x <= 61 && y >= ICON_RECTANGLES[0].y && y <= ICON_RECTANGLES[ICON_RECTANGLES.length - 1].y + 48) {
            var n = ((y - 18) % 60);
            if (n <= 48) {
                selectedIcon = ICON_RECTANGLES[Math.floor((y - 18) / 60)];
                setCurrentMode();
                drawIcons();
            }
        }
    }

    function drawIcons() {
        iconCtx.strokeStyle = 'rgb(100, 140, 230)';
        iconCtx.fillStyle = '#eeeeee';
        iconCtx.shadowColor = 'black';
        iconCtx.lineWidth = 1;

        iconCtx.clearRect(0, 0, iconCanvas.width, iconCanvas.height);
        ICON_RECTANGLES.forEach(function(rect) {
            drawIcon(rect);
        });
    }

    function drawIcon(rect) {
        iconCtx.save();

        if (selectedIcon.id === rect.id) {
            iconCtx.shadowBlur = 20;
            iconCtx.shadowOffsetX = 5;
            iconCtx.shadowOffsetY = 5;
        }

        iconCtx.beginPath();
        iconCtx.rect(rect.x, rect.y, rect.w, rect.h);

        iconCtx.stroke();
        iconCtx.fill();
        iconCtx.restore();

        iconCtx.save();
        iconCtx.strokeStyle = '#dddddd';
        iconCtx.fillStyle = '#dddddd';
        iconCtx.beginPath();
        iconCtx.moveTo(rect.x, rect.y + rect.h);
        iconCtx.lineTo(rect.x + rect.w, rect.y + rect.h);
        iconCtx.lineTo(rect.x + rect.w, rect.y);
        iconCtx.closePath();
        iconCtx.fill();
        iconCtx.restore();

        if (rect === ICON_RECTANGLES[WALL_ICON])                    { drawWallIcon(rect); }
        else if (rect === ICON_RECTANGLES[DOOR_ICON])               { drawDoorIcon(rect); }
        else if (rect === ICON_RECTANGLES[ARCHWAY_ICON])            { drawArchwayIcon(rect); }
        else if (rect === ICON_RECTANGLES[SECRETDOOR_ICON])         { drawSecretDoorIcon(rect); }
        else if (rect === ICON_RECTANGLES[BLOCK_ICON])              { drawBlockIcon(rect); }
        else if (rect === ICON_RECTANGLES[RUINS_ICON])              { drawRuinsIcon(rect); }
    }

    function drawWallIcon(rect) {
        iconCtx.beginPath();
        iconCtx.moveTo(rect.x + 5, rect.h / 2 + rect.y);
        iconCtx.lineTo(rect.x + rect.w - 5, rect.h / 2 + rect.y);
        iconCtx.moveTo(rect.x + rect.w / 2, rect.y + 5);
        iconCtx.lineTo(rect.x + rect.w / 2, rect.y + rect.h - 5);
        iconCtx.stroke();
    }

    function drawDoorIcon(rect) {
        iconCtx.beginPath();
        iconCtx.moveTo(rect.x + 5, rect.h / 2 + rect.y);
        iconCtx.lineTo(rect.x + 15, rect.h / 2 + rect.y);
        iconCtx.moveTo(rect.x + rect.w - 5, rect.h / 2 + rect.y);
        iconCtx.lineTo(rect.x + rect.w - 15, rect.h / 2 + rect.y);
        iconCtx.moveTo(rect.x + rect.w / 2 - 10, rect.y + rect.h / 2 - 10);
        iconCtx.lineTo(rect.x + rect.w / 2 + 10, rect.y + rect.h / 2 - 10);
        iconCtx.lineTo(rect.x + rect.w / 2 + 10, rect.y + rect.h / 2 + 10);
        iconCtx.lineTo(rect.x + rect.w / 2 - 10, rect.y + rect.h / 2 + 10);
        iconCtx.lineTo(rect.x + rect.w / 2 - 10, rect.y + rect.h / 2 - 10);

        iconCtx.stroke();
        iconCtx.closePath();
    }

    function drawArchwayIcon(rect) {
        iconCtx.beginPath();
        iconCtx.moveTo(rect.x + 5, rect.h / 2 + rect.y);
        iconCtx.lineTo(rect.x + 15, rect.h / 2 + rect.y);
        iconCtx.moveTo(rect.x + rect.w - 5, rect.h / 2 + rect.y);
        iconCtx.lineTo(rect.x + rect.w - 15, rect.h / 2 + rect.y);
        iconCtx.moveTo(rect.x + rect.w / 2 - 10, rect.y + rect.h / 2 - 10);
        iconCtx.lineTo(rect.x + rect.w / 2 - 10, rect.y + rect.h / 2 + 10);
        iconCtx.moveTo(rect.x + rect.w / 2 + 10, rect.y + rect.h / 2 - 10);
        iconCtx.lineTo(rect.x + rect.w / 2 + 10, rect.y + rect.h / 2 + 10);
        iconCtx.stroke();
        iconCtx.closePath();
    }

    function drawSecretDoorIcon(rect) {
        iconCtx.beginPath();
        iconCtx.moveTo(rect.x + 5, rect.h / 2 + rect.y);
        iconCtx.lineTo(rect.x + rect.w - 5, rect.h / 2 + rect.y);

        var sectionWidth = rect.w / 4;
        iconCtx.moveTo(rect.x + sectionWidth, rect.y + rect.h / 2 + 10);
        var cp1x = rect.x + sectionWidth + (sectionWidth / 2);
        var cp1y = rect.y - 20;
        var cp2x = rect.x + sectionWidth * 2 + (sectionWidth / 2);
        var cp2y = rect.y + rect.h + 20;
        iconCtx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, rect.x + sectionWidth * 3, rect.y + rect.h / 2 - 10);
        iconCtx.stroke();
    }

    function drawBlockIcon(rect) {
        iconCtx.strokeRect(rect.x + 5, rect.y + 5, rect.w - 10, rect.h - 10);

        var xStartX = rect.x + 5;
        var xStartY = rect.y + 5;

        for (var i = 5; i < rect.h - 10; i += 5) {
            iconCtx.beginPath();
            iconCtx.moveTo(xStartX, xStartY + rect.h - 10 - i);
            iconCtx.lineTo(xStartX + rect.w - 10 - i, xStartY);
            iconCtx.stroke();
            iconCtx.closePath();

            iconCtx.beginPath();
            iconCtx.moveTo(xStartX + i, xStartY + rect.h - 10);
            iconCtx.lineTo(xStartX + rect.w - 10, xStartY + i);
            iconCtx.stroke();
            iconCtx.closePath();
        }

        iconCtx.beginPath();
        iconCtx.moveTo(xStartX, xStartY + rect.h - 10);
        iconCtx.lineTo(xStartX + rect.w - 10, xStartY);
        iconCtx.stroke();
        iconCtx.closePath();
    }

    function drawRuinsIcon(rect) {
        
    }

    return {

    };

}(jQuery));
