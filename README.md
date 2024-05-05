# Math Quest: Gold Rush

## Functionality:
This project is a math-oriented game where players accumulate XP by solving mathematical problems. XP serves as currency for acquiring power-ups, which assist in earning gold. The game's primary goal is to ascend the leaderboard by amassing gold. Players can earn gold manually by clicking an "Add Gold" button or leveraging different power-ups.

In the game, players can access three distinct types of power-ups, each serving different purposes. The first type grants a passive gold income per second, ensuring a steady flow of gold over time. The second type enables players to steal a percentage of another player's gold, introducing a competitive aspect to the gameplay. Lastly, the third type enhances the effectiveness of the "Add Gold" button by increasing the amount of gold earned per click, catering to players seeking immediate score boosts. Additionally, each power-up type offers three sub-variants, varying in XP cost and the extent of their effects. Typically, more expensive power-ups provide more significant benefits per XP spent, similar to a "volume discount."

Every **45 seconds,** the backend dynamically generates a new math problem and simultaneously presents it to all users. Utilizing the **WolframAlpha API,** the correct answer to each question is fetched and compared to user-provided answers to determine accuracy.

These problems are meticulously categorized into easy (worth 300 XP), medium (worth 500 XP), or hard difficulty levels (worth 700 XP), each assigned with corresponding point values.

This deliberate diversity in difficulty ensures continuous engagement and motivation for users. Correctly solved problems contribute to XP accumulation, while incorrect answers result in XP deductions. Easy problems are tailored to be accessible to most adults, while medium and hard difficulties progressively offer more complex challenges, spanning topics from algebra to calculus and linear algebra.

Users can create new accounts by selecting a desired username and password. They can also log in and log out as required. Accordingly, the chosen power-ups, gold balances, and XP levels persist across server restarts and client refreshes, ensuring continuous gameplay. The leaderboard prominently displays usernames alongside their corresponding gold values, meticulously sorted in descending order, providing a clear overview of the current standings within the game.

## Code Specifications:
The program consists of four key elements. The first is the WebSocket server, the second is the RESTful CRUD API server (written in NodeJS), the third is the client-side code, and the fourth is the SQL database. The WebSocket and NodeJS servers are the controller, the client-side code is the view, and the SQL database is the model. The WebSocket and NodeJS servers run on a Hetzner virtual machine instance, the client-side code is run using Azure App Services, and the SQL database is run on Azure (using Microsoft SQL Server).

The WebSocket server handles the core game logic and most client-server communication. It consists of two essential tasks at the most fundamental level: a loop to check for incoming WebSocket connections and a timer to run routine tasks every second. When an incoming WebSocket connection is detected, the server starts up an asynchronous task dedicated to that WebSocket connection. Until that WebSocket closes, it performs the following processes in a loop: receive a message from the client, process it, and return a response message over the WebSocket connection. Each message (from the client to the client) consists of a set of lines; the first line indicates the message type, and the remaining lines indicate any associated data. As discussed above, the other key element is the timer, which runs a task every second. This task increments the gold for players with a passive gold income and updates the mathematics problem every 45 seconds. The problem is generated directly on the WebSocket server using random values substituted into various problem templates. Then, it is sent to the NodeJS server, which is processed using the WolframAlpha API to obtain the correct answer. In addition to those two essential functions mentioned above, the WebSocket server handles all direct read or write operations in the SQL database. 

Please note that the professor explicitly allowed the WebSocket server to be written in any language, using any framework, as long as the other server component, the RESTful CRUD API server, adhered to the language and framework requirements outlined in the project guidelines. As a result, the WebSocket server was developed in C# because Benjamin is most proficient in this language.

The NodeJS RESTful CRUD API server has functionality in two different areas. The first is querying the WolframAlpha API to provide the WebSocket server with correct answers, which involves simply requesting the WolframAlpha API and then returning that as the response. Additionally, this server is proxying specific client requests to the WebSocket server. In other words, for a few select types of client-server communication, the client sends the information to the CRUD API server, the CRUD API server transforms that into a WebSocket message for the WebSocket server, and then the WebSocket response is transformed back into an HTTP response. This is done for project compliance reasons to meet the requirement of serving at least two resources with a RESTful CRUD API. Also, when the CRUD API sends WebSocket messages to the WebSocket server, it authenticates itself to the server using a unique key stored in hashed format on the WebSocket server.

The client-side code is an integral component of our math-based game, responsible for rendering the game interface and facilitating user interactions. Here's an overview of its key functionalities:
1. **Authentication and Registration:** The client-side code facilitates user authentication and registration processes. Before they can access the game, users are prompted to input their credentials (username and password) via interfaces.
2. **WebSocket Connection:** Upon submission of login credentials, the client-side code establishes a WebSocket connection with the server that is opened and closed throughout the program. This connection serves authentication purposes and facilitates real-time communication between the client and server, ensuring interaction between the client and server sides throughout gameplay.
3. **Error Handling:** In case of invalid credentials, the client-side code adopts a safety-first approach. It promptly presents an error message, giving users clear instructions to retry the login process or register for a new account. Similarly, the user is immediately logged out should a credential error occur during gameplay, such as with a server restart. This proactive measure enhances reliability and underscores a commitment to cybersecurity best practices.
4. **Game Interface:** Once authenticated, the client-side code renders the game interface, granting users access to many game features and functionalities. This encompasses displaying math problems, enabling users to submit their answers, and presenting real-time updates on game progress.
5. **Power-Up Purchases:** Users can leverage their accumulated XP to acquire power-ups, enriching their gameplay experience. The client-side code streamlines selecting and purchasing power-ups, empowering users to obtain benefits within the game.
6. **Leaderboard View:** The leaderboard functionality within the client-side code displays user rankings based on their accumulated gold values. It provides users with a visual representation of their standing within the game. Additionally, the leaderboard allows users to gauge their progress relative to others and strive for higher rankings by earning more gold.

The final component, the SQL database, consists of two tables. The first consists of player attributes and the second consists of power-up attributes. The player table contains the username, the hashed password, the current passive income per second, the current gold amount earned per "Add Gold" button click, the current total XP, the current total gold, and a numeric ID serving as the primary key. The power-up table contains the power-up ID (again serving as the primary key), the passive income gained through the power-up, the additional gold per button click gained through the power-up, the proportion of gold that can be stolen through the power-up, the XP cost of the power-up, and the name of the power-up.

## Paths
- The WebSocket server code is located in the COMP426WebSocket1 directory.
- The CRUD API server code is located in the app.js, package.json, and package-lock.json files, as well as the node_modules directory.
- Everything else corresponds to client-side code.
- The SQL database is not stored as a local file but is accessed via a remote Azure server (comp426.database.windows.net). Therefore, there is no database file (such as a .sqlite file) to include in the repository.

## For the sake of grading simplicity, we’ve detailed the functionality below according to each requirement:
- **Interactive and Event-Driven Front End (30 points):** Our front-end design is interactive and driven by user events!
- **RESTful CRUD API Back End (30 points):** The NodeJS server implements a RESTful CRUD API serving two resources: user-answers and correct-answers. The user-answers endpoint enables clients to perform create, read, update, and delete operations on user-answers and retrieve the correct answer to the previous problem. The correct-answers endpoint serves the WebSocket server with the correct answer obtained from the WolframAlpha API for the current math question. Since the server retrieves data from the API and passes it to the WebSocket server, only the read operation is relevant, barring create, update, and delete operations.
- **Utilization of Third-Party API (10 points):** Our server integrates the WolframAlpha API to fetch accurate answers to mathematical problems.
- **Implementation of Session-Persistent State (10 points):** We maintain a session-persistent state by storing user credentials, hashed passwords, gold, XP, and power-up information in an SQL database.
- **Emphasis on User Experience (10 points):** We've endeavored to create a user-friendly experience, emphasizing ease of use and a consistent theme.
- **Quality of Presentation Video (10 points):** The presentation is included in this README file and linked below. We are excited to hear feedback!

## Final Notes
You can access the live website by visiting the following URL: 
[Math Quest: Gold Rush](http://426.absarka.com/SignUp.html)

Please note that you'll be redirected to the HTTPS version. However, the HTTPS version is currently unavailable. To access the correct website, please double-click on the address bar and change "HTTPS" to "HTTP".

For the YouTube demonstration video, please follow this link: [Math Quest Demo](https://www.youtube.com/watch?v=RB89VPqFkRQ). Please note that, in some cases, the YouTube video defaults to displaying at a very low resolution. However, higher resolutions are available; in order to improve the resolution, please click the gear icon in the YouTube video menu and select "1080p" as the resolution. Thank you for taking the time to review this project! If you have any questions or concerns, please don't hesitate to contact us at
 - bh4@unc.edu
 - ssahebi@unc.edu
 - walidaa@unc.edu
