function handleSignUp() {
    const username = document.getElementById('signUp-username').value;
    const confirmUsername = document.getElementById('signUp-confirm-username').value;
    const password = document.getElementById('signUp-password').value;
    const confirmPassword = document.getElementById('signUp-confirm-password').value;

    if (username.length !== 0 && password.length !== 0 && username === confirmUsername && password === confirmPassword) {
        const message = `Register\r\n${username}\r\n${password}`;
        askSocketForMessage(message)
            .then(response => {
                if (response == 'RegisterAccept\r\n') {
                    alert('Registration successful. Please login with your new account.');
                    window.location.href = 'Login.html';
                } else if (response == 'RegisterDeny\r\n') {
                    alert('Registration failed. Either the provided information is incorrect or the username is already taken.');
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
    const signUpSubmitButton = document.getElementById('signUp-submit-button');
    signUpSubmitButton.addEventListener('click', handleSignUp);
});