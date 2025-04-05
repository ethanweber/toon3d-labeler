import React from 'react';
import { Modal, Button } from 'react-bootstrap';

function Instructions({ show, onHide }) {
  return (
    <Modal show={show} onHide={onHide} size="lg" aria-labelledby="contained-modal-title-vcenter" centered>
      <Modal.Header closeButton>
        <Modal.Title id="contained-modal-title-vcenter">
          Instructions
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        Upload a ZIP folder of the processed data or simply a selection of images.

        Or, for no-upload use, host your processed data at some url. Then, specify the url in the path parameter.

        <br />
        <br />
        For example, "https://labeler.toon3d.studio/?path=http://localhost:8000/bobs-burgers-dining".
        <br />
        <br />

        Then, go through the images with the either the "previous" and "next" buttons
        or the left and right arrow key,
        clicking on points you believe the images share.
        <br />
        <br />
        <b>To ignore images</b>
        , you can toggle them off. This will exclude them from our reconstruction pipeline.
        <br />
        <br />
        When labeling one of points, polygons, or lines,
        you might want to only show that specific type to avoid conflicts.
        <br />
        <br />
        <b>To label points</b>
        , you can hide the polygons and click on the image to label points.
        If you have a point that is occluded in one image,
        when you are about to click to set that point, hold the 'n' key and then click.
        This will save the point in that image in a way which tells Toon3D that it is not observed.
        Make sure the numbers match up. You can hold 'd' to show the predicted depth image.
        <br />
        <br />
        {/* bullet points */}
        <ul>
          <li>
            <b>To delete the last point selected</b>
            , right click.
          </li>
          <li>
            <b>To replace a point</b>
            , click an existing point, press "Reposition", then click somewhere else to replace it.
          </li>
          <li>
            <b>To renumber a point</b>
            , click an existing point, set the number, and click "Renumber".
          </li>
        </ul>
        <br />
        Have fun labeling!
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={onHide}>Close</Button>
      </Modal.Footer>
    </Modal>
  );
}

export default Instructions;
