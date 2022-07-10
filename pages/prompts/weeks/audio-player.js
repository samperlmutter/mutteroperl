let audioPlayer = function(audioId) {
    "use strict";

    // Private letiables
    let _currentTrack = null;
    let _elements = {
        audio: document.getElementById(audioId),
        playerButtons: {
            largeToggleBtn: document.querySelector(".large-toggle-btn." + audioId),
            nextTrackBtn: document.querySelector(".next-track-btn." + audioId),
            previousTrackBtn: document.querySelector(".previous-track-btn." + audioId),
            smallToggleBtn: document.getElementsByClassName("small-toggle-btn " + audioId)
        },
        progressBar: document.querySelector(".progress-box." + audioId),
        playListRows: document.getElementsByClassName("play-list-row " + audioId),
        trackInfoBox: document.querySelector(".track-info-box." + audioId)
    };
    let _playAHead = false;
    let _progressCounter = 0;
    let _progressBarIndicator = _elements.progressBar.children[0].children[0].children[1];
    let _trackLoaded = false;

    /**
     * Determines the buffer progress.
     *
     * @param audio The audio element on the page.
     **/
    let _bufferProgress = function(audio) {
        let bufferedTime = (audio.buffered.end(0) * 100) / audio.duration;
        let progressBuffer = _elements.progressBar.children[0].children[0].children[0];

        progressBuffer.style.width = bufferedTime + "%";
    };

    /**
     * A utility function for getting the event cordinates based on browser type.
     *
     * @param e The JavaScript event.
     **/
    let _getXY = function(e) {
        let containerX = _elements.progressBar.offsetLeft;
        let containerY = _elements.progressBar.offsetTop;

        let coords = {
            x: null,
            y: null
        };

        let isTouchSuopported = "ontouchstart" in window;

        if (isTouchSuopported) { //For touch devices
            coords.x = e.clientX - containerX;
            coords.y = e.clientY - containerY;

            return coords;
        } else if (e.offsetX || e.offsetX === 0) { // For webkit browsers
            coords.x = e.offsetX;
            coords.y = e.offsetY;

            return coords;
        } else if (e.layerX || e.layerX === 0) { // For Mozilla firefox
            coords.x = e.layerX;
            coords.y = e.layerY;

            return coords;
        }
    };

    let _handleProgressIndicatorClick = function(e) {
        let progressBar = document.querySelector(".progress-box." + audioId);
        let xCoords = _getXY(e).x;

        return (xCoords - progressBar.offsetLeft) / progressBar.children[0].offsetWidth;
    };

    /**
     * Initializes the html5 audio player and the playlist.
     *
     **/
    let initPlayer = function() {

        if (_currentTrack === 1 || _currentTrack === null) {
            _elements.playerButtons.previousTrackBtn.disabled = true;
        }

        //Adding event listeners to playlist clickable elements.
        for (let i = 0; i < _elements.playListRows.length; i++) {
            let smallToggleBtn = _elements.playerButtons.smallToggleBtn[i];
            let playListLink = _elements.playListRows[i].children[2].children[0];

            //Playlist link clicked.
            playListLink.addEventListener("click", function(e) {
                e.preventDefault();
                let selectedTrack = parseInt(this.parentNode.parentNode.getAttribute("data-track-row"));

                if (selectedTrack !== _currentTrack) {
                    _resetPlayStatus();
                    _currentTrack = null;
                    _trackLoaded = false;
                }

                if (_trackLoaded === false) {
                    _currentTrack = parseInt(selectedTrack);
                    _setTrack();
                } else {
                    _playBack(this);
                }
            }, false);

            //Small toggle button clicked.
            smallToggleBtn.addEventListener("click", function(e) {
                e.preventDefault();
                let selectedTrack = parseInt(this.parentNode.getAttribute("data-track-row"));

                if (selectedTrack !== _currentTrack) {
                    _resetPlayStatus();
                    _currentTrack = null;
                    _trackLoaded = false;
                }

                if (_trackLoaded === false) {
                    _currentTrack = parseInt(selectedTrack);
                    _setTrack();
                } else {
                    _playBack(this);
                }

            }, false);
        }

        //Audio time has changed so update it.
        _elements.audio.addEventListener("timeupdate", _trackTimeChanged, false);

        //Audio track has ended playing.
        _elements.audio.addEventListener("ended", function(e) {
            _trackHasEnded();
        }, false);

        //Audio error.
        _elements.audio.addEventListener("error", function(e) {
            switch (e.target.error.code) {
                case e.target.error.MEDIA_ERR_ABORTED:
                    alert('You aborted the video playback.');
                    break;
                case e.target.error.MEDIA_ERR_NETWORK:
                    alert('A network error caused the audio download to fail.');
                    break;
                case e.target.error.MEDIA_ERR_DECODE:
                    alert('The audio playback was aborted due to a corruption problem or because the video used features your browser did not support.');
                    break;
                case e.target.error.MEDIA_ERR_SRC_NOT_SUPPORTED:
                    alert('The video audio not be loaded, either because the server or network failed or because the format is not supported.');
                    break;
                default:
                    alert('An unknown error occurred.');
                    break;
            }
            _trackLoaded = false;
            _resetPlayStatus();
        }, false);

        //Large toggle button clicked.
        _elements.playerButtons.largeToggleBtn.addEventListener("click", function(e) {
            if (_trackLoaded === false) {
                _currentTrack = parseInt(1);
                _setTrack()
            } else {
                _playBack();
            }
        }, false);

        //Next track button clicked.
        _elements.playerButtons.nextTrackBtn.addEventListener("click", function(e) {
            if (this.disabled !== true) {
                _currentTrack++;
                _trackLoaded = false;
                _resetPlayStatus();
                _setTrack();
            }
        }, false);

        //Previous track button clicked.
        _elements.playerButtons.previousTrackBtn.addEventListener("click", function(e) {
            if (this.disabled !== true) {
                _currentTrack--;
                _trackLoaded = false;
                _resetPlayStatus();
                _setTrack();
            }
        }, false);

        //User is moving progress indicator.
        _progressBarIndicator.addEventListener("mousedown", _mouseDown, false);

        //User stops moving progress indicator.
        window.addEventListener("mouseup", _mouseUp, false);
    };

    /**
     * Handles the mousedown event by a user and determines if the mouse is being moved.
     *
     * @param e The event object.
     **/
    let _mouseDown = function(e) {
        window.addEventListener("mousemove", _moveProgressIndicator, true);
        _elements.audio.removeEventListener("timeupdate", _trackTimeChanged, false);

        _playAHead = true;
    };

    /**
     * Handles the mouseup event by a user.
     *
     * @param e The event object.
     **/
    let _mouseUp = function(e) {
        if (_playAHead === true) {
            let duration = parseFloat(_elements.audio.duration);
            let progressIndicatorClick = parseFloat(_handleProgressIndicatorClick(e));
            window.removeEventListener("mousemove", _moveProgressIndicator, true);

            _elements.audio.currentTime = duration * progressIndicatorClick;
            _elements.audio.addEventListener("timeupdate", _trackTimeChanged, false);
            _playAHead = false;
        }
    };

    /**
     * Moves the progress indicator to a new point in the audio.
     *
     * @param e The event object.
     **/
    let _moveProgressIndicator = function(e) {
        let newPosition = 0;
        let progressBarOffsetLeft = _elements.progressBar.offsetLeft;
        let progressBarWidth = 0;
        let progressBarIndicator = _elements.progressBar.children[0].children[0].children[1];
        let progressBarIndicatorWidth = _progressBarIndicator.offsetWidth;
        let xCoords = _getXY(e).x;

        progressBarWidth = _elements.progressBar.children[0].offsetWidth - progressBarIndicatorWidth;
        newPosition = xCoords - progressBarOffsetLeft;

        if ((newPosition >= 1) && (newPosition <= progressBarWidth)) {
            progressBarIndicator.style.left = newPosition + ".px";
        }
        if (newPosition < 0) {
            progressBarIndicator.style.left = "0";
        }
        if (newPosition > progressBarWidth) {
            progressBarIndicator.style.left = progressBarWidth + "px";
        }
    };

    /**
     * Controls playback of the audio element.
     *
     **/
    let _playBack = function() {
        if (_elements.audio.paused) {
            _elements.audio.play();
            _updatePlayStatus(true);
        } else {
            _elements.audio.pause();
            _updatePlayStatus(false);
        }
    };

    /**
     * Sets the track if it hasn't already been loaded yet.
     *
     **/
    let _setTrack = function() {
        let songURL = _elements.audio.children[_currentTrack - 1].src;

        _elements.audio.setAttribute("src", songURL);
        _elements.audio.load();

        _trackLoaded = true;

        _setTrackTitle(_currentTrack, _elements.playListRows);

        _setActiveItem(_currentTrack, _elements.playListRows);

        _elements.trackInfoBox.style.visibility = "visible";

        _playBack();
    };

    /**
     * Sets the activly playing item within the playlist.
     *
     * @param currentTrack The current track number being played.
     * @param playListRows The playlist object.
     **/
    let _setActiveItem = function(currentTrack, playListRows) {
        for (let i = 0; i < playListRows.length; i++) {
            playListRows[i].children[2].className = "track-title";
        }

        playListRows[currentTrack - 1].children[2].className = "track-title active-track";
    };

    /**
     * Sets the text for the currently playing song.
     *
     * @param currentTrack The current track number being played.
     * @param playListRows The playlist object.
     **/
    let _setTrackTitle = function(currentTrack, playListRows) {
        let trackTitleBox = document.querySelector(".player .info-box .track-info-box." + audioId + " .track-title-text");
        let trackTitle = playListRows[currentTrack - 1].children[2].outerText;

        trackTitleBox.innerHTML = null;

        trackTitleBox.innerHTML = trackTitle;
    };

    /**
     * Plays the next track when a track has ended playing.
     *
     **/
    let _trackHasEnded = function() {
        parseInt(_currentTrack);
        _currentTrack = (_currentTrack === _elements.playListRows.length) ? 1 : _currentTrack + 1;
        _trackLoaded = false;

        _resetPlayStatus();

        _setTrack();
    };

    /**
     * Updates the time for the song being played.
     *
     **/
    let _trackTimeChanged = function() {
        let currentTimeBox = document.querySelector(".player .info-box .track-info-box." + audioId + " .audio-time .current-time");
        let currentTime = _elements.audio.currentTime;
        let duration = _elements.audio.duration;
        let durationBox = document.querySelector(".player .info-box .track-info-box." + audioId + " .audio-time .duration");
        let trackCurrentTime = _trackTime(currentTime);
        let trackDuration = _trackTime(duration);

        currentTimeBox.innerHTML = null;
        currentTimeBox.innerHTML = trackCurrentTime;

        durationBox.innerHTML = null;
        durationBox.innerHTML = trackDuration;

        _updateProgressIndicator(_elements.audio);
        if (_elements.audio.readyState === 4) {
            _bufferProgress(_elements.audio);
        }
    };

    /**
     * A utility function for converting a time in miliseconds to a readable time of minutes and seconds.
     *
     * @param seconds The time in seconds.
     *
     * @return time The time in minutes and/or seconds.
     **/
    let _trackTime = function(seconds) {
        let min = 0;
        let sec = Math.floor(seconds);
        let time = 0;

        min = Math.floor(sec / 60);

        min = min >= 10 ? min : '0' + min;

        sec = Math.floor(sec % 60);

        sec = sec >= 10 ? sec : '0' + sec;

        time = min + ':' + sec;

        return time;
    };

    /**
     * Updates both the large and small toggle buttons accordingly.
     *
     * @param audioPlaying A booean value indicating if audio is playing or paused.
     **/
    let _updatePlayStatus = function(audioPlaying) {
        if (audioPlaying) {
            _elements.playerButtons.largeToggleBtn.children[0].className = "large-pause-btn " + audioId;

            _elements.playerButtons.smallToggleBtn[_currentTrack - 1].children[0].className = "small-pause-btn " + audioId;
        } else {
            _elements.playerButtons.largeToggleBtn.children[0].className = "large-play-btn " + audioId;

            _elements.playerButtons.smallToggleBtn[_currentTrack - 1].children[0].className = "small-play-btn " + audioId;
        }

        //Update next and previous buttons accordingly
        if (_currentTrack === 1) {
            _elements.playerButtons.previousTrackBtn.disabled = true;
            _elements.playerButtons.previousTrackBtn.className = "previous-track-btn " + audioId + " disabled";
        } else if (_currentTrack > 1 && _currentTrack !== _elements.playListRows.length) {
            _elements.playerButtons.previousTrackBtn.disabled = false;
            _elements.playerButtons.previousTrackBtn.className = "previous-track-btn " + audioId;
            _elements.playerButtons.nextTrackBtn.disabled = false;
            _elements.playerButtons.nextTrackBtn.className = "next-track-btn " + audioId;
        } else if (_currentTrack === _elements.playListRows.length) {
            _elements.playerButtons.nextTrackBtn.disabled = true;
            _elements.playerButtons.nextTrackBtn.className = "next-track-btn " + audioId + " disabled";
        }
    };

    /**
     * Updates the location of the progress indicator according to how much time left in audio.
     *
     **/
    let _updateProgressIndicator = function() {
        let currentTime = parseFloat(_elements.audio.currentTime);
        let duration = parseFloat(_elements.audio.duration);
        let indicatorLocation = 0;
        let progressBarWidth = parseFloat(_elements.progressBar.offsetWidth);
        let progressIndicatorWidth = parseFloat(_progressBarIndicator.offsetWidth);
        let progressBarIndicatorWidth = progressBarWidth - progressIndicatorWidth;

        indicatorLocation = progressBarIndicatorWidth * (currentTime / duration);

        _progressBarIndicator.style.left = indicatorLocation + "px";
    };

    /**
     * Resets all toggle buttons to be play buttons.
     *
     **/
    let _resetPlayStatus = function() {
        let smallToggleBtn = _elements.playerButtons.smallToggleBtn;

        _elements.playerButtons.largeToggleBtn.children[0].className = "large-play-btn " + audioId;

        for (let i = 0; i < smallToggleBtn.length; i++) {
            if (smallToggleBtn[i].children[0].className === "small-pause-btn " + audioId) {
                smallToggleBtn[i].children[0].className = "small-play-btn " + audioId;
            }
        }
    };

    return {
        initPlayer: initPlayer
    };
};

(function(window) {
    window.onload = init;

    function init() {
        let benPlayer = new audioPlayer("reuben-audio");
        let samPlayer = new audioPlayer("sam-audio");

        benPlayer.initPlayer();
        samPlayer.initPlayer();
    }
})(window);
