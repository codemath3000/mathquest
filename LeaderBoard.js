async function createLeaderBoard() {
    let token = localStorage.getItem('token');
    let username = localStorage.getItem('username');
    const leaderboardTable = document.createElement('table');
    leaderboardTable.id = 'leaderboard-table';

    const headers = ['Position', 'Player Name', 'Gold Total'];
    const headerRow = document.createElement('tr');
    headers.forEach(headerText => {
        const header = document.createElement('th');
        header.textContent = headerText;
        headerRow.appendChild(header);
    });
    leaderboardTable.appendChild(headerRow);

    const leaderboardData = await GetLeaderboard();

    let index = 1;
    leaderboardData.forEach((playerData) => {
        const [goldTotal, playerUsername] = playerData.split(' ');
        const position = index;
        index++;

        const row = document.createElement('tr');

        const positionCell = document.createElement('td');
        positionCell.textContent = position;
        row.appendChild(positionCell);

        const usernameCell = document.createElement('td');
        usernameCell.textContent = playerUsername;
        row.appendChild(usernameCell);

        const goldTotalCell = document.createElement('td');
        goldTotalCell.textContent = goldTotal;
        row.appendChild(goldTotalCell);

        if (playerUsername == username) {
            row.classList.add('current-user');
        }

        leaderboardTable.appendChild(row);
    });

    const titleContainer = document.createElement('div');
    titleContainer.id = 'leaderboard-title-container';

    const leftTrophy = document.createElement('img');
    leftTrophy.src = 'Trophy Logo.png';
    leftTrophy.alt = 'Trophy Logo';
    leftTrophy.id = 'trophy-left';
    titleContainer.appendChild(leftTrophy);

    const title = document.createElement('h1');
    title.textContent = 'LeaderBoard' ;
    title.id = 'leaderboard-title';
    titleContainer.appendChild(title);

    const rightTrophy = document.createElement('img');
    rightTrophy.src = 'Trophy Logo.png';
    rightTrophy.alt = 'Trophy Logo';
    rightTrophy.id = 'trophy-right';
    titleContainer.appendChild(rightTrophy);

    const date = document.createElement('h3');
    date.textContent = '(As of ' + new Date().toLocaleString()  + ')';
    title.insertAdjacentElement('afterend', date);

    const div = document.getElementById('leaderBoard');
    div.appendChild(titleContainer);
    div.appendChild(leaderboardTable);

    const resumeGame = document.createElement('div');
    resumeGame.id = 'resume-game';
    resumeGame.textContent = 'Resume Game';
    resumeGame.addEventListener('click', () => {
        localStorage.setItem('token', token);
        localStorage.setItem('username', username);
        window.location.href = 'Game_Interface.html';
    });

    const currentUserCells = document.querySelectorAll('.current-user td');
    currentUserCells.forEach(cell => {
        cell.style.fontWeight = 'bold';
        cell.style.color = 'yellow';
    });

    div.appendChild(resumeGame);
}

async function GetLeaderboard() {
    try {
        const message = 'GetLeaderboard';
        const data = await askSocketForMessage(message);
        const lines = data.trim().split('\r\n');
        if (lines[0] == 'Leaderboard') {
            return lines.slice(1);
        } else {
            throw new Error('Unexpected response from server.');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while fetching the Math Problem.');
    }
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

window.addEventListener('load', () => {
    createLeaderBoard();
});