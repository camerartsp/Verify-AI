// Contry

document.addEventListener('DOMContentLoaded', () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            const { latitude, longitude } = position.coords;
            fetchRegionFromCoords(latitude, longitude);
        }, () => {
            fetchRecentNews();
        });
    } else {
        fetchRecentNews();
    }
});

async function fetchRegionFromCoords(lat, lng) {
    try {
        const response = await fetch(`https://geocode.xyz/${lat},${lng}?geoit=json`);
        const data = await response.json();
        const country = data.country;
        fetchRecentNews(country);
    } catch (error) {
        console.error('Erro ao determinar a região:', error);
        fetchRecentNews();
    }
}

document.getElementById('regionSelect').addEventListener('change', () => {
    const selectedRegion = document.getElementById('regionSelect').value;
    fetchRecentNews(selectedRegion);
});


document.addEventListener('DOMContentLoaded', () => {
    fetchRecentNews();
});

async function fetchRecentNews(region = '') {
    const apiKey = 'your_api_key_google';
    const cx = 'your_id_search_engine_google';
    let query = 'recent news';
    
    if (region) {
        query += ` ${region}`;
    }

    const url = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(query)}&cx=${cx}&key=${apiKey}&num=5&sort=date`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        displayRecentNews(data.items);
    } catch (error) {
        console.error('Erro ao buscar notícias recentes:', error);
    }
}

function displayRecentNews(newsItems) {
    const newsFeed = document.getElementById('newsFeed');
    newsFeed.innerHTML = ''; 

    if (newsItems && newsItems.length > 0) {
        newsItems.forEach(item => {
            const newsElement = document.createElement('div');
            newsElement.classList.add('topic', 'cursor-pointer'); 
            newsElement.innerHTML = `
                <h3 class="topic-title">${item.title}</h3>
                <p class="description-truncate">${item.snippet}</p>
                <a href="${item.link}" target="_blank" class="text-blue-500">Leia mais</a>
            `;

            newsElement.addEventListener('click', () => {
                document.getElementById('newsInput').value = item.link;
            });

            newsFeed.appendChild(newsElement);
        });
    } else {
        newsFeed.innerHTML = '<p class="text-gray-700">Nenhuma notícia encontrada.</p>';
    }
}

document.getElementById('regionSelect').addEventListener('change', (event) => {
    const region = event.target.value;
    fetchRecentNews(region);
});

fetchRecentNews('');

document.getElementById('verifyButton').addEventListener('click', () => {
    const query = document.getElementById('newsInput').value;
    if (query) {
        fetchNews(query);
    }
});

let uploadedFiles = [];

function handleFileUpload(event) {
    const files = event.target.files;
    for (let file of files) {
        if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
            uploadedFiles.push(file);
            displayPreview(file);
        }
    }
}

function displayPreview(file) {
    const previewContainer = document.getElementById('previewContainer');
    const previewItem = document.createElement('div');
    previewItem.className = 'preview-item';

    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-btn';
    removeBtn.innerHTML = 'X';
    removeBtn.onclick = () => removeFile(file, previewItem);

    if (file.type.startsWith('image/')) {
        const img = document.createElement('img');
        img.src = URL.createObjectURL(file);
        previewItem.appendChild(img);
    } else if (file.type.startsWith('video/')) {
        const video = document.createElement('video');
        video.src = URL.createObjectURL(file);
        video.controls = true;
        previewItem.appendChild(video);
    }

    previewItem.appendChild(removeBtn);
    previewContainer.appendChild(previewItem);
}

function removeFile(file, previewItem) {
    uploadedFiles = uploadedFiles.filter(f => f !== file);
    previewItem.remove();
}

async function verifyNews() {
    const newsInput = document.getElementById('newsInput').value;
    const mediaInput = document.getElementById('mediaInput').files;
    const resultContainer = document.getElementById('resultContainer');
    const resultTitle = document.getElementById('resultTitle');
    const resultStatus = document.getElementById('resultStatus');
    const resultText = document.getElementById('resultText');
    const readMoreBtn = document.getElementById('readMoreBtn');
    const resultAccuracy = document.getElementById('resultAccuracy');
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modalTitle');
    const modalContent = document.getElementById('modalContent');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const loadingDots = document.querySelector('.loading-dots');

    loadingDots.style.display = 'flex';
    resultContainer.classList.add('hidden');

    try {
        const formData = new FormData();

        // Check if the input is a URL
        const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
        if (urlPattern.test(newsInput)) {
            formData.append('url', newsInput);
        } else {
            formData.append('text', newsInput);
        }

        uploadedFiles.forEach((file, index) => {
            formData.append(`media`, file);
        });

        const response = await fetch('/analisar', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('Resultado recebido:', result);

        resultTitle.innerText = 'Resultado da Verificação';
        resultStatus.innerText = result.eConfiavel ? 'Confiável' : 'Não Confiável';
        resultStatus.className = result.eConfiavel ? 'bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium' : 'bg-red-500 text-white px-3 py-1 rounded-full text-xs font-medium';

        const truncatedText = truncateText(result.explicacao || 'Resultado da análise indisponível.', 100);
        resultText.innerText = truncatedText;
        readMoreBtn.classList.remove('hidden');

        readMoreBtn.onclick = function () {
            modalTitle.innerText = result.eConfiavel ? 'Explicação: Conteúdo Confiável' : 'Explicação: Conteúdo Não Confiável';
            const formattedExplanation = formatExplanation(result.explicacao || 'Resultado da análise indisponível.');
            modalContent.innerHTML = `
        <div class="prose prose-sm sm:prose lg:prose-lg xl:prose-xl dark:prose-invert">
            ${formattedExplanation}
        </div>
    `;
            modal.classList.remove('hidden');
        };

        closeModalBtn.onclick = function () {
            modal.classList.add('hidden');
        };

        resultAccuracy.innerText = `Precisão: ${result.pontuacaoCredibilidade || 'N/A'}`;

        resultContainer.classList.remove('hidden');
    } catch (error) {
        console.error('Erro ao verificar o conteúdo:', error);
        resultTitle.innerText = 'Erro na Verificação';
        resultStatus.innerText = 'Erro';
        resultStatus.className = 'bg-red-500 text-white px-3 py-1 rounded-full text-xs font-medium';
        resultText.innerText = 'Não foi possível verificar o conteúdo. Por favor, tente novamente mais tarde.';
        readMoreBtn.classList.add('hidden');
        resultAccuracy.innerText = '';
    } finally {
        loadingDots.style.display = 'none';
        resultContainer.classList.remove('hidden');
    }
}

function formatExplanation(text) {
    if (!text) return '<p>Nenhuma explicação disponível.</p>';

    const lines = text.split('\n');
    let formattedHtml = '';
    let inList = false;

    lines.forEach(line => {
        line = line.trim();
        if (line.startsWith('# ')) {
            formattedHtml += `<h1 class="text-2xl font-bold mb-4">${line.substring(2)}</h1>`;
        } else if (line.startsWith('## ')) {
            formattedHtml += `<h2 class="text-xl font-semibold mb-3">${line.substring(3)}</h2>`;
        } else if (line.startsWith('- ')) {
            if (!inList) {
                formattedHtml += '<ul class="list-disc pl-5 mb-3">';
                inList = true;
            }
            formattedHtml += `<li>${line.substring(2)}</li>`;
        } else {
            if (inList) {
                formattedHtml += '</ul>';
                inList = false;
            }
            if (line) {
                formattedHtml += `<p class="mb-3">${line}</p>`;
            }
        }
    });

    if (inList) {
        formattedHtml += '</ul>';
    }

    return formattedHtml;
}

function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + '...';
}