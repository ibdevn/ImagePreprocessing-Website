# ImagePreprocessing-Website

Simple Flask web interface replicating the Tkinter cropping application.

## Features

- Upload an image
- Drag, zoom, and crop a central square (300x300 display) with Cropper.js
- Backend processes crop: grayscale, contrast boost, threshold background, invert, resize to 35×35 and normalize
- Download result as `.npy` file formatted for EMNIST

## Setup

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python app.py
```

Open http://127.0.0.1:5000/ in your browser.
