// 初始化 FilePond
const pond = FilePond.create(document.querySelector('input[type="file"]'), {
    allowMultiple: true,
    acceptedFileTypes: ['image/*'],
    labelIdle: '拖放图片或点击选择图片',
    allowRemove: true,
});

// 监听文件添加事件
pond.on('addfile', (error, file) => {
    if (error) {
        console.error('文件添加失败:', error);
        return;
    }
    const imageGrid = document.getElementById('image-grid');

    const existingImage = Array.from(imageGrid.querySelectorAll('img')).find(
        img => img.dataset.fileId === file.id
    );

    if (!existingImage) {
        const img = document.createElement('img');
        img.src = URL.createObjectURL(file.file);
        img.dataset.rotate = 0;
        img.dataset.mirror = 'false';
        img.dataset.fileId = file.id;
        imageGrid.appendChild(img);
        imageGrid.style.display = 'grid';
    }
});

// 监听文件删除事件
pond.on('removefile', (error, file) => {
    if (error) {
        console.error('文件删除失败:', error);
        return;
    }
    const imageGrid = document.getElementById('image-grid');
    imageGrid.querySelectorAll('img').forEach(img => {
        if (img.dataset.fileId === file.id) {
            img.remove();
        }
    });
    if (imageGrid.children.length === 0) {
        imageGrid.style.display = 'none';
    }
});

// 绑定按钮事件
document.getElementById('rotate-button').addEventListener('click', rotateImages);
document.getElementById('mirror-button').addEventListener('click', mirrorImages);
document.getElementById('rotate-mirror-button').addEventListener('click', rotateMirrorImages);
document.getElementById('save-button').addEventListener('click', saveImages);
document.getElementById('clear-button').addEventListener('click', clearImages);
document.getElementById('other-tools-button').addEventListener('click', () => {
    document.getElementById('other-tools-modal').style.display = 'flex';
});
// 绑定“二维码合并工具”按钮事件
document.getElementById('qr-merge-tool-button').addEventListener('click', () => {
    window.location.href = 'https://image.iclass30.cloud/QRMerge.html';
});
document.getElementById('close-other-tools-modal').addEventListener('click', () => {
    document.getElementById('other-tools-modal').style.display = 'none';
});

// 旋转图片
function rotateImages() {
    const images = document.querySelectorAll('.image-grid img');
    images.forEach(img => {
        let currentRotate = parseInt(img.dataset.rotate) || 0;
        currentRotate = (currentRotate + 90) % 360;
        img.dataset.rotate = currentRotate;
        applyTransform(img);
    });
}

// 镜像图片
function mirrorImages() {
    const images = document.querySelectorAll('.image-grid img');
    images.forEach(img => {
        img.dataset.mirror = img.dataset.mirror === 'true' ? 'false' : 'true';
        applyTransform(img);
    });
}

// 旋转并镜像图片
function rotateMirrorImages() {
    const images = document.querySelectorAll('.image-grid img');
    images.forEach(img => {
        let currentRotate = parseInt(img.dataset.rotate) || 0;
        currentRotate = (currentRotate + 180) % 360;
        img.dataset.rotate = currentRotate;
        img.dataset.mirror = img.dataset.mirror === 'true' ? 'false' : 'true';
        applyTransform(img);
    });
}

// 应用变换
function applyTransform(img) {
    const rotate = parseInt(img.dataset.rotate) || 0;
    const isMirrored = img.dataset.mirror === 'true';
    img.style.transform = `rotate(${rotate}deg) ${isMirrored ? 'scaleX(-1)' : ''}`;
}

// 水印设置弹窗
document.getElementById('watermark-button').addEventListener('click', () => {
    document.getElementById('watermark-modal').style.display = 'block';
});

document.getElementById('close-modal').addEventListener('click', () => {
    document.getElementById('watermark-modal').style.display = 'none';
});

document.getElementById('apply-watermark').addEventListener('click', () => {
    const watermarkText = document.getElementById('text').value;
    const watermarkColor = document.getElementById('color').value;
    const watermarkAlpha = parseFloat(document.getElementById('alpha').value);
    const watermarkAngle = parseFloat(document.getElementById('angle').value);
    const watermarkSpace = parseFloat(document.getElementById('space').value);
    const watermarkSize = parseFloat(document.getElementById('size').value);

    addWatermark(watermarkText, watermarkColor, watermarkAlpha, watermarkAngle, watermarkSpace, watermarkSize);
    document.getElementById('watermark-modal').style.display = 'none';
});

// 添加水印
function addWatermark(text, color, alpha, angle, space, size) {
    const images = document.querySelectorAll('.image-grid img');
    if (images.length === 0) {
        alert('请先导入图片！');
        return;
    }

    images.forEach(img => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        ctx.font = `${canvas.width * 0.05 * size}px Arial`;
        ctx.fillStyle = `rgba(${parseInt(color.slice(1, 3), 16)}, ${parseInt(color.slice(3, 5), 16)}, ${parseInt(color.slice(5, 7), 16)}, ${alpha})`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((angle * Math.PI) / 180);

        const textWidth = ctx.measureText(text).width;
        const textHeight = parseInt(ctx.font, 10);
        for (let x = -canvas.width; x < canvas.width * 2; x += textWidth * space) {
            for (let y = -canvas.height; y < canvas.height * 2; y += textHeight * space) {
                ctx.fillText(text, x, y);
            }
        }

        img.src = canvas.toDataURL('image/png');
    });
}

// 保存图片为ZIP文件
async function saveImages() {
    const images = document.querySelectorAll('.image-grid img');
    if (images.length === 0) {
        alert('请先导入图片！');
        return;
    }

    const zip = new JSZip();
    const folder = zip.folder('edited-images');

    await Promise.all(Array.from(images).map(async (img, index) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        const maxSize = 1024;
        let width = img.naturalWidth;
        let height = img.naturalHeight;
        if (width > maxSize || height > maxSize) {
            const ratio = Math.min(maxSize / width, maxSize / height);
            width = Math.floor(width * ratio);
            height = Math.floor(height * ratio);
        }
        canvas.width = width;
        canvas.height = height;

        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((parseInt(img.dataset.rotate) || 0) * Math.PI / 180);
        if (img.dataset.mirror === 'true') {
            ctx.scale(-1, 1);
        }
        ctx.drawImage(img, -canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);
        ctx.restore();

        return new Promise(resolve => {
            canvas.toBlob(blob => {
                folder.file(`image-${index + 1}.png`, blob);
                resolve();
            }, 'image/png', 0.8);
        });
    }));

    zip.generateAsync({ type: 'blob' }).then(content => {
        saveAs(content, 'edited-images.zip');
    });
}

// 清空图片
function clearImages() {
    const imageGrid = document.getElementById('image-grid');
    imageGrid.innerHTML = '';
    imageGrid.style.display = 'none';
    pond.removeFiles();
}
