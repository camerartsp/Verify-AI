// Main application logic encapsulated in an IIFE (Immediately Invoked Function Expression).
// This helps to avoid polluting the global scope and keeps variables and functions private
// unless explicitly exposed (e.g., via `window` or `module.exports`).
(function() {
    // Stores files selected by the user for upload.
    let uploadedFiles = [];

    // DOMContentLoaded: Ensures the script runs after the entire HTML document is fully loaded and parsed.
    // This is a consolidated listener from previous refactorings.
    document.addEventListener('DOMContentLoaded', () => {
        // Initial news fetch based on geolocation or default
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(position => {
                const { latitude, longitude } = position.coords;
                // Attempt to determine user's region based on coordinates.
                fetchRegionFromCoords(latitude, longitude);
            }, () => {
                // If geolocation fails or is denied by the user, fetch global news.
                console.warn('Geolocation permission denied or failed. Fetching global news.');
                showGeolocationError('Geolocalização negada. Exibindo notícias globais.');
                fetchRecentNews('');
            });
        } else {
            // If the browser doesn't support geolocation, fetch global news.
            console.warn('Geolocation is not supported by this browser. Fetching global news.');
            showGeolocationError('Geolocalização não suportada. Exibindo notícias globais.');
            fetchRecentNews('');
        }

        // Event listener for the region selection dropdown.
        // When the user selects a new region, fetch news for that region.
        document.getElementById('regionSelect').addEventListener('change', (event) => {
            const selectedRegion = event.target.value;
            fetchRecentNews(selectedRegion);
            hideGeolocationError(); // Hide geolocation error if user manually selects a region
        });

        // Note: Click listeners for 'verifyButton' and 'mediaInput' (file upload)
        // are handled by inline 'onclick' and 'onchange' attributes in index.html,
        // which call globally exposed functions (verifyNews, handleFileUpload).
    });

    /**
     * Fetches the user's current country based on latitude and longitude using an external geocoding API.
     * If successful, it calls `fetchRecentNews` with the determined country.
     * Handles errors by logging them and falling back to fetching global news.
     * @param {number} lat - Latitude.
     * @param {number} lng - Longitude.
     */
    async function fetchRegionFromCoords(lat, lng) {
        const geocodeApiUrl = `https://geocode.xyz/${lat},${lng}?geoit=json`;
        // Alternative: Nominatim (OpenStreetMap)
        // const nominatimApiUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=3&accept-language=en&addressdetails=1`;

        try {
            // console.log(`Fetching region from: ${geocodeApiUrl}`); // For debugging
            const response = await fetch(geocodeApiUrl);

            if (!response.ok) {
                throw new Error(`Geolocation API request failed with status ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            // geocode.xyz specific checks: sometimes it returns an error object even with 200 OK
            if (data.error) {
                 console.error('Erro da API geocode.xyz:', data.error);
                 throw new Error(`Geocode.xyz API error: ${data.error.description || data.error.message}`);
            }

            // For geocode.xyz, country is in data.country
            // For Nominatim, it would be data.address.country_code (e.g., 'us', 'gb') or data.address.country
            const country = data.country;

            if (!country || typeof country !== 'string' || country.trim() === '') {
                throw new Error('País não encontrado ou inválido na resposta da API de geolocalização.');
            }

            console.log('Região determinada:', country);
            fetchRecentNews(country.trim());
            hideGeolocationError();
        } catch (error) {
            console.error('Erro ao determinar a região (fetchRegionFromCoords):', error.message);
            showGeolocationError('Não foi possível determinar sua região. Exibindo notícias globais.');
            fetchRecentNews(''); // Fallback to default (global news)
        }
    }

    function showGeolocationError(message) {
        let errorDiv = document.getElementById('geolocationError');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.id = 'geolocationError';
            errorDiv.style.textAlign = 'center';
            errorDiv.style.padding = '5px';
            errorDiv.style.backgroundColor = '#fffbe6'; // Light yellow
            errorDiv.style.color = '#92400e'; // Amber
            errorDiv.style.fontSize = '0.9rem';
            // Insert it somewhere sensible, e.g., before the news feed or after the header
            const newsFeed = document.getElementById('newsFeed');
            if (newsFeed) {
                newsFeed.parentNode.insertBefore(errorDiv, newsFeed);
            } else {
                // Fallback if newsFeed isn't found (though it should be)
                document.body.insertAdjacentElement('afterbegin', errorDiv);
            }
        }
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    }

    function hideGeolocationError() {
        const errorDiv = document.getElementById('geolocationError');
        if (errorDiv) {
            errorDiv.style.display = 'none';
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        // Initial news fetch based on geolocation or default
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                position => {
                    const { latitude, longitude } = position.coords;
                    fetchRegionFromCoords(latitude, longitude);
                },
                (error) => { // Error callback for getCurrentPosition
                    console.warn('Erro ao obter geolocalização do navegador:', error.message);
                    showGeolocationError('Geolocalização bloqueada ou indisponível. Exibindo notícias globais.');
                    fetchRecentNews(''); // Default call if geolocation fails or is denied
                }
            );
        } else {
            console.warn('Geolocalização não suportada por este navegador.');
            showGeolocationError('Geolocalização não suportada. Exibindo notícias globais.');
            fetchRecentNews(''); // Default call if geolocation is not available
        }

        // Consolidated regionSelect change listener
        document.getElementById('regionSelect').addEventListener('change', (event) => {
            const selectedRegion = event.target.value;
            fetchRecentNews(selectedRegion);
            hideGeolocationError(); // Hide error if user manually selects a region
        });
    });

    /**
     * Fetches recent news articles from the backend API.
     * The backend then calls the Google Custom Search API.
     * @param {string} [region=''] - The region to fetch news for (e.g., "Brasil").
     *                               If empty, fetches global news.
     */
    async function fetchRecentNews(region = '') {
        // Base query for recent news. The region can be appended or handled by the backend.
        let query = 'recent news';

        // Construct the URL for the backend API endpoint /api/search-news.
        // This endpoint abstracts the actual Google Custom Search API call.
        // The region is passed as a query parameter for the backend to use.
        const backendUrl = `/api/search-news?query=${encodeURIComponent(query)}&region=${encodeURIComponent(region)}`;

        try {
            // Make the GET request to the backend.
            const response = await fetch(backendUrl);
            if (!response.ok) {
                // If the backend returns an error, try to parse it as JSON.
                let errorData;
                try {
                    errorData = await response.json();
                } catch (e) {
                    // If the error response isn't JSON, use the status text.
                    errorData = { erro: response.statusText };
                }
                throw new Error(`Erro do servidor: ${response.status} - ${errorData.erro || 'Falha ao buscar notícias'}`);
            }
            // If successful, parse the JSON response from the backend.
            const data = await response.json();
            // Display the fetched news items in the UI.
            displayRecentNews(data.items);
        } catch (error) {
            // Log errors and display a user-friendly message in the news feed section.
            console.error('Erro ao buscar notícias recentes:', error.message);
            const newsFeed = document.getElementById('newsFeed');
            newsFeed.innerHTML = '<p class="text-red-500">Não foi possível carregar as notícias recentes. Tente novamente mais tarde.</p>';
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
} // End of duplicated displayRecentNews

    // Expose necessary functions to global scope due to inline HTML event attributes
    window.handleFileUpload = function(event) {
        const files = event.target.files;
        for (let file of files) {
            if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
                uploadedFiles.push(file);
                displayPreview(file); // Calls the IIFE-scoped displayPreview
            }
        }
    };

    function displayPreview(file) {
        const previewContainer = document.getElementById('previewContainer');
        const previewItem = document.createElement('div');
        previewItem.className = 'preview-item';

        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-btn';
        removeBtn.innerHTML = 'X';
        removeBtn.onclick = () => removeFile(file, previewItem); // Calls the IIFE-scoped removeFile

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

    /**
     * Handles the news verification process when the "Verify" button is clicked.
     * It collects text input and any uploaded files, sends them to the backend `/analisar` endpoint,
     * and then displays the analysis result (credibility score, explanation) in the UI.
     */
    window.verifyNews = async function() {
        // Get the news text or URL from the input field.
        const newsInput = document.getElementById('newsInput').value;
        // Note: `mediaInput.files` is not directly used here because `uploadedFiles` array
        // is maintained by `handleFileUpload` and `removeFile` functions.

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
        // Prepare UI elements for displaying results and loading state.
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

        // Show loading indicator and hide previous results.
        loadingDots.style.display = 'flex';
        resultContainer.classList.add('hidden');

        try {
            // Create a FormData object to send data (text and/or files) to the backend.
            // FormData is suitable for multipart/form-data requests, which is necessary for file uploads.
            const formData = new FormData();

            // Determine if the input is a URL or plain text and append it to FormData.
            const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
            if (urlPattern.test(newsInput)) {
                formData.append('url', newsInput);
            } else {
                formData.append('text', newsInput);
            }

            // Append each uploaded file to the FormData object.
            // The backend (Multer) will receive these under the field name 'media'.
            uploadedFiles.forEach((file) => {
                formData.append(`media`, file);
            });

            // Make a POST request to the `/analisar` endpoint on the server.
            const response = await fetch('/analisar', {
                method: 'POST',
                body: formData // FormData is sent as the request body.
            });

            // Check if the server response is successful.
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Parse the JSON response from the server.
            const result = await response.json();
            console.log('Resultado recebido do /analisar:', result);

            // Display the analysis results in the UI.
            resultTitle.innerText = 'Resultado da Verificação';
            resultStatus.innerText = result.eConfiavel ? 'Confiável' : 'Não Confiável';
            resultStatus.className = result.eConfiavel
                ? 'bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium'
                : 'bg-red-500 text-white px-3 py-1 rounded-full text-xs font-medium';

            // Display a truncated version of the explanation.
            const truncatedText = truncateText(result.explicacao || 'Resultado da análise indisponível.', 100);
            resultText.innerText = truncatedText;
            readMoreBtn.classList.remove('hidden'); // Show "Read More" button.

            // Set up the "Read More" button to show the full explanation in a modal.
            readMoreBtn.onclick = function () {
                modalTitle.innerText = result.eConfiavel ? 'Explicação: Conteúdo Confiável' : 'Explicação: Conteúdo Não Confiável';
                const formattedExplanation = formatExplanation(result.explicacao || 'Resultado da análise indisponível.');
                modalContent.innerHTML = `<div class="prose prose-sm sm:prose lg:prose-lg xl:prose-xl dark:prose-invert">${formattedExplanation}</div>`;
                modal.classList.remove('hidden'); // Show the modal.
            };

            // Set up the modal's close button.
            closeModalBtn.onclick = function () {
                modal.classList.add('hidden');
            };

            resultAccuracy.innerText = `Precisão: ${result.pontuacaoCredibilidade || 'N/A'}`;
            resultContainer.classList.remove('hidden'); // Show the results container.

        } catch (error) {
            // Handle errors during the verification process.
            console.error('Erro ao verificar o conteúdo:', error.message);
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

// The versions of displayRecentNews, formatExplanation, truncateText that were correctly placed
// inside the IIFE in the previous refactoring step are below.
// The duplicated ones outside the IIFE (above this comment block) will be removed by this diff.

// displayRecentNews, formatExplanation, truncateText are kept inside IIFE as they are called by functions within IIFE.
/* The following functions are correctly defined within the IIFE scope by the previous refactoring */
function displayRecentNewsScoped(newsItems) { // Renaming to avoid conflict during merge, will be displayRecentNews
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

    // Export functions for testing if in Node.js environment
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            truncateText,
            formatExplanation
            // Note: other functions are not exported as they rely on DOM or are not pure utility functions
        };
    }
})(); // End of IIFE