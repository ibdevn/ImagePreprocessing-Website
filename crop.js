// client-side processing of the cropped canvas and generation of .npy file

const fileInput = document.getElementById('file-input');
const preview = document.getElementById('preview');
const zoomInBtn = document.getElementById('zoom-in');
const zoomOutBtn = document.getElementById('zoom-out');
const saveBtn = document.getElementById('save');
let cropper;

fileInput.addEventListener('change', (evt) => {
    const file = evt.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    preview.src = url;
    preview.style.display = 'block';

    if (cropper) {
        cropper.destroy();
    }
    cropper = new Cropper(preview, {
        viewMode: 1,
        aspectRatio: 1,
        autoCropArea: 1,
        movable: true,
        zoomable: true,
        background: false
    });

    zoomInBtn.disabled = false;
    zoomOutBtn.disabled = false;
    saveBtn.disabled = false;
});

zoomInBtn.addEventListener('click', () => {
    if (cropper) cropper.zoom(0.1);
});
zoomOutBtn.addEventListener('click', () => {
    if (cropper) cropper.zoom(-0.1);
});

saveBtn.addEventListener('click', () => {
    if (!cropper) return;
    const canvas = cropper.getCroppedCanvas({ width: 300, height: 300 });
    processCanvas(canvas);
});

function processCanvas(canvas) {
    const ctx = canvas.getContext('2d');
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;

    // grayscale and contrast
    for (let i = 0; i < data.length; i += 4) {
        let gray = data[i] * 0.299 + data[i+1] * 0.587 + data[i+2] * 0.114;
        // contrast enhance: factor 1.8 around mid 128
        gray = (gray - 128) * 1.8 + 128;
        gray = Math.max(0, Math.min(255, gray));
        data[i] = data[i+1] = data[i+2] = gray;
    }
    ctx.putImageData(imgData, 0, 0);

    // threshold and invert using a second pass
    for (let i = 0; i < data.length; i += 4) {
        let v = data[i];
        if (v < 80) v = 0;
        v = 255 - v; // invert
        data[i] = data[i+1] = data[i+2] = v;
    }
    ctx.putImageData(imgData, 0, 0);

    // resize to 35x35 using temporary canvas
    const small = document.createElement('canvas');
    small.width = 35;
    small.height = 35;
    small.getContext('2d').drawImage(canvas, 0, 0, 35, 35);
    const smallData = small.getContext('2d').getImageData(0, 0, 35, 35).data;

    // build float32 normalized array
    const arr = new Float32Array(35 * 35);
    for (let y = 0; y < 35; y++) {
        for (let x = 0; x < 35; x++) {
            const idx = (y * 35 + x) * 4;
            arr[y * 35 + x] = smallData[idx] / 255.0;
        }
    }

    const npyBlob = makeNpy(arr, [35, 35], 'float32');
    downloadBlob(npyBlob, 'cropped.npy');
}

// simple .npy writer adapted from https://stackoverflow.com/a/18639999/466860
function makeNpy(data, shape, dtype) {
    function dtypeDescriptor(dtypestr) {
        const map = {
            'float32': '<f4',
            'float64': '<f8'
        };
        return map[dtypestr];
    }

    const headerDict = {
        descr: dtypeDescriptor(dtype),
        fortran_order: false,
        shape: shape
    };
    let header = JSON.stringify(headerDict)
        .replace(/\{/g, '{')
        .replace(/\}/g, '}');
    header = header.replace(/"/g, "'");
    const padLen = 16 - ((10 + header.length) % 16);
    header = header + ' '.repeat(padLen) + '\n';

    const encoder = new TextEncoder();
    const headerBytes = encoder.encode('\x93NUMPY\x01\x00' + String.fromCharCode(header.length % 256, Math.floor(header.length / 256)) + header);

    let dataBytes;
    if (data instanceof Float32Array) {
        dataBytes = new Uint8Array(data.buffer);
    } else {
        dataBytes = new Uint8Array(data);
    }

    const blob = new Blob([headerBytes, dataBytes], { type: 'application/octet-stream' });
    return blob;
}

function downloadBlob(blob, filename) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
}