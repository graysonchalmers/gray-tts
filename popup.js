document.addEventListener('DOMContentLoaded', () => {
    const toggleButton = document.getElementById('toggle');
    const pauseButton = document.getElementById('pause');
    const statusText = document.getElementById('status');
    const voiceSelect = document.getElementById('voice');
    const engineSelect = document.getElementById('engine');
    const rateInput = document.getElementById('rate');
    const pitchInput = document.getElementById('pitch');
    const volumeInput = document.getElementById('volume');

    // Labels for the sliders
    const rateLabel = document.getElementById('rateLabel');
    const pitchLabel = document.getElementById('pitchLabel');
    const volumeLabel = document.getElementById('volumeLabel');

    // Populate the voice dropdown
    populateVoiceDropdown();

    // Get the current TTS settings from storage and update the controls
    chrome.storage.sync.get('ttsSettings', function(data) {
        if (data.ttsSettings) {
            voiceSelect.value = data.ttsSettings.voiceName;
            engineSelect.value = data.ttsSettings.engine || 'webSpeech';
            rateInput.value = data.ttsSettings.rate;
            pitchInput.value = data.ttsSettings.pitch;
            volumeInput.value = data.ttsSettings.volume;
            // Update the labels
            rateLabel.innerText = `Rate: ${data.ttsSettings.rate}`;
            pitchLabel.innerText = `Pitch: ${data.ttsSettings.pitch}`;
            volumeLabel.innerText = `Volume: ${data.ttsSettings.volume}`;
        }
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

    // Send the TTS settings to the background script whenever they're changed
    voiceSelect.addEventListener('change', sendTTSSettings);
    engineSelect.addEventListener('change', sendTTSSettings);
    rateInput.addEventListener('input', sendTTSSettings);
    pitchInput.addEventListener('input', sendTTSSettings);
    volumeInput.addEventListener('input', sendTTSSettings);

    function sendTTSSettings() {
        let selectedOption = voiceSelect.value.split(" - ");
        let engine = selectedOption[0] === "Web Speech API" ? 'webSpeech' : 'responsiveVoice';
        let voiceName = selectedOption[1];
        let ttsSettings = {
            message: 'update_tts_settings',
            ttsSettings: {
                voiceName: voiceName,
                engine: engine,
                rate: parseFloat(rateInput.value),
                pitch: parseFloat(pitchInput.value),
                volume: parseFloat(volumeInput.value)
            }
        };
        if (!previewing) {
            chrome.runtime.sendMessage(ttsSettings, function(response) {
                if (chrome.runtime.lastError) {
                    console.error(chrome.runtime.lastError.message);
                }
            });
        }
        // Update the labels
        rateLabel.innerText = `Rate: ${rateInput.value}`;
        pitchLabel.innerText = `Pitch: ${pitchInput.value}`;
        volumeLabel.innerText = `Volume: ${volumeInput.value}`;
    }

    function populateVoiceDropdown() {
        // Clear the current options
        voiceSelect.innerHTML = '';

        // Populate the dropdown with the voices from the selected engine
        if (engineSelect.value === 'webSpeech') {
            chrome.tts.getVoices(function(voices) {
                for (let i = 0; i < voices.length; i++) {
                    let option = document.createElement('option');
                    option.text = "Web Speech API - " + voices[i].voiceName;
                    voiceSelect.add(option);
                }
            });
        } else {
            let rvVoices = responsiveVoice.getVoices();
            for (let i = 0; i < rvVoices.length; i++) {
                let option = document.createElement('option');
                option.text = "ResponsiveVoice - " + rvVoices[i].name;
                voiceSelect.add(option);
            }
        }
    }

    function previewVoice() {
        let selectedOption = voiceSelect.value.split(" - ");
        let engine = selectedOption[0] === "Web Speech API" ? 'webSpeech' : 'responsiveVoice';
        let voiceName = selectedOption[1];
        let sampleText = "This is a sample text for voice preview.";

        if (engine === 'webSpeech') {
            chrome.tts.speak(sampleText, {
                voiceName: voiceName,
                rate: parseFloat(rateInput.value),
                pitch: parseFloat(pitchInput.value),
                volume: parseFloat(volumeInput.value)
            });
        } else {
            responsiveVoice.speak(sampleText, voiceName, {
                rate: parseFloat(rateInput.value),
                pitch: parseFloat(pitchInput.value),
                volume: parseFloat(volumeInput.value)
            });
        }
    }

    // Populate the voice dropdown with ResponsiveVoice voices
    let rvVoices = responsiveVoice.getVoices();
    for (let i = 0; i < rvVoices.length; i++) {
        let option = document.createElement('option');
        option.text = "ResponsiveVoice - " + rvVoices[i].name;
        voiceSelect.add(option);
    }

    // Add an event listener to the engine dropdown
    engineSelect.addEventListener('change', populateVoiceDropdown);

    // Add an event listener for the "Preview" button
    document.getElementById('preview').addEventListener('click', previewVoice);
});