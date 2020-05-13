socket.on('pick_word', (message) => {
    if (!message.words) return;
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
        socket.emit('word_picked', { word });
        modal_pick.close();
    }
})

socket.on('reveal_word', (message) => {
    if (!message.word) return;
    let reveal = document.querySelector('.reveal.word');
    reveal.textContent = message.word;
    modal_reveal.open();
    setTimeout(() => {
        modal_reveal.close();
    }, 3000);
})

socket.on('hint_word', (message) => {
    if (!message.word) return;
    let hint = document.querySelector('.hint');
    hint.textContent = '';
    for (let ch of message.word) {
        console.log(ch);
        createCustomElement('li', hint, { class: ["letter"], content: ch });
    }
});

socket.on('word_found', (message) => {
    if (!message.username) return;
    createChatMessage({ console: true, content: `<b class="orange-text text-darken-3"><i class='skicon-lightbulb'></i> ${message.username} a trouvé.</b>` });
});