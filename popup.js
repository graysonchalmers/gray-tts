document.addEventListener('DOMContentLoaded', () => {
    // Always read the version from the manifest so the popup can never drift
    // out of sync with what's actually installed.
    const manifest = chrome.runtime.getManifest();
    const versionStamp = document.getElementById('versionStamp');
    if (versionStamp) {
        versionStamp.innerHTML = `GrayTTS ${manifest.version_name || manifest.version}<br>Made by ChatGPT and Grayson Chalmers`;
    }

    const toggleButton = document.getElementById('toggle');
    const pauseButton = document.getElementById('pause');
    const resumeButton = document.getElementById('resume');
    const stopButton = document.getElementById('stop');
    const statusText = document.getElementById('status');
    const langFilterSelect = document.getElementById('langFilter');
    const voiceSelect = document.getElementById('voice');
    const rateInput = document.getElementById('rate');
    const pitchInput = document.getElementById('pitch');
    const volumeInput = document.getElementById('volume');
    const previewError = document.getElementById('previewError');

    // Labels for the sliders
    const rateLabel = document.getElementById('rateLabel');
    const pitchLabel = document.getElementById('pitchLabel');
    const volumeLabel = document.getElementById('volumeLabel');

    let allVoices = [];
    // Voice/rate/pitch/volume remembered per language, keyed by the language filter
    // value ('' = All languages). Lets switching the filter recall what you last used
    // for that language instead of dragging the previous language's voice along.
    let perLang = {};

    // Load the full voice list once, then restore whatever the user had selected last.
    chrome.tts.getVoices(function(voices) {
        allVoices = voices;
        populateLangFilter();

        chrome.storage.sync.get('ttsSettings', function(data) {
            const rawSettings = data.ttsSettings || {};
            const wasLegacyShape = !rawSettings.perLang;
            const settings = migrateSettings(rawSettings);
            perLang = settings.perLang;
            langFilterSelect.value = settings.lang || '';
            populateVoiceDropdown(langFilterSelect.value);
            applyBucketToControls(getBucket(langFilterSelect.value));
            // Persist the migrated shape immediately so background.js (which handles
            // right-click/hotkey speech and may run before the popup is ever reopened)
            // isn't left reading the old flat shape as an empty perLang bucket.
            if (wasLegacyShape) {
                chrome.storage.sync.set({ttsSettings: settings});
            }
        });
    });

    toggleButton.addEventListener('click', () => {
        chrome.runtime.sendMessage({message: 'toggle'}, function(response) {
            if (response.status) {
                statusText.innerText = "Status: Enabled";
            } else {
                statusText.innerText = "Status: Disabled";
            }
        });
    });

    pauseButton.addEventListener('click', () => {
        chrome.runtime.sendMessage({message: 'pause'});
    });

    resumeButton.addEventListener('click', () => {
        chrome.runtime.sendMessage({message: 'resume'});
    });

    stopButton.addEventListener('click', () => {
        chrome.runtime.sendMessage({message: 'stop'});
    });

    langFilterSelect.addEventListener('change', () => {
        populateVoiceDropdown(langFilterSelect.value);
        applyBucketToControls(getBucket(langFilterSelect.value));
        sendTTSSettings();
    });

    // Send the TTS settings to the background script whenever they're changed
    voiceSelect.addEventListener('change', sendTTSSettings);
    rateInput.addEventListener('input', sendTTSSettings);
    pitchInput.addEventListener('input', sendTTSSettings);
    volumeInput.addEventListener('input', sendTTSSettings);

    // Old flat-settings shape (one global voice/rate/pitch/volume) becomes the
    // "All languages" bucket so existing installs don't lose their settings.
    function migrateSettings(settings) {
        if (settings.perLang) {
            return {lang: settings.lang || '', perLang: settings.perLang};
        }
        const legacyBucket = {};
        if (settings.voiceName !== undefined) legacyBucket.voiceName = settings.voiceName;
        if (settings.rate !== undefined) legacyBucket.rate = settings.rate;
        if (settings.pitch !== undefined) legacyBucket.pitch = settings.pitch;
        if (settings.volume !== undefined) legacyBucket.volume = settings.volume;
        const lang = settings.lang || '';
        return {lang, perLang: {[lang]: legacyBucket}};
    }

    function getBucket(lang) {
        return perLang[lang] || {};
    }

    function applyBucketToControls(bucket) {
        if (bucket.voiceName) {
            voiceSelect.value = bucket.voiceName;
        }
        rateInput.value = bucket.rate !== undefined ? bucket.rate : 1;
        pitchInput.value = bucket.pitch !== undefined ? bucket.pitch : 1;
        volumeInput.value = bucket.volume !== undefined ? bucket.volume : 1;
        rateLabel.innerText = `Rate: ${rateInput.value}`;
        pitchLabel.innerText = `Pitch: ${pitchInput.value}`;
        volumeLabel.innerText = `Volume: ${volumeInput.value}`;
    }

    function sendTTSSettings() {
        const lang = langFilterSelect.value;
        perLang[lang] = {
            voiceName: voiceSelect.value,
            rate: parseFloat(rateInput.value),
            pitch: parseFloat(pitchInput.value),
            volume: parseFloat(volumeInput.value)
        };
        const ttsSettings = {lang, perLang};
        chrome.storage.sync.set({ttsSettings}, function() {
            if (chrome.runtime.lastError) {
                console.error(chrome.runtime.lastError.message);
            }
        });
        chrome.runtime.sendMessage({message: 'update_tts_settings', ttsSettings}, function() {
            if (chrome.runtime.lastError) {
                console.error(chrome.runtime.lastError.message);
            }
        });
        // Update the labels
        rateLabel.innerText = `Rate: ${rateInput.value}`;
        pitchLabel.innerText = `Pitch: ${pitchInput.value}`;
        volumeLabel.innerText = `Volume: ${volumeInput.value}`;
    }

    function languageLabel(lang) {
        try {
            return `${new Intl.DisplayNames(['en'], {type: 'language'}).of(lang)} (${lang})`;
        } catch (e) {
            return lang;
        }
    }

    function populateLangFilter() {
        const langs = [...new Set(allVoices.map(v => v.lang).filter(Boolean))].sort();

        langFilterSelect.innerHTML = '';
        let allOption = document.createElement('option');
        allOption.value = '';
        allOption.text = `All languages (${allVoices.length})`;
        langFilterSelect.add(allOption);

        for (const lang of langs) {
            let option = document.createElement('option');
            option.value = lang;
            option.text = languageLabel(lang);
            langFilterSelect.add(option);
        }
    }

    function populateVoiceDropdown(lang) {
        const voices = lang ? allVoices.filter(v => v.lang === lang) : allVoices;
        voiceSelect.innerHTML = '';
        for (const voice of voices) {
            let option = document.createElement('option');
            option.value = voice.voiceName;
            option.text = voice.voiceName;
            voiceSelect.add(option);
        }
    }

    function showPreviewError(message) {
        if (!previewError) return;
        previewError.textContent = `⚠ ${message}`;
        previewError.style.display = 'block';
    }

    function clearPreviewError() {
        if (!previewError) return;
        previewError.style.display = 'none';
    }

    // Add an event listener for the "Preview" button
    document.getElementById('preview').addEventListener('click', () => {
        clearPreviewError();
        const sampleText = "This is a sample text for voice preview.";
        chrome.tts.speak(sampleText, {
            voiceName: voiceSelect.value,
            rate: parseFloat(rateInput.value),
            pitch: parseFloat(pitchInput.value),
            volume: parseFloat(volumeInput.value),
            onEvent: function(event) {
                if (event.type === 'error') {
                    showPreviewError(event.errorMessage || 'Speech failed');
                }
            }
        });
    });
});
