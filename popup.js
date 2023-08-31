document.addEventListener('DOMContentLoaded', () => {
    const toggleButton = document.getElementById('toggle');
    const statusText = document.getElementById('status');
    const voiceSelect = document.getElementById('voice');
    const rateInput = document.getElementById('rate');
    const pitchInput = document.getElementById('pitch');
    const volumeInput = document.getElementById('volume');

    // Populate the voice dropdown
    chrome.tts.getVoices(function(voices) {
        for (let i = 0; i < voices.length; i++) {
            let option = document.createElement('option');
            option.text = voices[i].voiceName;
            voiceSelect.add(option);
        }
    });

    // Get the current TTS settings from storage and update the controls
    chrome.storage.sync.get('ttsSettings', function(data) {
        if (data.ttsSettings) {
            voiceSelect.value = data.ttsSettings.voiceName;
            rateInput.value = data.ttsSettings.rate;
            pitchInput.value = data.ttsSettings.pitch;
            volumeInput.value = data.ttsSettings.volume;
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

    // Send the TTS settings to the background script whenever they're changed
    voiceSelect.addEventListener('change', sendTTSSettings);
    rateInput.addEventListener('input', sendTTSSettings);
    pitchInput.addEventListener('input', sendTTSSettings);
    volumeInput.addEventListener('input', sendTTSSettings);

    function sendTTSSettings() {
        chrome.runtime.sendMessage({
            message: 'update_tts_settings',
            ttsSettings: {
                voiceName: voiceSelect.value,
                rate: parseFloat(rateInput.value),
                pitch: parseFloat(pitchInput.value),
                volume: parseFloat(volumeInput.value)
            }
        });
    }
});