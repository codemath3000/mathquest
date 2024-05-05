let flagForSubmitting = true;
let flagInsertCorrectAnswer = false;
let savedAnswer = '';
const baseURL = 'http://5.161.198.239:3000';
const cheeringSound = new Audio('./Congratulations Sound Effect.mp3');
const failedSound = new Audio('./Fail Sound Effect.mp3');

async function createGameContent() {
    let token = localStorage.getItem('token');
    let username = localStorage.getItem('username');
    if (!token) {
        const params = new URLSearchParams(window.location.search);
        token = params.get('token');
        if (token) {
            localStorage.setItem('token', token);
        } else {
            window.location.href = 'Login.html';
            return;
        }
    }

    const logoutButton = document.createElement('button');
    logoutButton.textContent = 'Log out';
    logoutButton.id = 'logoutButton';
    logoutButton.addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.href = 'Login.html';
    });
    document.body.appendChild(logoutButton);

    const timerLabel = document.createElement('div');
    timerLabel.id = 'base-timer';
    logoutButton.insertAdjacentElement('afterend', timerLabel);

    const leaderBoardLabel = document.createElement('div');
    leaderBoardLabel.id = 'leader-board';
    leaderBoardLabel.textContent = 'LeaderBoard';
    leaderBoardLabel.addEventListener('click', () => {
        localStorage.setItem('token', token);
        localStorage.setItem('username', username);
        window.location.href = 'LeaderBoard.html';
    });

    timerLabel.insertAdjacentElement('afterend', leaderBoardLabel);

    const gameContainer = document.getElementById('game-container');
    const upperSection = document.createElement('div');
    upperSection.id = 'upper-section';
    gameContainer.appendChild(upperSection);

    const middleSection = document.createElement('div');
    middleSection.id = 'middle-section';
    gameContainer.appendChild(middleSection);

    const lowerSection = document.createElement('div');
    lowerSection.id = 'lower-section';
    gameContainer.appendChild(lowerSection);

    const title = document.createElement('h1');
    title.textContent = 'Math Quest: Gold Rush';
    upperSection.appendChild(title);

    const userNameDisplay = document.createElement('h2');
    userNameDisplay.textContent = `Hello ${username.charAt(0).toUpperCase() + username.slice(1)}!`;
    userNameDisplay.id = 'userNameDisplay';
    upperSection.appendChild(userNameDisplay);

    const xpContainer = document.createElement('div');
    xpContainer.id = 'xp-container';
    upperSection.appendChild(xpContainer);

    const xpLogo = document.createElement('img');
    xpLogo.src = 'XP Logo.png';
    xpLogo.alt = 'XP Logo';
    xpLogo.style.width = '30px';
    xpContainer.appendChild(xpLogo);

    const xpText = document.createElement('span');
    xpText.id = 'xp-text';
    xpText.textContent = ' ' + await getPlayerXP(token);
    xpContainer.appendChild(xpText);

    const goldContainer = document.createElement('div');
    goldContainer.id = 'gold-container';
    upperSection.appendChild(goldContainer);

    const goldLogo = document.createElement('img');
    goldLogo.src = 'Gold Logo.png';
    goldLogo.alt = 'Gold Logo';
    goldLogo.style.width = '30px';
    goldContainer.appendChild(goldLogo);

    const goldText = document.createElement('span');
    goldText.id = 'gold-text'
    goldText.textContent = ' ' + await getPlayerGold(token);
    goldContainer.appendChild(goldText);

    const goldButton = document.createElement('button');
    goldButton.id = 'gold-button';
    goldButton.textContent = 'Add Gold';
    goldButton.addEventListener('click', () => {
        clickGoldButton(token);
    });

    upperSection.appendChild(goldButton);

    const formulaContainer = document.createElement('div');
    formulaContainer.id = 'formula-container';
    formulaContainer.textContent = await getHumanProblem();
    middleSection.appendChild(formulaContainer);

    const answerInput = document.createElement('input');
    answerInput.type = 'text';
    answerInput.id = 'answer-input';
    answerInput.placeholder = 'Enter your answer';
    middleSection.appendChild(answerInput);

    const submitButton = document.createElement('button');
    submitButton.id = 'submit-button';
    submitButton.textContent = 'Submit Answer';
    submitButton.addEventListener('click', () => {
        if (answerInput.value != '' && flagForSubmitting === true) {
            submitUserAnswer(baseURL, answerInput.value, token);
            flagForSubmitting = false;
            savedAnswer = answerInput.value;
            submitButton.textContent = 'Update Answer';
        }
        else if (answerInput.value != '' && flagForSubmitting === false) {
            updateUserAnswer(baseURL, answerInput.value, token);
            savedAnswer = answerInput.value;
        }
    });
    middleSection.appendChild(submitButton);

    const clearButton = document.createElement('button');
    clearButton.id = 'clear-button';
    clearButton.textContent = 'Clear Answer';
    clearButton.addEventListener('click', () => {
        answerInput.value = '';
        if (flagForSubmitting === false) {
            deleteUserAnswer(baseURL, savedAnswer, token);
            flagForSubmitting = true;
            submitButton.textContent = 'Submit Answer';
            savedAnswer = '';
        }
    });
    middleSection.appendChild(clearButton);

    createItemShop();
}

async function updateTimer() {
    const timerLabel = document.getElementById('base-timer');
    const timeLeft = await getTimer();
    timerLabel.textContent = `00:${timeLeft < 10 ? '0' : ''}${timeLeft}`;
}

function createItemShop() {
    const lowerSection = document.getElementById('lower-section');
    lowerSection.innerHTML = '';
    const logoContainer = document.createElement('div');
    logoContainer.id = 'logo-container';
    lowerSection.appendChild(logoContainer);

    const powerShopLogo = document.createElement('img');
    powerShopLogo.src = 'PowerShop Logo.png';
    powerShopLogo.alt = 'PowerShop Logo';
    logoContainer.appendChild(powerShopLogo);

    const powerupContainer = document.createElement('div');
    powerupContainer.id = 'powerup-container';
    lowerSection.appendChild(powerupContainer);

    let increasePassiveIncomeButton = document.createElement('button');
    increasePassiveIncomeButton.id = 'increase-passive-income-button';
    increasePassiveIncomeButton.textContent = 'Passive Gold Booster';
    powerupContainer.appendChild(increasePassiveIncomeButton);

    let multiplyGoldButton = document.createElement('button');
    multiplyGoldButton.id = 'multiply-gold-button';
    multiplyGoldButton.textContent = 'Add Gold Booster';
    powerupContainer.appendChild(multiplyGoldButton);

    const stealGoldContainer = document.createElement('div');
    stealGoldContainer.id = 'steal-gold-container';
    powerupContainer.appendChild(stealGoldContainer);

    let stealGoldButton = document.createElement('button');
    stealGoldButton.id = 'steal-gold-button';
    stealGoldButton.textContent = 'Steal Gold from Opponent';
    stealGoldContainer.appendChild(stealGoldButton);

    increasePassiveIncomeButton = document.getElementById('increase-passive-income-button');
    increasePassiveIncomeButton.addEventListener('click', increasePassiveIncome);
    multiplyGoldButton = document.getElementById('multiply-gold-button');
    multiplyGoldButton.addEventListener('click', multiplyGold);
    stealGoldButton = document.getElementById('steal-gold-button');
    stealGoldButton.addEventListener('click', stealGold);
}

async function increasePassiveIncome() {
    const powerupContainer = document.getElementById('lower-section');
    powerupContainer.innerHTML = '';

    const title = document.createElement('h2');
    title.textContent = 'Passive Gold Booster';

    const newView = document.createElement('div');
    newView.id = 'new-view';
    newView.appendChild(title);

    powerupContainer.appendChild(newView);

    let powerUps = await GetPowerUps();
    powerUps = powerUps.map(powerUpString => powerUpString.split(' '));
    const passiveIncomePowerUps = powerUps.filter(powerUpInformation => parseFloat(powerUpInformation[1]) !== 0);
    let selectedItem = null;

    passiveIncomePowerUps.forEach(powerUp => {
        const powerUpButton = document.createElement('button');
        powerUpButton.textContent = `${powerUp[5]} ${powerUp[7]} (XP Cost: ${powerUp[4]})`;
        powerUpButton.classList.add('itemShopButtons');
        powerUpButton.dataset.selected = 'false';
        powerUpButton.dataset.id = powerUp[0];
        powerUpButton.addEventListener('click', () => {
            if (selectedItem !== powerUpButton) {
                if (selectedItem) {
                    selectedItem.classList.remove('selected');
                    selectedItem.dataset.selected = 'false';
                    selectedItem.dataset.id = powerUpButton.dataset.id;
                }
                powerUpButton.classList.add('selected');
                powerUpButton.dataset.selected = 'true';
                selectedItem = powerUpButton;
            }
        });
        powerupContainer.appendChild(powerUpButton);
    });

    const purchaseButton = document.createElement('button');
    purchaseButton.textContent = 'Purchase';
    purchaseButton.addEventListener('click', () => {
        if (selectedItem) {
            runPowerUp(localStorage.getItem('token'), selectedItem.dataset.id);
            selectedItem.classList.remove('selected');
            selectedItem.dataset.selected = 'false';
            selectedItem = null;
        }
    });
    powerupContainer.appendChild(purchaseButton);

    const backButton = document.createElement('button');
    backButton.textContent = 'Go Back';
    backButton.addEventListener('click', () => {
        createItemShop();
    });
    powerupContainer.appendChild(backButton);
}

async function multiplyGold() {
    const powerupContainer = document.getElementById('lower-section');
    powerupContainer.innerHTML = '';

    const title = document.createElement('h2');
    title.textContent = 'Add Gold Booster';

    const newView = document.createElement('div');
    newView.id = 'new-view';
    newView.appendChild(title);

    powerupContainer.appendChild(newView);

    let powerUps = await GetPowerUps();
    powerUps = powerUps.map(powerUpString => powerUpString.split(' '));
    const multiplierPowerUps = powerUps.filter(powerUpInformation => parseFloat(powerUpInformation[2]) !== 0);
    let selectedItem = null;

    multiplierPowerUps.forEach(powerUp => {
        const powerUpButton = document.createElement('button');
        powerUpButton.textContent = `${powerUp[5]} ${powerUp[7]} (XP Cost: ${powerUp[4]})`;
        powerUpButton.classList.add('itemShopButtons');
        powerUpButton.dataset.selected = 'false';
        powerUpButton.dataset.id = powerUp[0];
        powerUpButton.addEventListener('click', () => {
            if (selectedItem !== powerUpButton) {
                if (selectedItem) {
                    selectedItem.classList.remove('selected');
                    selectedItem.dataset.selected = 'false';
                    selectedItem.dataset.id = powerUpButton.dataset.id;
                }
                powerUpButton.classList.add('selected');
                powerUpButton.dataset.selected = 'true';
                selectedItem = powerUpButton;
            }
        });
        powerupContainer.appendChild(powerUpButton);
    });

    const purchaseButton = document.createElement('button');
    purchaseButton.textContent = 'Purchase';
    purchaseButton.addEventListener('click', () => {
        if (selectedItem) {
            runPowerUp(localStorage.getItem('token'), selectedItem.dataset.id);
            selectedItem.classList.remove('selected');
            selectedItem.dataset.selected = 'false';
            selectedItem = null;
        }
    });
    powerupContainer.appendChild(purchaseButton);

    const backButton = document.createElement('button');
    backButton.textContent = 'Go Back';
    backButton.addEventListener('click', () => {
        createItemShop();
    });
    powerupContainer.appendChild(backButton);
}

async function stealGold() {
    const powerupContainer = document.getElementById('lower-section');
    powerupContainer.innerHTML = '';

    const title = document.createElement('h2');
    title.textContent = 'Steal Gold from Opponent';

    const newView = document.createElement('div');
    newView.id = 'new-view';
    newView.appendChild(title);

    powerupContainer.appendChild(newView);

    const stealGoldInput = document.createElement('input');
    stealGoldInput.type = 'text';
    stealGoldInput.id = 'steal-gold-input';
    stealGoldInput.placeholder = 'Enter Player Name';
    newView.appendChild(stealGoldInput);

    let powerUps = await GetPowerUps();
    powerUps = powerUps.map(powerUpString => powerUpString.split(' '));
    const stealGoldPowerUps = powerUps.filter(powerUpInformation => parseFloat(powerUpInformation[3]) !== 0);
    let selectedItem = null;

    stealGoldPowerUps.forEach(powerUp => {
        const powerUpButton = document.createElement('button');
        powerUpButton.textContent = `${powerUp[5]} ${powerUp[7]} (XP Cost: ${powerUp[4]})`;
        powerUpButton.classList.add('itemShopButtons');
        powerUpButton.dataset.selected = 'false';
        powerUpButton.dataset.id = powerUp[0];
        powerUpButton.addEventListener('click', () => {
            if (selectedItem !== powerUpButton) {
                if (selectedItem) {
                    selectedItem.classList.remove('selected');
                    selectedItem.dataset.selected = 'false';
                    selectedItem.dataset.id = powerUpButton.dataset.id;
                }
                powerUpButton.classList.add('selected');
                powerUpButton.dataset.selected = 'true';
                selectedItem = powerUpButton;
            }
        });
        powerupContainer.appendChild(powerUpButton);
    });

    const purchaseButton = document.createElement('button');
    purchaseButton.textContent = 'Purchase';
    purchaseButton.addEventListener('click', () => {
        if (selectedItem) {
            runPowerUp(localStorage.getItem('token'), selectedItem.dataset.id, stealGoldInput.value);
            selectedItem.classList.remove('selected');
            selectedItem.dataset.selected = 'false';
            selectedItem = null;
        }
    });
    powerupContainer.appendChild(purchaseButton);

    const backButton = document.createElement('button');
    backButton.textContent = 'Go Back';
    backButton.addEventListener('click', () => {
        createItemShop();
    });
    powerupContainer.appendChild(backButton);
}

async function askSocketForMessage(message) {
    let ws = new WebSocket('ws://5.161.198.239:8080/');
    await new Promise((res, rej) => {
            ws.onopen = (event) =>
            {
                res();
            };
        }
    );
    let outputVal = await askSocketForMessageHelper(message, ws);
    ws.close();
    return outputVal;
}

function askSocketForMessageHelper(message,ws) {
    ws.send(message);
    return new Promise((resolve, reject) => {
        ws.addEventListener('message', (event) => {
            try {
                const data = event.data;
                if (!data) {
                    throw new Error('error retrieving data');
                }

                resolve(data);
            } catch (error) {
                reject(error);
            }
        });

        ws.addEventListener('error', (error) => {
            reject(new Error('error with websocket'));
        });

        ws.addEventListener('close', () => {
            reject(new Error('websocket connection is closed'));
        });
    });
}

async function getPlayerXP(token) {
    try {
        const message = `GetPlayerXP\r\n${token}`;
        const data = await askSocketForMessage(message);
        const lines = data.trim().split('\r\n');
        if (lines[0].trim() == 'PlayerXP') {
            const xpAmount = lines[1].trim();
            return xpAmount;
        } else if (lines[0].trim() == 'TokenInvalid') {
            alert('Token is invalid. Please log back in.');
            localStorage.removeItem('token');
            window.location.href = 'Login.html';
        } else {
            throw new Error('Unexpected response from server.');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while fetching XP.');
    }
}

async function getPlayerGold(token) {
    try {
        const message = 'GetPlayerGold\r\n' + token;
        const data = await askSocketForMessage(message);
        const lines = data.trim().split('\r\n');
        if (lines[0] == 'PlayerGold') {
            const goldAmount = lines[1];
            return goldAmount;
        } else if (lines[0] == 'TokenInvalid') {
            alert('Token is invalid. Please log back in.');
            localStorage.removeItem('token');
            window.location.href = 'Login.html';
        } else {
            throw new Error('Unexpected response from server.');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while fetching Gold.');
    }
}

async function clickGoldButton(token) {
    try {
        const message = 'ClickGoldButton\r\n' + token;
        const data = await askSocketForMessage(message);
        const lines = data.trim().split('\r\n');
        if (lines[0] == 'ClickComplete') {
            const goldText = document.getElementById('gold-text');
            goldText.textContent = ' ' + await getPlayerGold(token);
        } else if (lines[0] == 'TokenInvalid') {
            alert('Token is invalid. Please log back in.');
            localStorage.removeItem('token');
            window.location.href = 'Login.html';
        } else {
            throw new Error('Unexpected response from server.');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while fetching Gold.');
    }
}

async function getHumanProblem() {
    try {
        const message = 'GetHumanProblem';
        const data = await askSocketForMessage(message);
        const lines = data.trim().split('\r\n');
        if (lines[0] == 'HumanProblem') {
            const currentProblem = lines[1];
            return currentProblem;
        } else {
            throw new Error('Unexpected response from server.');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while fetching the Math Problem.');
    }
}

async function submitUserAnswer(baseURL, answer, userId) {
    try {
        const response = await fetch(baseURL + '/user-answers', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json'
            },
            body: JSON.stringify({
                answer: answer,
                user_id: userId
            })
        });
        if (!response.ok) {
            throw new Error('Failed to submit user answer');
        }
        const data = await response.text();
        console.log('Response:', data);
    } catch (error) {
        console.error('Error:', error);
    }
}

async function updateUserAnswer(baseURL, answer, userId) {
    try {
        const response = await fetch(baseURL + '/user-answers', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json'
            },
            body: JSON.stringify({
                answer: answer,
                user_id: userId
            })
        });
        if (!response.ok) {
            throw new Error('Failed to update user answer');
        }
        const data = await response.text();
        console.log('Response:', data);
    } catch (error) {
        console.error('Error:', error);
    }
}

async function deleteUserAnswer(baseURL, answer, userId) {
    try {
        const response = await fetch(baseURL + '/user-answers', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json'
            },
            body: JSON.stringify({
                answer: answer,
                user_id: userId
            })
        });
        if (!response.ok) {
            throw new Error('Failed to delete user answer');
        }
        const data = await response.text();
        console.log('Response:', data);
    } catch (error) {
        console.error('Error:', error);
    }
}

async function getPastCorrectAnswer(baseURL) {
    try {
        const response = await fetch(baseURL + '/user-answers', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json'
            }
        });
        if (!response.ok) {
            throw new Error('Failed to retrieve past correct answer');
        }
        const data = await response.text();
        return 'Past Correct Answer: ' + data.split('\r\n').slice(1, -1);
    } catch (error) {
        console.error('Error:', error);
    }
}

async function GetPowerUps() {
    try {
        const message = 'GetPowerUps';
        const data = await askSocketForMessage(message);
        const lines = data.trim().split('\r\n');
        if (lines[0] == 'PowerUpList') {
            return lines.slice(1);
        } else {
            throw new Error('Unexpected response from server.');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while attempting to retrieve the list of power-ups.');
    }
}

async function runPowerUp(token, powerupID, username) {
    try {
        let message = 'RunPowerUp\r\n' + token + '\r\n' + powerupID;
        if (username !== undefined) {
            message = message.concat('\r\n' + username);
        }
        const data = await askSocketForMessage(message);
        const lines = data.trim().split('\r\n');
        if (lines[0] == 'PowerUpComplete') {
            const xpText = document.getElementById('xp-text');
            xpText.textContent = ' ' + await getPlayerXP(token);
        } else if (lines[0] == 'NotEnoughXP') {
            alert('Not enough XP to purchase the power-up :(');
        } else if (lines[0] == 'IDInvalid' || lines[0] == 'InputMismatch') {
            throw new Error('Input is invalid.');
        } else if (lines[0] == 'TokenInvalid') {
            alert('Token is invalid. Please log back in.');
            localStorage.removeItem('token');
            window.location.href = 'Login.html';
        } else {
            throw new Error('Unexpected response from server.');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while attempting to purchase the power-up.');
    }
}

async function getTimer() {
    try {
        const message = 'GetTimeLeft';
        const data = await askSocketForMessage(message);
        const lines = data.trim().split('\r\n');
        if (lines[0] == 'TimeResponse') {
            const time = lines[1];
            return time;
        } else {
            throw new Error('Unexpected response from server.');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while fetching the time.');
    }
}

async function repeat(token){
    const goldText = document.getElementById('gold-text');
    try {
        goldText.textContent = ' ' + await getPlayerGold(token);
    } catch {}

    const formulaContainer = document.getElementById('formula-container');

    await updateTimer();

    if (parseInt(await getTimer()) >= 44) {
        formulaContainer.textContent = await getHumanProblem();
        flagForSubmitting = true;
        savedAnswer = '';
        const xpText = document.getElementById('xp-text');
        const oldXP = xpText.textContent.slice(1);
        xpText.textContent = ' ' + await getPlayerXP(token);

        if (!flagInsertCorrectAnswer) {
            flagInsertCorrectAnswer = true;
            const correctAnswerDisplay = document.createElement('div');
            correctAnswerDisplay.id = 'past-correct-answer';
            setTimeout(() => {
                const clearButton = document.getElementById('clear-button');
                clearButton.insertAdjacentElement('afterend', correctAnswerDisplay);
            }, 1000);
        }

        setTimeout(async () => {
            const correctAnswerDisplay = document.getElementById('past-correct-answer');
            correctAnswerDisplay.textContent = await getPastCorrectAnswer(baseURL);
            const currentXP = parseInt(await getPlayerXP(token));
            if (parseInt(oldXP) < currentXP) {
                correctAnswerDisplay.style.backgroundColor = 'limegreen';
                cheeringSound.play();
            } else if (parseInt(oldXP) > currentXP) {
                correctAnswerDisplay.style.backgroundColor = 'red';
                failedSound.play();
            } else {
                correctAnswerDisplay.style.backgroundColor = '#ef5e84';
            }
        }, 1000);

        const submitButton = document.getElementById('submit-button');
        submitButton.textContent = 'Submit Answer';
        const answerInput = document.getElementById('answer-input');
        answerInput.value = '';
    }
}

window.addEventListener('load', () => {
    createGameContent();
    setInterval(() => repeat(localStorage.getItem('token')), 1000);
});