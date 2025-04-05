# Toon3D Labeler

A simple tool to manually annotate correspondences on a set of images from the [Toon3D project](https://github.com/ethanweber/toon3d).

## Features

- Upload images or ZIP files for annotation
- Label points and polygons on images
- Export annotations as JSON
- Example datasets available for quick access
- Toggle between regular images and depth maps

## Installation

### Prerequisites

First, install Node Version Manager (nvm).

### Installing the Labeler

```bash
git clone https://github.com/ethanweber/toon3d-labeler.git
cd toon3d-labeler
nvm use 20
npm install
npm start
```

## Usage

- Use the "Upload Images" or "Upload ZIP" button to load your dataset
- Click on the images to annotate points and polygons
- Use the "Export" button to save your annotations
- Click on example datasets at the top to quickly load sample data
- Press 'd' to toggle between regular images and depth maps

## License

This project is licensed under the MIT License.
