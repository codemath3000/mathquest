import express from "express";
import bodyParser from "body-parser";
import WebSocket from "ws";
import cors from 'cors';
const app = express();
const port = 3000;
app.use(cors());
app.use(bodyParser.json());

//translate problem (sent by websocket) into correct answer and send websocket the correct answer
app.get("/correct-answers", async (req, res) => {
    try {
        //wait for this
        let problem = await askSocketForMessage("GetCurrentProblem\r\n[SERVER KEY HERE]");
        let response = (await (await fetch("http://api.wolframalpha.com/v1/result?input=" + encodeURIComponent(problem.split("\r\n")[1]) + "&appid=[WOLFRAM ALPHA API KEY HERE]&format=minput")).text()).replace("\r", "\n").replace("\n\n", "\n").replace("\n", ", ");
        // send the web socket the response
        await askSocketForMessage("SetCorrectAnswer\r\n[SERVER KEY HERE]\r\n" + response);
        res.status(200).send("Request Successful");
    } catch (e) {
        if (e.response) {
            res.status(400).send("Wolfram|Alpha API error: " + error.response.data);
        } else if (e.request) {
            res.status(500).send("No response received from Wolfram|Alpha API");
        } else {
            res.status(500).send("invalid input");
        }
        return;
    }

    //assuming that response resolves to a string
});

app.get("/current-problem", async (req, res) => {

    let problem = await askSocketForMessage("GetHumanProblem");
    //validate whether problem was received by websocket?


    res.status(200).send(problem.split("\r\n")[1]);

})

//post answer received from user (client-side) to the websocket serrver
app.post("/user-answers", async (req, res) => {
    const answer = req.body.answer;
    const user_id = req.body.user_id;
    await askSocketForMessage("AddUserAnswer\r\n" + user_id + "\r\n" + answer);
    //should I listen for any errors from websocket and send a 400/500?
    res.status(200).send(`received submitted answer: ${answer} from user: ${user_id}`);
});

app.put("/user-answers", async (req, res) => {
    const answer = req.body.answer;
    const user_id = req.body.user_id;
    await askSocketForMessage("SetUserAnswer\r\n" + user_id + "\r\n" + answer);
    //should I listen for any errors from websocket and send a 400/500?
    res.status(200).send(`received updated answer: ${answer} from user: ${user_id}`);
});

//get previous correct answer
app.get("/user-answers", async (req, res) => {

    const prevCorrect = await askSocketForMessage("GetPastCorrectAnswer");

    //potential errors here?

    res.status(200).send(prevCorrect);
});



app.delete("/user-answers", async (req, res) => {
    const answer = req.body.answer;
    const user_id = req.body.user_id;
    await askSocketForMessage("DeleteUserAnswer\r\n" + user_id);
    //check for token invalid and return 400 if invalid?
    res.status(200).send('sucessfully deleted')
});

async function askSocketForMessage(message) {
    let ws = new WebSocket("ws://5.161.198.239:8080/");
    //make sure we wait for this to open!!!!!
    await new Promise((acc, rej) => {
            ws.onopen = (event) => {
                acc();
            };
        }
    );
    try {
        let outputVal = await askSocketForMessageHelper(message, ws);
        return outputVal;
    } finally {
        // even if an error occurs and promise is rejected
        ws.close();
    }
}


//potential bug with event listeners
//close event listeners? If so, define a function for cleaning up event listeners?
function askSocketForMessageHelper(message,ws) {
    ws.send(message);
    //outputs data wrapped in a promise
    return new Promise((resolve, reject) => {
        ws.addEventListener("message", (event) => {
            try {
                const data = event.data + "";
                if (!data) {
                    throw new Error("error retrieving data");
                }

                resolve(data);
            } catch (error) {
                reject(error);
            }
        });

        ws.addEventListener("error", (error) => {
            reject(new Error("error with websocket"));
        });

        ws.addEventListener("close", () => {
            reject(new Error("websocket connection is closed"));
        });
    });
}

app.listen(port, () => {
    console.log("Running...");
});
