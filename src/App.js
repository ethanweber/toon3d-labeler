import React, { useState, useEffect } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import Button from 'react-bootstrap/Button';
import JSZip from 'jszip';
import ReactGA from 'react-ga';
import Instructions from './Instructions';
import LabelCanvas from './LabelCanvas';
import PointUploader from './PointUploader';

import './App.css';

function Gallery({
  images, leftImageIndex, setLeftImageIndex, rightImageIndex, setRightImageIndex, validImages, leftOrRight,
}) {
  return (
    <Row className="gallery-row">
      {images.map((image, index) => (
        <Col key={index} className="gallery-item mb-3">
          {/* eslint-disable-next-line jsx-a11y/img-redundant-alt */}
          <img
            src={image}
            alt={`Image ${index + 1}`}
            className={`gallery-item ${
              index === leftImageIndex ? 'gallery-item-left-selected' : ''} ${
              index === rightImageIndex ? 'gallery-item-right-selected' : ''}`}
            onClick={() => {
              if (leftOrRight === 'left') {
                setLeftImageIndex(index);
              } else {
                setRightImageIndex(index);
              }
            }}
            style={{
              opacity: validImages[index] ? 1 : 0.3,
              filter: validImages[index] ? 'none' : 'grayscale(100%)',
            }}
          />
        </Col>
      ))}
    </Row>
  );
}

function App() {
  useEffect(() => {
    ReactGA.send({ hitType: 'pageview', page: window.location.pathname });
  }, []);

  // eslint-disable-next-line no-unused-vars
  const [metadata, setMetadata] = useState(null);
  const [images, setImages] = useState([]);
  const [validImages, setValidImages] = useState([]); // Track whether the images are valid or not
  const [depths, setDepths] = useState([]);
  const [polygons, setPolygons] = useState([]);
  const [hoveredPolygons, setHoveredPolygon] = useState();
  const [clickedPolygons, setClickedPolygons] = useState([]);
  const [labelPointsMode, setLabelPointsMode] = useState(true);
  const [showPolygons, setShowPolygons] = useState(false); // Track whether we are labeling polygons or not
  const [lineDrawingMode, setLineDrawingMode] = useState(false);
  const [linePoints, setLinePoints] = useState([]);
  const [lines, setLines] = useState([]);
  const [points, setPoints] = useState([]);
  const [validPoints, setValidPoints] = useState([]); // Track whether the points are valid or not
  const [keyHeld, setKeyHeld] = useState('');
  const [leftOrRight, setLeftOrRight] = useState('right');
  const [leftImageIndex, setLeftImageIndex] = useState(0); // Track the left image index
  const [rightImageIndex, setRightImageIndex] = useState(0); // Track the right image index
  const [hoverIndex, setHoverIndex] = useState(-1); // Track which point is being hovered over

  const nextLeftImage = () => {
    setLeftImageIndex((prevIndex) => (prevIndex + 1 > images.length - 1 ? 0 : prevIndex + 1));
  };

  const prevLeftImage = () => {
    setLeftImageIndex((prevIndex) => (prevIndex - 1 < 0 ? images.length - 1 : prevIndex - 1));
  };

  const nextRightImage = () => {
    setRightImageIndex((prevIndex) => (prevIndex + 1 > images.length - 1 ? 0 : prevIndex + 1));
  };

  const prevRightImage = () => {
    setRightImageIndex((prevIndex) => (prevIndex - 1 < 0 ? images.length - 1 : prevIndex - 1));
  };

  const nextImage = () => {
    if (leftOrRight === 'left') {
      nextLeftImage();
    } else {
      nextRightImage();
    }
  };

  const prevImage = () => {
    if (leftOrRight === 'left') {
      prevLeftImage();
    } else {
      prevRightImage();
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowLeft') {
      prevImage();
    }
    if (e.key === 'ArrowRight') {
      nextImage();
    }
    if (e.key === 'n') {
      setKeyHeld('n');
    }
    if (e.key === 'r') {
      setKeyHeld('r');
    }
    if (e.key === 'd') {
      setKeyHeld('d');
    }
  };

  const onKeyUp = () => {
    setKeyHeld('');
  };

  // Function to parse query parameters from the URL
  const parseQueryString = () => {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    return {
      path: urlParams.get('path') || '',
    };
  };

  // Get the parsed query parameters
  const { path } = parseQueryString();

  // function for processing metadata
  const handleMetadata = (data) => {
    setMetadata(data);
    const polygonsArray = data.frames.map((frame) => (frame.masks.map((mask) => (mask.polygons))));
    setPolygons(polygonsArray);
    setHoveredPolygon(data.frames.map((frame) => (frame.masks.map((mask) => (mask.polygons.map(() => false))))));
    setClickedPolygons(data.frames.map((frame) => (frame.masks.map((mask) => (mask.polygons.map(() => false))))));
    const pointsArray = data.frames.map(() => ([]));
    setPoints(pointsArray);
    let linesArray = [];
    if (data.frames[0].lines) {
      linesArray = data.frames.map((frame) => (frame.lines.map((line) => ({
        startPoint: { x: line[0][1], y: line[0][0] },
        endPoint: { x: line[1][1], y: line[1][0] },
      }))));
      setLines(linesArray);
    } else {
      setLines(data.frames.map(() => ([])));
    }
    setValidPoints(data.frames.map(() => ([])));
  };

  const onPointsUpload = (fileContent) => {
    const data = JSON.parse(fileContent);
    if (data.points) {
      const updatedPoints = data.points.map(() => ([]));
      for (let i = 0; i < data.points.length; i += 1) {
        for (let j = 0; j < data.points[i].length; j += 1) {
          const point = data.points[i][j];
          const { x } = point;
          const { y } = point;
          updatedPoints[i].push({ x, y });
        }
      }
      setPoints(updatedPoints);
    }
    if (data.polygons) {
      setClickedPolygons(data.polygons);
    }
    if (data.validPoints) {
      setValidPoints(data.validPoints);
    }
    if (data.validImages) {
      setValidImages(data.validImages);
    }
    if (data.lines) {
      setLines(data.lines);
    }
  };

  const onLoadCurrent = () => {
    const fetchCurrent = async () => {
      try {
        // Assuming data.frames and path are available
        const cleanedPath = path.endsWith('/') ? path.slice(0, -1) : path;
        // Use the current timestamp to avoid cache
        const timestamp = new Date().getTime();
        const pointsURL = `${cleanedPath}/points.json?_=${timestamp}`;
        const response = await fetch(pointsURL, {
          cache: 'no-cache', // This tells the request to try to fetch a fresh copy
        });
        if (!response.ok) {
          throw new Error('Failed to fetch points data');
        }
        const data = await response.json();
        const jsonString = JSON.stringify(data);
        // eslint-disable-next-line no-console
        console.log(data);
        onPointsUpload(jsonString);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error fetching data:', error);
      }
    };
    fetchCurrent();
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Assuming data.frames and path are available
        const cleanedPath = path.endsWith('/') ? path.slice(0, -1) : path;
        const metadataURL = `${cleanedPath}/metadata.json`;
        const response = await fetch(metadataURL);
        if (!response.ok) {
          throw new Error('Failed to fetch metadata data');
        }
        const data = await response.json();
        handleMetadata(data);
        const imageURLs = data.frames.map((frame) => (`${path}/${frame.file_path}`));
        setImages(imageURLs);
        setValidImages(data.frames.map(() => (true)));
        const depthURLs = data.frames.map((frame) => (`${path}/${frame.depth_image_file_path}`));
        setDepths(depthURLs);

        // Automatically load current points after initial data load
        if (path) {
          onLoadCurrent();
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []); // Empty dependency array ensures this effect runs once on mount

  useEffect(() => {
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [onKeyDown, onKeyUp]);

  const onClearCurrent = () => {
    setPoints(images.map(() => ([])));
    setValidPoints(images.map(() => ([])));
    setClickedPolygons(images.map(() => ([])));
    setLines(images.map(() => ([])));
    setValidImages(images.map(() => true));
    setHoveredPolygon(images.map(() => ([])));
    setLinePoints([]);
  };

  const onSelectPoint = (currentImageIndex, point) => {
    const updatedPoints = [...points];
    updatedPoints[currentImageIndex].push(point);
    setPoints(updatedPoints);
  };

  const onDeletePoint = (currentImageIndex) => {
    const updatedPoints = [...points];
    // delete latest point
    updatedPoints[currentImageIndex].pop();
    setPoints(updatedPoints);
    // delete latest valid point
    const updatedValidPoints = [...validPoints];
    updatedValidPoints[currentImageIndex].pop();
    setValidPoints(updatedValidPoints);
  };

  const onIgnorePoint = (currentImageIndex, value) => {
    const updatedValidPoints = [...validPoints];
    updatedValidPoints[currentImageIndex].push(value);
    setValidPoints(updatedValidPoints);
  };

  const onClickPolygon = (currentImageIndex, polyIndex, subpolyIndex) => {
    const updatedClickedPolygons = [...clickedPolygons];
    // eslint-disable-next-line max-len
    updatedClickedPolygons[currentImageIndex][polyIndex][subpolyIndex] = !updatedClickedPolygons[currentImageIndex][polyIndex][subpolyIndex];
    setClickedPolygons(updatedClickedPolygons);
  };

  const onHoverPolygon = (currentImageIndex, polyIndex, subpolyIndex) => {
    const updatedHoveredPolygons = [...hoveredPolygons];
    // eslint-disable-next-line max-len
    updatedHoveredPolygons[currentImageIndex][polyIndex][subpolyIndex] = !updatedHoveredPolygons[currentImageIndex][polyIndex][subpolyIndex];
    setHoveredPolygon(updatedHoveredPolygons);
  };

  const onAddLine = (currentImageIndex, line) => {
    const updatedLines = [...lines];
    updatedLines[currentImageIndex].push(line);
    setLines(updatedLines);
  };

  const onDeleteLine = (currentImageIndex, lineIndex) => {
    const updatedLines = [...lines];
    updatedLines[currentImageIndex].splice(lineIndex, 1);
    setLines(updatedLines);
  };

  const toggleValidImage = (index) => {
    const updatedValidImages = [...validImages];
    updatedValidImages[index] = !updatedValidImages[index];
    setValidImages(updatedValidImages);
  };

  const onExport = () => {
    const data = {
      points,
      validPoints,
      polygons: clickedPolygons,
      validImages,
      lines,
    };
    const json = JSON.stringify(data, null, 2);

    // You can save the JSON or perform other actions here
    const dataStr = `data:text/json;charset=utf-8,${encodeURIComponent(json)}`;
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute('href', dataStr);
    downloadAnchorNode.setAttribute('download', 'points.json');
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const onAddIgnorePoints = () => {
    const current_points = points;
    const current_valid_points = validPoints;

    // find max number of points for any image
    let max_num_points = 0;
    for (let i = 0; i < current_points.length; i += 1) {
      if (current_points[i].length > max_num_points) {
        max_num_points = current_points[i].length;
      }
    }

    // add ignore points for all images
    for (let i = 0; i < current_points.length; i += 1) {
      const num_points = current_points[i].length;
      for (let j = num_points; j < max_num_points; j += 1) {
        current_points[i].push({ x: 0, y: 0 });
        current_valid_points[i].push(false);
      }
    }

    setPoints(current_points);
    setValidPoints(current_valid_points);
  };

  const [showInstructions, setShowInstructions] = useState(false);
  const onCloseInstructions = () => setShowInstructions(false);
  const onShowInstructions = () => setShowInstructions(true);

  const onUploadImages = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.onchange = async (e) => {
      const files = Array.from(e.target.files);
      const sortedFiles = files.sort((a, b) => a.name.localeCompare(b.name));
      const tempImages = [];

      for (let i = 0; i < sortedFiles.length; i += 1) {
        const imageUrl = URL.createObjectURL(sortedFiles[i]);
        tempImages.push(imageUrl);
      }

      setImages(tempImages);
      setValidImages(tempImages.map(() => (true)));
      setDepths(tempImages); // set depths to images for now
      setPolygons(tempImages.map(() => ([])));
      setHoveredPolygon(tempImages.map(() => ([])));
      setClickedPolygons(tempImages.map(() => ([])));
      setPoints(tempImages.map(() => ([])));
      setValidPoints(tempImages.map(() => ([])));
      setLines(tempImages.map(() => ([])));
    };
    input.click();
  };

  const onUploadZIP = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.zip';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.readAsArrayBuffer(file);
      reader.onload = async (readerEvent) => {
        const buffer = readerEvent.target.result;
        const zip = new JSZip();
        const contents = await zip.loadAsync(buffer);
        const tempImages = [];
        const tempDepthImages = [];
        const tempMetadata = {};

        const tempImageFilenames = [];
        const tempDepthImageFilenames = [];

        // eslint-disable-next-line no-restricted-syntax
        for (const [fileName, fileData] of Object.entries(contents.files)) {
          if (!fileData.dir) {
            if (fileName.endsWith('metadata.json')) {
              // eslint-disable-next-line no-await-in-loop
              const jsonContent = await fileData.async('string');
              Object.assign(tempMetadata, JSON.parse(jsonContent));
            } else if (fileName.match(/depth-images\/.*\.(png|jpg|jpeg)$/)) {
              // Check for depth images in 'depth-images/' folder
              tempDepthImageFilenames.push(fileName);
            } else if (fileName.match(/images\/.*\.(png|jpg|jpeg)$/)) {
              // Check for regular images in 'images/' folder
              tempImageFilenames.push(fileName);
            }
          }
        }

        // Sort the images and depth images
        tempImageFilenames.sort();
        tempDepthImageFilenames.sort();
        // Load the images and depth images
        for (let i = 0; i < tempImageFilenames.length; i += 1) {
          // eslint-disable-next-line no-await-in-loop
          const imageUrl = await contents.file(tempImageFilenames[i]).async('blob');
          tempImages.push(URL.createObjectURL(imageUrl));
        }
        for (let i = 0; i < tempDepthImageFilenames.length; i += 1) {
          // eslint-disable-next-line no-await-in-loop
          const depthImageUrl = await contents.file(tempDepthImageFilenames[i]).async('blob');
          tempDepthImages.push(URL.createObjectURL(depthImageUrl));
        }

        if (Object.keys(tempMetadata).length === 0) {
          // no metadata file found
          // eslint-disable-next-line no-alert
          alert('No metadata file found in the ZIP folder.');
        } else {
          // metadata file found
          handleMetadata(tempMetadata);
          setImages(tempImages);
          setValidImages(tempImages.map(() => (true)));
          setDepths(tempDepthImages);
        }
      };
    };
    input.click();
  };

  return (
    <Container className="p-3">
      <h1 className="header header-style">
        <a href="/" style={{ color: 'inherit', textDecoration: 'none' }}>Toon3D Labeler</a>
      </h1>
      <p className="header">
        This is a simple tool to manually annotate correspondences on a set of images.
        Click to see examples from the Toon3D Dataset:
      </p>
      <div className="d-flex flex-wrap justify-content-center mb-2">
        {[
          'avatar-house',
          'bobs-burgers',
          'bojak-room',
          'family-guy-dining',
          'family-guy-house',
          'krusty-krab',
          'magic-school-bus',
          'mystery-machine',
          'planet-express',
          'simpsons-house',
          'smith-residence',
          'spirited-away',
        ].map((example) => (
          <Button
            key={example}
            variant="outline-secondary"
            size="sm"
            className="btn-xs m-1"
            onClick={() => {
              window.location.href = `/?path=https://ethanweber.me/toon3d-dataset/${example}`;
            }}
          >
            {example}
          </Button>
        ))}
      </div>
      <Button variant="outline-primary" onClick={onUploadImages} className="me-2">Upload Images</Button>
      <Button variant="outline-primary" onClick={onUploadZIP} className="me-2">Upload ZIP</Button>
      <Button variant="outline-primary" onClick={onShowInstructions} className="me-2">Instructions</Button>
      <Button variant="outline-primary" href="https://toon3d.studio" target="_blank" className="me-2">Project Page</Button>
      <Button variant="outline-primary" href="https://github.com/ethanweber/toon3d" target="_blank" className="me-2">Toon3D Code</Button>
      <Button variant="outline-primary" href="https://github.com/ethanweber/toon3d-labeler" target="_blank">Labeler Code</Button>
      <hr />
      <Instructions show={showInstructions} onHide={onCloseInstructions} />
      <Gallery
        images={images}
        leftImageIndex={leftImageIndex}
        setLeftImageIndex={setLeftImageIndex}
        rightImageIndex={rightImageIndex}
        setRightImageIndex={setRightImageIndex}
        validImages={validImages}
        leftOrRight={leftOrRight}
      />
      <br />
      <Row>
        <Col md={12} className="d-flex justify-content-center">
          <Button className="m-2" onClick={() => setLabelPointsMode(!labelPointsMode)}>
            {labelPointsMode ? 'Hide' : 'Show'}
            {' '}
            Points
          </Button>
          <Button className="m-2" onClick={() => setShowPolygons(!showPolygons)}>
            {showPolygons ? 'Hide' : 'Show'}
            {' '}
            Polygons
          </Button>
          <Button className="m-2" onClick={() => setLineDrawingMode(!lineDrawingMode)}>
            {lineDrawingMode ? 'Hide' : 'Show'}
            {' '}
            Lines
          </Button>
          <Button className="m-2" variant="info" onClick={() => onAddIgnorePoints()}>Add Ignore Points</Button>
        </Col>
      </Row>
      <Row>
        <Col md={6}>
          <Button className="m-2" onClick={() => prevLeftImage()}>Previous</Button>
          <Button className="m-2" onClick={() => nextLeftImage()}>Next</Button>
          <Button
            className="m-2"
            style={{ opacity: validImages[leftImageIndex] ? 1 : 0.3 }}
            onClick={() => toggleValidImage(leftImageIndex)}
          >
            {validImages[leftImageIndex] ? 'Ignore' : 'Keep'}
            {' '}
            Image
          </Button>
          {(images.length > 0 || depths.length > 0) && (
          <LabelCanvas
            currentImageIndex={leftImageIndex}
            image={((keyHeld !== 'd' && images[leftImageIndex])
          || !depths[leftImageIndex]) ? images[leftImageIndex] : depths[leftImageIndex]}
            validImage={validImages[leftImageIndex]}
            polygons={polygons[leftImageIndex]}
            hoveredPolygon={hoveredPolygons[leftImageIndex]}
            onHoverPolygon={onHoverPolygon}
            clickedPolygons={clickedPolygons[leftImageIndex]}
            onClickPolygon={onClickPolygon}
            showPolygons={showPolygons}
            points={points[leftImageIndex]}
            validPoints={validPoints[leftImageIndex]}
            onSelectPoint={onSelectPoint}
            onDeletePoint={onDeletePoint}
            onIgnorePoint={onIgnorePoint}
            keyHeld={keyHeld}
            hoverIndex={hoverIndex}
            setHoverIndex={setHoverIndex}
            labelPointsMode={labelPointsMode}
            lineDrawingMode={lineDrawingMode}
            linePoints={linePoints}
            setLinePoints={setLinePoints}
            lines={lines[leftImageIndex]}
            onAddLine={onAddLine}
            onDeleteLine={onDeleteLine}
            leftOrRight={leftOrRight}
            myLeftOrRight="left"
            setLeftOrRight={setLeftOrRight}
          />
          )}
        </Col>
        <Col md={6}>
          <Button className="m-2" onClick={() => prevRightImage()}>Previous</Button>
          <Button className="m-2" onClick={() => nextRightImage()}>Next</Button>
          <Button
            className="m-2"
            style={{ opacity: validImages[rightImageIndex] ? 1 : 0.3 }}
            onClick={() => toggleValidImage(rightImageIndex)}
          >
            {validImages[rightImageIndex] ? 'Ignore' : 'Keep'}
            {' '}
            Image
          </Button>
          {(images.length > 0 || depths.length > 0) && (
          <LabelCanvas
            currentImageIndex={rightImageIndex}
            image={((keyHeld !== 'd' && images[rightImageIndex])
          || !depths[rightImageIndex]) ? images[rightImageIndex] : depths[rightImageIndex]}
            validImage={validImages[rightImageIndex]}
            polygons={polygons[rightImageIndex]}
            hoveredPolygon={hoveredPolygons[rightImageIndex]}
            onHoverPolygon={onHoverPolygon}
            clickedPolygons={clickedPolygons[rightImageIndex]}
            onClickPolygon={onClickPolygon}
            showPolygons={showPolygons}
            points={points[rightImageIndex]}
            validPoints={validPoints[rightImageIndex]}
            onSelectPoint={onSelectPoint}
            onDeletePoint={onDeletePoint}
            onIgnorePoint={onIgnorePoint}
            keyHeld={keyHeld}
            hoverIndex={hoverIndex}
            setHoverIndex={setHoverIndex}
            labelPointsMode={labelPointsMode}
            lineDrawingMode={lineDrawingMode}
            linePoints={linePoints}
            setLinePoints={setLinePoints}
            lines={lines[rightImageIndex]}
            onAddLine={onAddLine}
            onDeleteLine={onDeleteLine}
            leftOrRight={leftOrRight}
            myLeftOrRight="right"
            setLeftOrRight={setLeftOrRight}
          />
          )}
        </Col>
      </Row>
      <Row>
        <Col md={12} className="d-flex justify-content-center">
          <Button className="m-2" onClick={onExport}>Export</Button>
          <PointUploader onUpload={onPointsUpload} />
          <Button className="m-2" onClick={onLoadCurrent}>Load Current</Button>
          <Button className="m-2" onClick={onClearCurrent}>Clear Current</Button>
        </Col>
      </Row>
    </Container>
  );
}

export default App;
