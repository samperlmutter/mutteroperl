function toggleMedia(n, src, isPrompt) {
    let toggledOff = false;
    let isAudio = src.slice(-3) !== 'mp4';
    let loc = isPrompt ? n.parentElement.nextElementSibling : n.parentElement.previousElementSibling;
    let mediaClass = function (b) {
        return b ? 'prompt-media' : 'product-media';
    }
    if (loc.classList.contains(mediaClass(isPrompt))) {
        toggledOff = true;
        loc.classList.remove(mediaClass(isPrompt));
    }
    if (loc.classList.contains(mediaClass(!isPrompt))) {
        loc.classList.remove(mediaClass(!isPrompt));
    }
    if (loc.childElementCount > 0) {
        for (let child of loc.children) {
            child.remove();
        }
    }
    if (!toggledOff) {
        loc.classList.add(mediaClass(isPrompt));
        showMedia(loc, src, isAudio);
    }
}

function showMedia(n, src, isAudio) {
    let m;
    if (isAudio) {
        m = document.createElement('audio');
        m.src = src;
        m.controls = true;
    } else {
        m = document.createElement('video');
        m.src = src;
        m.controls = true;
        m.poster = '';
    }
    n.append(m);
}
