// helper to create image from File
const fileInput = document.getElementById('fileInput');
const previewCanvas = document.getElementById('previewCanvas');
const lowThreshInput = document.getElementById('lowThresh');
const highThreshInput = document.getElementById('highThresh');
const lowValLabel = document.getElementById('lowVal');
const highValLabel = document.getElementById('highVal');
const processBtn = document.getElementById('processBtn');
const downloadLink = document.getElementById('downloadLink');

let originalImage = null;
let selection = null;          // {x,y,w,h} in displayed canvas coords
let isSelecting = false;
let selStart = {x:0,y:0};
let imgScale = 1;              // ratio of displayed->original
let displayDims = {w:0,h:0};

fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (!file) return;
    const img = new Image();
    img.onload = () => {
        originalImage = img;
        selection = null; // reset any old selection
        drawPreview(img);
    };
    img.src = URL.createObjectURL(file);
});

// allow user to drag a selection on the preview canvas
previewCanvas.addEventListener('mousedown', e => {
    if (!originalImage) return;
    isSelecting = true;
    const rect = previewCanvas.getBoundingClientRect();
    selStart.x = e.clientX - rect.left;
    selStart.y = e.clientY - rect.top;
    selection = {x: selStart.x, y: selStart.y, w: 0, h: 0};
});

previewCanvas.addEventListener('mousemove', e => {
    if (!isSelecting || !selection) return;
    const rect = previewCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    selection.w = x - selStart.x;
    selection.h = y - selStart.y;
    drawPreview(originalImage); // redraw including updated selection
});

window.addEventListener('mouseup', () => {
    if (isSelecting) {
        isSelecting = false;
        // normalize selection (make positive width/height)
        if (selection) {
            if (selection.w < 0) { selection.x += selection.w; selection.w = -selection.w; }
            if (selection.h < 0) { selection.y += selection.h; selection.h = -selection.h; }
            // enforce square by taking the smaller side
            const side = Math.min(selection.w, selection.h);
            selection.w = selection.h = side;
        }
        drawPreview(originalImage);
    }
});


lowThreshInput.addEventListener('input', () => {
    lowValLabel.textContent = lowThreshInput.value;
});
highThreshInput.addEventListener('input', () => {
    highValLabel.textContent = highThreshInput.value;
});

processBtn.addEventListener('click', () => {
    if (!originalImage) return;
    const low = parseInt(lowThreshInput.value, 10);
    const high = parseInt(highThreshInput.value, 10);
    let crop = null;
    if (selection) {
        crop = {
            x: Math.round(selection.x * imgScale),
            y: Math.round(selection.y * imgScale),
            w: Math.round(selection.w * imgScale),
            h: Math.round(selection.h * imgScale)
        };
    }
    const processed = processImage(originalImage, low, high, crop);
    drawPreview(processed, true);
    prepareDownload(processed);
});

function drawPreview(img, scaleUp = false) {
    const ctx = previewCanvas.getContext('2d');
    let w = img.width;
    let h = img.height;
    // scale down or up for the preview (max 350px)
    const max = 350;
    if (!scaleUp) {
        if (w > max || h > max) {
            const factor = max / Math.max(w, h);
            w *= factor;
            h *= factor;
        }
    } else {
        const factor = max / Math.max(w, h);
        w *= factor;
        h *= factor;
    }
    // remember display dims & scale for coordinate conversions
    displayDims.w = w;
    displayDims.h = h;
    imgScale = img.width / w;

    previewCanvas.width = w;
    previewCanvas.height = h;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, 0, 0, w, h);

    // if drawing selection rectangle (only for original images)
    if (!scaleUp && selection) {
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2;
        ctx.strokeRect(selection.x, selection.y, selection.w, selection.h);
    }
}

// returns an Image element containing the processed 35x35 result
// cropRect (optional) = {x,y,w,h} in original image coords
function processImage(img, lowThresh, highThresh, cropRect = null) {
    // draw into temporary canvas
    const tmp = document.createElement('canvas');
    let sx, sy, s;
    if (cropRect) {
        // ensure square
        s = Math.min(cropRect.w, cropRect.h);
        sx = cropRect.x;
        sy = cropRect.y;
    } else {
        s = Math.min(img.width, img.height);
        sx = (img.width - s) / 2;
        sy = (img.height - s) / 2;
    }
    tmp.width = s;
    tmp.height = s;
    const tctx = tmp.getContext('2d');
    tctx.drawImage(img, sx, sy, s, s, 0, 0, s, s);

    // resize to 35x35
    const out = document.createElement('canvas');
    out.width = 35;
    out.height = 35;
    const octx = out.getContext('2d');
    octx.imageSmoothingEnabled = false;
    octx.drawImage(tmp, 0, 0, 35, 35);

    // process pixels
    const imageData = octx.getImageData(0, 0, 35, 35);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
        // convert to grayscale
        const r = data[i];
        const g = data[i+1];
        const b = data[i+2];
        let gray = Math.round(0.299*r + 0.587*g + 0.114*b);
        // threshold
        if (gray <= lowThresh) {
            gray = 0;
        } else if (gray >= highThresh) {
            gray = 255;
        }
        // invert
        gray = 255 - gray;
        data[i] = data[i+1] = data[i+2] = gray;
        // keep alpha
    }
    octx.putImageData(imageData, 0, 0);

    const resultImg = new Image();
    resultImg.src = out.toDataURL('image/png');
    return resultImg;
}

function prepareDownload(img) {
    downloadLink.href = img.src;
    downloadLink.classList.remove('hidden');
    downloadLink.textContent = 'Bild herunterladen';
}
