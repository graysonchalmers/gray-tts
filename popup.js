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
    const statusText = document.getElementById('status');
    const langFilterSelect = document.getElementById('langFilter');
    const voiceSelect = document.getElementById('voice');
    const rateInput = document.getElementById('rate');
    const pitchInput = document.getElementById('pitch');
    const volumeInput = document.getElementById('volume');

    // Labels for the sliders
    const rateLabel = document.getElementById('rateLabel');
    const pitchLabel = document.getElementById('pitchLabel');
    const volumeLabel = document.getElementById('volumeLabel');

    let allVoices = [];

    // Load the full voice list once, then restore whatever the user had selected last.
    chrome.tts.getVoices(function(voices) {
        allVoices = voices;
        populateLangFilter();

        chrome.storage.sync.get('ttsSettings', function(data) {
            const settings = data.ttsSettings || {};
            langFilterSelect.value = settings.lang || '';
            populateVoiceDropdown(langFilterSelect.value);
            if (settings.voiceName) {
                voiceSelect.value = settings.voiceName;
            }
            if (settings.rate !== undefined) {
                rateInput.value = settings.rate;
                rateLabel.innerText = `Rate: ${settings.rate}`;
            }
            if (settings.pitch !== undefined) {
                pitchInput.value = settings.pitch;
                pitchLabel.innerText = `Pitch: ${settings.pitch}`;
            }
            if (settings.volume !== undefined) {
                volumeInput.value = settings.volume;
                volumeLabel.innerText = `Volume: ${settings.volume}`;
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

    langFilterSelect.addEventListener('change', () => {
        populateVoiceDropdown(langFilterSelect.value);
        sendTTSSettings();
    });

    // Send the TTS settings to the background script whenever they're changed
    voiceSelect.addEventListener('change', sendTTSSettings);
    rateInput.addEventListener('input', sendTTSSettings);
    pitchInput.addEventListener('input', sendTTSSettings);
    volumeInput.addEventListener('input', sendTTSSettings);

    function sendTTSSettings() {
        let ttsSettings = {
            message: 'update_tts_settings',
            ttsSettings: {
                lang: langFilterSelect.value,
                voiceName: voiceSelect.value,
                rate: parseFloat(rateInput.value),
                pitch: parseFloat(pitchInput.value),
                volume: parseFloat(volumeInput.value)
            }
        };
        chrome.runtime.sendMessage(ttsSettings, function(response) {
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

    // Add an event listener for the "Preview" button
    document.getElementById('preview').addEventListener('click', () => {
        const sampleText = "This is a sample text for voice preview.";
        chrome.tts.speak(sampleText, {
            voiceName: voiceSelect.value,
            rate: parseFloat(rateInput.value),
            pitch: parseFloat(pitchInput.value),
            volume: parseFloat(volumeInput.value)
        });
    });
});
