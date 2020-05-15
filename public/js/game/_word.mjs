socket.on('pick_word', (message) => {
    if (!message.words) return;
    playAudio(AUDIO.PICK_WORD);
    let words = document.querySelector('.words');
    words.textContent = '';
    for (let w of message.words) {
        let wli = createCustomElement('li', words, { class: ["card", "grey", "lighten-3", "word"], content: w })
        wli.addEventListener('click', (e) => {
            chooseWord(e.srcElement.innerText);
        });
    }
    let time;
    setTimeout(() => {
        modal_pick.open();
        time = setTimeout(() => {
            let rd = message.words[Math.floor(Math.random() * 3)];
            chooseWord(rd);
        }, 1000 * 10);
    }, 1500);

    function chooseWord(word) {
        clearTimeout(time);
        document.querySelector(".tool").onclick();
        socket.emit('word_picked', { word });
        drawzone.removeAttribute('disabled');
        modal_pick.close();
    }
})

let timer_interval;

socket.on('reveal_word', (message) => {
    if (!message.word) return;
    let reveal = document.querySelector('.reveal.word');
    reveal.textContent = message.word;
    modal_reveal.open();
    clearInterval(timer_interval);
    setTimeout(() => {
        modal_reveal.close();
    }, 3000);
    playAudio(AUDIO.WORD_REVEAL);
})

socket.on('hint_word', (message) => {
    if (!message.word) return;
    let hint = document.querySelector('.hint');
    hint.textContent = '';
    for (let ch of message.word) {
        createCustomElement('li', hint, { class: ["letter"], content: ch });
    }

    let timer = document.querySelector('header .timer');
    let duration = parseInt(message.expires);
    timer.innerText = duration--;
    timer_interval = setInterval(() => {
        if (timer.innerText == 0) {
            clearInterval(timer_interval);
            socket.emit('time_out');
        } else {
            timer.innerText = duration--;
        }
    }, 1000);
});

socket.on('word_found', (message) => {
    if (!message.username) return;
    playAudio(AUDIO.WORD_FOUND);
    createChatMessage({ console: true, content: `<b class="orange-text text-darken-3"><i class='skicon-lightbulb'></i> ${message.username} a trouvé. (+${message.score} pts)</b>` });
});