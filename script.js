// Variables globales
let selectedFiles = [];
let convertedImages = [];

// Éléments DOM
const uploadZone = document.getElementById('uploadZone');
const fileInput = document.getElementById('fileInput');
const previewSection = document.getElementById('previewSection');
const previewGrid = document.getElementById('previewGrid');
const resultsSection = document.getElementById('resultsSection');
const resultsGrid = document.getElementById('resultsGrid');
const convertBtn = document.getElementById('convertBtn');
const clearBtn = document.getElementById('clearBtn');
const downloadAllBtn = document.getElementById('downloadAllBtn');
const convertMoreBtn = document.getElementById('convertMoreBtn');
const loadingModal = document.getElementById('loadingModal');

// Événements de glisser-déposer
uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.classList.add('dragover');
});

uploadZone.addEventListener('dragleave', () => {
    uploadZone.classList.remove('dragover');
});

uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.classList.remove('dragover');
    handleFiles(e.dataTransfer.files);
});

uploadZone.addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
});

// Boutons
convertBtn.addEventListener('click', convertImages);
clearBtn.addEventListener('click', clearAll);
downloadAllBtn.addEventListener('click', downloadAll);
convertMoreBtn.addEventListener('click', resetConverter);

// Fonctions
function handleFiles(files) {
    const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
        alert('Veuillez sélectionner des fichiers images valides.');
        return;
    }

    selectedFiles = [...selectedFiles, ...imageFiles];
    updatePreview();
}

function updatePreview() {
    if (selectedFiles.length === 0) {
        previewSection.style.display = 'none';
        return;
    }

    previewSection.style.display = 'block';
    previewGrid.innerHTML = '';

    selectedFiles.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const previewItem = document.createElement('div');
            previewItem.className = 'preview-item';
            previewItem.innerHTML = `
                <button class="remove-btn" onclick="removeFile(${index})">×</button>
                <img src="${e.target.result}" alt="${file.name}">
                <div class="file-name">${file.name}</div>
                <div class="file-size">${formatFileSize(file.size)}</div>
            `;
            previewGrid.appendChild(previewItem);
        };
        reader.readAsDataURL(file);
    });
}

function removeFile(index) {
    selectedFiles.splice(index, 1);
    updatePreview();
}

function clearAll() {
    selectedFiles = [];
    updatePreview();
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function convertImages() {
    if (selectedFiles.length === 0) return;

    showLoading(true);
    convertedImages = [];

    for (let i = 0; i < selectedFiles.length; i++) {
        try {
            const convertedImage = await convertToPNG(selectedFiles[i]);
            convertedImages.push({
                name: selectedFiles[i].name.replace(/\.[^/.]+$/, '') + '.png',
                dataURL: convertedImage
            });
        } catch (error) {
            console.error('Erreur de conversion:', error);
        }
    }

    showLoading(false);
    showResults();
}

function convertToPNG(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                
                canvas.toBlob((blob) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.readAsDataURL(blob);
                }, 'image/png');
            };
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function showLoading(show) {
    loadingModal.style.display = show ? 'flex' : 'none';
}

function showResults() {
    previewSection.style.display = 'none';
    resultsSection.style.display = 'block';
    
    resultsGrid.innerHTML = '';
    
    convertedImages.forEach((image, index) => {
        const resultItem = document.createElement('div');
        resultItem.className = 'result-item';
        resultItem.innerHTML = `
            <img src="${image.dataURL}" alt="${image.name}">
            <div class="file-name">${image.name}</div>
            <button class="btn btn-primary" onclick="downloadImage(${index})">
                Télécharger
            </button>
        `;
        resultsGrid.appendChild(resultItem);
    });
}

function downloadImage(index) {
    const image = convertedImages[index];
    const link = document.createElement('a');
    link.download = image.name;
    link.href = image.dataURL;
    link.click();
}

function downloadAll() {
    convertedImages.forEach((image, index) => {
        setTimeout(() => downloadImage(index), index * 200);
    });
}

function resetConverter() {
    selectedFiles = [];
    convertedImages = [];
    previewSection.style.display = 'none';
    resultsSection.style.display = 'none';
    fileInput.value = '';
}

// ---------------------------------------------------------
// Contrôle audio de fond (play / pause) en haut à droite
// ---------------------------------------------------------
(() => {
    const bgAudio = document.getElementById('bgAudio');
    const audioToggle = document.getElementById('audioToggle');

    if (!bgAudio || !audioToggle) return; // sécurité

    // Met à jour l'icone / label du bouton selon l'état
    function updateAudioButton() {
        if (bgAudio.paused) {
            audioToggle.textContent = '▶';
            audioToggle.title = 'Lire la musique';
            audioToggle.setAttribute('aria-pressed', 'false');
        } else {
            audioToggle.textContent = '⏸';
            audioToggle.title = 'Mettre la musique en pause';
            audioToggle.setAttribute('aria-pressed', 'true');
        }
    }

    // Tenter de lire l'audio en gérant la promesse (autoplay bloqué possible)
    function tryPlay() {
        const p = bgAudio.play();
        if (p !== undefined) {
            p.catch(() => {
                // autoplay bloqué, on reste en pause jusqu'à action utilisateur
                updateAudioButton();
            });
        }
    }

    // Toggle play/pause manuellement
    audioToggle.addEventListener('click', () => {
        if (bgAudio.paused) {
            tryPlay();
        } else {
            bgAudio.pause();
        }
        // Sauvegarde de l'état souhaité
        setTimeout(() => {
            localStorage.setItem('audioPlaying', (!bgAudio.paused).toString());
            updateAudioButton();
        }, 0);
    });

    // Mettre à jour le bouton quand l'audio change d'état
    bgAudio.addEventListener('play', updateAudioButton);
    bgAudio.addEventListener('pause', updateAudioButton);

    // Au chargement de la page, essayer de restaurer l'état précédent.
    // Comportement : si l'utilisateur avait explicitement choisi "pause" (saved === 'false'),
    // on respecte cette préférence. Sinon (saved === 'true' ou pas de préférence),
    // on tente de démarrer la musique par défaut.
    window.addEventListener('load', () => {
        const saved = localStorage.getItem('audioPlaying');
        if (saved === 'true' || saved === null) {
            tryPlay();
        }
        updateAudioButton();
    });

})();