function handleLogin() {
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    if (username.length !== 0 && password.length !== 0) {
        const message = `Login\r\n${username}\r\n${password}`;
        askSocketForMessage(message)
            .then(response => {
                const lines = response.split('\n');
                if (lines[0].trim() == 'LoginAccept') {
                    const token = lines[1].trim();
                    alert('Login successful.');
                    localStorage.setItem('username', username);
                    window.location.href = 'Game_Interface.html?token=' + token;
                } else if (lines[0].trim() == 'LoginDeny') {
                    alert('Login failed. Please check your username and password.');
                } else {
                    alert('Unexpected response from server.');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('An error occurred while processing your request.');
            });
    } else {
        alert('Please fill all fields correctly.');
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

function askSocketForMessageHelper(message, ws) {
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
    const loginSubmitButton = document.getElementById('login-submit-button');
    loginSubmitButton.addEventListener('click', handleLogin);
});