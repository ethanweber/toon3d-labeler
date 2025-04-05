import React, { useState, useEffect, useRef } from 'react';
import Button from 'react-bootstrap/Button';
import InputGroup from 'react-bootstrap/InputGroup';
import FormControl from 'react-bootstrap/FormControl';

const Popup = React.forwardRef(({
  onToggle, onReposition, onRenumber, style, validIndex, currentIndex, currentNumber, setCurrentNumber,
}, ref) => {
  // Update the input field based on the currentIndex
  useEffect(() => {
    setCurrentNumber(String(currentIndex + 1)); // Assuming index starts at 0
  }, [currentIndex, setCurrentNumber]);

  return (
    <div ref={ref} className="popup" style={style}>
      <Button className="m-2" onClick={onToggle}>
        {validIndex ? 'Ignore' : 'Keep'}
        {' '}
        Point
      </Button>
      <Button className="m-2" onClick={onReposition}>Reposition</Button>
      <InputGroup className="m-2">
        <FormControl
          placeholder="New number"
          aria-label="New number"
          type="number"
          value={currentNumber}
          onChange={(e) => setCurrentNumber(e.target.value)}
          style={{ width: 'auto', maxWidth: '150px' }}
        />
        <Button onClick={() => onRenumber(currentIndex, parseInt(currentNumber, 10))}>
          Renumber
        </Button>
      </InputGroup>
    </div>
  );
});

function LabelCanvas({
  currentImageIndex,
  image,
  validImage,
  polygons,
  hoveredPolygon,
  onHoverPolygon,
  clickedPolygons,
  onClickPolygon,
  showPolygons,
  points,
  validPoints,
  onSelectPoint,
  onDeletePoint,
  onIgnorePoint,
  keyHeld,
  hoverIndex,
  setHoverIndex,
  labelPointsMode,
  lineDrawingMode,
  linePoints,
  setLinePoints,
  lines,
  onAddLine,
  onDeleteLine,
  leftOrRight,
  myLeftOrRight,
  setLeftOrRight,
}) {
  const [originalImageSize, setOriginalImageSize] = useState({ width: 0, height: 0 });
  const [currentToOriginalRatio, setCurrentToOriginalRatio] = useState(1);
  const imageRef = useRef(null);
  const popupRef = useRef(null); // Ref for the popup

  const [showPopup, setShowPopup] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const [popupIndex, setPopupIndex] = useState(0);
  const [currentNumber, setCurrentNumber] = useState('');
  const [mousePosition, setMousePosition] = useState({ x: null, y: null });
  const [hoveredLineIndex, setHoveredLineIndex] = useState(null);
  const [replaceIndex, setReplaceIndex] = useState(false); // Track whether to replace the current point or not

  useEffect(() => {
    const onClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        setShowPopup(false); // Close the popup if the click is outside
      }
    };

    // Add click listener when the component mounts
    document.addEventListener('mousedown', onClickOutside);

    // Cleanup the listener when the component unmounts
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
    };
  }, []); // Empty dependency array ensures this runs once on mount

  const onMouseMove = (e) => {
    const rect = imageRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / currentToOriginalRatio;
    const y = (e.clientY - rect.top) / currentToOriginalRatio;
    setMousePosition({ x, y });
    setLeftOrRight(myLeftOrRight);
  };

  const onPointClick = (index, e) => {
    const rect = imageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setPopupPosition({ x, y });
    setShowPopup(true);
    setPopupIndex(index);
    setCurrentNumber(index + 1);
  };

  const popupStyle = {
    position: 'absolute',
    left: `${popupPosition.x}px`,
    top: `${popupPosition.y}px`,
  };

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setOriginalImageSize({ width: img.width, height: img.height });
    };
    img.src = image;
  }, [image]);

  useEffect(() => {
    const onResize = () => {
      if (originalImageSize.width > 0 && originalImageSize.height > 0) {
        const currentImage = imageRef.current;
        const currentImageWidth = currentImage.width;
        const widthRatio = currentImageWidth / originalImageSize.width;
        setCurrentToOriginalRatio(widthRatio);
      }
    };

    // Call onResize initially on mount
    onResize();

    window.addEventListener('resize', onResize);

    return () => {
      // Cleanup the event listener on component unmount
      window.removeEventListener('resize', onResize);
    };
  }, [originalImageSize]);

  const addLinePoint = (x, y) => {
    const newLinePoints = [...linePoints];
    newLinePoints.push({ x, y });
    setLinePoints(newLinePoints);
    if (newLinePoints.length === 2) {
      // If two points are selected, add the line to the lines state and clear line points
      onAddLine(currentImageIndex, { startPoint: newLinePoints[0], endPoint: newLinePoints[1] });
      setLinePoints([]);
    }
  };

  const onClick = (e) => {
    const rect = e.target.getBoundingClientRect();
    const x = (e.clientX - rect.left) / currentToOriginalRatio;
    const y = (e.clientY - rect.top) / currentToOriginalRatio;
    if (lineDrawingMode) {
      addLinePoint(x, y);
      return;
    }
    if (labelPointsMode) {
      if (replaceIndex === 0 || replaceIndex) {
        points[replaceIndex].x = x;
        points[replaceIndex].y = y;
        if (keyHeld === 'n') {
          validPoints[replaceIndex] = false;
        } else {
          validPoints[replaceIndex] = true;
        }
        setReplaceIndex(false);
        return;
      }
      if (keyHeld === 'n') {
        onIgnorePoint(currentImageIndex, false);
      } else {
        onIgnorePoint(currentImageIndex, true);
      }
      onSelectPoint(currentImageIndex, { x, y });
    }
  };

  const onClickOnPoint = (index) => {
    const point = points[index];
    const newLinePoints = [...linePoints];
    newLinePoints.push(point);
    setLinePoints(newLinePoints);
    if (newLinePoints.length === 2) {
      onAddLine(currentImageIndex, { startPoint: newLinePoints[0], endPoint: newLinePoints[1] });
      setLinePoints([]);
    }
  };

  const onLineRightClick = (e, index) => {
    e.preventDefault(); // Prevent the default context menu
    onDeleteLine(currentImageIndex, index);
  };

  const onLineClick = (e, index) => {
    // If within 5 pixels from an endpoint, snap to that endpoint
    const { x } = mousePosition;
    const { y } = mousePosition;
    const line = lines[index];
    const startDistance = Math.sqrt((line.startPoint.x - x) ** 2 + (line.startPoint.y - y) ** 2);
    const endDistance = Math.sqrt((line.endPoint.x - x) ** 2 + (line.endPoint.y - y) ** 2);
    if (startDistance < 5) {
      addLinePoint(line.startPoint.x, line.startPoint.y);
      // eslint-disable-next-line no-console
      console.log('Start point clicked');
    }
    if (endDistance < 5) {
      addLinePoint(line.endPoint.x, line.endPoint.y);
      // eslint-disable-next-line no-console
      console.log('End point clicked');
    }
  };

  const onRightClick = (e) => {
    e.preventDefault();
    const rect = e.target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (lineDrawingMode) {
      if (linePoints.length === 1) {
        setLinePoints([]);
      } else if (lines.length > 0) {
        onDeleteLine(currentImageIndex, lines.length - 1);
      }
      return;
    }
    onDeletePoint(currentImageIndex, { x, y });
  };

  const onRightClickOnPoint = (e) => {
    e.preventDefault();
    onDeletePoint(currentImageIndex, replaceIndex);
  };

  // iterate over all the polygons and find the max number of subpolygons
  let max_num_subpolys = 0;
  for (let i = 0; i < polygons.length; i += 1) {
    if (polygons[i].length > max_num_subpolys) {
      max_num_subpolys = polygons[i].length;
    }
  }

  return (
    <div
      onMouseMove={onMouseMove}
      style={{ position: 'relative' }}
    >
      <img
        ref={imageRef}
        src={image}
        alt="Uploaded"
        onContextMenu={onRightClick}
        onClick={onClick}
        style={{
          maxWidth: '100%',
          opacity: validImage ? 1 : 0.3,
          filter: validImage ? 'none' : 'grayscale(100%)',
        }}
        className={`${myLeftOrRight === leftOrRight ? `hovered-image-${leftOrRight}` : ''}`}
      />
      {showPopup && (
        <Popup
          ref={popupRef}
          style={popupStyle}
          validIndex={validPoints[popupIndex]}
          currentIndex={popupIndex}
          currentNumber={currentNumber}
          setCurrentNumber={setCurrentNumber}
          onToggle={() => {
            validPoints[popupIndex] = !validPoints[popupIndex];
            setShowPopup(false);
          }}
          onReposition={() => {
            setReplaceIndex(popupIndex);
            setShowPopup(false);
          }}
          onRenumber={(index, newNumber) => {
            // eslint-disable-next-line no-console
            console.log('Renumbering point', index + 1, 'to', newNumber);
            const old_index = index;
            const new_index = newNumber - 1;
            if (new_index < 0 || new_index >= points.length) {
              // eslint-disable-next-line no-console
              console.log('Invalid index');
              return;
            }
            let temp = points[old_index];
            points[old_index] = points[new_index];
            points[new_index] = temp;
            temp = validPoints[old_index];
            validPoints[old_index] = validPoints[new_index];
            validPoints[new_index] = temp;
            setShowPopup(false);
          }}
        />
      )}
      {showPolygons && (
        <svg
          width="100%"
          height="100%"
          xmlns="http://www.w3.org/2000/svg"
          style={{
            position: 'absolute', top: 0, left: 0, pointerEvents: 'all',
          }}
        >
          {polygons.map((polygon, polyIndex) => (
            polygon.map((subpolygon, subpolyIndex) => {
              let opacity = 0.0;
              let hovered = false;
              if (hoveredPolygon[polyIndex][subpolyIndex] === true) {
                opacity = 0.5;
                hovered = true;
              }
              if (clickedPolygons[polyIndex][subpolyIndex] === true) {
                opacity = 1.0;
              }
              return (
                <polygon
                  key={polyIndex * max_num_subpolys + subpolyIndex}
                  // eslint-disable-next-line max-len
                  points={subpolygon.map((point) => `${point[0] * currentToOriginalRatio},${point[1] * currentToOriginalRatio}`).join(' ')}
                  fill={`rgba(255, 255, 255, ${opacity})`}
                  stroke="blue"
                  strokeWidth={hovered ? 4 : 0}
                  pointerEvents="all"
                  onMouseEnter={() => onHoverPolygon(currentImageIndex, polyIndex, subpolyIndex)}
                  onMouseLeave={() => onHoverPolygon(currentImageIndex, polyIndex, subpolyIndex)}
                  onClick={() => onClickPolygon(currentImageIndex, polyIndex, subpolyIndex)}
                />
              );
            })
          ))}
        </svg>
      )}
      <svg
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          position: 'absolute', top: 0, left: 0, pointerEvents: 'none',
        }}
      >
        {lineDrawingMode && linePoints.length === 1 && (
          <circle
            cx={linePoints[0].x * currentToOriginalRatio}
            cy={linePoints[0].y * currentToOriginalRatio}
            r={5}
            fill="green"
          />
        )}
      </svg>
      <svg
        width="100%"
        height="100%"
        style={{
          position: 'absolute', top: 0, left: 0, pointerEvents: 'none',
        }}
        xmlns="http://www.w3.org/2000/svg"
      >
        {lineDrawingMode && linePoints.length === 1 && mousePosition.x !== null && (
        <line
          x1={linePoints[0].x * currentToOriginalRatio}
          y1={linePoints[0].y * currentToOriginalRatio}
          x2={mousePosition.x * currentToOriginalRatio}
          y2={mousePosition.y * currentToOriginalRatio}
          stroke="red"
          strokeWidth={2}
        />
        )}
      </svg>
      <svg
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          position: 'absolute', top: 0, left: 0, pointerEvents: 'none',
        }}
      >
        {lineDrawingMode && lines.map((line, index) => (
          <line
            key={index}
            x1={line.startPoint.x * currentToOriginalRatio}
            y1={line.startPoint.y * currentToOriginalRatio}
            x2={line.endPoint.x * currentToOriginalRatio}
            y2={line.endPoint.y * currentToOriginalRatio}
            stroke={index === hoveredLineIndex ? 'blue' : 'red'}
            strokeWidth={index === hoveredLineIndex ? 4 : 4} // Slightly thicker line on hover
            style={{ cursor: 'pointer', pointerEvents: 'visibleStroke' }} // Ensure pointer events are detected
            onMouseEnter={() => setHoveredLineIndex(index)}
            onMouseLeave={() => setHoveredLineIndex(null)}
            onContextMenu={(e) => onLineRightClick(e, index)}
            onClick={(e) => onLineClick(e, index)}
          />
        ))}
      </svg>
      <svg
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          position: 'absolute', top: 0, left: 0, pointerEvents: 'none',
        }}
      >
        {labelPointsMode && points.map((point, index) => (
          validPoints[index] && index !== replaceIndex && ( // Check if index is not equal to replacingIndex
            <g key={index} style={{ pointerEvents: 'all' }}>
              <text
                x={point.x * currentToOriginalRatio}
                y={point.y * currentToOriginalRatio - 10} // Adjust the vertical position as needed
                textAnchor="middle"
                fill="black"
                pointerEvents="none"
              >
                {index + 1}
              </text>
              <circle
                cx={point.x * currentToOriginalRatio}
                cy={point.y * currentToOriginalRatio}
                r={5} // Adjust the radius as needed
                fill={validPoints[index] ? '#0FFF50' : 'white'}
                stroke="black"
                strokeWidth={hoverIndex === index ? 4 : 2}
                onMouseEnter={() => !lineDrawingMode && setHoverIndex(index)}
                onMouseLeave={() => !lineDrawingMode && setHoverIndex(-1)}
                onClick={(event) => {
                  if (lineDrawingMode) {
                    event.preventDefault();
                    onClickOnPoint(index);
                    return;
                  }
                  onPointClick(index, event);
                }}
                onContextMenu={(event) => {
                  if (lineDrawingMode) {
                    event.preventDefault();
                    return;
                  }
                  onRightClickOnPoint(event);
                }}
              />
            </g>
          )
        ))}
      </svg>
      <div>
        {points && points.length > 0 && (<div>Included Points:</div>)}
        <div className="points-container">
          {points && points.map(
            (point, index) => validPoints[index] && (
              <div
                key={index}
                className="point-box"
              // eslint-disable-next-line no-console
              // onClick={() => console.log('Point', index + 1, 'clicked')}
                onClick={(event) => {
                  if (lineDrawingMode) {
                    event.preventDefault();
                    onClickOnPoint(index);
                    return;
                  }
                  onPointClick(index, event);
                }}
                onContextMenu={(event) => {
                  if (lineDrawingMode) {
                    event.preventDefault();
                    return;
                  }
                  onRightClickOnPoint(event);
                }}
                onMouseEnter={() => setHoverIndex(index)}
                onMouseLeave={() => setHoverIndex(-1)}
              >
                {index + 1}
              </div>
            ),
          )}
        </div>
        {points && points.length > 0 && (<div>Excluded Points:</div>)}
        <div className="points-container">
          {points && points.map(
            (point, index) => !validPoints[index] && (
              <div
                key={index}
                className="point-box"
              // eslint-disable-next-line no-console
              // onClick={() => console.log('Point', index + 1, 'clicked')}
                onClick={(event) => {
                  if (lineDrawingMode) {
                    event.preventDefault();
                    onClickOnPoint(index);
                    return;
                  }
                  onPointClick(index, event);
                }}
                onContextMenu={(event) => {
                  if (lineDrawingMode) {
                    event.preventDefault();
                    return;
                  }
                  onRightClickOnPoint(event);
                }}
                onMouseEnter={() => setHoverIndex(index)}
                onMouseLeave={() => setHoverIndex(-1)}
              >
                {index + 1}
              </div>
            ),
          )}
        </div>
      </div>
    </div>
  );
}

export default LabelCanvas;
