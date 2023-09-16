/**
 * @license ResponsiveVoice JS v1.8.3
 *
 * (c) 2015-2022 LearnBrite
 *
 * License: https://responsivevoice.org/license
 */
// Array.from polyfill - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/from
if (!Array.from) {
    Array.from = (function () {
        var toStr = Object.prototype.toString;
        var isCallable = function (fn) {
            return typeof fn === 'function' || toStr.call(fn) === '[object Function]';
        };
        var toInteger = function (value) {
            var number = Number(value);
            if (isNaN(number)) { return 0; }
            if (number === 0 || !isFinite(number)) { return number; }
            return (number > 0 ? 1 : -1) * Math.floor(Math.abs(number));
        };
        var maxSafeInteger = Math.pow(2, 53) - 1;
        var toLength = function (value) {
            var len = toInteger(value);
            return Math.min(Math.max(len, 0), maxSafeInteger);
        };

        return function from(arrayLike/*, mapFn, thisArg */) {
            var C = this;

            var items = Object(arrayLike);

            if (arrayLike == null) {
                throw new TypeError('Array.from requires an array-like object - not null or undefined');
            }

            var mapFn = arguments.length > 1 ? arguments[1] : void undefined;
            var T;
            if (typeof mapFn !== 'undefined') {
                if (!isCallable(mapFn)) {
                    throw new TypeError('Array.from: when provided, the second argument must be a function');
                }

                if (arguments.length > 2) {
                    T = arguments[2];
                }
            }

            var len = toLength(items.length);

            var A = isCallable(C) ? Object(new C(len)) : new Array(len);

            var k = 0;
            var kValue;
            while (k < len) {
                kValue = items[k];
                if (mapFn) {
                    A[k] = typeof T === 'undefined' ? mapFn(kValue, k) : mapFn.call(T, kValue, k);
                } else {
                    A[k] = kValue;
                }
                k += 1;
            }
            A.length = len;
            return A;
        };
    }());
}

// Polyfill Number.isNaN for pre-ES6 browsers
if (!isNaN) {
    var isNaN = function (value) {
        var n = Number(value);
        return n !== n;
    };
}

/**
 * navigator.sendBeacon Polyfill - https://github.com/miguelmota/Navigator.sendBeacon
 */
(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory() :
        typeof define === 'function' && define.amd ? define(factory) :
            (factory());
}(this, (function () {
    'use strict';

    function _typeof(obj) {
        if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
            _typeof = function (obj) {
                return typeof obj;
            };
        } else {
            _typeof = function (obj) {
                return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
            };
        }

        return _typeof(obj);
    }

    var isString = function isString(val) {
        return typeof val === 'string';
    };

    var isBlob = function isBlob(val) {
        return val instanceof Blob;
    };

    polyfill.call((typeof window === "undefined" ? "undefined" : _typeof(window)) === 'object' ? window : undefined || {});

    function polyfill() {
        if (!('navigator' in this)) {
            this.navigator = {};
        }

        if (typeof this.navigator.sendBeacon !== 'function') {
            this.navigator.sendBeacon = sendBeacon.bind(this);
        }
    }

    function sendBeacon(url, data) {
        var event = this.event && this.event.type;
        var sync  = event === 'unload' || event === 'beforeunload';
        var xhr   = 'XMLHttpRequest' in this ? new XMLHttpRequest() : new ActiveXObject('Microsoft.XMLHTTP');
        xhr.open('POST', url, !sync);
        xhr.withCredentials = true;
        xhr.setRequestHeader('Accept', '*/*');

        if (isString(data)) {
            xhr.setRequestHeader('Content-Type', 'text/plain;charset=UTF-8');
            xhr.responseType = 'text';
        } else if (isBlob(data) && data.type) {
            xhr.setRequestHeader('Content-Type', data.type);
        }

        try {
            xhr.send(data);
        } catch (error) {
            return false;
        }

        return true;
    }

})));

if (typeof responsiveVoice != 'undefined') {
    console.log('ResponsiveVoice already loaded');
    console.log(responsiveVoice);
} else {

    var ResponsiveVoice = function () {

        var self = this;

        self.version = "1.8.3";
        console.log("ResponsiveVoice r" + self.version);

        // Our own collection of voices
        self.responsivevoices = [
            {name: 'UK English Female',  flag: 'gb',  gender: 'f', lang: 'en-GB',  voiceIDs: [3, 7, 171, 201, 5, 1, 528, 257, 286, 342, 258, 287, 343, 8]},
            {name: 'UK English Male',  flag: 'gb',  gender: 'm', lang: 'en-GB',  voiceIDs: [0, 277, 202, 75, 4, 2, 256, 285, 341, 159]},
            {name: 'US English Female',  flag: 'us',  gender: 'f', lang: 'en-US',  voiceIDs: [432, 433, 434, 40, 41, 42, 383, 205, 204, 43, 481, 173, 235, 283, 339, 408, 44]},
            {name: 'US English Male',  flag: 'us',  gender: 'm', lang: 'en-US',  voiceIDs: [431, 39, 234, 282, 338, 236, 284, 340, 2, 4, 0,75, 195,169]},
            {name: 'Arabic Male',  flag: 'ar',  gender: 'm', lang: 'ar-SA',  voiceIDs: [96, 95, 97, 196, 388]},
            {name: 'Arabic Female',  flag: 'ar',  gender: 'f', lang: 'ar-SA',  voiceIDs: [483, 98]},
            {name: 'Armenian Male',  flag: 'hy',  gender: 'f', lang: 'hy-AM',  voiceIDs: [99]},
            {name: 'Australian Female',  flag: 'au',  gender: 'f', lang: 'en-AU',  voiceIDs: [495, 415,276,201,87,5,88]},
            {name: 'Australian Male',  flag: 'au',  gender: 'm', lang: 'en-AU',  voiceIDs: [86, 386]},
            {name: 'Bangla Bangladesh Female',  flag: 'bd',  gender: 'f', lang: 'bn-BD',  voiceIDs: [435]},
            {name: 'Bangla Bangladesh Male',  flag: 'bd',  gender: 'm', lang: 'bn-BD',  voiceIDs: [485, 410,436]},
            {name: 'Bangla India Female',  flag: 'bd',  gender: 'f', lang: 'bn-IN',  voiceIDs: [447]},
            {name: 'Bangla India Male',  flag: 'bd',  gender: 'm', lang: 'bn-IN',  voiceIDs: [492, 411,448]},
            {name: 'Brazilian Portuguese Female',  flag: 'br',  gender: 'f', lang: 'pt-BR',  voiceIDs: [245, 124, 123, 125, 499, 186, 223, 126]},
            {name: 'Brazilian Portuguese Male',  flag: 'br',  gender: 'm', lang: 'pt-BR',  voiceIDs: [315, 332, 371, 399], deprecated: true},
            {name: 'Chinese Female',  flag: 'cn',  gender: 'f', lang: 'zh-CN',  voiceIDs: [249, 58, 59, 452, 380, 281, 231, 155, 60, 513, 191, 268, 297, 353, 269, 298, 354, 409, 61]},
            {name: 'Chinese Male',  flag: 'cn',  gender: 'm', lang: 'zh-CN',  voiceIDs: [317, 334, 373, 389]},
            {name: 'Chinese (Hong Kong) Female',  flag: 'hk',  gender: 'f', lang: 'zh-HK',  voiceIDs: [463, 464, 192, 193, 232, 250, 251, 270, 299, 355, 409, 444,252]},
            {name: 'Chinese (Hong Kong) Male',  flag: 'hk',  gender: 'm', lang: 'zh-HK',  voiceIDs: [430,318, 335, 374, 445,390]},
            {name: 'Chinese Taiwan Female',  flag: 'tw',  gender: 'f', lang: 'zh-TW',  voiceIDs: [469, 194, 233, 253, 254, 305, 322, 361, 384, 319, 336, 375, 409, 255]},
            {name: 'Chinese Taiwan Male',  flag: 'tw',  gender: 'm', lang: 'zh-TW',  voiceIDs: [320, 337, 376, 391]},
            {name: 'Czech Female',  flag: 'cz',  gender: 'f', lang: 'cs-CZ',  voiceIDs: [504, 412,101,100,102,197,103]},
            {name: 'Czech Male',  flag: 'cz',  gender: 'm', lang: 'cs-CZ',  voiceIDs: [161], deprecated: true},
            {name: 'Danish Female',  flag: 'dk',  gender: 'f', lang: 'da-DK',  voiceIDs: [474, 413,105,104,106,198,107]},
            {name: 'Danish Male',  flag: 'da',  gender: 'm', lang: 'da-DK',  voiceIDs: [162], deprecated: true},
            {name: 'Deutsch Female',  flag: 'de',  gender: 'f', lang: 'de-DE',  voiceIDs: [27, 28, 29, 30, 78, 170, 275, 199, 31, 502, 261, 290, 346, 262, 291, 347, 32]},
            {name: 'Deutsch Male',  flag: 'de',  gender: 'm', lang: 'de-DE',  voiceIDs: [307, 324, 363, 377, 393]},
            {name: 'Dutch Female',  flag: 'nl',  gender: 'f', lang: 'nl-NL',  voiceIDs: [243, 219, 84, 157, 158, 496, 184, 45]},
            {name: 'Dutch Male',  flag: 'nl',  gender: 'm', lang: 'nl-NL',  voiceIDs: [157, 220, 407]},
            {name: 'Estonian Male',  flag: 'ee',  gender: 'm', lang: 'et-EE',  voiceIDs: [476, 416,446]},
            {name: 'Filipino Female',  flag: 'ph',  gender: 'f', lang: 'fil-PH',  voiceIDs: [507, 418,437]},
            {name: 'Finnish Female',  flag: 'fi',  gender: 'f', lang: 'fi-FI',  voiceIDs: [490, 417,90,89,91,209,92]},
            {name: 'Finnish Male',  flag: 'fi',  gender: 'm', lang: 'fi-FI',  voiceIDs: [160], deprecated: true},
            {name: 'French Female',  flag: 'fr',  gender: 'f', lang: 'fr-FR',  voiceIDs: [240, 21, 22, 23, 77, 178, 279, 210, 493, 266, 295, 351, 304, 321, 360, 26]},
            {name: 'French Male',  flag: 'fr',  gender: 'm', lang: 'fr-FR',  voiceIDs: [311, 328, 367, 378, 392]},
            {name: 'French Canadian Female',  flag: 'ca',  gender: 'f', lang: 'fr-CA',  voiceIDs: [497, 419, 210, 449]},
            {name: 'French Canadian Male',  flag: 'ca',  gender: 'm', lang: 'fr-CA',  voiceIDs: [450]},
            {name: 'Greek Female',  flag: 'gr',  gender: 'f', lang: 'el-GR',  voiceIDs: [488, 414,62, 63, 80, 200,64]},
            {name: 'Greek Male',  flag: 'gr',  gender: 'm', lang: 'el-GR',  voiceIDs: [163], deprecated: true},
            // {name: 'Haitian Creole Female',  flag: 'ht',  gender: 'f', lang: 'ht',  voiceIDs: [109]}, //DEPRECATED - NO LONGER SUPPORTED
            {name: 'Hindi Female',  flag: 'hi',  gender: 'f', lang: 'hi-IN',  voiceIDs: [247, 66, 154, 179, 213, 489, 259, 288, 344, 67]},
            {name: 'Hindi Male',  flag: 'hi',  gender: 'm', lang: 'hi-IN',  voiceIDs: [394]},
            {name: 'Hungarian Female',  flag: 'hu',  gender: 'f', lang: 'hu-HU',  voiceIDs: [470, 420,9, 10, 81,214, 11]},
            {name: 'Hungarian Male',  flag: 'hu',  gender: 'm', lang: 'hu-HU',  voiceIDs: [164], deprecated: true},
            {name: 'Indonesian Female',  flag: 'id',  gender: 'f', lang: 'id-ID',  voiceIDs: [241, 111, 112, 524, 180, 215, 113]},
            {name: 'Indonesian Male',  flag: 'id',  gender: 'm', lang: 'id-ID',  voiceIDs: [395]},
            {name: 'Italian Female',  flag: 'it',  gender: 'f', lang: 'it-IT',  voiceIDs: [242, 33, 34, 35, 36, 37, 79, 181, 216, 508, 271, 300, 356, 38]},
            {name: 'Italian Male',  flag: 'it',  gender: 'm', lang: 'it-IT',  voiceIDs: [312, 329, 368, 406]},
            {name: 'Japanese Female',  flag: 'jp',  gender: 'f', lang: 'ja-JP',  voiceIDs: [51, 280, 217, 52, 153, 517, 182, 273, 302, 358, 274, 303, 359, 53]},
            {name: 'Japanese Male',  flag: 'jp',  gender: 'm', lang: 'ja-JP',  voiceIDs: [248, 50, 313, 330, 369, 396]},
            {name: 'Korean Female',  flag: 'kr',  gender: 'f', lang: 'ko-KR',  voiceIDs: [54, 55, 56, 156, 183, 218, 466, 306, 323, 362, 384, 57]},
            {name: 'Korean Male',  flag: 'kr',  gender: 'm', lang: 'ko-KR',  voiceIDs: [397]},
            {name: 'Latin Female',  flag: 'va',  gender: 'f', lang: 'la',  voiceIDs: [114], deprecated:true},   //DEPRECATED - NO LONGER SUPPORTED
            {name: 'Latin Male',  flag: 'va',  gender: 'm', lang: 'la',  voiceIDs: [165]},
            {name: 'Nepali',  flag: 'np',  gender: 'f', lang: 'ne-NP',  voiceIDs: [509, 423, 441]},
            {name: 'Norwegian Female',  flag: 'no',  gender: 'f', lang: 'nb-NO',  voiceIDs: [473, 422,72, 73, 221,74]},
            {name: 'Norwegian Male',  flag: 'no',  gender: 'm', lang: 'nb-NO',  voiceIDs: [166]},
            {name: 'Polish Female',  flag: 'pl',  gender: 'f', lang: 'pl-PL',  voiceIDs: [244, 120, 119, 121, 185, 222, 505, 267, 296, 352, 122]},
            {name: 'Polish Male',  flag: 'pl',  gender: 'm', lang: 'pl-PL',  voiceIDs: [314, 331, 370, 398]},
            {name: 'Portuguese Female',  flag: 'br',  gender: 'f', lang: 'pt-BR',  voiceIDs: [128, 127, 129, 187, 224, 479, 272, 301, 357, 130]},
            {name: 'Portuguese Male',  flag: 'br',  gender: 'm', lang: 'pt-BR',  voiceIDs: [400]},
            {name: 'Romanian Female',  flag: 'ro',  gender: 'f', lang: 'ro-RO',  voiceIDs: [526, 424, 151, 150, 152, 225, 46]},
            {name: 'Russian Female',  flag: 'ru',  gender: 'f', lang: 'ru-RU',  voiceIDs: [246, 47, 48, 83, 468, 188, 226, 260, 289, 345, 49]},
            {name: 'Russian Male',  flag: 'ru',  gender: 'm', lang: 'ru-RU',  voiceIDs: [316,333,372,387], deprecated: true},
            {name: 'Sinhala',  flag: 'lk',  gender: 'f', lang: 'si-LK',  voiceIDs: [501, 425, 442]},
            {name: 'Slovak Female',  flag: 'sk',  gender: 'f', lang: 'sk-SK',  voiceIDs: [506, 426, 133, 132, 134, 227, 135]},
            {name: 'Slovak Male',  flag: 'sk',  gender: 'm', lang: 'sk-SK',  voiceIDs: [167], deprecated:true},
            {name: 'Spanish Female',  flag: 'es',  gender: 'f', lang: 'es-ES',  voiceIDs: [19, 238, 16, 17, 18, 20, 76, 174, 207, 514, 521, 263, 292, 348, 264, 293, 349, 15]},
            {name: 'Spanish Male',  flag: 'es',  gender: 'm', lang: 'es-ES',  voiceIDs: [309, 326, 365, 401], deprecated: true},
            {name: 'Spanish Latin American Female',  flag: 'es',  gender: 'f', lang: 'es-MX',  voiceIDs: [239,137,136,138,175,208,265,294,350,139]},
            {name: 'Spanish Latin American Male',  flag: 'es',  gender: 'm', lang: 'es-MX',  voiceIDs: [136, 310, 327, 366, 402]},
            {name: 'Swedish Female',  flag: 'sv',  gender: 'f', lang: 'sv-SE',  voiceIDs: [482, 427,85, 149, 228, 65]},
            {name: 'Swedish Male',  flag: 'sv',  gender: 'm', lang: 'sv-SE',  voiceIDs: [148, 168]},
            {name: 'Tamil Female',  flag: 'hi',  gender: 'm', lang: 'hi-IN',  voiceIDs: [458, 516, 451]},
            {name: 'Tamil Male',  flag: 'hi',  gender: 'm', lang: 'hi-IN',  voiceIDs: [141]},
            {name: 'Thai Female',  flag: 'th',  gender: 'f', lang: 'th-TH',  voiceIDs: [143, 142, 144, 471, 189, 229, 145]},
            {name: 'Thai Male',  flag: 'th',  gender: 'm', lang: 'th-TH',  voiceIDs: [403]},
            {name: 'Turkish Female',  flag: 'tr',  gender: 'f', lang: 'tr-TR',  voiceIDs: [69, 70, 82, 475, 190, 230,71]},
            {name: 'Turkish Male',  flag: 'tr',  gender: 'm', lang: 'tr-TR',  voiceIDs: [465, 404]},
            {name: 'Ukrainian Female',  flag: 'ua',  gender: 'f', lang: 'uk-UA',  voiceIDs: [494, 428, 443]},
            {name: 'Vietnamese Female',  flag: 'vi',  gender: 'f', lang: 'vi-VN',  voiceIDs: [480, 429, 405]},
            {name: 'Vietnamese Male',  flag: 'vi',  gender: 'm', lang: 'vi-VN',  voiceIDs: [146]},
            {name: 'Afrikaans Male',  flag: 'af',  gender: 'm', lang: 'af-ZA',  voiceIDs: [93]},
            {name: 'Albanian Male',  flag: 'sq',  gender: 'm', lang: 'sq-AL',  voiceIDs: [94]},
            {name: 'Bosnian Male',  flag: 'bs',  gender: 'm', lang: 'bs',  voiceIDs: [14]},
            {name: 'Catalan Male',  flag: 'catalonia',  gender: 'm', lang: 'ca-ES',  voiceIDs: [68]},
            {name: 'Croatian Male',  flag: 'hr',  gender: 'm', lang: 'hr-HR',  voiceIDs: [13]},
            {name: 'Esperanto Male',  flag: 'eo',  gender: 'm', lang: 'eo',  voiceIDs: [108]},
            {name: 'Icelandic Male',  flag: 'is',  gender: 'm', lang: 'is-IS',  voiceIDs: [110], deprecated: true},
            {name: 'Icelandic Female',  flag: 'is',  gender: 'm', lang: 'is-IS',  voiceIDs: [110]},
            {name: 'Latvian Male',  flag: 'lv',  gender: 'm', lang: 'lv-LV',  voiceIDs: [115]},
            {name: 'Macedonian Male',  flag: 'mk',  gender: 'm', lang: 'mk-MK',  voiceIDs: [116]},
            {name: 'Moldavian Female',  flag: 'md',  gender: 'f', lang: 'md',  voiceIDs: [117]},
            {name: 'Moldavian Male',  flag: 'md',  gender: 'm', lang: 'md',  voiceIDs: [117], deprecated:true},   //DEPRECATED - NO LONGER SUPPORTED
            {name: 'Montenegrin Male',  flag: 'me',  gender: 'm', lang: 'me',  voiceIDs: [118]},
            {name: 'Serbian Male',  flag: 'sr',  gender: 'm', lang: 'sr-RS',  voiceIDs: [12]},
            {name: 'Serbo-Croatian Male',  flag: 'hr',  gender: 'm', lang: 'hr-HR',  voiceIDs: [131]},
            {name: 'Swahili Male',  flag: 'sw',  gender: 'm', lang: 'sw-KE',  voiceIDs: [140]},
            {name: 'Welsh Male',  flag: 'cy',  gender: 'm', lang: 'cy',  voiceIDs: [147]},
            {name: 'Fallback UK Female',  flag: 'gb',  gender: 'f', lang: 'en-GB',  voiceIDs: [8]}
        ];

        //All voices available on every system and device
        self.voicecollection = [
            {name: 'Google UK English Male'}, //0 male uk android/chrome
            {name: 'Agnes'}, //1 female us safari mac
            {name: 'Daniel Compact'}, //2 male us safari mac

            {name: 'Google UK English Female'}, //3 female uk android/chrome
            {name: 'en-GB', rate: 0.25, pitch: 1}, //4 male uk IOS
            {name: 'en-AU', rate: 0.25, pitch: 1}, //5 female english IOS

            {name: 'inglÃ©s Reino Unido'}, //6 spanish english android
            {name: 'English United Kingdom'}, //7 english english android
            {name: 'Fallback en-GB Female', lang: 'en-GB', fallbackvoice: true, service: 'g1', gender: 'female'}, //8 fallback english female

            {name: 'Eszter Compact'}, //9 Hungarian mac
            {name: 'hu-HU', rate: 0.4}, //10 Hungarian iOS
            {name: 'Fallback Hungarian Female', lang: 'hu', fallbackvoice: true, service: 'g1'}, //11 Hungarian Female fallback

            {name: 'Fallback Serbian Male', lang: 'sr', fallbackvoice: true, service: 'g1', gender: 'male'}, //12 Serbian Male fallback

            {name: 'Fallback Croatian Male', lang: 'hr', rate: 0.5, fallbackvoice: true, service: 'g2', gender: 'male'}, //13 Croatian Male fallback

            {name: 'Fallback Bosnian Male', lang: 'bs', fallbackvoice: true, service: 'g2', gender: 'male'}, //14 Bosnian Male fallback

            {name: 'Fallback Spanish Female', lang: 'es', fallbackvoice: true, service: 'g1', gender: 'female'}, //15 Spanish Female fallback
            {name: 'Spanish Spain'}, //16 female es android/chrome
            {name: 'espaÃ±ol EspaÃ±a'}, //17 female es android/chrome
            {name: 'Diego Compact', rate: 0.3}, //18 male es mac
            {name: 'Google EspaÃ±ol'}, //19 male es chrome
            {name: 'es-ES', rate: 0.20}, //20 male es iOS

            {name: 'Google FranÃ§ais'}, //21 FR chrome
            {name: 'French France'}, //22 android/chrome
            {name: 'francÃ©s Francia'}, //23 android/chrome
            {name: 'Virginie Compact', rate: 0.5}, //24 mac
            {name: 'fr-FR', rate: 0.25}, //25 iOS
            {name: 'Fallback French Female', lang: 'fr', fallbackvoice: true, service: 'g1', gender: 'female'}, //26 fallback

            {name: 'Google Deutsch'}, //27 DE chrome
            {name: 'German Germany'}, //28 android/chrome
            {name: 'alemÃ¡n Alemania'}, //29 android/chrome
            {name: 'Yannick Compact', rate: 0.5}, //30 mac
            {name: 'de-DE', rate: 0.25}, //31 iOS
            {name: 'Fallback Deutsch Female', lang: 'de', fallbackvoice: true, service: 'g1', gender: 'female'}, //32 fallback

            {name: 'Google Italiano'}, //33 IT chrome
            {name: 'Italian Italy'}, //34 android/chrome
            {name: 'italiano Italia'}, //35 android/chrome
            {name: 'Paolo Compact', rate: 0.5}, //36 mac
            {name: 'it-IT', rate: 0.25}, //37 iOS
            {name: 'Fallback Italian Female', lang: 'it', fallbackvoice: true, service: 'g1', gender: 'female'}, //38 fallback

            {name: 'Google US English', timerSpeed:1}, //39 EN chrome US English Female
            {name: 'English United States'}, //40 android/chrome US English Female
            {name: 'inglÃ©s Estados Unidos'}, //41 android/chrome US English Female
            {name: 'Vicki'}, //42 mac US English Female
            {name: 'en-US', rate: 0.2, pitch: 1, timerSpeed:1.3}, //43 iOS US English Female
            {name: 'Fallback US English', lang: 'en-US', fallbackvoice: true, timerSpeed:0, service: 'g1', gender: 'female'}, //44 fallback
            {name: 'Fallback Dutch Female', lang: 'nl', fallbackvoice: true, timerSpeed:0, service: 'g1', gender: 'female'}, //45 fallback

            {name: 'Fallback Romanian', lang: 'ro', fallbackvoice: true, service: 'g1', gender: 'female'}, //46 Romanian Female fallback

            {name: 'Milena Compact'}, //47 Russian mac
            {name: 'ru-RU', rate: 0.25}, //48 iOS
            {name: 'Fallback Russian', lang: 'ru', fallbackvoice: true, service: 'g1', gender: 'female'}, //49 Russian fallback

            {name: 'Google æ—¥æœ¬äºº', timerSpeed:1}, //50 June 2019 changed to Japanese Male from Japanese Female Chrome .
            {name: 'Kyoko Compact'}, //51 Japanese Female mac
            {name: 'ja-JP', rate: 0.25}, //52 iOS Japanese Female
            {name: 'Fallback Japanese Female', lang: 'ja', fallbackvoice: true, service: 'g1', gender: 'female'}, //53 Japanese Female fallback

            {name: 'Google í•œêµ­ì˜', timerSpeed:1}, //54 KO Chrome
            {name: 'Narae Compact'}, //55 Korean mac
            {name: 'ko-KR', rate: 0.25}, //56 iOS
            {name: 'Fallback Korean Female', lang: 'ko', fallbackvoice: true, service: 'g1', gender: 'female'}, //57 Korean fallback

            {name: 'Google ä¸­å›½çš„', timerSpeed:1}, //58 CN Chrome
            {name: 'Ting-Ting Compact'}, //59 Chinese mac Female
            {name: 'zh-CN', rate: 0.25}, //60 iOS
            {name: 'Fallback Chinese', lang: 'zh-CN', fallbackvoice: true, service: 'g1', gender: 'female'}, //61 Chinese Female fallback

            {name: 'Alexandros Compact'}, //62 Greek Male Mac
            {name: 'el-GR', rate: 0.25}, //63 iOS
            {name: 'Fallback Greek', lang: 'el', fallbackvoice: true, service: 'g3', gender: 'female'}, //64 Greek Female fallback

            {name: 'Fallback Swedish', lang: 'sv', fallbackvoice: true, service: 'g3', gender: 'female'}, //65 Swedish Female fallback

            {name: 'hi-IN', rate: 0.25}, //66 iOS
            {name: 'Fallback Hindi Female', lang: 'hi', fallbackvoice: true, service: 'g1', gender: 'female'}, //67 Hindi Female fallback

            {name: 'Fallback Catalan', lang: 'ca', fallbackvoice: true, service: 'g1', gender: 'male'}, //68 Catalan Male fallback

            {name: 'Aylin Compact'}, //69 Turkish Female Mac
            {name: 'tr-TR', rate: 0.25}, //70 iOS Turkish Female
            {name: 'Fallback Turkish', lang: 'tr', fallbackvoice: true, service: 'g1', gender: 'female'}, //71 Turkish Female fallback

            {name: 'Stine Compact'}, //72 Norweigan Male Mac

            {name: 'no-NO', rate: 0.25}, //73 iOS Female
            {name: 'Fallback Norwegian', lang: 'no', fallbackvoice: true, service: 'g1', gender: 'female'}, //74 Norwegian Female fallback

            {name: 'Daniel'}, //75 English UK male uk safari 8 mac
            {name: 'Monica'}, //76 Spanish female es safari 8 mac
            {name: 'Amelie'}, //77 French Canadian female fr safari 8 mac
            {name: 'Anna'}, //78 female de safari 8 mac
            {name: 'Alice'}, //79 Italian female it safari 8 mac
            {name: 'Melina'}, //80 Greek female gr safari 8 mac
            {name: 'Mariska'}, //81 Hungarian female hu safari 8 mac
            {name: 'Yelda'}, //82 Turkish female tr safari 8 mac
            {name: 'Milena'}, //83 Russian female ru safari 8 mac

            //Gender Disparity
            {name: 'Xander'}, //84 Dutch female nl safari 8 mac
            {name: 'Alva'},  //85 Swedish female sv safari 8 mac

            // Gender Disparity
            {name: 'Lee Compact'}, //86 Australian Male Mac
            {name: 'Karen'}, //87 Australian Female safari 8 mac
            {name: 'Fallback Australian Female', lang: 'en-AU', fallbackvoice: true, service: 'g1', gender: 'female'}, //88 Australian Female fallback

            // Gender Disparity
            {name: 'Mikko Compact'}, //89 Finnish Male Mac
            {name: 'Satu'}, //90 Finnish Female safari 8 mac
            {name: 'fi-FI', rate: 0.25}, //91 iOS
            {name: 'Fallback Finnish', lang: 'fi', fallbackvoice: true, service: 'g1', gender: 'female'}, //92 Finnish Female fallback

            {name: 'Fallback Afrikans', lang: 'af', fallbackvoice: true, service: 'g1', gender: 'male'}, //93 Afrikaans Male fallback

            {name: 'Fallback Albanian', lang: 'sq', fallbackvoice: true, service: 'g2', gender: 'male'}, //94 Albanian Male fallback

            {name: 'Maged Compact'}, //95 Arabic Male Mac
            {name: 'Tarik'}, //96 Arabic Male safari 8 mac
            {name: 'ar-SA', rate: 0.25}, //97 iOS
            {name: 'Fallback Arabic', lang: 'ar', fallbackvoice: true, service: 'g1', gender: 'female'}, //98 Arabic Female fallback

            {name: 'Fallback Armenian', lang: 'hy', fallbackvoice: true, service: 'g5', gender: 'male'}, //99 Armenian Male fallback

            {name: 'Zuzana Compact'}, //100 Czech Female Mac
            {name: 'Zuzana'}, //101 Czech Female safari 8 mac
            {name: 'cs-CZ', rate: 0.25}, //102 iOS
            {name: 'Fallback Czech', lang: 'cs', fallbackvoice: true, service: 'g1', gender: 'female'}, //103 Czech Female fallback

            {name: 'Ida Compact'}, //104 Danish Female Mac
            {name: 'Sara'}, //105 Danish Female safari 8 mac
            {name: 'da-DK', rate: 0.25}, //106 iOS
            {name: 'Fallback Danish', lang: 'da', fallbackvoice: true, service: 'g1', gender: 'female'}, //107 Danish Female fallback

            {name: 'Fallback Esperanto', lang: 'eo', fallbackvoice: true, service: 'g5', gender: 'male'}, //108 Esperanto Male fallback

            {name: 'Fallback Haitian Creole', lang: 'ht', fallbackvoice: true}, //109 Haitian Creole Female fallback NO LONGER SUPPORTED

            {name: 'Fallback Icelandic', lang: 'is', fallbackvoice: true, service: 'g1', gender: 'male'}, //110 Icelandic Male fallback

            {name: 'Damayanti'}, //111 Indonesian Female safari 8 mac
            {name: 'id-ID', rate: 0.25}, //112 iOS
            {name: 'Fallback Indonesian Female', lang: 'id', fallbackvoice: true, service: 'g1', gender: 'female'}, //113 Indonesian Female fallback

            {name: 'Fallback Latin Female', lang: 'la', fallbackvoice: true, service: 'g2', gender: 'female'}, //114 Latin Female fallback
            {name: 'Fallback Latvian Male', lang: 'lv', fallbackvoice: true, service: 'g1', gender: 'male'}, //115 Latvian Male fallback
            {name: 'Fallback Macedonian Male', lang: 'mk', fallbackvoice: true, service: 'g5', gender: 'male'}, //116 Macedonian Male fallback
            {name: 'Fallback Moldavian Female', lang: 'mo', fallbackvoice: true, service: 'g2', gender: 'female'}, //117 Moldavian Female fallback
            {name: 'Fallback Montenegrin Male', lang: 'sr-ME', fallbackvoice: true, service: 'g1', gender: 'male'}, //118 Montenegrin Male fallback

            {name: 'Agata Compact'}, //119 Polish Female Mac
            {name: 'Zosia'}, //120 Polish Female safari 8 mac
            {name: 'pl-PL', rate: 0.25}, //121 iOS
            {name: 'Fallback Polish Female', lang: 'pl', fallbackvoice: true, service: 'g1', gender: 'female'}, //122 Polish Female fallback

            {name: 'Raquel Compact'}, //123 Brazilian Portugese Female Male Mac
            {name: 'Luciana'}, //124 Brazilian Portugese Female safari 8 mac
            {name: 'pt-BR', rate: 0.25}, //125 iOS
            {name: 'Fallback Brazilian Portuguese Female', lang: 'pt-BR', fallbackvoice: true, service: 'g1', gender: 'female'}, //126 Brazilian Portugese Female fallback

            {name: 'Joana Compact'}, //127 Portuguese Female Mac
            {name: 'Joana'}, //128 Portuguese Female safari 8 mac
            {name: 'pt-PT', rate: 0.25}, //129 iOS
            {name: 'Fallback Portuguese', lang: 'pt-PT', fallbackvoice: true, service: 'g1', gender: 'female'}, //130 Portuguese Female fallback

            {name: 'Fallback Serbo-Croation', lang: 'sh', fallbackvoice: true, service: 'g2', gender: 'male'}, //131 Serbo-Croation Male fallback

            {name: 'Laura Compact'}, //132 Slovak Female Mac
            {name: 'Laura'}, //133 Slovak Female safari 8 mac
            {name: 'sk-SK', rate: 0.25}, //134 iOS
            {name: 'Fallback Slovak', lang: 'sk', fallbackvoice: true, service: 'g1', gender: 'female'}, //135 Slovak Female fallback

            //Gender Disparity
            {name: 'Javier Compact'}, //136 Spanish (Latin American) Male Mac
            {name: 'Paulina'}, //137 Spanish Mexican Female safari 8 mac
            {name: 'es-MX', rate: 0.25}, //138 iOS
            {name: 'Fallback Spanish (Latin American) Female', lang: 'es-419', fallbackvoice: true, service: 'g1', gender: 'female'}, //139 Spanish (Latin American) Female fallback

            {name: 'Fallback Swahili', lang: 'sw', fallbackvoice: true, service: 'g2', gender: 'male'}, //140 Swahili Male fallback

            {name: 'Fallback Tamil', lang: 'ta', fallbackvoice: true, service: 'g1', gender: 'male'}, //141 Tamil Male fallback

            {name: 'Narisa Compact'}, //142 Thai Female Mac
            {name: 'Kanya'}, //143 Thai Female safari 8 mac
            {name: 'th-TH', rate: 0.25}, //144 iOS
            {name: 'Fallback Thai Female', lang: 'th', fallbackvoice: true, service: 'g1', gender: 'female'}, //145 Thai Female fallback

            {name: 'Fallback Vietnamese Male', lang: 'vi', fallbackvoice: true, service: 'g3', gender: 'male'}, //146 Vietnamese Male fallback

            {name: 'Fallback Welsh', lang: 'cy', fallbackvoice: true, service: 'g5', gender: 'male'}, //147 Welsh Male fallback

            // Gender Disparity
            {name: 'Oskar Compact'}, //148 Swedish Male Mac
            {name: 'sv-SE', rate: 0.25}, //149 iOS

            // Gender Disparity
            {name: 'Simona Compact'}, //150 Romanian mac female
            {name: 'Ioana'}, //151 Romanian Female safari 8 mac
            {name: 'ro-RO', rate: 0.25}, //152 iOS female

            {name: 'Kyoko'}, //153 Japanese Female safari 8 mac

            {name: 'Lekha'}, //154 Hindi Female safari 8 mac

            {name: 'Ting-Ting'}, //155 Chinese Female safari 8 mac

            {name: 'Yuna'}, //156 Korean Female safari 8 mac

            // Gender Disparity
            {name: 'Xander Compact'}, //157 Dutch male or female nl safari 8 mac
            {name: 'nl-NL', rate: 0.25}, //158 iOS
            //

            {name: 'Fallback UK English Male', lang: 'en-GB', fallbackvoice: true, service: 'g1', voicename: 'rjs', gender: 'male'}, //159 UK Male fallback

            {name: 'Finnish Male', lang: 'fi', fallbackvoice: true, service: 'g3', voicename: '', gender: 'male', deprecated: true}, //160 Finnish Male fallback. Deprecated due to RES-313

            {name: 'Czech Male', lang: 'cs', fallbackvoice: true, service: 'g3', voicename: '', gender: 'male', deprecated: true}, //161 Czech Male fallback. Deprecated due to RES-313

            {name: 'Danish Male', lang: 'da', fallbackvoice: true, service: 'g3', voicename: '', gender: 'male', deprecated: true}, //162 Danish Male fallback. Deprecated due to RES-313

            {name: 'Greek Male', lang: 'el', fallbackvoice: true, service: 'g3', voicename: '', gender: 'male', deprecated: true}, //163 Greek Male fallback. Deprecated due to RES-313

            {name: 'Hungarian Male', lang: 'hu', fallbackvoice: true, service: 'g3', voicename: '', gender: 'male', deprecated: true}, //164 Hungarian Male fallback. Deprecated due to RES-313.

            {name: 'Latin Male', lang: 'la', fallbackvoice: true, service: 'g2', voicename: '', gender: 'male'}, //165 Latin Male fallback

            {name: 'Norwegian Male', lang: 'no', fallbackvoice: true, service: 'g3', voicename: '', gender: 'male'}, //166 Norwegian Male fallback

            {name: 'Slovak Male', lang: 'sk', fallbackvoice: true, service: 'g3', voicename: '', gender: 'male', deprecated: true}, //167 Slovak Male fallback. Deprecated due to RES-313.

            {name: 'Swedish Male', lang: 'sv', fallbackvoice: true, service: 'g3', voicename: '', gender: 'male'}, //168 Swedish Male fallback

            {name: 'Fallback US English Male', lang: 'en-US', fallbackvoice: true, service: 'g3', voicename: '', gender: 'male'}, //169 US English Male fallback

            {name: 'German Germany', lang: 'de_DE'}, //170 Android 5 German Female
            {name: 'English United Kingdom', lang: 'en_GB'}, //171 Android 5 English United Kingdom Female
            {name: 'English India', lang: 'en_IN'}, //172 Android 5 English India Female
            {name: 'English United States', lang: 'en_US'}, //173 Android 5 English United States Female
            {name: 'Spanish Spain', lang: 'es_ES'}, //174 Android 5 Spanish Female
            {name: 'Spanish Mexico', lang: 'es_MX'}, //175 Android 5 Spanish Mexico Female
            {name: 'Spanish United States', lang: 'es_US'}, //176 Android 5 Spanish Mexico Female
            {name: 'French Belgium', lang: 'fr_BE'}, //177 Android 5 French Belgium Female
            {name: 'French France', lang: 'fr_FR'}, //178 Android 5 French France Female
            {name: 'Hindi India', lang: 'hi_IN'}, //179 Android 5 Hindi India Female
            {name: 'Indonesian Indonesia', lang: 'in_ID'}, //180 Android 5 Indonesian Female
            {name: 'Italian Italy', lang: 'it_IT'}, //181 Android 5 Italian Female
            {name: 'Japanese Japan', lang: 'ja_JP'}, //182 Android 5 Japanese Female
            {name: 'Korean South Korea', lang: 'ko_KR'}, //183 Android 5 Korean Female
            {name: 'Dutch Netherlands', lang: 'nl_NL'}, //184 Android 5 Dutch Female
            {name: 'Polish Poland', lang: 'pl_PL'}, //185 Android 5 Polish Female
            {name: 'Portuguese Brazil', lang: 'pt_BR'}, //186 Android 5 Portuguese Brazil Female
            {name: 'Portuguese Portugal', lang: 'pt_PT'}, //187 Android 5 Portuguese Portugal Female
            {name: 'Russian Russia', lang: 'ru_RU'}, //188 Android 5 Russian Female
            {name: 'Thai Thailand', lang: 'th_TH'}, //189 Android 5 Thai Female
            {name: 'Turkish Turkey', lang: 'tr_TR'}, //190 Android 5 Turkish Female
            {name: 'Chinese China', lang: 'zh_CN_#Hans'}, //191 Android 5 Chinese China Female
            {name: 'Chinese Hong Kong', lang: 'zh_HK_#Hans'}, //192 Android 5 Chinese Hong Kong Simplified Female
            {name: 'Chinese Hong Kong', lang: 'zh_HK_#Hant'}, //193 Android 5 Chinese Hong Kong Traditional Female
            {name: 'Chinese Taiwan', lang: 'zh_TW_#Hant'}, //194 Android 5 Chinese Taiwan Female

            {name: 'Alex'}, //195 US English Male safari 8 mac

            {name: 'Maged', lang: 'ar-SA'}, //196 iOS 9 Arabic Male
            {name: 'Zuzana', lang: 'cs-CZ'}, //197 iOS 9 Czech Female
            {name: 'Sara', lang: 'da-DK'}, //198 iOS 9 Danish Female
            {name: 'Anna', lang: 'de-DE'}, //199 iOS 9 Deutsch Female
            {name: 'Melina', lang: 'el-GR'}, //200 iOS 9 Greek Female
            {name: 'Karen', lang: 'en-AU'}, //201 iOS 9 English (AU) Female
            {name: 'Daniel', lang: 'en-GB'}, //202 iOS 9 English (GB) Male
            {name: 'Moira', lang: 'en-IE'}, //203 iOS 9 English (IE) Female
            {name: 'Samantha (Enhanced)', lang: 'en-US'}, //204 iOS 9 US English Female
            {name: 'Samantha', lang: 'en-US'}, //205 iOS 9 US English Female
            {name: 'Tessa', lang: 'en-ZA'}, //206 iOS 9 English Female
            {name: 'Monica', lang: 'es-ES'}, //207 iOS 9 Spanish Female
            {name: 'Paulina', lang: 'es-MX'}, //208 iOS 9 Spanish Latin American Female
            {name: 'Satu', lang: 'fi-FI'}, //209 iOS 9 Finnish Female
            {name: 'Amelie', lang: 'fr-CA'}, //210 iOS 9 French (CA) Female
            {name: 'Thomas', lang: 'fr-FR'}, //211 iOS 9 French (FR) Male
            {name: 'Carmit', lang: 'he-IL'}, //212 iOS 9 Hebrew Female
            {name: 'Lekha', lang: 'hi-IN'}, //213 iOS 9 Hindi Female
            {name: 'Mariska', lang: 'hu-HU'}, //214 iOS 9 Hungarian Female
            {name: 'Damayanti', lang: 'id-ID'}, //215 iOS 9 Indonesian Female
            {name: 'Alice', lang: 'it-IT'}, //216 iOS 9 Italian Female
            {name: 'Kyoko', lang: 'ja-JP'}, //217 iOS 9 Japanese Female
            {name: 'Yuna', lang: 'ko-KR'}, //218 iOS 9 Korean Female
            {name: 'Ellen', lang: 'nl-BE'}, //219 iOS 9 Dutch Female
            {name: 'Xander', lang: 'nl-NL'}, //220 iOS 9 Dutch Male
            {name: 'Nora', lang: 'no-NO'}, //221 iOS 9 Norwegian Female
            {name: 'Zosia', lang: 'pl-PL'}, //222 iOS 9 Polish Female
            {name: 'Luciana', lang: 'pt-BR'}, //223 iOS 9 Portuguese (BR) Female
            {name: 'Joana', lang: 'pt-PT'}, //224 iOS 9 Portuguese (PT) Female
            {name: 'Ioana', lang: 'ro-RO'}, //225 iOS 9 Romanian Female
            {name: 'Milena', lang: 'ru-RU'}, //226 iOS 9 Russian Female
            {name: 'Laura', lang: 'sk-SK'}, //227 iOS 9 Slovak Female
            {name: 'Alva', lang: 'sv-SE'}, //228 iOS 9 Swedish Female
            {name: 'Kanya', lang: 'th-TH'}, //229 iOS 9 Thai Female
            {name: 'Yelda', lang: 'tr-TR'}, //230 iOS 9 Turkish Female
            {name: 'Ting-Ting', lang: 'zh-CN'}, //231 iOS 9 Chinese (PRC) Female
            {name: 'Sin-Ji', lang: 'zh-HK'}, //232 iOS 9 Chinese (Hong Kong SAR) Female
            {name: 'Mei-Jia', lang: 'zh-TW'}, //233 iOS 9 Chinese (Taiwan) Female

            // Microsoft Edge 14
            {name: 'Microsoft David Mobile - English (United States)', lang: 'en-US'}, //234 Microsoft Edge David English Male
            {name: 'Microsoft Zira Mobile - English (United States)', lang: 'en-US'}, //235 Microsoft Edge Zira English Female
            {name: 'Microsoft Mark Mobile - English (United States)', lang: 'en-US'}, //236 Microsoft Edge Mark English Male

            {name: 'native', lang: ''}, //237 Chromium Windows native US Male

            {name: 'Google espaÃ±ol'}, //238 Google Chrome Windows newer name variants Spanish Female
            {name: 'Google espaÃ±ol de Estados Unidos'}, //239 Google Chrome Windows newer name variants US Spanish Female
            {name: 'Google franÃ§ais'}, //240 Google Chrome Windows newer name variants French Female
            {name: 'Google Bahasa Indonesia'}, //241 Google Chrome Windows newer name variants Indonesian Female
            {name: 'Google italiano'}, //242 Google Chrome Windows newer name variants Italian Female
            {name: 'Google Nederlands'}, //243 Google Chrome Windows newer name variants Dutch Female
            {name: 'Google polski'}, //244 Google Chrome Windows newer name variants Polish Female
            {name: 'Google portuguÃªs do Brasil'}, //245 Google Chrome Windows newer name variants Brazilian Portugese Female
            {name: 'Google Ñ€ÑƒÑÑÐºÐ¸Ð¹'}, //246 Google Chrome Windows newer name variants Russian Female
            {name: 'Google à¤¹à¤¿à¤¨à¥à¤¦à¥€'}, //247 Google Chrome Windows newer name variants Hindi Female
            {name: 'Google æ—¥æœ¬èªž'}, //248 Google Chrome Windows newer name variants Japanese Female. June 2019 changed to Japanese Male from Japanese Female Chrome .
            {name: 'Google æ™®é€šè¯ï¼ˆä¸­å›½å¤§é™†ï¼‰'}, //249 Google Chrome Windows newer name variants Chinese Female

            {name: 'Google ç²¤èªžï¼ˆé¦™æ¸¯ï¼‰'}, //250 Google Chrome Windows newer name variants Hong Kong Chinese Female
            {name: 'zh-HK', rate: 0.25}, //251 iOS
            {name: 'Fallback Chinese (Hong Kong) Female', lang: 'zh-HK', fallbackvoice: true, service: 'g1', gender: 'female'}, //252 Chinese (Hong Kong) Female fallback

            {name: 'Google ç²¤èªžï¼ˆé¦™æ¸¯ï¼‰'}, //253 Google Chrome Windows newer name variants Chinese Taiwan Female
            {name: 'zh-TW', rate: 0.25}, //254 iOS
            {name: 'Fallback Chinese (Taiwan) Female', lang: 'zh-TW', fallbackvoice: true, service: 'g1', gender: 'female'}, //255 Chinese Taiwan Female fallback

            {name: 'Microsoft George Mobile - English (United Kingdom)', lang: 'en-GB'}, //256 Male
            {name: 'Microsoft Susan Mobile - English (United Kingdom)', lang: 'en-GB'}, //257 Female
            {name: 'Microsoft Hazel Mobile - English (United Kingdom)', lang: 'en-GB'}, //258 Female
            {name: 'Microsoft Heera Mobile - English (India)', lang: 'en-In'}, //259 Female
            {name: 'Microsoft Irina Mobile - Russian (Russia)', lang: 'ru-RU'}, //260 Female
            {name: 'Microsoft Hedda Mobile - German (Germany)', lang: 'de-DE'}, //261 Female
            {name: 'Microsoft Katja Mobile - German (Germany)', lang: 'de-DE'}, //262
            {name: 'Microsoft Helena Mobile - Spanish (Spain)', lang: 'es-ES'}, //263 Female
            {name: 'Microsoft Laura Mobile - Spanish (Spain)', lang: 'es-ES'}, //264 Female
            {name: 'Microsoft Sabina Mobile - Spanish (Mexico)', lang: 'es-MX'}, //265 Female
            {name: 'Microsoft Julie Mobile - French (France)', lang: 'fr-FR'}, //266 Female
            {name: 'Microsoft Paulina Mobile - Polish (Poland)', lang: 'pl-PL'}, //267 Female
            {name: 'Microsoft Huihui Mobile - Chinese (Simplified, PRC)', lang: 'zh-CN'}, //268 Female
            {name: 'Microsoft Yaoyao Mobile - Chinese (Simplified, PRC)', lang: 'zh-CN'}, //269 Female
            {name: 'Microsoft Tracy Mobile - Chinese (Traditional, Hong Kong S.A.R.)', lang: 'zh-CN'}, //270 Female
            {name: 'Microsoft Elsa Mobile - Italian (Italy)', lang: 'it-IT'}, //271 Female
            {name: 'Microsoft Maria Mobile - Portuguese (Brazil)', lang: 'pt-BR'}, //272 Female
            {name: 'Microsoft Ayumi Mobile - Japanese (Japan)', lang: 'ja-JP'}, //273
            {name: 'Microsoft Haruka Mobile - Japanese (Japan)', lang: 'ja-JP'}, //274 Female

            {name: 'Helena', lang: 'de-DE'}, //275 iOS 10 siri Deutsch Female
            {name: 'Catherine', lang: 'en-AU'}, //276 iOS 10 siri Australian Female
            {name: 'Arthur', lang: 'en-GB'}, //277 iOS 10 siri UK English Male
            {name: 'Martha', lang: 'en-GB'}, //278 iOS 10 siri UK English Female
            {name: 'Marie', lang: 'fr-FR'}, //279 iOS 10 siri French Female
            {name: 'O-ren', lang: 'ja-JP'}, //280 iOS 10 siri Japanese Female
            {name: 'Yu-shu', lang: 'zh-CN'}, //281 iOS 10 siri Chinese Female

            // Microsoft Edge 41.16275.1000.0
            {name: 'Microsoft David - English (United States)', lang: 'en-US'}, //282 like 234 Microsoft Edge David English Male
            {name: 'Microsoft Zira - English (United States)', lang: 'en-US'}, //283 like 235 Microsoft Edge Zira English Female
            {name: 'Microsoft Mark - English (United States)', lang: 'en-US'}, //284 like 236 Microsoft Edge Mark English Male
            {name: 'Microsoft George - English (United Kingdom)', lang: 'en-GB'}, //285 like 256 Male
            {name: 'Microsoft Susan - English (United Kingdom)', lang: 'en-GB'}, //286 like 257 Female
            {name: 'Microsoft Hazel - English (United Kingdom)', lang: 'en-GB'}, //287 like 258 Female
            {name: 'Microsoft Heera - English (India)', lang: 'en-In'}, //288 like 259 Female
            {name: 'Microsoft Irina - Russian (Russia)', lang: 'ru-RU'}, //289 like 260 Female
            {name: 'Microsoft Hedda - German (Germany)', lang: 'de-DE'}, //290 like 261 Female
            {name: 'Microsoft Katja - German (Germany)', lang: 'de-DE'}, //291 like 262
            {name: 'Microsoft Helena - Spanish (Spain)', lang: 'es-ES'}, //292 like 263 Female
            {name: 'Microsoft Laura - Spanish (Spain)', lang: 'es-ES'}, //293 like 264 Female
            {name: 'Microsoft Sabina - Spanish (Mexico)', lang: 'es-MX'}, //294 like 265 Female
            {name: 'Microsoft Julie - French (France)', lang: 'fr-FR'}, //295 like 266 Female
            {name: 'Microsoft Paulina - Polish (Poland)', lang: 'pl-PL'}, //296 like 267 Female
            {name: 'Microsoft Huihui - Chinese (Simplified, PRC)', lang: 'zh-CN'}, //297 like 268 Female
            {name: 'Microsoft Yaoyao - Chinese (Simplified, PRC)', lang: 'zh-CN'}, //298 like 269 Female
            {name: 'Microsoft Tracy - Chinese (Traditional, Hong Kong S.A.R.)', lang: 'zh-CN'}, //299 like 270 Female
            {name: 'Microsoft Elsa - Italian (Italy)', lang: 'it-IT'}, //300 like 271 Female
            {name: 'Microsoft Maria - Portuguese (Brazil)', lang: 'pt-BR'}, //301 like 272 Female
            {name: 'Microsoft Ayumi - Japanese (Japan)', lang: 'ja-JP'}, //302 like 273
            {name: 'Microsoft Haruka - Japanese (Japan)', lang: 'ja-JP'}, //303 like 274 Female
            {name: 'Microsoft Hortense - French (France)', lang: 'fr-FR'}, //304 Female like 266
            {name: 'Microsoft Hanhan - Chinese (Traditional, Taiwan)', lang: 'zh-TW'}, //305 Female
            {name: 'Microsoft Heami - Korean (Korean)', lang: 'ko-KR'}, //306 like 218 Female
            {name: 'Microsoft Stefan - German (Germany)', lang: 'de-DE'}, //307 Male
            {name: 'Microsoft Ravi - English (India)', lang: 'en-IN'}, //308 Male ** NOT USED
            {name: 'Microsoft Pablo - Spanish (Spain)', lang: 'es-ES'}, //309 Male
            {name: 'Microsoft Raul - Spanish (Mexico)', lang: 'es-MX'}, //310 Male
            {name: 'Microsoft Paul - French (France)', lang: 'fr-FR'}, //311 Male
            {name: 'Microsoft Cosimo - Italian (Italy)', lang: 'it-IT'}, //312 Male
            {name: 'Microsoft Ichiro - Japanese (Japan)', lang: 'ja-JP'}, //313 Male
            {name: 'Microsoft Adam - Polish (Poland)', lang: 'pl-PL'}, //314 Male
            {name: 'Microsoft Daniel - Portuguese (Brazil)', lang: 'pt-BR'}, //315 Male
            {name: 'Microsoft Pavel - Russian (Russia)', lang: 'ru-RU'}, //316 Male
            {name: 'Microsoft Kangkang - Chinese (Simplified, PRC)', lang: 'zh-CN'}, //317 Male
            {name: 'Microsoft Danny - Chinese (Traditional, Hong Kong S.A.R.)', lang: 'zh-HK'}, //318 Male
            {name: 'Microsoft Yating - Chinese (Traditional, Taiwan)', lang: 'zh-TW'}, //319 Female
            {name: 'Microsoft Zhiwei - Chinese (Traditional, Taiwan)', lang: 'zh-TW'}, //320 Male
            // Microsoft new Mobile
            {name: 'Microsoft Hortense Mobile - French (France)', lang: 'fr-FR'}, //321 like 304 Female
            {name: 'Microsoft Hanhan Mobile - Chinese (Traditional, Taiwan)', lang: 'zh-TW'}, //322 like 305 Female
            {name: 'Microsoft Heami Mobile - Korean (Korean)', lang: 'ko-KR'}, //323 like 306 Female
            {name: 'Microsoft Stefan Mobile - German (Germany)', lang: 'de-DE'}, //324 like 307 Male
            {name: 'Microsoft Ravi Mobile - English (India)', lang: 'en-IN'}, //325 like 308 Male ** NOT USED
            {name: 'Microsoft Pablo Mobile - Spanish (Spain)', lang: 'es-ES'}, //326 like 309 Male
            {name: 'Microsoft Raul Mobile - Spanish (Mexico)', lang: 'es-MX'}, //327 like 310 Male
            {name: 'Microsoft Paul Mobile - French (France)', lang: 'fr-FR'}, //328 like 311 Male
            {name: 'Microsoft Cosimo Mobile - Italian (Italy)', lang: 'it-IT'}, //329 like 312 Male
            {name: 'Microsoft Ichiro Mobile - Japanese (Japan)', lang: 'ja-JP'}, //330 like 313 Male
            {name: 'Microsoft Adam Mobile - Polish (Poland)', lang: 'pl-PL'}, //331 like 314 Male
            {name: 'Microsoft Daniel Mobile - Portuguese (Brazil)', lang: 'pt-BR'}, //332 like 315 Male
            {name: 'Microsoft Pavel Mobile - Russian (Russia)', lang: 'ru-RU'}, //333 like 316 Male
            {name: 'Microsoft Kangkang Mobile - Chinese (Simplified, PRC)', lang: 'zh-CN'}, //334 like 317 Male
            {name: 'Microsoft Danny Mobile - Chinese (Traditional, Hong Kong S.A.R.)', lang: 'zh-HK'}, //335 like 318 Male
            {name: 'Microsoft Yating Mobile - Chinese (Traditional, Taiwan)', lang: 'zh-TW'}, //336 like 319 Female
            {name: 'Microsoft Zhiwei Mobile - Chinese (Traditional, Taiwan)', lang: 'zh-TW'}, //337 like 320 Male
            // Microsoft available in Chrome with Desktop string
            {name: 'Microsoft David Desktop - English (United States)', lang: 'en-US'}, //338 like 282, 234 Microsoft Edge David English Male
            {name: 'Microsoft Zira Desktop - English (United States)', lang: 'en-US'}, //339 like 283, 235 Microsoft Edge Zira English Female
            {name: 'Microsoft Mark Desktop - English (United States)', lang: 'en-US'}, //340 like 284, 236 Microsoft Edge Mark English Male
            {name: 'Microsoft George Desktop - English (United Kingdom)', lang: 'en-GB'}, //341 like 285, 256 Male
            {name: 'Microsoft Susan Desktop - English (United Kingdom)', lang: 'en-GB'}, //342 like 286, 257 Female
            {name: 'Microsoft Hazel Desktop - English (United Kingdom)', lang: 'en-GB'}, //343 like 287, 258 Female
            {name: 'Microsoft Heera Desktop - English (India)', lang: 'en-In'}, //344 like 288, 259 Female
            {name: 'Microsoft Irina Desktop - Russian (Russia)', lang: 'ru-RU'}, //345 like 289, 260 Female
            {name: 'Microsoft Hedda Desktop - German (Germany)', lang: 'de-DE'}, //346 like 290, 261 Female
            {name: 'Microsoft Katja Desktop - German (Germany)', lang: 'de-DE'}, //347 like 291, 262
            {name: 'Microsoft Helena Desktop - Spanish (Spain)', lang: 'es-ES'}, //348 like 292, 263 Female
            {name: 'Microsoft Laura Desktop - Spanish (Spain)', lang: 'es-ES'}, //349 like 293, 264 Female
            {name: 'Microsoft Sabina Desktop - Spanish (Mexico)', lang: 'es-MX'}, //350 like 294, 265 Female
            {name: 'Microsoft Julie Desktop - French (France)', lang: 'fr-FR'}, //351 like 295, 266 Female
            {name: 'Microsoft Paulina Desktop - Polish (Poland)', lang: 'pl-PL'}, //352 like 296, 267 Female
            {name: 'Microsoft Huihui Desktop - Chinese (Simplified, PRC)', lang: 'zh-CN'}, //353 like 297, 268 Female
            {name: 'Microsoft Yaoyao Desktop - Chinese (Simplified, PRC)', lang: 'zh-CN'}, //354 like 298, 269 Female
            {name: 'Microsoft Tracy Desktop - Chinese (Traditional, Hong Kong S.A.R.)', lang: 'zh-CN'}, //355 like 299, 270 Fenale
            {name: 'Microsoft Elsa Desktop - Italian (Italy)', lang: 'it-IT'}, //356 like 300, 271 Female
            {name: 'Microsoft Maria Desktop - Portuguese (Brazil)', lang: 'pt-BR'}, //357 like 301, 272 Female
            {name: 'Microsoft Ayumi Desktop - Japanese (Japan)', lang: 'ja-JP'}, //358 like 302, 273
            {name: 'Microsoft Haruka Desktop - Japanese (Japan)', lang: 'ja-JP'}, //359 like 303, 274 Female
            {name: 'Microsoft Hortense Desktop - French (France)', lang: 'fr-FR'}, //360 like 304 Female
            {name: 'Microsoft Hanhan Desktop - Chinese (Traditional, Taiwan)', lang: 'zh-TW'}, //361 like 322, 305 Female
            {name: 'Microsoft Heami Desktop - Korean (Korean)', lang: 'ko-KR'}, //362 like 323, 306 Female
            {name: 'Microsoft Stefan Desktop - German (Germany)', lang: 'de-DE'}, //363 like 324, 307 Male
            {name: 'Microsoft Ravi Desktop - English (India)', lang: 'en-IN'}, //364 like 325, 308 Male ** NOT USED
            {name: 'Microsoft Pablo Desktop - Spanish (Spain)', lang: 'es-ES'}, //365 like 326, 309 Male
            {name: 'Microsoft Raul Desktop - Spanish (Mexico)', lang: 'es-MX'}, //366 like 327, 310 Male
            {name: 'Microsoft Paul Desktop - French (France)', lang: 'fr-FR'}, //367 like 328, 311 Male
            {name: 'Microsoft Cosimo Desktop - Italian (Italy)', lang: 'it-IT'}, //368 like 239, 312 Male
            {name: 'Microsoft Ichiro Desktop - Japanese (Japan)', lang: 'ja-JP'}, //369 like 330, 313 Male
            {name: 'Microsoft Adam Desktop - Polish (Poland)', lang: 'pl-PL'}, //370 like 331, 314 Male
            {name: 'Microsoft Daniel Desktop - Portuguese (Brazil)', lang: 'pt-BR'}, //371 like 332, 315 Male
            {name: 'Microsoft Pavel Desktop - Russian (Russia)', lang: 'ru-RU'}, //372 like 333, 316 Male
            {name: 'Microsoft Kangkang Desktop - Chinese (Simplified, PRC)', lang: 'zh-CN'}, //373 like 334, 317 Male
            {name: 'Microsoft Danny Desktop - Chinese (Traditional, Hong Kong S.A.R.)', lang: 'zh-HK'}, //374 like 335, 318 Male
            {name: 'Microsoft Yating Desktop - Chinese (Traditional, Taiwan)', lang: 'zh-TW'}, //375 like 336, 319 Female
            {name: 'Microsoft Zhiwei Desktop - Chinese (Traditional, Taiwan)', lang: 'zh-TW'}, //376 like 337, 320 Male

            {name: 'Martin', lang: 'de-DE'}, //377 iOS 11 siri Deutsch Male
            {name: 'Daniel', lang: 'fr-FR'}, //378 iOS 11 siri French Male
            {name: 'Hattori', lang: 'ja-JP'}, //379 iOS 11 siri Japanese Male
            {name: 'Li-mu', lang: 'zh-CN'}, //380 iOS 11 siri Chinese Female
            {name: 'Gordon', lang: 'en-AU'}, //381 iOS 10 siri Australian Male
            {name: 'Aaron', lang: 'en-US'}, //382 iOS 10 siri US English Male
            {name: 'Nicky', lang: 'en-US'}, //383 iOS 10 siri US English Female

            {name: 'Microsoft Hanhan Desktop - Chinese (Taiwan)', lang: 'zh-TW'}, //384 like 361 like 322, 305 Female Windows Chrome and Firefox variation on name
            {name: 'Microsoft Heami Desktop - Korean', lang: 'ko-KR'}, //385 like 362 like 323, 306 FemaleWindows Chrome and Firefox variation on name
            {name: 'Fallback Australian Male', lang: 'en-AU', fallbackvoice: true, service: 'g3', gender: 'male'}, //386 Australian Male fallback
            {name: 'Fallback Russian Male', lang: 'ru', fallbackvoice: true, service: 'g3', gender: 'male', deprecated: true}, //387 Russian Male fallback. Deprecated due to RES-313.
            {name: 'Fallback Arabic Male', lang: 'ar', fallbackvoice: true, service: 'g3', gender: 'male'}, //388 Arabic Male fallback
            {name: 'Fallback Chinese', lang: 'zh-CN', fallbackvoice: true, service: 'g3', gender: 'male'}, //389 Chinese Male fallback
            {name: 'Fallback Chinese HK', lang: 'zh-HK', fallbackvoice: true, service: 'g3', gender: 'male'}, //390 Chinese HK Male fallback
            {name: 'Fallback Chinese TW', lang: 'zh-TW', fallbackvoice: true, service: 'g3', gender: 'male'}, //391 Chinese TW Male fallback
            {name: 'Fallback French Male', lang: 'fr', fallbackvoice: true, service: 'g3', gender: 'male'}, //392 French Male fallback
            {name: 'Fallback Deutsch Male', lang: 'de', fallbackvoice: true, service: 'g3', gender: 'male'}, //393 Deutsch Male fallback
            {name: 'Fallback Hindi Male', lang: 'hi', fallbackvoice: true, service: 'g3', gender: 'male'}, //394 Hindi Male fallback
            {name: 'Fallback Indonesian Male', lang: 'id', fallbackvoice: true, service: 'g3', gender: 'male'}, //395 Indonesian Male fallback
            {name: 'Fallback Japanese Male', lang: 'ja', fallbackvoice: true, service: 'g3', gender: 'male'}, //396 Japanese Male fallback
            {name: 'Fallback Korean Male', lang: 'ko', fallbackvoice: true, service: 'g3', gender: 'male'}, //397 Korean Male fallback
            {name: 'Fallback Polish Male', lang: 'pl', fallbackvoice: true, service: 'g1', gender: 'male'}, //398 Polish Male fallback
            {name: 'Fallback Brazilian Portuguese Male', lang: 'pt-BR', fallbackvoice: true, service: 'g3', gender: 'male', deprecated: true}, //399 Brazilian Portuguese Male fallback. Deprecated due to RES-313.
            {name: 'Fallback Portuguese Male', lang: 'pt-PT', fallbackvoice: true, service: 'g1', gender: 'male'}, //400 Portuguese Male fallback
            {name: 'Fallback Spanish Male', lang: 'es', fallbackvoice: true, service: 'g3', gender: 'male', deprecated: true}, //401 Spanish Male fallback. Deprecated due to RES-313.
            {name: 'Fallback Spanish (Latin American) Male', lang: 'es-419', fallbackvoice: true, service: 'g3', gender: 'male'}, //402 Spanish (Latin American) Male fallback
            {name: 'Fallback Thai Male', lang: 'th', fallbackvoice: true, service: 'g3', gender: 'male'}, //403 Thai Male fallback
            {name: 'Fallback Turkish Male', lang: 'tr', fallbackvoice: true, service: 'g3', gender: 'male'}, //404 Turkish Male fallback
            {name: 'Fallback Vietnamese Female', lang: 'vi', fallbackvoice: true, service: 'g1', gender: 'female'}, //405 Vietnamese Female fallback
            {name: 'Fallback Italian Male', lang: 'it', fallbackvoice: true, service: 'g3', gender: 'male'}, //406 Italian Male fallback
            {name: 'Fallback Dutch Male', lang: 'nl', fallbackvoice: true, timerSpeed:0, service: 'g3', gender: 'male'}, //407 Dutch Male fallback
            {name: 'Microsoft Anna - English (United States)', lang: 'en-US', gender: 'female'}, //408 Windows 7 default US English Female
            {name: 'Microsoft Lili - Chinese (China)', lang: 'zh-CN', gender: 'female'}, //409 Windows 7 default Chinese Female

            {name: 'Bangla Bangladesh', lang: 'bn_BD', gender: 'male'}, //410 Android 9 Bangla Bangladesh Male
            {name: 'Bangla India', lang: 'bn_IN', gender: 'male'}, //411 Android 9 Bangla India Male
            {name: 'Czech Czechia', lang: 'cs_CZ', gender: 'female'}, //412 Android 9 Czech Czechia Female
            {name: 'Danish Denmark', lang: 'da_DK', gender: 'female'}, //413 Android 9 Danish Denmark Female
            {name: 'Greek Greece', lang: 'el_GR', gender: 'female'}, //414 Android 9 Greek Greece Female
            {name: 'English Australia', lang: 'en_AU', gender: 'female'}, //415 Android 9 English Australia Female
            {name: 'Estonian Estonia', lang: 'et_EE', gender: 'male'}, //416 Android 9 Estonian Estonia Male
            {name: 'Finnish Finland', lang: 'fi_FI', gender: 'female'}, //417 Android 9 Finnish Finland Female
            {name: 'Filipino Philippines', lang: 'fil_PH', gender: 'female'}, //418 Android 9 Filipino Philippines Female
            {name: 'French Canada', lang: 'fr_CAF', gender: 'female'}, //419 Android 9 French Canada Female
            {name: 'Hungarian Hungary', lang: 'hu_HU', gender: 'female'}, //420 Android 9 Hungarian Hungary Female
            {name: 'Khmer Cambodia', lang: 'km_KH', gender: 'female'}, //421 Android 9 Khmer Cambodia Female - unused
            {name: 'Norwegian BokmÃ¥l Norway', lang: 'nb_NO', gender: 'female'}, //422 Android 9 Norwegian BokmÃ¥l Norway Female
            {name: 'Nepali Nepal', lang: 'ne_NP', gender: 'female'}, //423 Android 9 Nepali Nepal Female
            {name: 'Romanian Romania', lang: 'ro_RO', gender: 'female'}, //424 Android 9 Romanian Romania Female
            {name: 'Sinhala Sri Lanka', lang: 'si_LK', gender: 'female'}, //425 Android 9 Sinhala Sri Lanka Female
            {name: 'Slovak Slovakia', lang: 'sk_SK', gender: 'female'}, //426 Android 9 Slovak Slovakia Female
            {name: 'Swedish Sweden', lang: 'sv_SE', gender: 'female'}, //427 Android 9 Swedish Sweden Female
            {name: 'Ukrainian Ukraine', lang: 'uk_UA', gender: 'female'}, //428 Android 9 Ukrainian Ukraine Female
            {name: 'Vietnamese Vietnam', lang: 'vi_VN', gender: 'female'}, //429 Android 9 Vietnamese Vietnam Female
            {name: 'Cantonese Hong Kong', lang: 'yue_HK_#Hant', gender: 'female'}, //430 Android 9 Cantonese Hong Kong Female

            {name: 'Microsoft Server Speech Text to Speech Voice (en-US, Guy24kRUS)', lang: 'en-US', gender: 'male'}, //431 Microsoft Edge 77.0.189.3 (Official build) dev (64-bit) US Male
            {name: 'Microsoft Server Speech Text to Speech Voice (en-US, Jessa24kRUS)', lang: 'en-US', gender: 'female'}, //432 Microsoft Edge 77.0.189.3 (Official build) dev (64-bit) US Female
            {name: 'Microsoft Server Speech Text to Speech Voice (en-US, JessaRUS)', lang: 'en-US', gender: 'female'}, //433 Microsoft Edge 77.0.189.3 (Official build) dev (64-bit) US Female
            {name: 'Microsoft Server Speech Text to Speech Voice (en-US, ZiraRUS)', lang: 'en-US', gender: 'female'}, //434 Microsoft Edge 77.0.189.3 (Official build) dev (64-bit) US Female

            {name: 'Fallback Bangla Bangladeh Female', lang: 'bn-BD', fallbackvoice: true, timerSpeed:0, service: 'g3', gender: 'female'}, //435 Bangla Bangladesh Female fallback
            {name: 'Fallback Bangla Bangladeh Male', lang: 'bn-BD', fallbackvoice: true, timerSpeed:0, service: 'g3', gender: 'male'}, //436 Bangla Bangladesh Male fallback
            {name: 'Fallback Filipino Female', lang: 'fil-PH', fallbackvoice: true, timerSpeed:0, service: 'g3', gender: 'female'}, //437 Filipino Female fallback
            {name: 'Fallback Filipino Male', lang: 'fil-PH', fallbackvoice: true, timerSpeed:0, service: 'g3', gender: 'male'}, //438 Filipino Male fallback
            {name: 'Fallback Cambodian Khmer Female', lang: 'km-KH', fallbackvoice: true, timerSpeed:0, service: 'g3', gender: 'female'}, //439 Cambodian Khmer Female fallback - unused
            {name: 'Fallback Cambodian Khmer Male', lang: 'km-KH', fallbackvoice: true, timerSpeed:0, service: 'g3', gender: 'male'}, //440 Cambodian Khmer Male fallback
            {name: 'Fallback Nepali Female', lang: 'ne-NP', fallbackvoice: true, timerSpeed:0, service: 'g3', gender: 'female'}, //441 Nepali Female fallback
            {name: 'Fallback Sinhala Female', lang: 'si-LK', fallbackvoice: true, timerSpeed:0, service: 'g3', gender: 'female'}, //442 Sinhala Female fallback
            {name: 'Fallback Ukrainian Female', lang: 'uk-UA', fallbackvoice: true, timerSpeed:0, service: 'g3', gender: 'female'}, //443 Ukrainian Female fallback
            {name: 'Fallback Cantonese Hong Kong Female', lang: 'yue-HK', fallbackvoice: true, timerSpeed:0, service: 'g3', gender: 'female'}, //444 Cantonese Hong Kong Female fallback
            {name: 'Fallback Cantonese Hong Kong Male', lang: 'yue-HK', fallbackvoice: true, timerSpeed:0, service: 'g3', gender: 'male'}, //445 Cantonese Hong Kong Male fallback
            {name: 'Fallback Estonian Male', lang: 'et-EE', fallbackvoice: true, timerSpeed:0, service: 'g3', gender: 'male'}, //446 Estonian Male fallback
            {name: 'Fallback Bangla India Female', lang: 'bn-IN', fallbackvoice: true, timerSpeed:0, service: 'g3', gender: 'female'}, //447 Bangla India Female fallback
            {name: 'Fallback Bangla India Male', lang: 'bn-IN', fallbackvoice: true, timerSpeed:0, service: 'g3', gender: 'male'}, //448 Bangla India Male fallback
            {name: 'Fallback French Canadian Female', lang: 'fr-CA', fallbackvoice: true, timerSpeed:0, service: 'g3', gender: 'female'}, //449 French Canadian Female fallback
            {name: 'Fallback French Canadian Male', lang: 'fr-CA', fallbackvoice: true, timerSpeed:0, service: 'g3', gender: 'male'}, //450 French Canadian Male fallback

            {name: 'Fallback Tamil', lang: 'ta', fallbackvoice: true, service: 'g1', gender: 'female'}, //451 Tamil Female fallback

            {name: 'Tian-Tian', voiceURI: 'com.apple.ttsbundle.Ting-Ting-compact', lang:'zh-CN', gender: 'female'}, //452 iOS14 name change of #231
            {name: 'English Nigeria', lang: 'en_NG', gender: 'female'}, //453 Android 10 English Nigeria - unused
            {name: 'Gujarati India', lang: 'gu_IN', gender: 'female'}, //454 Android 10 Gujarati India - unused
            {name: 'Kannada India', lang: 'kn_IN', gender: 'female'}, //455 Android 10 Kannada India - unused
            {name: 'Malayalam India', lang: 'ml_IN', gender: 'female'}, //456 Android 10 Malayalam India - unused
            {name: 'Marathi India', lang: 'mr_IN', gender: 'female'}, //457 Android 10 Marathi India - unused
            {name: 'Tamil India', lang: 'ta_IN', gender: 'female'}, //458 Android 10 Tamil India
            {name: 'Telugu India', lang: 'te_IN', gender: 'female'}, //459 Android 10 Telugu India - unused
            {name: 'Urdu Pakistan', lang: 'ur_PK', gender: 'female'}, //460 Android 10 Urdu Pakistan - unused
            {name: 'Javanese Indonesia', lang: 'jv_ID', gender: 'female'}, //461 Android 11 Javanese Indonesia - unused
            {name: 'Malay Malaysia', lang: 'ms_MY', gender: 'female'}, //462 Android 11 Malay Malaysia - unused
            {name: 'Chinese Hong Kong', lang: 'zh_HK_#Hans', gender: 'female'}, //463 Android 11 Chinese Hong Kong (Simplified)
            {name: 'Chinese Hong Kong', lang: 'zh_HK_#Hant', gender: 'female'}, //464 Android 11 Chinese Hong Kong (Traditional)
            {name: 'Microsoft Tolga - Turkish (Turkey)', lang: 'tr-TR', gender: 'male'}, //465 Windows 10 Microsoft Tolga Turkish
            {name: 'Korean (South Korea)', voiceURI: 'moz-tts:android:ko_KR', lang: 'ko-KR', gender: 'female'}, //466 Android 11 Firefox Korean (South Korea)
            {name: 'Marathi (India)', voiceURI: 'moz-tts:android:mr_IN', lang: 'mr-IN', gender: 'female'}, //467 Android 11 Firefox Marathi (India) - unused
            {name: 'Russian (Russia)', voiceURI: 'moz-tts:android:ru_RU', lang: 'ru-RU', gender: 'female'}, //468 Android 11 Firefox Russian (Russia)
            {name: 'Chinese (Taiwan)', voiceURI: 'moz-tts:android:zh_TW', lang: 'zh-TW', gender: 'female'}, //469 Android 11 Firefox Chinese (Taiwan)
            {name: 'Hungarian (Hungary)', voiceURI: 'moz-tts:android:hu_HU', lang: 'hu-HU', gender: 'female'}, //470 Android 11 Firefox Hungarian (Hungary)
            {name: 'Thai (Thailand)', voiceURI: 'moz-tts:android:th_TH', lang: 'th-TH', gender: 'female'}, //471 Android 11 Firefox Thai (Thailand)
            {name: 'Urdu (Pakistan)', voiceURI: 'moz-tts:android:ur_PK', lang: 'ur-PK', gender: 'female'}, //472 Android 11 Firefox Urdu (Pakistan) - unused
            {name: 'Norwegian BokmÃ¥l (Norway)', voiceURI: 'moz-tts:android:nb_NO', lang: 'nb-NO', gender: 'female'}, //473 Android 11 Firefox Norwegian BokmÃ¥l (Norway)
            {name: 'Danish (Denmark)', voiceURI: 'moz-tts:android:da_DK', lang: 'da-DK', gender: 'female'}, //474 Android 11 Firefox Danish (Denmark)
            {name: 'Turkish (Turkey)', voiceURI: 'moz-tts:android:tr_TR', lang: 'tr-TR', gender: 'female'}, //475 Android 11 Firefox Turkish (Turkey)
            {name: 'Estonian (Estonia)', voiceURI: 'moz-tts:android:et_EE', lang: 'et-EE', gender: 'male'}, //476 Android 11 Firefox Estonian (Estonia)
            {name: 'Bosnian', voiceURI: 'moz-tts:android:bs', lang: 'bs', deprecated: true}, //477 Android 11 Firefox Bosnian
            {name: 'Swahili', voiceURI: 'moz-tts:android:sw', lang: 'sw', deprecated: true}, //478 Android 11 Firefox Swahili
            {name: 'Portuguese (Portugal)', voiceURI: 'moz-tts:android:pt_PT', lang: 'pt-PT', gender: 'female'}, //479 Android 11 Firefox Portuguese (Portugal)
            {name: 'Vietnamese (Vietnam)', voiceURI: 'moz-tts:android:vi_VN', lang: 'vi-VN', gender: 'female'}, //480 Android 11 Firefox Vietnamese (Vietnam)
            {name: 'English (United States)', voiceURI: 'moz-tts:android:en_US', lang: 'en-US', gender: 'female'}, //481 Android 11 Firefox English (United States)
            {name: 'Swedish (Sweden)', voiceURI: 'moz-tts:android:sv_SE', lang: 'sv-SE', gender: 'female'}, //482 Android 11 Firefox Swedish (Sweden)
            {name: 'Arabic', voiceURI: 'moz-tts:android:ar', lang: 'ar', gender: 'female'}, //483 Android 11 Firefox Arabic
            {name: 'Sundanese (Indonesia)', voiceURI: 'moz-tts:android:su_ID', lang: 'su-ID', gender: 'female'}, //484 Android 11 Firefox Sundanese (Indonesia) - unused
            {name: 'Bangla (Bangladesh)', voiceURI: 'moz-tts:android:bn_BD', lang: 'bn-BD', gender: 'male'}, //485 Android 11 Firefox Bangla (Bangladesh)
            {name: 'Gujarati (India)', voiceURI: 'moz-tts:android:gu_IN', lang: 'gu-IN', gender: 'female'}, //486 Android 11 Firefox Gujarati (India) - unused
            {name: 'Kannada (India)', voiceURI: 'moz-tts:android:kn_IN', lang: 'kn-IN', gender: 'female'}, //487 Android 11 Firefox Kannada (India) - unused
            {name: 'Greek (Greece)', voiceURI: 'moz-tts:android:el_GR', lang: 'el-GR', gender: 'female'}, //488 Android 11 Firefox Greek (Greece)
            {name: 'Hindi (India)', voiceURI: 'moz-tts:android:hi_IN', lang: 'hi-IN', gender: 'female'}, //489 Android 11 Firefox Hindi (India)
            {name: 'Finnish (Finland)', voiceURI: 'moz-tts:android:fi_FI', lang: 'fi-FI', gender: 'female'}, //490 Android 11 Firefox Finnish (Finland)
            {name: 'Khmer (Cambodia)', voiceURI: 'moz-tts:android:km_KH', lang: 'km-KH', gender: 'female'}, //491 Android 11 Firefox Khmer (Cambodia) - unused
            {name: 'Bangla (India)', voiceURI: 'moz-tts:android:bn_IN', lang: 'bn-IN', gender: 'male'}, //492 Android 11 Firefox Bangla (India)
            {name: 'French (France)', voiceURI: 'moz-tts:android:fr_FR', lang: 'fr-FR', gender: 'female'}, //493 Android 11 Firefox French (France)
            {name: 'Ukrainian (Ukraine)', voiceURI: 'moz-tts:android:uk_UA', lang: 'uk-UA', gender: 'female'}, //494 Android 11 Firefox Ukrainian (Ukraine)
            {name: 'English (Australia)', voiceURI: 'moz-tts:android:en_AU', lang: 'en-AU', gender: 'female'}, //495 Android 11 Firefox English (Australia)
            {name: 'Dutch (Netherlands)', voiceURI: 'moz-tts:android:nl_NL', lang: 'nl-NL', gender: 'female'}, //496 Android 11 Firefox Dutch (Netherlands)
            {name: 'French (Canada)', voiceURI: 'moz-tts:android:fr_CA', lang: 'fr-CA', gender: 'female'}, //497 Android 11 Firefox French (Canada)
            {name: 'Serbian', voiceURI: 'moz-tts:android:sr', lang: 'sr', gender: 'female'}, //498 Android 11 Firefox Serbian - unused
            {name: 'Portuguese (Brazil)', voiceURI: 'moz-tts:android:pt_BR', lang: 'pt-BR', gender: 'female'}, //499 Android 11 Firefox Portuguese (Brazil)
            {name: 'Malayalam (India)', voiceURI: 'moz-tts:android:ml_IN', lang: 'ml-IN', gender: 'female'}, //500 Android 11 Firefox Malayalam (India) - unused
            {name: 'Sinhala (Sri Lanka)', voiceURI: 'moz-tts:android:si_LK', lang: 'si-LK', gender: 'female'}, //501 Android 11 Firefox Sinhala (Sri Lanka)
            {name: 'German (Germany)', voiceURI: 'moz-tts:android:de_DE', lang: 'de-DE', gender: 'female'}, //502 Android 11 Firefox German (Germany)
            {name: 'Kurdish', voiceURI: 'moz-tts:android:ku', lang: 'ku', deprecated: true}, //503 Android 11 Firefox Kurdish
            {name: 'Czech (Czechia)', voiceURI: 'moz-tts:android:cs_CZ', lang: 'cs-CZ', gender: 'female'}, //504 Android 11 Firefox Czech (Czechia)
            {name: 'Polish (Poland)', voiceURI: 'moz-tts:android:pl_PL', lang: 'pl-PL', gender: 'female'}, //505 Android 11 Firefox Polish (Poland)
            {name: 'Slovak (Slovakia)', voiceURI: 'moz-tts:android:sk_SK', lang: 'sk-SK', gender: 'female'}, //506 Android 11 Firefox Slovak (Slovakia)
            {name: 'Filipino (Philippines)', voiceURI: 'moz-tts:android:fil_PH', lang: 'fil-PH', gender: 'female'}, //507 Android 11 Firefox Filipino (Philippines)
            {name: 'Italian (Italy)', voiceURI: 'moz-tts:android:it_IT', lang: 'it-IT', gender: 'female'}, //508 Android 11 Firefox Italian (Italy)
            {name: 'Nepali (Nepal)', voiceURI: 'moz-tts:android:ne_NP', lang: 'ne-NP', gender: 'female'}, //509 Android 11 Firefox Nepali (Nepal)
            {name: 'Malay (Malaysia)', voiceURI: 'moz-tts:android:ms_MY', lang: 'ms-MY', gender: 'female'}, //510 Android 11 Firefox Malay (Malaysia) - unused
            {name: 'Croatian', voiceURI: 'moz-tts:android:hr', lang: 'hr', deprecated: true}, //511 Android 11 Firefox Croatian
            {name: 'English (Nigeria)', voiceURI: 'moz-tts:android:en_NG', lang: 'en-NG', gender: 'female'}, //512 Android 11 Firefox English (Nigeria) - unused
            {name: 'Chinese (China)', voiceURI: 'moz-tts:android:zh_CN', lang: 'zh-CN', gender: 'female'}, //513 Android 11 Firefox Chinese (China)
            {name: 'Spanish (Spain)', voiceURI: 'moz-tts:android:es_ES', lang: 'es-ES', gender: 'female'}, //514 Android 11 Firefox Spanish (Spain)
            {name: 'Welsh', voiceURI: 'moz-tts:android:cy', lang: 'cy', deprecated: true}, //515 Android 11 Firefox Welsh
            {name: 'Tamil (India)', voiceURI: 'moz-tts:android:ta_IN', lang: 'ta-IN', gender: 'female'}, //516 Android 11 Firefox Tamil (India)
            {name: 'Japanese (Japan)', voiceURI: 'moz-tts:android:ja_JP', lang: 'ja-JP', gender: 'female'}, //517 Android 11 Firefox Japanese (Japan)
            {name: 'Albanian', voiceURI: 'moz-tts:android:sq', lang: 'sq', deprecated: true}, //518 Android 11 Firefox Albanian
            {name: 'Cantonese (Hong Kong)', voiceURI: 'moz-tts:android:yue_HK', lang: 'yue-HK', gender: 'female'}, //519 Android 11 Firefox Cantonese (Hong Kong) - unused
            {name: 'English (India)', voiceURI: 'moz-tts:android:en_IN', lang: 'en-IN', gender: 'female'}, //520 Android 11 Firefox English (India) - unused
            {name: 'Spanish (United States)', voiceURI: 'moz-tts:android:es_US', lang: 'es-US', gender: 'female'}, //521 Android 11 Firefox Spanish (United States)
            {name: 'Javanese (Indonesia)', voiceURI: 'moz-tts:android:jv_ID', lang: 'jv-ID', gender: 'female'}, //522 Android 11 Firefox Javanese (Indonesia) - unused
            {name: 'Latin', voiceURI: 'moz-tts:android:la', lang: 'la', deprecated: true}, //523 Android 11 Firefox Latin
            {name: 'Indonesian (Indonesia)', voiceURI: 'moz-tts:android:in_ID', lang: 'in-ID', gender: 'female'}, //524 Android 11 Firefox Indonesian (Indonesia)
            {name: 'Telugu (India)', voiceURI: 'moz-tts:android:te_IN', lang: 'te-IN', gender: 'female'}, //525 Android 11 Firefox Telugu (India) - unused
            {name: 'Romanian (Romania)', voiceURI: 'moz-tts:android:ro_RO', lang: 'ro-RO', gender: 'female'}, //526 Android 11 Firefox Romanian (Romania)
            {name: 'Catalan', voiceURI: 'moz-tts:android:ca', lang: 'ca', gender: 'female'}, //527 Android 11 Firefox Catalan - unused
            {name: 'English (United Kingdom)', voiceURI: 'moz-tts:android:en_GB', lang: 'en-GB', gender: 'female'}, //528 Android 11 Firefox English (United Kingdom)
            {name: 'Rishi', voiceURI: 'com.apple.ttsbundle.Rishi-compact', lang: 'en-IN', gender: 'male'}, //529 iOS14 Rishi Indian English - unused
        ];

        self.iOS = /(iPad|iPhone|iPod)/g.test(navigator.userAgent);
        self.iOS9  = /(iphone|ipod|ipad).* os 9_/.test(navigator.userAgent.toLowerCase());
        self.iOS10  = /(iphone|ipod|ipad).* os 10_/.test(navigator.userAgent.toLowerCase());
        self.iOS11  = /(iphone|ipod|ipad).* os 11_/.test(navigator.userAgent.toLowerCase());
        self.iOS11plus = /(iphone|ipod|ipad).* os 1[1-9]/.test(navigator.userAgent.toLowerCase());
        self.iOS9plus  = /(iphone|ipod|ipad).* os 10_/.test(navigator.userAgent.toLowerCase());
        self.iOS12_0 = /(iphone|ipod|ipad).* os 12_0/.test(navigator.userAgent.toLowerCase());
        self.iOS12  = /(iphone|ipod|ipad).* os 12_/.test(navigator.userAgent.toLowerCase());

        self.is_chrome = navigator.userAgent.indexOf('Chrome') > -1;
        self.is_safari = navigator.userAgent.indexOf("Safari") > -1;
        if ((self.is_chrome)&&(self.is_safari)) {self.is_safari=false;}
        self.is_opera = !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;
        self.is_android = navigator.userAgent.toLowerCase().indexOf("android") > -1;

        self.iOS_initialized = false;
        self.iOS9_initialized = false;
        self.iOS10_initialized = false;
        self.iOS11_initialized = false;


        //Fallback cache voices
        self.cache_ios_voices = [{"name":"he-IL","voiceURI":"he-IL","lang":"he-IL"},{"name":"th-TH","voiceURI":"th-TH","lang":"th-TH"},{"name":"pt-BR","voiceURI":"pt-BR","lang":"pt-BR"},{"name":"sk-SK","voiceURI":"sk-SK","lang":"sk-SK"},{"name":"fr-CA","voiceURI":"fr-CA","lang":"fr-CA"},{"name":"ro-RO","voiceURI":"ro-RO","lang":"ro-RO"},{"name":"no-NO","voiceURI":"no-NO","lang":"no-NO"},{"name":"fi-FI","voiceURI":"fi-FI","lang":"fi-FI"},{"name":"pl-PL","voiceURI":"pl-PL","lang":"pl-PL"},{"name":"de-DE","voiceURI":"de-DE","lang":"de-DE"},{"name":"nl-NL","voiceURI":"nl-NL","lang":"nl-NL"},{"name":"id-ID","voiceURI":"id-ID","lang":"id-ID"},{"name":"tr-TR","voiceURI":"tr-TR","lang":"tr-TR"},{"name":"it-IT","voiceURI":"it-IT","lang":"it-IT"},{"name":"pt-PT","voiceURI":"pt-PT","lang":"pt-PT"},{"name":"fr-FR","voiceURI":"fr-FR","lang":"fr-FR"},{"name":"ru-RU","voiceURI":"ru-RU","lang":"ru-RU"},{"name":"es-MX","voiceURI":"es-MX","lang":"es-MX"},{"name":"zh-HK","voiceURI":"zh-HK","lang":"zh-HK"},{"name":"sv-SE","voiceURI":"sv-SE","lang":"sv-SE"},{"name":"hu-HU","voiceURI":"hu-HU","lang":"hu-HU"},{"name":"zh-TW","voiceURI":"zh-TW","lang":"zh-TW"},{"name":"es-ES","voiceURI":"es-ES","lang":"es-ES"},{"name":"zh-CN","voiceURI":"zh-CN","lang":"zh-CN"},{"name":"nl-BE","voiceURI":"nl-BE","lang":"nl-BE"},{"name":"en-GB","voiceURI":"en-GB","lang":"en-GB"},{"name":"ar-SA","voiceURI":"ar-SA","lang":"ar-SA"},{"name":"ko-KR","voiceURI":"ko-KR","lang":"ko-KR"},{"name":"cs-CZ","voiceURI":"cs-CZ","lang":"cs-CZ"},{"name":"en-ZA","voiceURI":"en-ZA","lang":"en-ZA"},{"name":"en-AU","voiceURI":"en-AU","lang":"en-AU"},{"name":"da-DK","voiceURI":"da-DK","lang":"da-DK"},{"name":"en-US","voiceURI":"en-US","lang":"en-US"},{"name":"en-IE","voiceURI":"en-IE","lang":"en-IE"},{"name":"hi-IN","voiceURI":"hi-IN","lang":"hi-IN"},{"name":"el-GR","voiceURI":"el-GR","lang":"el-GR"},{"name":"ja-JP","voiceURI":"ja-JP","lang":"ja-JP"}];
        self.cache_ios9_voices = [{name:"Maged",voiceURI:"com.apple.ttsbundle.Maged-compact",lang:"ar-SA",localService:!0,"default":!0},{name:"Zuzana",voiceURI:"com.apple.ttsbundle.Zuzana-compact",lang:"cs-CZ",localService:!0,"default":!0},{name:"Sara",voiceURI:"com.apple.ttsbundle.Sara-compact",lang:"da-DK",localService:!0,"default":!0},{name:"Anna",voiceURI:"com.apple.ttsbundle.Anna-compact",lang:"de-DE",localService:!0,"default":!0},{name:"Melina",voiceURI:"com.apple.ttsbundle.Melina-compact",lang:"el-GR",localService:!0,"default":!0},{name:"Karen",voiceURI:"com.apple.ttsbundle.Karen-compact",lang:"en-AU",localService:!0,"default":!0},{name:"Daniel",voiceURI:"com.apple.ttsbundle.Daniel-compact",lang:"en-GB",localService:!0,"default":!0},{name:"Moira",voiceURI:"com.apple.ttsbundle.Moira-compact",lang:"en-IE",localService:!0,"default":!0},{name:"Samantha (Enhanced)",voiceURI:"com.apple.ttsbundle.Samantha-premium",lang:"en-US",localService:!0,"default":!0},{name:"Samantha",voiceURI:"com.apple.ttsbundle.Samantha-compact",lang:"en-US",localService:!0,"default":!0},{name:"Tessa",voiceURI:"com.apple.ttsbundle.Tessa-compact",lang:"en-ZA",localService:!0,"default":!0},{name:"Monica",voiceURI:"com.apple.ttsbundle.Monica-compact",lang:"es-ES",localService:!0,"default":!0},{name:"Paulina",voiceURI:"com.apple.ttsbundle.Paulina-compact",lang:"es-MX",localService:!0,"default":!0},{name:"Satu",voiceURI:"com.apple.ttsbundle.Satu-compact",lang:"fi-FI",localService:!0,"default":!0},{name:"Amelie",voiceURI:"com.apple.ttsbundle.Amelie-compact",lang:"fr-CA",localService:!0,"default":!0},{name:"Thomas",voiceURI:"com.apple.ttsbundle.Thomas-compact",lang:"fr-FR",localService:!0,"default":!0},{name:"Carmit",voiceURI:"com.apple.ttsbundle.Carmit-compact",lang:"he-IL",localService:!0,"default":!0},{name:"Lekha",voiceURI:"com.apple.ttsbundle.Lekha-compact",lang:"hi-IN",localService:!0,"default":!0},{name:"Mariska",voiceURI:"com.apple.ttsbundle.Mariska-compact",lang:"hu-HU",localService:!0,"default":!0},{name:"Damayanti",voiceURI:"com.apple.ttsbundle.Damayanti-compact",lang:"id-ID",localService:!0,"default":!0},{name:"Alice",voiceURI:"com.apple.ttsbundle.Alice-compact",lang:"it-IT",localService:!0,"default":!0},{name:"Kyoko",voiceURI:"com.apple.ttsbundle.Kyoko-compact",lang:"ja-JP",localService:!0,"default":!0},{name:"Yuna",voiceURI:"com.apple.ttsbundle.Yuna-compact",lang:"ko-KR",localService:!0,"default":!0},{name:"Ellen",voiceURI:"com.apple.ttsbundle.Ellen-compact",lang:"nl-BE",localService:!0,"default":!0},{name:"Xander",voiceURI:"com.apple.ttsbundle.Xander-compact",lang:"nl-NL",localService:!0,"default":!0},{name:"Nora",voiceURI:"com.apple.ttsbundle.Nora-compact",lang:"no-NO",localService:!0,"default":!0},{name:"Zosia",voiceURI:"com.apple.ttsbundle.Zosia-compact",lang:"pl-PL",localService:!0,"default":!0},{name:"Luciana",voiceURI:"com.apple.ttsbundle.Luciana-compact",lang:"pt-BR",localService:!0,"default":!0},{name:"Joana",voiceURI:"com.apple.ttsbundle.Joana-compact",lang:"pt-PT",localService:!0,"default":!0},{name:"Ioana",voiceURI:"com.apple.ttsbundle.Ioana-compact",lang:"ro-RO",localService:!0,"default":!0},{name:"Milena",voiceURI:"com.apple.ttsbundle.Milena-compact",lang:"ru-RU",localService:!0,"default":!0},{name:"Laura",voiceURI:"com.apple.ttsbundle.Laura-compact",lang:"sk-SK",localService:!0,"default":!0},{name:"Alva",voiceURI:"com.apple.ttsbundle.Alva-compact",lang:"sv-SE",localService:!0,"default":!0},{name:"Kanya",voiceURI:"com.apple.ttsbundle.Kanya-compact",lang:"th-TH",localService:!0,"default":!0},{name:"Yelda",voiceURI:"com.apple.ttsbundle.Yelda-compact",lang:"tr-TR",localService:!0,"default":!0},{name:"Ting-Ting",voiceURI:"com.apple.ttsbundle.Ting-Ting-compact",lang:"zh-CN",localService:!0,"default":!0},{name:"Sin-Ji",voiceURI:"com.apple.ttsbundle.Sin-Ji-compact",lang:"zh-HK",localService:!0,"default":!0},{name:"Mei-Jia",voiceURI:"com.apple.ttsbundle.Mei-Jia-compact",lang:"zh-TW",localService:!0,"default":!0}];
        self.cache_ios10_voices = [{"name":"Maged","voiceURI":"com.apple.ttsbundle.Maged-compact","lang":"ar-SA"},{"name":"Zuzana","voiceURI":"com.apple.ttsbundle.Zuzana-compact","lang":"cs-CZ"},{"name":"Sara","voiceURI":"com.apple.ttsbundle.Sara-compact","lang":"da-DK"},{"name":"Anna","voiceURI":"com.apple.ttsbundle.Anna-compact","lang":"de-DE"},{"name":"Helena","voiceURI":"com.apple.ttsbundle.siri_female_de-DE_compact","lang":"de-DE"},{"name":"Martin","voiceURI":"com.apple.ttsbundle.siri_male_de-DE_compact","lang":"de-DE"},{"name":"Nikos (Enhanced)","voiceURI":"com.apple.ttsbundle.Nikos-premium","lang":"el-GR"},{"name":"Melina","voiceURI":"com.apple.ttsbundle.Melina-compact","lang":"el-GR"},{"name":"Nikos","voiceURI":"com.apple.ttsbundle.Nikos-compact","lang":"el-GR"},{"name":"Catherine","voiceURI":"com.apple.ttsbundle.siri_female_en-AU_compact","lang":"en-AU"},{"name":"Gordon","voiceURI":"com.apple.ttsbundle.siri_male_en-AU_compact","lang":"en-AU"},{"name":"Karen","voiceURI":"com.apple.ttsbundle.Karen-compact","lang":"en-AU"},{"name":"Daniel (Enhanced)","voiceURI":"com.apple.ttsbundle.Daniel-premium","lang":"en-GB"},{"name":"Arthur","voiceURI":"com.apple.ttsbundle.siri_male_en-GB_compact","lang":"en-GB"},{"name":"Daniel","voiceURI":"com.apple.ttsbundle.Daniel-compact","lang":"en-GB"},{"name":"Martha","voiceURI":"com.apple.ttsbundle.siri_female_en-GB_compact","lang":"en-GB"},{"name":"Moira","voiceURI":"com.apple.ttsbundle.Moira-compact","lang":"en-IE"},{"name":"Nicky (Enhanced)","voiceURI":"com.apple.ttsbundle.siri_female_en-US_premium","lang":"en-US"},{"name":"Samantha (Enhanced)","voiceURI":"com.apple.ttsbundle.Samantha-premium","lang":"en-US"},{"name":"Aaron","voiceURI":"com.apple.ttsbundle.siri_male_en-US_compact","lang":"en-US"},{"name":"Fred","voiceURI":"com.apple.speech.synthesis.voice.Fred","lang":"en-US"},{"name":"Nicky","voiceURI":"com.apple.ttsbundle.siri_female_en-US_compact","lang":"en-US"},{"name":"Samantha","voiceURI":"com.apple.ttsbundle.Samantha-compact","lang":"en-US"},{"name":"Tessa","voiceURI":"com.apple.ttsbundle.Tessa-compact","lang":"en-ZA"},{"name":"Monica","voiceURI":"com.apple.ttsbundle.Monica-compact","lang":"es-ES"},{"name":"Paulina","voiceURI":"com.apple.ttsbundle.Paulina-compact","lang":"es-MX"},{"name":"Satu","voiceURI":"com.apple.ttsbundle.Satu-compact","lang":"fi-FI"},{"name":"Amelie","voiceURI":"com.apple.ttsbundle.Amelie-compact","lang":"fr-CA"},{"name":"Daniel","voiceURI":"com.apple.ttsbundle.siri_male_fr-FR_compact","lang":"fr-FR"},{"name":"Marie","voiceURI":"com.apple.ttsbundle.siri_female_fr-FR_compact","lang":"fr-FR"},{"name":"Thomas","voiceURI":"com.apple.ttsbundle.Thomas-compact","lang":"fr-FR"},{"name":"Carmit","voiceURI":"com.apple.ttsbundle.Carmit-compact","lang":"he-IL"},{"name":"Lekha","voiceURI":"com.apple.ttsbundle.Lekha-compact","lang":"hi-IN"},{"name":"Mariska","voiceURI":"com.apple.ttsbundle.Mariska-compact","lang":"hu-HU"},{"name":"Damayanti","voiceURI":"com.apple.ttsbundle.Damayanti-compact","lang":"id-ID"},{"name":"Alice","voiceURI":"com.apple.ttsbundle.Alice-compact","lang":"it-IT"},{"name":"Hattori","voiceURI":"com.apple.ttsbundle.siri_male_ja-JP_compact","lang":"ja-JP"},{"name":"Kyoko","voiceURI":"com.apple.ttsbundle.Kyoko-compact","lang":"ja-JP"},{"name":"O-ren","voiceURI":"com.apple.ttsbundle.siri_female_ja-JP_compact","lang":"ja-JP"},{"name":"Yuna","voiceURI":"com.apple.ttsbundle.Yuna-compact","lang":"ko-KR"},{"name":"Ellen","voiceURI":"com.apple.ttsbundle.Ellen-compact","lang":"nl-BE"},{"name":"Xander","voiceURI":"com.apple.ttsbundle.Xander-compact","lang":"nl-NL"},{"name":"Nora","voiceURI":"com.apple.ttsbundle.Nora-compact","lang":"no-NO"},{"name":"Zosia","voiceURI":"com.apple.ttsbundle.Zosia-compact","lang":"pl-PL"},{"name":"Luciana","voiceURI":"com.apple.ttsbundle.Luciana-compact","lang":"pt-BR"},{"name":"Joana","voiceURI":"com.apple.ttsbundle.Joana-compact","lang":"pt-PT"},{"name":"Ioana","voiceURI":"com.apple.ttsbundle.Ioana-compact","lang":"ro-RO"},{"name":"Milena","voiceURI":"com.apple.ttsbundle.Milena-compact","lang":"ru-RU"},{"name":"Laura","voiceURI":"com.apple.ttsbundle.Laura-compact","lang":"sk-SK"},{"name":"Alva","voiceURI":"com.apple.ttsbundle.Alva-compact","lang":"sv-SE"},{"name":"Kanya","voiceURI":"com.apple.ttsbundle.Kanya-compact","lang":"th-TH"},{"name":"Yelda","voiceURI":"com.apple.ttsbundle.Yelda-compact","lang":"tr-TR"},{"name":"Li-mu","voiceURI":"com.apple.ttsbundle.siri_male_zh-CN_compact","lang":"zh-CN"},{"name":"Ting-Ting","voiceURI":"com.apple.ttsbundle.Ting-Ting-compact","lang":"zh-CN"},{"name":"Yu-shu","voiceURI":"com.apple.ttsbundle.siri_female_zh-CN_compact","lang":"zh-CN"},{"name":"Sin-Ji","voiceURI":"com.apple.ttsbundle.Sin-Ji-compact","lang":"zh-HK"},{"name":"Mei-Jia","voiceURI":"com.apple.ttsbundle.Mei-Jia-compact","lang":"zh-TW"}];
        self.cache_ios11_voices = [{"name":"Maged","voiceURI":"com.apple.ttsbundle.Maged-compact","lang":"ar-SA"},{"name":"Zuzana","voiceURI":"com.apple.ttsbundle.Zuzana-compact","lang":"cs-CZ"},{"name":"Sara","voiceURI":"com.apple.ttsbundle.Sara-compact","lang":"da-DK"},{"name":"Anna","voiceURI":"com.apple.ttsbundle.Anna-compact","lang":"de-DE"},{"name":"Helena","voiceURI":"com.apple.ttsbundle.siri_female_de-DE_compact","lang":"de-DE"},{"name":"Martin","voiceURI":"com.apple.ttsbundle.siri_male_de-DE_compact","lang":"de-DE"},{"name":"Melina","voiceURI":"com.apple.ttsbundle.Melina-compact","lang":"el-GR"},{"name":"Catherine","voiceURI":"com.apple.ttsbundle.siri_female_en-AU_compact","lang":"en-AU"},{"name":"Gordon","voiceURI":"com.apple.ttsbundle.siri_male_en-AU_compact","lang":"en-AU"},{"name":"Karen","voiceURI":"com.apple.ttsbundle.Karen-compact","lang":"en-AU"},{"name":"Arthur","voiceURI":"com.apple.ttsbundle.siri_male_en-GB_compact","lang":"en-GB"},{"name":"Daniel","voiceURI":"com.apple.ttsbundle.Daniel-compact","lang":"en-GB"},{"name":"Martha","voiceURI":"com.apple.ttsbundle.siri_female_en-GB_compact","lang":"en-GB"},{"name":"Moira","voiceURI":"com.apple.ttsbundle.Moira-compact","lang":"en-IE"},{"name":"Aaron","voiceURI":"com.apple.ttsbundle.siri_male_en-US_compact","lang":"en-US"},{"name":"Fred","voiceURI":"com.apple.speech.synthesis.voice.Fred","lang":"en-US"},{"name":"Nicky","voiceURI":"com.apple.ttsbundle.siri_female_en-US_compact","lang":"en-US"},{"name":"Samantha","voiceURI":"com.apple.ttsbundle.Samantha-compact","lang":"en-US"},{"name":"Tessa","voiceURI":"com.apple.ttsbundle.Tessa-compact","lang":"en-ZA"},{"name":"Monica","voiceURI":"com.apple.ttsbundle.Monica-compact","lang":"es-ES"},{"name":"Paulina","voiceURI":"com.apple.ttsbundle.Paulina-compact","lang":"es-MX"},{"name":"Satu","voiceURI":"com.apple.ttsbundle.Satu-compact","lang":"fi-FI"},{"name":"Amelie","voiceURI":"com.apple.ttsbundle.Amelie-compact","lang":"fr-CA"},{"name":"Daniel","voiceURI":"com.apple.ttsbundle.siri_male_fr-FR_compact","lang":"fr-FR"},{"name":"Marie","voiceURI":"com.apple.ttsbundle.siri_female_fr-FR_compact","lang":"fr-FR"},{"name":"Thomas","voiceURI":"com.apple.ttsbundle.Thomas-compact","lang":"fr-FR"},{"name":"Carmit","voiceURI":"com.apple.ttsbundle.Carmit-compact","lang":"he-IL"},{"name":"Lekha","voiceURI":"com.apple.ttsbundle.Lekha-compact","lang":"hi-IN"},{"name":"Mariska","voiceURI":"com.apple.ttsbundle.Mariska-compact","lang":"hu-HU"},{"name":"Damayanti","voiceURI":"com.apple.ttsbundle.Damayanti-compact","lang":"id-ID"},{"name":"Alice","voiceURI":"com.apple.ttsbundle.Alice-compact","lang":"it-IT"},{"name":"Hattori","voiceURI":"com.apple.ttsbundle.siri_male_ja-JP_compact","lang":"ja-JP"},{"name":"Kyoko","voiceURI":"com.apple.ttsbundle.Kyoko-compact","lang":"ja-JP"},{"name":"O-ren","voiceURI":"com.apple.ttsbundle.siri_female_ja-JP_compact","lang":"ja-JP"},{"name":"Yuna","voiceURI":"com.apple.ttsbundle.Yuna-compact","lang":"ko-KR"},{"name":"Ellen","voiceURI":"com.apple.ttsbundle.Ellen-compact","lang":"nl-BE"},{"name":"Xander","voiceURI":"com.apple.ttsbundle.Xander-compact","lang":"nl-NL"},{"name":"Nora","voiceURI":"com.apple.ttsbundle.Nora-compact","lang":"no-NO"},{"name":"Zosia","voiceURI":"com.apple.ttsbundle.Zosia-compact","lang":"pl-PL"},{"name":"Luciana","voiceURI":"com.apple.ttsbundle.Luciana-compact","lang":"pt-BR"},{"name":"Joana","voiceURI":"com.apple.ttsbundle.Joana-compact","lang":"pt-PT"},{"name":"Ioana","voiceURI":"com.apple.ttsbundle.Ioana-compact","lang":"ro-RO"},{"name":"Milena","voiceURI":"com.apple.ttsbundle.Milena-compact","lang":"ru-RU"},{"name":"Laura","voiceURI":"com.apple.ttsbundle.Laura-compact","lang":"sk-SK"},{"name":"Alva","voiceURI":"com.apple.ttsbundle.Alva-compact","lang":"sv-SE"},{"name":"Kanya","voiceURI":"com.apple.ttsbundle.Kanya-compact","lang":"th-TH"},{"name":"Yelda","voiceURI":"com.apple.ttsbundle.Yelda-compact","lang":"tr-TR"},{"name":"Li-mu","voiceURI":"com.apple.ttsbundle.siri_male_zh-CN_compact","lang":"zh-CN"},{"name":"Ting-Ting","voiceURI":"com.apple.ttsbundle.Ting-Ting-compact","lang":"zh-CN"},{"name":"Yu-shu","voiceURI":"com.apple.ttsbundle.siri_female_zh-CN_compact","lang":"zh-CN"},{"name":"Sin-Ji","voiceURI":"com.apple.ttsbundle.Sin-Ji-compact","lang":"zh-HK"},{"name":"Mei-Jia","voiceURI":"com.apple.ttsbundle.Mei-Jia-compact","lang":"zh-TW"}];

        self.systemvoices = null;

        self.CHARACTER_LIMIT = 100;
        self.VOICESUPPORT_ATTEMPTLIMIT = 5;
        self.voicesupport_attempts = 0;
        self.fallbackMode = false;
        self.WORDS_PER_MINUTE = 130;

        self.fallback_audio = null;
        self.fallback_playbackrate = 1;
        self.def_fallback_playbackrate = self.fallback_playbackrate;
        self.fallback_audiopool = [];
        self.msgparameters = null;
        self.timeoutId = null;
        self.OnLoad_callbacks = [];
        self.useTimer = false;
        self.utterances = [];
        self.userInteractionEvents = ["mousedown", "mouseup", "mousewheel", "keydown"];
        self.fallbackBufferLength = 5;
        if (self.iOS) {
            //RES-290 On iOS we can't preload as many chunks in advance becuse they will fail to play after some time.
            self.fallbackBufferLength = 2;
        }
        var silentAudioSrc = "data:audio/mpeg;base64,/+NIxAAAAAAAAAAAAFhpbmcAAAAPAAAAEwAACZAAIiIiIiIqKioqKjMzMzMzRERERERETExMTExdXV1dXWZmZmZmd3d3d3d3gICAgICRkZGRkZmZmZmZqqqqqqqqs7Ozs7PExMTExMzMzMzM3d3d3d3d5ubm5ub39/f39///////AAAAUExBTUUzLjEwMAQoAAAAAAAAAAAVCCQCQCEAAeAAAAmQ/qJL7wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/+NIxAAGkAJAGAAAAABn///////////////6w//L/IeGCGc//+U61QAP/4LmWycNjPzmXtEL0VxbXSoQaadV7pSNs2X6hJ3Ok1a9yNRtf7ddPJrLR2nyP/p/30b0OdF6Su29GKp9Ls6LORkWRJ1sOsGr4mUADf9n/P+9v/FR5t08rK1UubPiChtJS2Yoop4MH48ec+PjR01tJJOmX8O3Mvmf//nf6s7pnCzO5wl8y7aVyzX5lLGdCKJYgd6S33q26FtBZVczczydHIbM6oMQuaUADf9n/9v//js/ijDGj7uNKCaLVPLY2TzXwmkzHCZrHdGypjNcBdIf+cssK+/f4397ez1JaRw1aI3FlV5ubTY1LQIWVb2m7K89qpjxLf5g/+MYxPgS5FZAeADFKNGO6mh1fMqEEQGWqWYmg3FqAA2vQlp77/uffWS702wqfv8vFD5PuNitqPG8p77pLmWf/+/HA5ryUlu7/+MYxOcXRFo8eAGHKS//vwnLX//6HPNCIzXla56JRuFPNdKV2pety8ID4VN+uRuoU+VV8zTMMfXYUQ4eh9ZoGKKlPHBCqgAN/+MoxMUX3CY8eAGHKbdmn+OeVJTGIlzpdOsUYwaXtdxnHOiuHjAFIU+ZnMzIo2eVWlxPy//y8rD9GK8OTKZXL6Wply47bXzyeYUcuXSE5qSwGGPcoJv2DchBu8Jw8gGwmW09AA23RXO3nb6WmOopONBSqNIeqnXWiAz7K4XEHwmcIdATmzwV0jJ9s4V/k////+MYxOgYlGo4eAGHLO/5f9nlL8kDpHZv+mbMu4mH7HHuyyqHq6TeK5/8aMjm1eRixEgQJqGo+0p5lQAN/0f477nlU9IqLh3g/+MoxMAV6+48eABHIXO7Otw9wgTCohOLjxNDi9CJZRx1mRayrbDuUE9K1/pzV12nzc/+fe9/4ZerXKtVHrfdcl3Snkp5pGPb7DmYQNJNSh9zwUw9UvZi6fQYM8eKDZqHEZhiAA3/Y/3//e/ncbwBH455AViDJuJXNlQhwMiabt6ZEy6bRZ0EyOvDkSz2KvaZ/+MYxOsWVDY8eAFHJX7d09JbPf7UcpGYFU4MK/TuiMtVI3U+7sa9XVlqveysYtTVmOxmQruJCGeRFdkDcQANv0P3v3+7/3v8/+MoxMwY7F48eAIHLXy7nE/l1671KjRcnSXttqsdJjz2h+kezUHiUdTRuwjpGa8vMy/+f55c7D+2xUlyOfmTv66UvLp0GeRl5WIljlTvLXeKT5Jwvad3F1mByDEbg4DVAA33Y/siOm/FK0CDQEmy6l1gwcQJgyQLX8QIFrg8G8A8hcy4q8OF+ZHkb0p5fP/K/+MYxOsXRCo8eAGFKUPMFnky0+ddOU/S++kPVj1z5qq55m56zXyFmmU0V3mwIsuiUKchEUZjC1y1AA33Y+///fv+5GmZj12N/+MoxMkXhGI8eAGHKcORvd5V0ztA0tUM1d+s21a+e6KTMnBOORPRyKWf/+1Of+f5OxsW9IyZ2uy3M/mef1/vzuZZ1+5S4ttla/eWHjROLbPed0N/NGppAxUqAA33YL08vVo7VkuqIZR2GbZVHBO0MUUIGSGq5ID2e8wpwECpKV8878nSmv//S/Ms5dUdI5Hm/+MYxO4W3F48eABHIQiMTfh86Vs7nfvC9Uz8pZcymIeTPMKyUIcIsjkcyeKlrzc2k0CVAA3/Y+Pr/fn//7zv3OWUiaOhGM2//+MoxM0Wy+48eAGHKRjF4VTgSyzCCRr9P73Jc005wH9MiLp5G/2/Kn+yf/86jUqeNwFTqP5fqU4xMbl/8SdmZ/NtnZjdrWFF6UKjAWGFTDC2EeELBAvBAA2vI/f7nm2z7j8yZbGhowotlks7nfrmUdf4x2L/eGdHO1CiZMbZmtjJ08Rr/e+YzL1v///y7/3O/+MYxPQW3G48eAAGPNpFgkl87qjOVlLOrn9vCSGL5fOHCRe/Unm5gbFu+VQFRSCPW4kxnBUHAA2/R//35++f7/8f5UFOi5dp/+MoxNMXs/48eAGHKeb7ShEhrRrJ7ox2Dwom6lJchCIyAxmlmRblJ8/+J///5/9kbi6dYzc7Dzh3ZeZJOeKImygKWGTGRWucLNkQ180DEbzPRTV2MRjGM6SOHQoADfdn/vX13Zq7bvdmzAaHWaYxtxRuGeiA/JGqh7PMwvZd9KC2NEoEYzKdkrrd/Z21t1u7/+MYxPcYhGY4eAGHLTf0v8++Rq1UzJCdC1k5f3yfRSooW/dmui4H0GqxkF8S+GJJmuU6GQOYJDfCiLo9zim9ElBNAA+/gj5S/+MoxNAYHGY8eAGHKKw6Zmxn++StD2qiVTXJhRFSftxQ4s7mwjZjKC1IcjKvv8xXov/77EeQqjPV3az/vqlNe6XVJFSs7UVlR7oxnY/eeRFcis7KrkJGMgtyc+lMAFWYnvEQQh4ViYhGFC/59/vG+MdJtVsaBhUV3+FHcKDf/EVLf/6KCeBWWK2STEFNRTMu/+MYxPIaLG44eAGHLDEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq/+MoxMQVRE48eADFKaqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq/+MYxPELK54oGABHoaqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq";

        var textReplacements = null;

        var defaultRate = 1;

        self.tstCompiled = function() {return !(/param/.test(function(param) {}));};

        self.fallbackServicePath = typeof rvApiEndpoint != 'undefined' && rvApiEndpoint ? rvApiEndpoint : 'https://code.responsivevoice.org/' + (self.tstCompiled()?'':'develop/') + 'getvoice.php';


        //onvoiceschanged Deprecated: Only works on chrome and introduces glitches.
        /*
        //Wait until system voices are ready and trigger the event OnVoiceReady
        if (typeof speechSynthesis != 'undefined') {
            speechSynthesis.onvoiceschanged = function () {

                self.systemvoices = window.speechSynthesis.getVoices();
                console.log("OnVoiceReady - from onvoiceschanged");
               // console.log(self.OnVoiceReady);
                if (self.OnVoiceReady != null) {
                    self.OnVoiceReady.call();
                }


            };
        }*/

        self.default_rv = self.responsivevoices[0];

        self.debug = false;

        self.rvsMapped = false;

        self.forcedFallbackMode = false;
        self.speechAllowedByUser = true;
        self.enableEstimationTimeout = true;
        self.analytics = { characterCount: 0 };
        //self.OnVoiceReady = null; // OnVoiceReady is meant to be defined externally

        self.log = function (log) {
            if (self.debug) {
                console.log(log);
            }
        };

        self.init = function() {

            // Detect types of RV deployment
            self.is_wordpress = wpDetect();
            self.is_bundle    = bundleDetect();

            if( typeof rvApiKey == 'undefined' ) {
                console.error('ResponsiveVoice missing API key. See https://responsivevoice.org/register?devtools=' + encodeURIComponent(window.location.href) );
            }

            //Disable RV on IOS temporally
            /*if (self.iOS) {
                self.enableFallbackMode();
                return;
            }*/

            //Force using timers on Android, iOS and Safari
            if (self.is_android || self.iOS || self.is_safari)
                self.useTimer = true;

            //Force Opera to fallback mode
            if (self.is_opera || typeof speechSynthesis === 'undefined') {
                //Needs to be output
                console.log('RV: Voice synthesis not supported');
                self.enableFallbackMode();



            } else {


                //Waiting a few ms before calling getVoices() fixes some issues with safari on IOS as well as Chrome
                setTimeout(function () {
                    var gsvinterval = setInterval(function () {

                        var v = window.speechSynthesis.getVoices();

                        if (v.length == 0 && (self.systemvoices == null || self.systemvoices.length == 0)) {
                            //Needs to be output
                            console.log('Voice support NOT ready');

                            self.voicesupport_attempts++;
                            if (self.voicesupport_attempts > self.VOICESUPPORT_ATTEMPTLIMIT) {

                                clearInterval(gsvinterval);

                                //On IOS, sometimes getVoices is just empty, but speech works. So we use a cached voice collection.
                                if (window.speechSynthesis != null) {

                                    if (self.iOS) {

                                        //Determine iOS version:
                                        if (self.iOS11plus) {
                                            //iOS 11
                                            self.systemVoicesReady(self.cache_ios11_voices);

                                        } else if (self.iOS10) {
                                            //iOS 10
                                            self.systemVoicesReady(self.cache_ios10_voices);

                                        } else if (self.iOS9) {
                                            //iOS 9
                                            self.systemVoicesReady(self.cache_ios9_voices);

                                        }else{
                                            //iOS <9
                                            self.systemVoicesReady(self.cache_ios_voices);

                                        }
                                        //Needs to be output
                                        console.log('RV: Voice support ready (cached)');


                                    }else{
                                        //Needs to be output
                                        console.log("RV: speechSynthesis present but no system voices found");
                                        self.enableFallbackMode();
                                    }

                                } else {

                                    //We don't support voices. Using fallback
                                    self.enableFallbackMode();
                                }
                            }

                        } else {
                            //Needs to be output
                            console.log('RV: Voice support ready');
                            self.systemVoicesReady(v);

                            clearInterval(gsvinterval);

                        }

                    }, 100);
                }, 100);
            }

            //Enable user interaction hooks by default on mobile and safari
            if (self.iOS || self.is_android || self.is_safari) {
                self.enableWindowClickHook();
            }

            self.Dispatch("OnLoad");
        };

        self.systemVoicesReady = function(v) {
            self.systemvoices = v;

            self.mapRVs();

            if (self.OnVoiceReady != null)
                self.OnVoiceReady.call();           // TO BE DEPRECATED

            self.Dispatch("OnReady");
            if (window.hasOwnProperty('dispatchEvent'))
                window.dispatchEvent(new Event("ResponsiveVoice_OnReady"));
        };

        self.enableFallbackMode = function() {

            self.fallbackMode = true;
            self.forcedFallbackMode = true;
            //Needs to be output
            console.log('RV: Enabling fallback mode');

            self.mapRVs();

            if (self.OnVoiceReady != null)
                self.OnVoiceReady.call();           // TO BE DEPRECATED

            self.Dispatch("OnReady");
            if (window.hasOwnProperty('dispatchEvent'))
                window.dispatchEvent(new Event("ResponsiveVoice_OnReady"));

            self.Dispatch("OnServiceSwitched");
        };


        /**
         * Get a list of active ResponsiveVoices.
         *
         * @returns {array}
         */
        self.getVoices = function () {
            var v = [];
            for (var i = 0; i < self.responsivevoices.length; i++) {
                var voice = self.responsivevoices[i];
                if (voice.deprecated !== true) {
                    v.push({name: voice.name});
                }
            }
            return v;
        };


        self.speak = function (text, voicename, parameters) {
            if (text==null) {
                self.log("No text provided");
                return;
            }

            if (self.initializePermissionsTimeout) {
                clearTimeout(self.initializePermissionsTimeout); //No need to initialize permissions if the first click on the page triggered speak
            }

            if (self.rvsMapped) {
              var serviceUsed = null;



                //all iOS initialization
               /* if (self.iOS && !self.iOS_initialized) {
                    self.log("Initializing ios10");
                    setTimeout(function(){ self.speak(text,voicename,parameters);},100);
                    self.clickEvent();
                    self.iOS_initialized = true;
                    return;
                }*/

              //Cancel previous speech if it's already playing
              if (self.isPlaying()){
                self.log("Cancelling previous speech");
                self.cancel();
                setTimeout(function() {
                    self.speak(text, voicename, parameters);
                },50);
                return;
              }

                //Find system voice that matches voice name
                var rv;

                if (voicename == null) {
                    rv = self.default_rv;
                    self.setDefaultVoice(rv.name);
                } else {
                    rv = self.getResponsiveVoice(voicename);
                }

                if (!rv) {
                    console.error('Selected voice does not exist: ' + voicename);
                    self.Dispatch('OnMissingVoiceError', {voice: voicename});
                    return;
                }

                //Deprecated announcement
                if (rv.deprecated===true) {
                    console.warn('ResponsiveVoice: Voice "' + rv.name + '" is deprecated; it might not always be the right gender, and could be removed in future releases');
                }


                var profile = {};


                // Map was done so no need to look for the mapped voice
                if (rv.mappedProfile != null) {

                    profile = rv.mappedProfile;

                } else {

                    profile.systemvoice = self.getMatchedVoice(rv);
                    profile.collectionvoice = {};

                    if (profile.systemvoice == null) {
                        //Needs to be output
                        console.log('RV: ERROR: No voice found for: ' + voicename);
                        return;
                    }
                }

              //Apply text replacements
              text = applyTextReplacements(text, profile);

              //Clean text
              // Quotes " and ` -> '
              text = text.replace(/[\"\`]/gm,"'");

              self.msgparameters = parameters ||  {};
              self.msgtext = text;
              self.msgvoicename = voicename;

              self.onstartFired = false;

              //Support for multipart text (there is a limit on characters)
              var multipartText = [];

              function multipartTextPush(string){
                  // RES-301 24-02-2020: catches text not split by the Chinese "period" kanji and splits the text again;
                  // Chinese Female fails without any errors using "Google æ™®é€šè¯ï¼ˆä¸­å›½å¤§é™†ï¼‰" and there are reports that a Thai voice
                  // has the same issue, so this works as a catch-all function for this symbol;
                  if(string.search(/[ã€‚]/gm) != -1){
                      var chineseSplits = string.split(/[ã€‚]/);
                      chineseSplits.filter(function( arrayElement ) {
                          if( arrayElement ){
                              multipartText.push( arrayElement );
                          }
                      });
                  } else {
                      multipartText.push(string);
                  }
              }

              if (text.length > self.CHARACTER_LIMIT) {

                  text = _sanitizeNewlines(text);

                var tmptxt = text;

                while (tmptxt.length > self.CHARACTER_LIMIT) {

                  //Split by common phrase delimiters
                  var p = tmptxt.search(/([ã€‚:!Â¡?Â¿;\(\)\[\]â€”Â«Â»\n]+|\.[^0-9]+)/);
                  var part = '';

                  //Couldn't split by priority characters, try commas
                  if (p == -1 || p >= self.CHARACTER_LIMIT) {
                    p = tmptxt.search(/,[^0-9]+/);
                  }



                  //Couldn't split by normal characters, then we try spaces
                  if ((p == -1 || p >= self.CHARACTER_LIMIT) && tmptxt.search(" ")!=-1) {

                    var words = tmptxt.split(' ');

                    for (var i = 0; i < words.length; i++) {

                        //Can't add more words
                        if (part.length + words[i].length + 1 > self.CHARACTER_LIMIT) {
                            if (words[i].length >= self.CHARACTER_LIMIT) {
                                //The word is too long. We split it and start over
                                part += words[i].substr(0, self.CHARACTER_LIMIT - part.length - 1);
                                break;
                            } else {
                                //We add the words to the chunk and start over
                                break;
                            }
                        }


                      part += (i != 0 ? ' ' : '') + words[i];

                    }

                  } else {

                    //Make sure we have a chunk at least smaller than the character limit
                    if (p == -1 || p >= self.CHARACTER_LIMIT) {
                        p = self.CHARACTER_LIMIT-1;
                    }

                    part = tmptxt.substr(0, p + 1);

                  }

                  tmptxt = tmptxt.substr(part.length, tmptxt.length - part.length);

                  multipartText.push(part);
                  //self.log(part.length + " - " + part);

                }
                //Add the remaining text
                if (tmptxt.length > 0) {
                  multipartTextPush(tmptxt);
                }

              } else {

                //Small text
                multipartTextPush(text);
              }
                console.log(multipartText);

                self.multipartText = multipartText;



              //Check we have permission to play audio (mobile)
              var speechAllowed = self.checkSpeechAllowed();

              if (!speechAllowed) {
                  self.scheduledSpeak = {text: text, voicename:voicename, parameters:parameters};
                  return;
              }


              //Prevent fallbackmode to play more than 1 speech at the same time
              if (self.fallbackMode && self.fallback_audiopool.length>0) {
                  self.clearFallbackPool();
              }

              self.msgprofile = profile;

              self.log('Voice picked: ' + self.msgprofile.systemvoice.name);
              //self.log("Start multipart play");

              self.utterances=[];
              self.fallbackChunks=[];

              //Play multipart text
              for (var i = 0; i < multipartText.length; i++) {

                if (!self.fallbackMode && self.getServiceEnabled(self.services.NATIVE_TTS)) {
                  //Use SpeechSynthesis
                  self.log('Using SpeechSynthesis');
                  serviceUsed = self.services.NATIVE_TTS;

                  //Create msg object
                  var msg = new SpeechSynthesisUtterance();
                  msg.voiceURI = profile.systemvoice.voiceURI;
                  msg.volume = self.selectBest([profile.collectionvoice.volume, profile.systemvoice.volume, 1]); // 0 to 1
                  msg.rate = self.selectBest([(self.iOS9plus ? 1 : null), profile.collectionvoice.rate, profile.systemvoice.rate, defaultRate]); // 0.1 to 10 ** override iOS 0.25 rate
                  msg.pitch = self.selectBest([profile.collectionvoice.pitch, profile.systemvoice.pitch, 1]); //0 to 2*/
                  msg.text = multipartText[i];
                  msg.lang = self.selectBest([profile.collectionvoice.lang, profile.systemvoice.lang]);
                  msg.rvIndex = i;
                  msg.rvTotal = multipartText.length;

                  if (i == 0) {
                    msg.onstart = self.speech_onstart;
                  }
                  self.msgparameters.onendcalled = false;

                  if (parameters != null) {
                    msg.voice = typeof parameters.voice !== 'undefined' ? parameters.voice : profile.systemvoice;;

                    if (i < multipartText.length - 1 && multipartText.length > 1) {
                      msg.onend = self.onPartEnd;
                      if (msg.hasOwnProperty("addEventListener"))
                        msg.addEventListener('end',self.onPartEnd);

                    } else {
                      msg.onend = self.speech_onend;
                      if (msg.hasOwnProperty("addEventListener"))
                        msg.addEventListener('end',self.speech_onend);
                    }

                      msg.onerror = parameters.onerror || function (e) {
                          self.log('RV: Unknown Error');
                          self.log(e);

                          if (e.error === 'not-allowed') {
                              self.speechSynthesisNotAllowedError = true;
                              self.speak(text, voicename, parameters);
                              return;
                          }
                      };

                    // Validate int/float parameters and return defaults
                    parameters.rate   = self.validateParameters(parameters, 'rate');
                    parameters.pitch  = self.validateParameters(parameters, 'pitch');
                    parameters.volume = self.validateParameters(parameters, 'volume');

                    msg.onpause = parameters.onpause;
                    msg.onresume = parameters.onresume;
                    msg.onmark = parameters.onmark;
                    msg.onboundary = parameters.onboundary || self.onboundary;
                    msg.pitch = parameters.pitch != null ? parameters.pitch : msg.pitch;
                    if (self.iOS) {
                      msg.rate = (parameters.rate != null ? (parameters.rate * parameters.rate) : 1) * msg.rate;
                    } else {
                      msg.rate = (parameters.rate != null ? parameters.rate : defaultRate) * msg.rate;
                    }

                    msg.volume = parameters.volume != null ? parameters.volume : msg.volume;
                  } else {
                    self.log('No Params received for current Utterance');

                    msg.voice = profile.systemvoice;
                    parameters = parameters || {};

                    msg.onend = self.speech_onend;
                    msg.onboundary = self.onboundary;

                      msg.onerror = function (e) {
                          self.log('RV: Unknown Error');
                          self.log(e);

                          if (e.error === 'not-allowed') {
                              self.speechSynthesisNotAllowedError = true;
                              self.speak(text, voicename, parameters);
                              return;
                          }
                      };
                  }

                  self.utterances.push(msg);

                  if (i==0)
                    self.currentMsg = msg;

                  //This needs to be output for stability
                  console.log(msg);

                  //setTimeout(function(){
                  //speechSynthesis.speak(msg);
                  //},0);
                  self.tts_speak(msg);
                } else if (self.fallbackMode && self.getServiceEnabled(self.services.FALLBACK_AUDIO)) {

                  serviceUsed = self.services.FALLBACK_AUDIO;

                  self.fallback_playbackrate = self.def_fallback_playbackrate;

                  var pitch = self.selectBest([profile.collectionvoice.pitch, profile.systemvoice.pitch, 1]); //0 to 2*/
                  var rate = self.selectBest([ (self.iOS9plus?1:null), profile.collectionvoice.rate, profile.systemvoice.rate, 1]) ; // 0.1 to 10 ** override iOS 0.25 rate
                  var volume = self.selectBest([profile.collectionvoice.volume, profile.systemvoice.volume, 1]); // 0 to 1
                  var extraParams;

                  if (parameters != null) {
                    pitch = (parameters.pitch!=null?parameters.pitch:1) * pitch;
                    rate = (parameters.rate!=null?parameters.rate:1) * rate;
                    volume = (parameters.volume!=null?parameters.volume:1) * volume;
                    extraParams = parameters.extraParams || null;
                  }
                  pitch /= 2;
                  rate /=2;
                  volume *=2;
                  pitch = Math.min(Math.max(pitch, 0), 1);
                  rate = Math.min(Math.max(rate, 0), 1);
                  volume = Math.min(Math.max(volume, 0), 1);
                  //self.log(volume);
                  //self.fallback_playbackrate = pitch;

                  var urlParams = '?t='     + encodeURIComponent(multipartText[i])
                                + '&tl='    + (profile.collectionvoice.lang || profile.systemvoice.lang || 'en-US')
                                + '&sv='    + (profile.collectionvoice.service || profile.systemvoice.service || '')
                                + '&vn='    + (profile.collectionvoice.voicename || profile.systemvoice.voicename || '')
                                + '&pitch=' + pitch.toString()
                                + '&rate='  + rate.toString()
                                + '&vol='   + volume.toString();

                  // Parameters for new RV fallback API
                  if( typeof rvApiEndpoint != 'undefined' && rvApiEndpoint) {
                      urlParams = '?text='   + encodeURIComponent(multipartText[i])
                                + '&lang='   + (profile.collectionvoice.lang || profile.systemvoice.lang || 'en-US')
                                + '&engine=' + (profile.collectionvoice.service || profile.systemvoice.service || '')
                                + '&name='   + (profile.collectionvoice.voicename || profile.systemvoice.voicename || '')
                                + '&pitch='  + pitch.toString()
                                + '&rate='   + rate.toString()
                                + '&volume=' + volume.toString();
                  }

                  var url = self.fallbackServicePath + urlParams;

                  if( typeof rvApiKey != 'undefined' ) {
                      url += '&key=' + rvApiKey;
                  }

                  // Add generic RV Wordpress plugin API Key
                  if( typeof rvApiKey == 'undefined' && self.is_bundle ){
                      url += '&key=FQ9r4hgY';
                  }

                  // Add generic Bundler users API Key
                  if( typeof rvApiKey == 'undefined' && self.is_wordpress ){
                      url += '&key=HY7lTyiS';
                  }

                  if (profile.collectionvoice.gender !== undefined) url += '&gender='+profile.collectionvoice.gender;

                  if (extraParams) {
                    url += "&extraParams=" + JSON.stringify(extraParams);
                  }



                  self.fallbackChunks.push ({
                      text: multipartText[i],
                      url: url,
                      audio: null //not assigned yet
                  });


                  //self.log(audio);


                }


              }

              if (self.fallbackMode && self.getServiceEnabled(self.services.FALLBACK_AUDIO)) {


                self.fallbackChunkIndex = 0;
                self.fallback_startPart();

              }

              //Log service used
              self.log("Service used: " + serviceUsed);
            } else {
                var rvCheck = setTimeout(function() {
                    self.speak(text, voicename, parameters);
                }, 15);
            }
        };

        function _sanitizeNewlines(input) {
            // CF 14-Mar-19: First we remove all multiple CR/LF.
            var text = input.replace(/([\n\r])+/gm, "\n");

            // CF 14-Mar-19: Then we look for delimiter + CR/LF, which breaks fallback.
            var re = /([,.:!Â¡?Â¿;()\[\]â€”Â«Â»])+[\n\r]/gm;
            var hasMatch = true;

            while(hasMatch) {
                var capture = text.match(re);
                if(capture === null) {
                    hasMatch = false;
                } else {
                    // CF 14-Mar-19: Instead of delimiter+CR/LF, we have delimiter+space.
                    text = text.replace(re, "$1 ");
                }
            }
            return text;
        }

        self.startTimeout = function (text, callback) {
            //if (self.iOS) {
            //   multiplier = 0.5;
            //}

            var multiplier = self.msgprofile.collectionvoice.timerSpeed;
            if (self.msgprofile.collectionvoice.timerSpeed==null)
                multiplier = 1;

            //self.log(self.msgprofile.collectionvoice.name);
            if (multiplier <=0)
                return;

            self.timeoutId = setTimeout(callback, self.getEstimatedTimeLength(text, multiplier));
            self.log("Timeout ID: " + self.timeoutId);
        };

        self.checkAndCancelTimeout = function () {
            if (self.timeoutId != null) {
                //self.log("Timeout " + self.timeoutId + " cancelled");
                clearTimeout(self.timeoutId);
                self.timeoutId = null;
            }
        };

        self.speech_timedout = function() {
            //self.log("Speech cancelled: Timeout " + self.timeoutId + " ended");
            self.cancel();
            self.cancelled = false;
            //if (!self.iOS) //On iOS, cancel calls msg.onend
                self.speech_onend();

        };

        self.speech_onend = function () {
            self.checkAndCancelTimeout();

            //Avoid this being automatically called just after calling speechSynthesis.cancel
            if (self.cancelled === true) {
                self.cancelled = false;
                return;
            }

            self.log("on end fired");

            if (self.msgparameters != null && self.msgparameters.onend != null && self.msgparameters.onendcalled!=true) {
                self.log("Speech on end called  -" + self.msgtext);
                self.msgparameters.onendcalled=true;
                self.msgparameters.onend();

            }

        };

        self.speech_onstart = function () {
            //Start can be triggered after onboundary!
            if (self.onstartFired) return;

            self.onstartFired = true;
            //if (!self.iOS)
            self.log("Speech start");
            if (self.enableEstimationTimeout && self.useTimer) {
                if (!self.fallbackMode)
                    self.startTimeout(self.msgtext,self.speech_timedout);

            }


            self.msgparameters.onendcalled=false;
            if (self.msgparameters != null && self.msgparameters.onstart != null) {
                self.msgparameters.onstart();
            }

        };



        self.fallback_startPart = function () {

            if (self.fallbackChunkIndex == 0) {
                self.speech_onstart();
            }

            self.fallback_updateChunksBuffer();

            self.fallback_audio = self.fallbackChunks[self.fallbackChunkIndex].audio;

            if (self.fallback_audio == null) {

                //Fallback audio is not working. Just wait for the timeout event
                self.log("RV: Fallback Audio is not available");

            } else {

                (function() {
                    var audio = self.fallback_audio;

                    //Add to pool to prevent multiple streams to be played at the same time
                    //self.fallback_audiopool.push(audio);

                    setTimeout(function () {
                        audio.playbackRate = self.fallback_playbackrate;
                    }, 50);
                    audio.onloadedmetadata = function () {
                        //audio.play();
                        audio.playbackRate = self.fallback_playbackrate;
                    };

                    var setAudioPlayingCheck = function(audio) {
                        setTimeout(function() {
                            if (audio.currentTime==0) {
                                self.log("Audio chunk not playing. Trying to recover. Disabling time estimation");
                                self.enableEstimationTimeout = false;
                                self.checkAndCancelTimeout();
                                audio.load();
                                var canPlay = function () {
                                    audio.play();
                                    audio.removeEventListener('canplaythrough', canPlay);
                                };
                                audio.addEventListener('canplaythrough', canPlay, false);
                            }
                        },700);
                    };
                    if (audio.readyState>=2) {
                        audio.play();
                        setAudioPlayingCheck(audio);

                    }else {
                        var canPlay = function () {
                            audio.play();
                            audio.removeEventListener('canplaythrough', canPlay);
                        };
                        audio.addEventListener('canplaythrough', canPlay, false);
                    }
                })();

                self.fallback_audio.onerror = function(e) {

                    function parseResponses(){
                        if (this.readyState == this.DONE && this.status !== 200) {
                            switch (this.status) {
                                case 400:
                                    console.error('ResponsiveVoice audio could not be loaded. Invalid parameters.');
                                    break;
                                case 403:
                                    console.error('ResponsiveVoice invalid API key. See https://responsivevoice.org/register?devtools=' + encodeURIComponent(window.location.href) );
                                    break;
                                default:
                                    console.error('ResponsiveVoice audio could not be loaded. There is an issue connecting your browser to the API endpoint.');
                                    break;
                            }
                        }
                    }

                    switch (e.target.error.code) {
                        case e.target.error.MEDIA_ERR_SRC_NOT_SUPPORTED:
                            var xhttp = new XMLHttpRequest();
                            xhttp.open("GET", e.target.src, true);
                            xhttp.send();
                            xhttp.onreadystatechange = parseResponses;
                            break;
                        default:
                            console.error('ResponsiveVoice: an unknown error occurred.');
                            break;
                    }
                };

                self.fallback_audio.addEventListener('ended', self.fallback_finishPart);

                if (self.enableEstimationTimeout && self.useTimer)
                    self.startTimeout(self.multipartText[self.fallbackChunkIndex], self.fallback_finishPart);

            }
        };

        /**
         * returns true if any of the fallback audio parts is currently playing
         */
        self.isFallbackAudioPlaying = function () {
            var c;

            for (c = 0; c < self.fallback_audiopool.length; c++) {
                var audio = self.fallback_audiopool[c];

                if (audio.paused || audio.ended || (audio.currentTime==audio.duration)) {
                    //Any of those means audio is not playing
                }else{
                    return true;
                }
            }

            return false;
        };

        self.fallback_finishPart = function (e) {
            /**
             * don't overlap audios
             */
            if (self.isFallbackAudioPlaying()) {
                self.checkAndCancelTimeout();
                self.timeoutId = setTimeout(self.fallback_finishPart, (self.fallback_audio.duration - self.fallback_audio.currentTime) * 1000);
                return;
            }



            self.checkAndCancelTimeout();

            if (self.fallbackChunkIndex < self.fallbackChunks.length - 1) {
                //self.log('chunk ended');
                self.fallbackChunkIndex++;
                self.fallback_startPart();

            } else {
                //self.log('msg ended');
                self.speech_onend();

            }

        };


        self.cancel = function () {

            self.checkAndCancelTimeout();

            if (self.fallbackMode){
                if (self.fallback_audio!=null)
                    self.fallback_audio.pause();
                self.clearFallbackPool();
            }else{
                self.cancelled = true;
                speechSynthesis.cancel();

            }
        };


        self.voiceSupport = function () {

            return ('speechSynthesis' in window);

        };

        self.OnFinishedPlaying = function (event) {
            //self.log("OnFinishedPlaying");
            if (self.msgparameters != null) {
                if (self.msgparameters.onend != null)
                    self.msgparameters.onend();
            }

        };

        // Set default voice to use when no voice name is supplied to speak()
        self.setDefaultVoice = function (voicename) {
            if (self.rvsMapped) {
                var rv = self.getResponsiveVoice(voicename);

                if (rv != null) {
                    self.default_rv = rv;
                }
            } else {
                var rvCheck = setTimeout(function () {
                    self.setDefaultVoice(voicename);
                }, 15);
            }
        };

        // Set default rate of speech
        self.setDefaultRate = function (value) {
            var originalValue = value;
            value = parseFloat(value);
            if (isNaN(value)) {
                console.error('[responsiveVoice.setDefaultRate] invalid argument: ' + originalValue.toString());
                return;
            }

            if (value === 0) {
                console.error('[responsiveVoice.setDefaultRate] rate must be > 0');
                return;
            }

            if (value > 1.5) {
                console.error('[responsiveVoice.setDefaultRate] rate must be <= 1.5');
                return;
            }
            defaultRate = value;
        }

        //Map responsivevoices to system voices
        self.mapRVs = function() {

            var browserLanguage = (function(){if('object'==typeof navigator){var c,a='anguage',b=navigator;return c=b['l'+a+'s'],c&&c.length?c:(a=b['l'+a]||b['browserL'+a]||b['userL'+a])?[a]:a}})()[0];

            for (var i = 0; i < self.responsivevoices.length; i++) {

                var rv = self.responsivevoices[i];

                for (var j = 0; j < rv.voiceIDs.length; j++) {

                    var vcoll = self.voicecollection[rv.voiceIDs[j]];

                    if (vcoll.fallbackvoice != true) {		// vcoll.fallbackvoice would be null instead of false

                        // Look on system voices
                        var v = self.getSystemVoice(vcoll.name);

                        //Forcing fallback mode: force ignore system voices
                        if (self.forcedFallbackMode) {
                            v = null;
                        }

                        //iOS12_0 temporary fix: Use fallback voices for any voice except the system language
                        if (self.iOS12_0) {

                            //Browser language can be language or language-country
                            if (rv.lang.toLowerCase() != browserLanguage.toLowerCase() &&
                                rv.lang.toLowerCase().split("-")[0] != browserLanguage.toLowerCase()) {
                                v = null;
                            }

                        }

                        if (v != null) {
                            rv.mappedProfile = {
                                systemvoice: v,
                                collectionvoice: vcoll
                            };
                            //self.log("Mapped " + rv.name + " to " + v.name);
                            break;
                        }

                    } else {

                        //Pick the fallback voice
                        rv.mappedProfile = {
                            systemvoice: {},
                            collectionvoice: vcoll
                        };
                        //self.log("Mapped " + rv.name + " to " + vcoll.lang + " fallback voice");
                        break;

                    }
                }
            }
            self.rvsMapped = true;
        };


        //Look for the voice in the system that matches the one in our collection
        self.getMatchedVoice = function(rv) {

            for (var i = 0; i < rv.voiceIDs.length; i++) {
                var v = self.getSystemVoice(self.voicecollection[rv.voiceIDs[i]].name);
                if (v != null)
                    return v;
            }

            return null;

        };

        self.getSystemVoice = function (name) {
            var encodedName = '';
            var unicodeWhiteSpace = String.fromCharCode(160),
                encodedName = name.replace(new RegExp('\\s+|' + unicodeWhiteSpace, 'g'), '');

            if (typeof self.systemvoices === 'undefined' || self.systemvoices === null) {
                return null;
            }

            for (var i = 0; i < self.systemvoices.length; i++) {
                //Simple compare first
                if (0 === self.systemvoices[i].name.localeCompare(name)) {
                    return self.systemvoices[i];
                }
                //Try to match chromes asian language space charaacters
                if (0 === self.systemvoices[i].name.replace(new RegExp('\\s+|' + unicodeWhiteSpace, 'g'), '').replace(/ *\([^)]*\) */g, "").localeCompare(encodedName)) {
                    return self.systemvoices[i];
                }
            }

            //Not found by name. Try lang (iOS9) -- mixes up chrome voices with android voices
            /*for (var i = 0; i < self.systemvoices.length; i++) {
                if (self.systemvoices[i].lang == name)
                    return self.systemvoices[i];
            }*/

            return null;

        };

        self.getResponsiveVoice = function(name) {

            for (var i = 0; i < self.responsivevoices.length; i++) {
                if (self.responsivevoices[i].name == name) {

                    var lastFbMode = self.fallbackMode;

                    //set fallbackMode and parts, used when the profile fallbackvoice is true or when fallbackMode is forced
                    if (self.responsivevoices[i].mappedProfile.collectionvoice.fallbackvoice === true || self.forcedFallbackMode === true) {
                        self.fallbackMode = true;
                    } else {
                        self.fallbackMode = false;
                    }

                    //Map RVs again if we are switching in or out of fallbackMode
                    if (lastFbMode != self.fallbackMode) {
                        self.mapRVs();
                        self.Dispatch("OnServiceSwitched");
                    }

                    return self.responsivevoices[i];
                }
            }

            return null;

        };

        self.Dispatch = function (name, data) {
            // Don't use nullish coalescing operator (??) - unavailable in IE (CF 06.08.20).
            data = data !== undefined ? data : null;

            //self.log("Dispatching " +name);
            if (self.hasOwnProperty(name + "_callbacks") &&
                self[name + "_callbacks"] != null &&
                self[name + "_callbacks"].length > 0) {
                var callbacks = self[name + "_callbacks"];
                for(var i=0; i<callbacks.length; i++) {
                    callbacks[i](data);
                }
                //self.log("Dispatched " + name);
                return true;
            }else {
                //Try calling a few ms later
                var timeoutName = name + "_callbacks_timeout";
                var timeoutCount = name + "_callbacks_timeoutCount";
                if (!self.hasOwnProperty(timeoutName)) {
                    //self.log("Setting up timeout for " + name);
                    self[timeoutCount] = 10;
                    self[timeoutName] = setInterval(function() {
                        //self.log("Timeout function for " + name)
                        self[timeoutCount] = self[timeoutCount] - 1;

                        if (self.Dispatch(name, data) || self[timeoutCount] < 0) {
                            clearTimeout(self[timeoutName]);
                            //if (self[timeoutCount]<0) self.log("Timeout ran out");
                        } else{
                           //self.log("Keep waiting..." + name);
                        }
                    },50);
                }


                //self.log("not found");
                return false;
            }
        };

        self.AddEventListener = function(name,callback) {
            if (!self.hasOwnProperty(name + "_callbacks")) {
                self[name + "_callbacks"] = [];
            }
            self[name + "_callbacks"].push(callback);
        };

        self.addEventListener = self.AddEventListener;

        self.RemoveEventListener = function(name, callback) {
            if (self[name + "_callbacks"] && self[name + "_callbacks"].indexOf(callback) != -1 ) {
                self[name + "_callbacks"].splice(self[name + "_callbacks"].indexOf(callback), 1);
            }
        };

        //Event designed to be hooked to any click event on the page and initialize permission to play audio
        // iOS: Needed to play TTS
        // Android: Needed to play audio files
        self.clickEvent = function() {
            self.log("Click event");
            self.click_event_detected = true;

            //Initialize permissions only if the click doesn't trigger a speak in the next few mss
            self.initializePermissionsTimeout = setTimeout(self.initializePermissions, 5);

            //Remove hooks
            self.userInteractionEvents.forEach(function(event) {
                window.removeEventListener(event, self.clickEvent, false);
            });

            self.Dispatch("OnClickEvent");

        };

        self.initializePermissions = function() {

            //TTS
            if (self.iOS && !self.iOS_initialized) {
                self.log("Initializing iOS click event");
                if (typeof speechSynthesis !== 'undefined') {
                    var u = new SpeechSynthesisUtterance(" ");
                    speechSynthesis.speak(u);
                }
                self.iOS_initialized = true;
            }

            if (self.is_android && !self.android_initialized) {
                self.log("Initializing Android click event");
                if (typeof speechSynthesis !== 'undefined') {
                    var u = new SpeechSynthesisUtterance(" ");
                    speechSynthesis.speak(u);
                }
                self.android_initialized = true;
            }

            //Fallback
            self.initFallbackPool();

        };

        self.isPlaying = function() {
            if (self.fallbackMode) {

                return  (self.fallback_audio!=null &&
                        !self.fallback_audio.ended &&
                        !self.fallback_audio.paused);

            }else{
                if (typeof speechSynthesis != 'undefined') {
                    return speechSynthesis.speaking;
                }else{
                    return false;
                }

            }
        };

        self.clearFallbackPool = function() {

            for (var i=0; i<self.fallback_audiopool.length; i++) {

                if (self.fallback_audiopool[i]!=null) {
                    self.fallback_audiopool[i].pause();
                    //self.fallback_audiopool[i].src=''; //RES-279 This has no effect to clear the pool so we just remove it for now
                    //self.fallback_audiopool[i].parentElement.removeChild(self.fallback_audiopool[i]);
                }
            }
            //self.fallback_audiopool = [];
            self.fallback_audiopool_index = 0;
            self.fallbackChunks = [];
        };

        self.initFallbackPool = function() {
            //console.log("Init fallback pool");

            if (!self.fallback_audiopool || self.fallback_audiopool.length==0) {
                var poolLength = 10;

                for (var i = 0; i < poolLength; i++) {
                    (function(i) {
                        var audio = document.createElement("AUDIO");
                        audio.preload = 'auto';



                        //Only initialize them with sound on android (as this is triggered by the first user click)
                        if (self.is_android) {

                            audio.src = silentAudioSrc;
                            audio.load();

                            //audio.play();
                            /*var canPlayCallback = function () {
                                audio.play();
                                audio.removeEventListener('canplaythrough', canPlayCallback);
                            }
                            audio.addEventListener('canplaythrough', canPlayCallback, false);

                            if (i == 0) {
                                var initializedCallback = function () {
                                    self.log("Android audio initialized");
                                    self.android_initialized = true;
                                    audio.removeEventListener('ended', initializedCallback);
                                };
                                audio.addEventListener('ended', initializedCallback);
                            }*/

                            //It seems we don't even need to play the audio, just loading an empty src does the trick
                            if (i==poolLength-1) {
                                self.log("Android HTML audio initialized");
                                self.android_initialized = true;
                            }

                        }

                        if (self.iOS) {

                            audio.src = silentAudioSrc;
                            audio.load();

                            //audio.play();
                            /*var canPlayCallback = function () {
                             audio.play();
                             audio.removeEventListener('canplaythrough', canPlayCallback);
                             }
                             audio.addEventListener('canplaythrough', canPlayCallback, false);

                             if (i == 0) {
                             var initializedCallback = function () {
                             self.log("Android audio initialized");
                             self.android_initialized = true;
                             audio.removeEventListener('ended', initializedCallback);
                             };
                             audio.addEventListener('ended', initializedCallback);
                             }*/

                            //It seems we don't even need to play the audio, just loading an empty src does the trick
                            if (i==poolLength-1) {
                                self.log("iOS HTML audio initialized");
                                self.iOS_initialized = true;
                            }
                        }

                        self.fallback_audiopool.push(audio);
                    })(i);

                }

                self.fallback_audiopool_index = 0;
            }

        };

        self.allowSpeechClicked = function(value) {
            self.allowSpeechDiv.parentNode.removeChild(self.allowSpeechDiv);
            self.allowSpeechDiv = null;

            self.speechAllowedByUser = value;

            if (value) {
                self.clickEvent();
                if (self.scheduledSpeak) {
                    self.speak(self.scheduledSpeak.text, self.scheduledSpeak.voicename, self.scheduledSpeak.parameters);
                    self.scheduledSpeak = null;
                }
            }

            self.Dispatch("OnAllowSpeechClicked");
        };

        self.checkSpeechAllowed = function(options) {
            //If the user explicitly denied access
            if (self.speechAllowedByUser==false) {
                return false;
            }

            //If we are on mobile we can only initialize audio from a user action.
            //If it didn't happen it means speak was called without any user interaction so we need to force it.
            //Also applies to safari (html5 audio only)
            var onMobile = self.is_android || self.iOS;
            var onSafariFallback = self.is_safari && (self.fallbackMode || self.forcedFallbackMode);
            var shouldShowPopup = self.disablePermissionPopup !== true && (self.allowPermissionPopupEverywhere === true || onMobile || onSafariFallback || self.speechSynthesisNotAllowedError === true);
            if (shouldShowPopup && !self.click_event_detected) {
                //self.enableWindowClickHook();

                if (self.allowSpeechDiv) return;

                self.allowSpeechDiv_appearances = self.allowSpeechDiv_appearances==null?1:++self.allowSpeechDiv_appearances;
                if (self.allowSpeechDiv_appearances>2) {
                    console.log("ResponsiveVoice: Speech not allowed by user");
                    return false;
                }

                var cssnode = document.createElement('style');
                cssnode.innerHTML = '.rvNotification{position:fixed;background-color:#fff;text-align:center;font-family:-apple-system,system-ui,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;font-weight:400;line-height:1.5;box-shadow:0 4px 8px 0 rgba(0,0,0,.2),0 6px 20px 0 rgba(0,0,0,.19);z-index:10000;width:100vw;left:0;bottom:0;font-size:1rem;padding-bottom:.5em;padding-right:.5em}.rvButtonRow{padding-right:2em;padding-bottom:1em;text-align:right;font-size:medium}.rvButton{cursor:pointer;display:inline-block;margin-left:1em;padding:.8em 2em;border-radius:3px;font-size:small}.rvButtonAllow{border:none;background-color:#2b8cff;color:#fff}.rvButtonDeny{border:1px solid #2b8cff;color:#2b8cff;background-color:#fff}.rvTextRow{padding-top:1em;padding-bottom:2em}@media (min-width:576px){.rvNotification{width:60vw;left:20vw}}@media (min-width:768px){.rvNotification{width:50vw;left:25vw}}@media (min-width:992px){.rvNotification{width:40vw;left:30vw}}@media (min-width:1200px){.rvNotification{width:30vw;left:35vw}}';
                document.body.appendChild(cssnode);

                self.allowSpeechDiv = document.createElement("div");
                self.allowSpeechDiv.classList.add('rvNotification');

                if(options == undefined) {
                    options = {};
                }
                var origin = options.urlOverride != undefined ? options.urlOverride : window.location.hostname;
                var action = options.textOverride != undefined ? options.textOverride : 'wants to play speech';

                self.allowSpeechDiv.innerHTML = '<div class="rvTextRow"><strong>' + origin + '</strong> ' + action + '</div><div class="rvButtonRow"><div onclick="responsiveVoice.allowSpeechClicked(false);" class="rvButton rvButtonDeny">DENY</div><div onclick="responsiveVoice.allowSpeechClicked(true);" class="rvButton rvButtonAllow">ALLOW</div></div>';
                document.body.appendChild(self.allowSpeechDiv);

                return false;
            }
            return true;
        };



        self.fallback_audioPool_getAudio = function() {
            self.initFallbackPool();
            if (self.fallback_audiopool_index>=self.fallback_audiopool.length) {
                //Pool is ended. We clear it
                //self.log("Audio pool capacity over. Reusing from index 0");
                self.fallback_audiopool_index = 0;
            }
            return self.fallback_audiopool[self.fallback_audiopool_index++];
        };

        self.fallback_updateChunksBuffer = function() {

            //Make sure we are ahead loading chunks
            for (var i = self.fallbackChunkIndex; i < Math.min(self.fallbackChunks.length, self.fallbackChunkIndex + self.fallbackBufferLength) ; i++) {
                var c = self.fallbackChunks[i];
                if (c.audio==null) {
                    c.audio = self.fallback_audioPool_getAudio();
                    (function(c) {
                        var loadChunk = function() {
                            //Load the audio
                            c.audio.src = c.url;
                            c.audio.playbackRate = self.fallback_playbackrate;
                            c.audio.preload = 'auto';
                            c.audio.load(); // android doesn't allow playing audio without an user action. this initializes all audio chunks at first action so restriction is removed.
                        }
                        if (i==0) {
                            loadChunk(); // Load now
                        }else{
                            setTimeout(loadChunk,50*i); // Schedule
                        }

                    })(c);
                }
            }


        };

        self.selectBest = function(a) {

            for(var i=0; i<a.length; i++) {
                if (a[i]!=null) return a[i];
            }
            return null;
        };


        self.pause = function() {

            if (self.fallbackMode) {
                if (self.fallback_audio!=null) {
                    self.fallback_audio.pause();
                }
            }else{
                speechSynthesis.pause();
                self.ttsCancelledByTimeout = false;
                self.ttsKeepAliveTimeout = setTimeout(function() {
                    self.ttsKeepAliveTimeout = null;
                    speechSynthesis.cancel();
                    self.ttsCancelledByTimeout = true;
                },60000);
            }

        };

        self.resume = function() {
            if (self.fallbackMode) {
                if (self.fallback_audio!=null) {
                    self.fallback_audio.play();
                }
            }else{

                if (self.ttsCancelledByTimeout) {
                    self.ttsCancelledByTimeout = false;
                    var playFromHere = false;
                    for (var i = 0; i < self.utterances.length; i++) {
                        var utterance = self.utterances[i];
                        if (self.currentMsg == utterance) {
                            playFromHere=true;
                        }
                        if (playFromHere) {
                            self.tts_speak(utterance);
                        }
                    }

                }else{
                    if (self.ttsKeepAliveTimeout) {
                        clearTimeout(self.ttsKeepAliveTimeout);
                        self.ttsKeepAliveTimeout = null;
                    }
                    speechSynthesis.resume();
                }


            }

        };

        self.tts_speak = function(msg) {
            setTimeout(function(){
                self.cancelled = false;
                self.analytics.characterCount += msg.text.toString().length
                speechSynthesis.speak(msg);
            },0.01);
        };

        self.setVolume = function(v) {

            if (self.isPlaying()) {
                if (self.fallbackMode) {
                    for (var i=0; i<self.fallback_audiopool.length; i++) {
                        self.fallback_audiopool[i].volume = v;
                    }
                    self.fallback_audio.volume = v;
                }else{
                    for (var i=0; i<self.utterances.length; i++) {
                        self.utterances[i].volume = v;
                    }
                }
            }
        };

        self.onPartEnd = function(e) {

            if (self.msgparameters!=null && self.msgparameters.onchuckend!=null) {
                self.msgparameters.onchuckend();
            }

            self.Dispatch("OnPartEnd");

            var i = self.utterances.indexOf(e.utterance);
            self.currentMsg = self.utterances[i+1];

        };

        self.onboundary = function(e) {
            self.log("On Boundary");

            //on iOS on boundary sometimes will be fired when start hasn't. We use this as a false start.
            if (self.iOS && !self.onstartFired) {
                self.speech_onstart();
            }

        };

        self.numToWords = function (n) {
            var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

            function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

            var arr = function arr(x) {
                return Array.from(x);
            };

            var num = function num(x) {
                return Number(x) || 0;
            };

            var isEmpty = function isEmpty(xs) {
                return xs.length === 0;
            };

            var take = function take(n) {
                return function (xs) {
                    return xs.slice(0, n);
                };
            };

            var drop = function drop(n) {
                return function (xs) {
                    return xs.slice(n);
                };
            };

            var reverse = function reverse(xs) {
                return xs.slice(0).reverse();
            };

            var comp = function comp(f) {
                return function (g) {
                    return function (x) {
                        return f(g(x));
                    };
                };
            };

            var not = function not(x) {
                return !x;
            };

            var chunk = function chunk(n) {
                return function (xs) {
                    return isEmpty(xs) ? [] : [take(n)(xs)].concat(_toConsumableArray(chunk(n)(drop(n)(xs))));
                };
            };

            var a = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];

            var b = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

            var g = ['', 'thousand', 'million', 'billion', 'trillion', 'quadrillion', 'quintillion', 'sextillion', 'septillion', 'octillion', 'nonillion'];

            // this part is really nasty still
            // it might edit this again later to show how Monoids could fix this up
            var makeGroup = function makeGroup(_ref) {
                var _ref2 = _slicedToArray(_ref, 3);

                var ones = _ref2[0];
                var tens = _ref2[1];
                var huns = _ref2[2];

                return [num(huns) === 0 ? '' : a[huns] + ' hundred ', num(ones) === 0 ? b[tens] : b[tens] && b[tens] + ' ' || '', a[tens + ones] || a[ones]].join('');
            };

            var thousand = function thousand(group, i) {
                return group === '' ? group : group + ' ' + g[i];
            };

            if (typeof n === 'number') return self.numToWords(String(n));else if (n === '0') return 'zero';else return comp(chunk(3))(reverse)(arr(n)).map(makeGroup).map(thousand).filter(comp(not)(isEmpty)).reverse().join(' ').trim();
        };

        self.getWords = function (text) {

            //Process currencies
            text = text.replace(/$|Â¥|â‚¡|â‚¬|Â£|â‚ª|â‚¹|ï¿¥|áŸ›|â‚©|â‚¦|à¸¿|â‚´|â‚«/gi, " dummy currency ");

            var words = text.split(/(\s*[\s,]\s*|\?|;|:|\.|\(|\)|!)/),
                match;

            words = words.filter(function(str) {
                return /[^\s]/.test(str);
            });

            //find numbers, translate them to text, push as words
            for (var i = 0; i < words.length; i++) {
                if ((match = words[i].toString().match(/\d+/)) != null) {
                    words.splice(i, 1);
                    self.numToWords(+match[0]).split(/\s+/).map(function (word){
                        words.push(word);
                    });
                }
            }

            return words;
        };

        self.getEstimatedTimeLength = function (text, multiplier) {
            var words = self.getWords(text),
                charsCount = 0,
                base = self.fallbackMode ? 1300 : 700,
                multiplier = multiplier || 1/*, minWordLengthInText = 0, maxWordLengthInText = 0*/;

            words.map(function (word, i){
                charsCount += (word.toString().match(/[^ ]/igm) || word).length;

                 /*self.log(minWordLengthInText, maxWordLengthInText);

                 if (minWordLengthInText > 0 && minWordLengthInText > word.length) {
                 minWordLengthInText = word.length;
                 } else if (maxWordLengthInText > 0 && maxWordLengthInText < word.length) {
                 maxWordLengthInText = word.length;
                 } else if (minWordLengthInText == 0 && maxWordLengthInText == 0) {
                 minWordLengthInText = maxWordLengthInText = word.length;
                 }*/
            });

            //self.log("Words: [" + words + "], charsCount: " + charsCount);

            var wordsCount = words.length;
            //var avgWordLengthInText = (minWordLengthInText + maxWordLengthInText) / 2;

            //self.log(minWordLengthInText, maxWordLengthInText, avgWordLengthInText);

            //var wlf = (charsCount/wordsCount) / avgWordLengthInText * 5.1; //word length factor: 5.1 is the average word length in english.

            var estimatedLength = multiplier * 1000 * (60 / self.WORDS_PER_MINUTE) * wordsCount /** wlf*/;

            if (wordsCount < 5) {
                estimatedLength = multiplier * (base + charsCount * 50);
            }

            self.log("Estimated time length: " + estimatedLength + " ms, words: [" + words + "], charsCount: " + charsCount);

            return estimatedLength;
        };

        /**
         * Receives parameter name and value to check types.
         * Currently checks [rate, pitch, volume] for the native JS type "Number".
         * Returns unchanged value OR default "1" and outputs a warning on the console.
         * @param parameters
         * @param name
         * @returns {*}
         */
        self.validateParameters = function (parameters, name) {

            if (typeof parameters[name] === 'undefined'){
                return parameters[name];
            }

            // Leaving in a switch-case for future fine-tuning of individual parameters
            switch (name) {
                case 'rate':
                case 'pitch':
                case 'volume':
                    var test = Number(parameters[name]);

                    if (isNaN(test)) {
                        console.warn(
                            'ResponsiveVoice: the parameter ' + name + ' has a wrong value "' + parameters[name] + '". Defaults were used.'
                        );
                    }
                    parameters[name] = isNaN(test) ? "1" : parameters[name];
            }

            return parameters[name];
        };

        self.services = {
            NATIVE_TTS:     0,
            FALLBACK_AUDIO: 1
        };

        self.servicesPriority = [0, 1];
        self.servicesEnabled = [];

        self.setServiceEnabled = function(service,enabled) {
            self.servicesEnabled[service] = enabled;
        };

        self.getServiceEnabled = function(service) {
            return self.servicesEnabled[service] || false;
        };

        //Default services status
        self.setServiceEnabled(self.services.NATIVE_TTS, true);
        self.setServiceEnabled(self.services.FALLBACK_AUDIO, true);

        self.forceFallbackMode = function(value) {

            self.forcedFallbackMode = value;
            self.fallbackMode = value;
            self.mapRVs();

            self.Dispatch("OnServiceSwitched");
        };

        self.enableWindowClickHook = function() {

            self.userInteractionEvents.forEach(function(event) {
                    window.addEventListener(event, self.clickEvent, false);
            });


        };

        self.setTextReplacements = function(array) {

            if (array==null) {
                textReplacements = null;
                return;
            }

            textReplacements = [];

            for (var i = 0; i < array.length; i++) {
                var rep = array[i];

                //Parse possible regular expressions
                var exp = rep.searchvalue;

                //Parse regular expressions
                if (typeof exp == "string") {
                    try {
                        var match = exp.match(new RegExp('^/(.*?)/([gimy]*)$'));
                        var rexp = new RegExp(match[1], match[2]);
                        if (rexp instanceof RegExp) {
                            exp = rexp;
                        }
                    }catch(e){
                        //Create a regexp
                        exp = new RegExp(exp, "g");
                    }
                }

                textReplacements.push({
                    searchvalue: exp,
                    newvalue: rep.newvalue,
                    collectionvoices: rep.collectionvoices,
                    systemvoices: rep.systemvoices
                });

            }

        };

        function applyTextReplacements (text, profile) {

            if (!textReplacements) return text;

            console.log(profile);

            var resText = text;
            try {
                for (var i = 0; i < textReplacements.length; i++) {
                    var rep = textReplacements[i];

                    //Check collectionvoices and systemvoices
                    var collectionVoicesMatch = false;

                    var collectionvoices = rep.collectionvoices;

                    if (collectionvoices) {
                        if (!Array.isArray(collectionvoices)) {
                            collectionvoices = [collectionvoices];
                        }

                        if (profile.collectionvoice && profile.collectionvoice.name && collectionvoices.indexOf(profile.collectionvoice.name)!=-1) {
                            collectionVoicesMatch = true;
                        }

                    }else{
                        collectionVoicesMatch = true;
                    }

                    var systemVoicesMatch = false;

                    var systemvoices = rep.systemvoices;

                    if (systemvoices) {
                        if (!Array.isArray(systemvoices)) {
                            systemvoices = [systemvoices];
                        }

                        if (profile.systemvoice && profile.systemvoice.name && systemvoices.indexOf(profile.systemvoice.name)!=-1) {
                            systemVoicesMatch = true;
                        }

                    }else{
                        systemVoicesMatch = true;
                    }

                    if ((collectionvoices==null || collectionvoices!=null && collectionVoicesMatch) &&
                        (systemvoices==null || systemvoices!=null && systemVoicesMatch)) {

                        resText = resText.replace(rep.searchvalue, rep.newvalue);
                    }
                }
                return resText;
            } catch(e) {
                console.warn("ResponsiveVoice: There was an error while processing the textReplacements array");
                return text;
            }
        }

        /**
         * Searches parameters of an URL string and returns a chosen parameter
         * @param url
         * @param parameter
         * @returns {boolean|*}
         */
        function parseUrlParameter(url, parameter) {
            var element = document.createElement('a'), qsObject = {}, qsParams, qsKeyValue, i;

            element.href = url;

            if (!element.search) {
                return false;
            }

            qsParams = element.search.replace(/^\?/, '').split('&');

            for (i = 0; i < qsParams.length; i++) {
                qsKeyValue              = qsParams[i].split('=');
                qsObject[qsKeyValue[0]] = qsKeyValue[1];
            }

            if (parameter && qsObject[parameter]) {
                return qsObject[parameter];
            }

            return false;
        }

        // Test for a valid RV script tag
        var rvCanonicalRegEx = /(code\.responsivevoice\.org|local-lb).*?responsivevoice(\.\w+)?\.js/ig;

        /**
         * Returns true if we assume that RV is loaded from the Wordpress plugin
         * @returns {boolean}
         */
        function wpDetect (){
            var scripts = document.getElementsByTagName('script'),
                index;

            for ( index = 0; index < scripts.length; ++index ) {
                if( scripts[index].src && rvCanonicalRegEx.test(scripts[index].src) ){
                    var wpValue = parseUrlParameter(scripts[index].src, 'source');
                    if(wpValue && wpValue == 'wp-plugin'){
                        rvCanonicalRegEx.lastIndex = 0;
                        return true;
                    }
                }
            }
            return false;
        }

        /**
         * Returns true if we assume that RV is loaded from a bundler
         * @returns {boolean}
         */
        function bundleDetect (){
            var scripts = document.getElementsByTagName('script'),
                index;

            for ( index = 0; index < scripts.length; ++index ) {
                if( scripts[index].src && rvCanonicalRegEx.test(scripts[index].src) ){
                    rvCanonicalRegEx.lastIndex = 0;
                    return false;
                }
            }
            return true;
        }

        //Keep this at the end
        if(document.readyState === "interactive") {
            //Already loaded
            self.init();
        }else {
            document.addEventListener('DOMContentLoaded', function () {
                self.init();
            });
        }

        window.addEventListener('beforeunload', function () {
            var rvKey = rvApiKey || null;

            if (!rvKey || !self.analytics.characterCount) {
                return;
            }

            var Data = new FormData();

            Data.append('key', rvApiKey);
            Data.append('count', self.analytics.characterCount);

            var beaconQueued = navigator.sendBeacon('https://app.responsivevoice.org/analytics/cc/session', Data);

            if (beaconQueued) {
                self.analytics.characterCount = 0;
            }
        });

    };
    var responsiveVoice = new ResponsiveVoice();
}
