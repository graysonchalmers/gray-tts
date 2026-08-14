document.addEventListener('DOMContentLoaded', () => {
    // Always read the version from the manifest so the popup can never drift
    // out of sync with what's actually installed.
    const manifest = chrome.runtime.getManifest();
    const versionStamp = document.getElementById('versionStamp');
    if (versionStamp) {
        versionStamp.innerHTML = `GrayTTS ${manifest.version_name || manifest.version}<br>Made by Grayson Chalmers and coding agents`;
    }

    const toggleButton = document.getElementById('toggle');
    const pauseResumeButton = document.getElementById('pauseResume');
    const stopButton = document.getElementById('stop');
    const statusText = document.getElementById('status');
    const langFilterSelect = document.getElementById('langFilter');
    const voiceSelect = document.getElementById('voice');
    const rateInput = document.getElementById('rate');
    const pitchInput = document.getElementById('pitch');
    const volumeInput = document.getElementById('volume');
    const previewError = document.getElementById('previewError');
    const showHighlightCheckbox = document.getElementById('showHighlight');
    const showOverlayCheckbox = document.getElementById('showOverlay');

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
            const settings = GrayTTSSettings.migrateSettings(rawSettings);
            perLang = settings.perLang;
            langFilterSelect.value = settings.lang || '';
            populateVoiceDropdown(langFilterSelect.value);
            applyBucketToControls(GrayTTSSettings.getBucket(perLang, langFilterSelect.value));
            showHighlightCheckbox.checked = rawSettings.showHighlight !== false;
            showOverlayCheckbox.checked = rawSettings.showOverlay !== false;
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

    // Speech state ('idle' | 'speaking' | 'paused') lives in chrome.storage.session, written
    // by background.js's chrome.tts event handlers — the popup is ephemeral and reopens fresh
    // each time, so it can't track this itself. Read it on open and stay live via
    // storage.onChanged so the button label never lies about whether it's actually paused.
    let speechState = 'idle';

    function applySpeechStateToButton() {
        if (speechState === 'paused') {
            pauseResumeButton.textContent = 'Resume';
            pauseResumeButton.disabled = false;
        } else if (speechState === 'speaking') {
            pauseResumeButton.textContent = 'Pause';
            pauseResumeButton.disabled = false;
        } else {
            pauseResumeButton.textContent = 'Pause';
            pauseResumeButton.disabled = true;
        }
    }

    chrome.storage.session.get('speechState', (data) => {
        speechState = (data && data.speechState) || 'idle';
        applySpeechStateToButton();
    });

    chrome.storage.onChanged.addListener((changes, area) => {
        if (area === 'session' && changes.speechState) {
            speechState = changes.speechState.newValue || 'idle';
            applySpeechStateToButton();
        }
    });

    pauseResumeButton.addEventListener('click', () => {
        if (speechState === 'paused') {
            chrome.runtime.sendMessage({message: 'resume'});
        } else if (speechState === 'speaking') {
            chrome.runtime.sendMessage({message: 'pause'});
        }
    });

    stopButton.addEventListener('click', () => {
        chrome.runtime.sendMessage({message: 'stop'});
    });

    const saveClipButton = document.getElementById('saveClip');
    const saveClipError = document.getElementById('saveClipError');

    function showSaveClipError(message) {
        if (!saveClipError) return;
        saveClipError.textContent = `⚠ ${message}`;
        saveClipError.style.display = 'block';
    }

    function clearSaveClipError() {
        if (!saveClipError) return;
        saveClipError.style.display = 'none';
    }

    saveClipButton.addEventListener('click', () => {
        clearSaveClipError();
        chrome.runtime.sendMessage({message: 'save_clip_from_popup'}, (response) => {
            if (chrome.runtime.lastError) return; // popup already closed — nothing to show
            if (response && response.error) showSaveClipError(response.error);
        });
    });

    langFilterSelect.addEventListener('change', () => {
        populateVoiceDropdown(langFilterSelect.value);
        applyBucketToControls(GrayTTSSettings.getBucket(perLang, langFilterSelect.value));
        sendTTSSettings();
    });

    // Send the TTS settings to the background script whenever they're changed
    voiceSelect.addEventListener('change', sendTTSSettings);
    rateInput.addEventListener('input', sendTTSSettings);
    pitchInput.addEventListener('input', sendTTSSettings);
    volumeInput.addEventListener('input', sendTTSSettings);
    showHighlightCheckbox.addEventListener('change', sendTTSSettings);
    showOverlayCheckbox.addEventListener('change', sendTTSSettings);

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
        const ttsSettings = {
            lang,
            perLang,
            showHighlight: showHighlightCheckbox.checked,
            showOverlay: showOverlayCheckbox.checked
        };
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
