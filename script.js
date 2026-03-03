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

fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (!file) return;
    const img = new Image();
    img.onload = () => {
        originalImage = img;
        drawPreview(img);
    };
    img.src = URL.createObjectURL(file);
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
    const processed = processImage(originalImage, low, high);
    drawPreview(processed, true);
    prepareDownload(processed);
});

function drawPreview(img, scaleUp = false) {
    const ctx = previewCanvas.getContext('2d');
    let w = img.width;
    let h = img.height;
    // scale down large images for the preview (max 350px)
    if (!scaleUp) {
        const max = 350;
        if (w > max || h > max) {
            const factor = max / Math.max(w, h);
            w *= factor;
            h *= factor;
        }
    } else {
        // if we want to see a bigger preview, scale to ~350px (keeping aspect ratio)
        const factor = 350 / Math.max(w, h);
        w *= factor;
        h *= factor;
    }
    previewCanvas.width = w;
    previewCanvas.height = h;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, 0, 0, w, h);
}

// returns an Image element containing the processed 35x35 result
function processImage(img, lowThresh, highThresh) {
    // draw into temporary canvas
    const tmp = document.createElement('canvas');
    const s = Math.min(img.width, img.height);
    tmp.width = s;
    tmp.height = s;
    const tctx = tmp.getContext('2d');
    // crop center square
    const sx = (img.width - s) / 2;
    const sy = (img.height - s) / 2;
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
