(function (fsh) {
    'use strict';
    angular.module('fsh.modules.shell')
        .directive('fshVoiceSearch', FshVoiceSearch);

    // ReSharper disable once InconsistentNaming
    function FshVoiceSearch() {
        /// <summary>
        ///     voice based search application modules 
        /// </summary>
        var directive = {
            restrict: 'E',
            templateUrl: 'Template/FshVoiceSearchTemplate',
            link: function (scope, element) {
                var destroyListener = scope.$on('$destroy', cleanUp);

                function cleanUp() {
                    /// <summary>
                    ///     Clean up the memory
                    /// </summary>
                    element.off();
                    element.remove();
                    if (destroyListener !== undefined && destroyListener !== null) {
                        destroyListener();
                    }
                }
            },
            replace: true, // replace original markup with template
            transclude: false, // do not copy original HTML content
            controller: VoiceSearchController,
            scope: {
                voiceSearchDetails: '='
            }
        };
        return directive;
    }

    VoiceSearchController.$inject = ['$scope', '$http'];

    // ReSharper disable once InconsistentNaming
    function VoiceSearchController($scope, $http) {
        console.log('$scope', $scope);
        $scope.jsonValues = [{}];

        var isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);

        if (!isChrome) {
            unsupported();
        }

        setTimeout(function () {
            $('#newPage').removeClass('loading')
        }, 10);

        var tip;

        var keywords = [];

        // You can add keywords in bulk by JSON file here.
        //var keywordPacks = [
        //    "./shell/directives/keywords.json"
        //];
        // var keywordPacks = {};
        $http.get('./Scripts/fsh/shell/directives/keywords.json').then(function (data) {
            console.log('data', data);
            // keywordPacks = data.data;
            keywords = data.data.keywords.concat(keywords);
        });



        var precursors = [
          'on',
          'on my',
          'in',
          'in my',
          'from',
          'from my',
          "'",
          "'s",
          "at",
          "sell",
          "have"
        ];
        var worthlessPrefixes = [
          "what's the",
          "what is the",
          "what will the",
          "find",
          "show me",
          "show",
          "i want to",
          "i want",
          "give me",
          "help me find",
          "help me",
          "let me",
          "search for",
          "look up",
          "look for",
          "search for",
          "search",
          "i need",
          "i need to",
          "i need to get",
          "i need to have",
          "play",
          "is",
          "are",
          "does",
          "do they sell",
          "do they have",
          "can I buy",
          "can I get"
        ];
        var final_transcript = '';
        var recognizing = false;
        var cancel = false;

        worthlessPrefixes.sort(lengthSort).reverse();
        precursors.sort(lengthSort).reverse();


        // Grab any keyword packs
        //$.each(keywordPacks,
        //    function () {
        //        $.getJSON(this,
        //            function (data) {
        //                if (data.keywords) {
        //                    keywords = data.keywords.concat(keywords);
        //                }
        //            });
        //    });

        // Check to see if webkitSpeechRecognition is available
        if (!('webkitSpeechRecognition' in window)) {
            unsupported();
        } else {
            var recognition = new webkitSpeechRecognition();
            recognition.interimResults = true;
            recognition.continuous = true;
            recognition.onstart = function () { }
            recognition.onresult = function (e) {
                var interim_transcript = '';

                for (var i = e.resultIndex; i < e.results.length; ++i) {
                    if (e.results[i].isFinal) {
                        final_transcript = final_transcript + e.results[i][0].transcript;
                    } else {
                        interim_transcript = interim_transcript + e.results[i][0].transcript;
                    }
                }
                final_transcript = capitalize(final_transcript);
                $('#final_span').empty().html(linebreak(final_transcript));
                $('#interim_span').empty().html(linebreak(interim_transcript));
            };
        }
        recognition.onerror = function (e) { }

        function startButton(event) {
            final_transcript = '';
            //recognition.lang = select_dialect.value;
            recognition.start();
        }

        function unsupported() {
            console.log('Webkit speech api not supported in your browser');
        }

        // Main start event
        $('#button').on('mousedown touchstart', function () {
            if (cancel) {
                reset();
            } else {
                startRecog();
            }
        });

        function startRecog() {
            if (!recognizing) {
                recognition.start();
                final_transcript = '';
                $('#final_span').empty();
                $('#interim_span').empty();
                $(this).text('done');
                recognizing = true;
            }
        };

        $(document).on('touchend mouseup', function () {
            endRecog();
        })

        function endRecog() {
            if (recognizing) {
                recognizing = false;
                recognition.stop();
            }
        }

        recognition.onend = function () {
            var string = final_transcript.toLowerCase();
            if (string.trim() != '') {
                recognizing = false;
                cancel = true;
                process(string);
            } else {
                showTip();
            }
        }

        function process(string) {
            string = string.toLowerCase();
            var foundKeywords = [];
            $.each(keywords, function () {
                if ($.isArray(this.keyword)) {
                    var self = this;
                    this.keyword.sort(lengthSort).reverse();
                    $(this.keyword).each(function () {
                        var keyword = this.toLowerCase(),
                            keywordIndex = String(string).indexOf(keyword);
                        if (keywordIndex > -1) {
                            foundKeywords.push({
                                'keywordIndex': keywordIndex,
                                'keywordObject': self,
                                'keyword': keyword
                            });
                        }
                    });
                } else {
                    var keyword = this.keyword.toLowerCase(),
                      keywordIndex = String(string).indexOf(keyword);
                    if (keywordIndex > -1) {
                        foundKeywords.push({
                            'keywordIndex': keywordIndex,
                            'keywordObject': this,
                            'keyword': this.keyword
                        });
                    }
                }
            });
            if (!foundKeywords.length) {
                noKeyword(string);
            } else if (foundKeywords.length == 1) {
                // String ops
                var passIt = foundKeywords[0].keywordObject;
                passIt.foundKeyword = foundKeywords[0].keyword;
                parseString(string, passIt);
            } else {
                // At this point, we know more than one keyword is in here.
                // Now we need to determine which is the command
                // and which is part of a query.
                var youngestKeyword,
                    youngestIndex = 10000000000000000000000000000,
                    finished = false;
                $.each(foundKeywords, function () {
                    if (youngestIndex > this.keywordIndex) {
                        youngestKeyword = this.keywordObject;
                        youngestKeyword.foundKeyword = this.keyword;
                        youngestIndex = this.keywordIndex;
                    }
                    var currentKeywordObject = this.keywordObject;
                    var currentKeyword = this.keyword
                    $.each(precursors, function () {
                        var thisString = String(string).toLowerCase();
                        var precursorIndex = thisString.indexOf(String(this).toLowerCase()),
                            proposedIndex = precursorIndex + String(this).length,
                            actualIndex = thisString.indexOf(String(currentKeyword).toLowerCase());
                        if (precursorIndex > 0) {
                            if (proposedIndex == actualIndex || proposedIndex + 1 == actualIndex) {
                                currentKeywordObject.foundKeyword = currentKeyword;
                                parseString(string, currentKeywordObject);
                                finished = true;
                                return false;
                            }
                        }
                    })
                    if (finished) {
                        return false;
                    }
                })
                if (!finished) {
                    parseString(string, youngestKeyword);
                }
            }
        }

        function noKeyword(string) {
            var text = "Invalid Keyword " + string;
            if ('speechSynthesis' in window) {
                var msg = new SpeechSynthesisUtterance();
                var voices = window.speechSynthesis.getVoices();
                msg.voice = voices[1];
                msg.rate = 1;
                msg.pitch = 1;
                msg.text = text;

                msg.onend = function (e) {
                    console.log('Finished in ' + event.elapsedTime + ' seconds.');
                };

                speechSynthesis.speak(msg);
            } else {
                alert(text);
            }
            reset();
        }

        function parseString(string, keyword) {
            var found = false;
            // strip out useless human context
            $(worthlessPrefixes).each(function () {
                if (string.indexOf(this) == 0) {
                    string = string.substring(this.length + 1);
                    return false;
                }
            });
            if (string.trim() == String(keyword.foundKeyword).toLowerCase()) {
                var newKeyword = {
                    func: keyword.func
                }
                getThat(newKeyword, '');
            } else {
                // There is a string here, so query it
                $(precursors).each(function () {
                    var onKeyword = String(this) + ' ' + keyword.foundKeyword.toLowerCase();
                    if (string.indexOf(onKeyword) > -1 && string.indexOf(onKeyword) == string.length - onKeyword.length) {
                        string = string.substring(0, string.length - onKeyword.length).trim();
                        found = true;
                        return false
                    }
                });

                var searchXFor = keyword.foundKeyword.toLowerCase() + ' for';
                if (string.indexOf(searchXFor) == 0 && !found) {
                    string = string.substring(searchXFor.length + 1);
                }

                if (!found) {
                    string = string.replace(keyword.foundKeyword.toLowerCase(), '')
                }
                getThat(keyword, string.trim());
            }
        }

        function getThat(command, query, firstHit) {
            eval(command.func + "();");
        }

        function reset() {
            $('#button').removeClass('cancel');
            $('#button #contents').empty();
            cancel = false;
            final_transcript = '';
            $('#final_span').text('');
        }

        function showTip() {
            reset();
            // TODO: Display Help Message
            $('#tip').addClass('show');
            if (tip) {
                window.clearTimeout(tip);
            }
            tip = setTimeout(function () {
                $('#tip').removeClass('show');
            }, 3000);

        }

        /// ##### VISUALIZATION STUFF #####

        var liveSource;
        var analyser;
        var frequencyData;

        // creates an audiocontext and hooks up the audio input
        var context = new AudioContext();
        navigator.webkitGetUserMedia({
            audio: true
        }, function (stream) {
            console.log("Connected live audio input");
            if (!analyser) {
                liveSource = context.createMediaStreamSource(stream);
                // Create the analyser
                analyser = context.createAnalyser();
                analyser.smoothingTimeConstant = 0.3;
                analyser.fftSize = 64;
                frequencyData = new Uint8Array(analyser.frequencyBinCount);
                liveSource.connect(analyser);
            };
        }, function () {
            console.log('Error connecting to audio')
        });

        /// ##### BASIC UTILS #####

        function capitalize(string) {
            return string.charAt(0).toUpperCase() + string.slice(1);
        }

        function linebreak(s) {
            var two_line = /\n\n/g;
            var one_line = /\n/g;
            return s.replace(two_line, '<p></p>').replace(one_line, '<br>');
        }

        function lengthSort(astr, bstr) {
            if (astr.length != bstr.length) {
                return astr.length - bstr.length;
            }
            return (astr < bstr) ? -1 : (astr > bstr) ? 1 : 0;


        }


        // ##### Functions ######

        function openStock() {
            window.location.href = "http:\/\/localhost:27819\/#\/Stock\/StockSearch";
        }

        function openClient() {
            window.location.href = "http:\/\/localhost:27819\/#\/Client\/ClientSearch";
        }

        function openPersonnel() {
            window.location.href = "http:\/\/localhost:27819\/#\/Personnel\/PersonnelSearch";
        }

        function searchData() {
            $("#searchButton").click();
        }
    }
})(window.fsh);