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

// Nouveau bouton "Choisir des images" (sera aussi utilisé pour démarrer la musique)
const chooseBtn = document.getElementById('chooseBtn');

if (chooseBtn) {
    chooseBtn.addEventListener('click', (e) => {
        const bg = document.getElementById('bgAudio');

        // Si le comportement fuyant n'est pas actif : premier clic classique
        if (!evasiveActive) {
            // Ouvre la sélection de fichiers
            fileInput.click();

            // Tenter de démarrer la musique (interaction utilisateur)
            if (window.tryPlayBackgroundAudio) {
                window.tryPlayBackgroundAudio();
            } else if (bg) {
                const p = bg.play();
                if (p !== undefined) p.catch(() => {});
                localStorage.setItem('audioPlaying', 'true');
            }

            // Démarrer le comportement fuyant après le premier clic
            enableEvasive();
            return;
        }

        // Si le bouton est déjà fuyant et que l'utilisateur parvient à cliquer
        // on bascule la musique (pause si en lecture, lire si en pause)
        if (bg) {
            if (bg.paused) {
                // essayer de relancer
                const p = bg.play();
                if (p !== undefined) p.catch(() => {});
                localStorage.setItem('audioPlaying', 'true');
            } else {
                bg.pause();
                localStorage.setItem('audioPlaying', 'false');
            }
        }
    });
}

// ---------- Comportement fuyant du bouton "Choisir des images" ----------
let evasiveActive = false;
let _mouseMoveHandler = null;
let _evasiveInterval = null;

function enableEvasive() {
    if (!chooseBtn) return;
    if (evasiveActive) return;
    evasiveActive = true;
    chooseBtn.classList.add('fleeing');

    // Forcer fixed pour parcourir tout l'écran
    chooseBtn.style.position = 'fixed';

    // Position initiale (bas-centre) relative au viewport
    const bRect = chooseBtn.getBoundingClientRect();
    const initLeft = Math.max(8, (window.innerWidth - bRect.width) / 2);
    const initTop = Math.max(8, window.innerHeight - bRect.height - 18);
    chooseBtn.style.left = initLeft + 'px';
    chooseBtn.style.top = initTop + 'px';

    const threshold = 140; // distance en px à partir de laquelle le bouton commence à fuir

    _mouseMoveHandler = (e) => {
        const btnRect = chooseBtn.getBoundingClientRect();
        const mouseX = e.clientX;
        const mouseY = e.clientY;

        const btnCenterX = btnRect.left + btnRect.width / 2;
        const btnCenterY = btnRect.top + btnRect.height / 2;

        const dx = btnCenterX - mouseX;
        const dy = btnCenterY - mouseY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < threshold) {
            // Calculer nouvelle position : s'éloigner du curseur
            const angle = Math.atan2(dy, dx);
            const moveDist = Math.max(80, (threshold - dist) * 1.8);

            let newCenterX = btnCenterX + Math.cos(angle) * moveDist;
            let newCenterY = btnCenterY + Math.sin(angle) * moveDist;

            let newLeft = newCenterX - btnRect.width / 2;
            let newTop = newCenterY - btnRect.height / 2;

            // Clamp dans la fenêtre
            newLeft = Math.max(8, Math.min(newLeft, window.innerWidth - btnRect.width - 8));
            newTop = Math.max(8, Math.min(newTop, window.innerHeight - btnRect.height - 8));

            chooseBtn.style.left = newLeft + 'px';
            chooseBtn.style.top = newTop + 'px';
        }
    };

    document.addEventListener('mousemove', _mouseMoveHandler);

    // Mouvement aléatoire périodique sur tout le viewport
    _evasiveInterval = setInterval(() => {
        if (!evasiveActive) return;
        const btnRectNow = chooseBtn.getBoundingClientRect();
        const randX = Math.random() * (window.innerWidth - btnRectNow.width - 16) + 8;
        const randY = Math.random() * (window.innerHeight - btnRectNow.height - 16) + 8;
        chooseBtn.style.left = randX + 'px';
        chooseBtn.style.top = randY + 'px';
    }, 1500 + Math.random() * 1200);
}

function disableEvasive() {
    if (!evasiveActive) return;
    evasiveActive = false;
    chooseBtn.classList.remove('fleeing');
    if (_mouseMoveHandler) document.removeEventListener('mousemove', _mouseMoveHandler);
    if (_evasiveInterval) clearInterval(_evasiveInterval);
    _mouseMoveHandler = null;
    _evasiveInterval = null;

    // Rétablir le flux normal : on remet le bouton en position initiale CSS
    chooseBtn.style.position = '';
    chooseBtn.style.left = '';
    chooseBtn.style.top = '';
    chooseBtn.style.transform = '';
}

// Arrêter le comportement fuyant quand l'utilisateur a sélectionné des fichiers
if (fileInput) {
    fileInput.addEventListener('change', () => {
        // Si au moins un fichier sélectionné, on arrête
        if (fileInput.files && fileInput.files.length > 0) {
            disableEvasive();
        }
    });
}

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
// Contrôle audio de fond — lecture automatique/restauration
// La lecture peut être déclenchée par le bouton "Choisir des images"
// ---------------------------------------------------------
(() => {
    const bgAudio = document.getElementById('bgAudio');
    if (!bgAudio) return; // sécurité

    // Tenter de lire l'audio en gérant la promesse (autoplay bloqué possible)
    function tryPlay() {
        const p = bgAudio.play();
        if (p !== undefined) {
            p.catch(() => {
                // autoplay bloqué, on reste en pause jusqu'à action utilisateur
            });
        }
    }

    // Sauvegarde de l'état souhaité lors des changements
    bgAudio.addEventListener('play', () => localStorage.setItem('audioPlaying', 'true'));
    bgAudio.addEventListener('pause', () => localStorage.setItem('audioPlaying', 'false'));

    // Au chargement de la page, essayer de restaurer l'état précédent.
    window.addEventListener('load', () => {
        const saved = localStorage.getItem('audioPlaying');
        if (saved === 'true' || saved === null) {
            tryPlay();
        }
    });

    // Rendre accessible la fonction tryPlay pour d'autres handlers (ex: chooseBtn)
    window.tryPlayBackgroundAudio = tryPlay;
})();