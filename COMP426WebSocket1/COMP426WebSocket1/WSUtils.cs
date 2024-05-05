using System.Net.WebSockets;
using System.Text;
using System.Security.Cryptography;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Threading;
using System.Linq;
using System.CodeDom;
using System.Deployment.Internal;
using System.Timers;
using System.Security.Policy;
using System.Web;
using System.Net.Http;

internal static class WSUtils
{
    private static Dictionary<string, string> tokenMap = new Dictionary<string, string>();
    private static int counter = 0;
    private static string wolframProblem = "";
    private static string humanProblem = "";
    private static string correctAnswer = "";
    private static string pastCorrectAnswer = "";
    private static string serverAuthenticationKeyHash = "[SERVER KEY SHA512 HASH HERE]";
    private static int questionValue = 0;
    private static Dictionary<string, string> userAnswers = new Dictionary<string, string>();
    internal static async Task RunWS(WebSocket webSocket)
    {
        byte[] inputBuffer = new byte[1 << 16];
        var inputResult = await webSocket.ReceiveAsync(
            new ArraySegment<byte>(inputBuffer), CancellationToken.None);

        while (!inputResult.CloseStatus.HasValue)
        {
            byte[] outputBuffer = Encoding.UTF8.GetBytes(await ProcessInput(Encoding.UTF8.GetString(inputBuffer)));
            await webSocket.SendAsync(
                new ArraySegment<byte>(outputBuffer, 0, outputBuffer.Length),
                inputResult.MessageType,
                inputResult.EndOfMessage,
                CancellationToken.None);

            for (int i = 0; i < inputBuffer.Length; i++) inputBuffer[i] = 0;

            inputResult = await webSocket.ReceiveAsync(
                new ArraySegment<byte>(inputBuffer), CancellationToken.None);

        }

        await webSocket.CloseAsync(
            inputResult.CloseStatus.Value,
            inputResult.CloseStatusDescription,
            CancellationToken.None);
    }

    internal static async Task<string> ProcessInput(string inputString)
    {
        string[] lines = inputString.Replace("\r\n", "\n").Replace("\r", "\n").Replace("\0", "").Split(new char[] { '\n' });
        if (lines.Length == 0)
        {
            return "Reject\r\n";
        }
        switch (lines[0])
        {
            case "Login":
                {
                    if (lines.Length != 3)
                    {
                        return "Reject\r\n";
                    }
                    string username = lines[1];
                    string password = lines[2];
                    SHA512 hasher = SHA512.Create();
                    string passwordHash = string.Concat(Array.ConvertAll(hasher.ComputeHash(Encoding.UTF8.GetBytes(password)), hashValue => hashValue.ToString("X2")));
                    if (await SQLUtils.AcceptsUser(username, passwordHash))
                    {
                        RandomNumberGenerator rng = RandomNumberGenerator.Create();
                        byte[] rngBytes = new byte[64];
                        rng.GetBytes(rngBytes);
                        string userToken = string.Concat(Array.ConvertAll(rngBytes, randomByte => randomByte.ToString("X2")));
                        tokenMap[userToken] = username;
                        return "LoginAccept\r\n" + userToken + "\r\n";
                    }
                    return "LoginDeny\r\n";
                }
            case "Register":
                {
                    if (lines.Length != 3)
                    {
                        return "Reject\r\n";
                    }
                    string username = lines[1];
                    string password = lines[2];
                    SHA512 hasher = SHA512.Create();
                    string passwordHash = string.Concat(Array.ConvertAll(hasher.ComputeHash(Encoding.UTF8.GetBytes(password)), hashValue => hashValue.ToString("X2")));
                    if (await SQLUtils.ContainsUser(username) || username.Length == 0)
                    {
                        return "RegisterDeny\r\n";
                    }
                    await SQLUtils.AddUser(username, passwordHash);
                    return "RegisterAccept\r\n";
                }
            case "GetPowerUps":
                {
                    if (lines.Length != 1)
                    {
                        return "Reject\r\n";
                    }
                    return (await SQLUtils.GetPowerUps()).Aggregate("PowerUpList\r\n", (string accumulator, Tuple<int, int, int, double, int, string> input) => { return accumulator + input.Item1 + " " + input.Item2 + " " + input.Item3 + " " + input.Item4 + " " + input.Item5 + " " + input.Item6 + "\r\n"; });
                }
            case "GetPlayerGold":
                {
                    if (lines.Length != 2)
                    {
                        return "Reject\r\n";
                    }
                    if (!tokenMap.ContainsKey(lines[1]))
                    {
                        return "TokenInvalid\r\n";
                    }
                    return "PlayerGold\r\n" + await SQLUtils.GetPlayerGold(tokenMap[lines[1]]);
                }
            case "GetPlayerXP":
                {
                    if (lines.Length != 2)
                    {
                        return "Reject\r\n";
                    }
                    if (!tokenMap.ContainsKey(lines[1]))
                    {
                        return "TokenInvalid\r\n";
                    }
                    return "PlayerXP\r\n" + await SQLUtils.GetPlayerXP(tokenMap[lines[1]]);
                }
            case "RunPowerUp":
                {
                    if (lines.Length < 3 || lines.Length > 4)
                    {
                        return "Reject\r\n";
                    }
                    int powerUpID = 0;
                    if (!int.TryParse(lines[2], out powerUpID))
                    {
                        return "Reject\r\n";
                    }
                    if (!tokenMap.ContainsKey(lines[1]))
                    {
                        return "TokenInvalid\r\n";
                    }
                    if(!await SQLUtils.HasPowerUp(powerUpID))
                    {
                        return "IDInvalid\r\n";
                    }
                    Tuple<int, int, int, double, int, string> powerUp = await SQLUtils.GetPowerUp(powerUpID);
                    if(powerUp.Item4 != 0 && lines.Length == 3 || powerUp.Item4 == 0 && lines.Length == 4)
                    {
                        return "InputMismatch\r\n";
                    }
                    if(powerUp.Item4 != 0 && !await SQLUtils.ContainsUser(lines[3]))
                    {
                        return "TargetInvalid\r\n";
                    }
                    if(await SQLUtils.GetPlayerXP(tokenMap[lines[1]]) < powerUp.Item5)
                    {
                        return "NotEnoughXP\r\n";
                    }
                    await SQLUtils.SetPlayerXP(tokenMap[lines[1]], await SQLUtils.GetPlayerXP(tokenMap[lines[1]]) - powerUp.Item5);
                    if(powerUp.Item2 != 0)
                    {
                        await SQLUtils.SetPlayerPassive(tokenMap[lines[1]], await SQLUtils.GetPlayerPassive(tokenMap[lines[1]]) + powerUp.Item2);
                    }
                    if (powerUp.Item3 != 0)
                    {
                        await SQLUtils.SetPlayerClick(tokenMap[lines[1]], await SQLUtils.GetPlayerClick(tokenMap[lines[1]]) + powerUp.Item3);
                    }
                    if (powerUp.Item4 != 0)
                    {
                        int stealAmount = (int)Math.Min(powerUp.Item4 * await SQLUtils.GetPlayerGold(lines[3]), await SQLUtils.GetPlayerGold(tokenMap[lines[1]]));
                        await SQLUtils.SetPlayerGold(tokenMap[lines[1]], await SQLUtils.GetPlayerGold(tokenMap[lines[1]]) + stealAmount);
                        await SQLUtils.SetPlayerGold(lines[3], await SQLUtils.GetPlayerGold(lines[3]) - stealAmount);
                    }
                    return "PowerUpComplete\r\n";
                }
            case "ClickGoldButton":
                {
                    if (lines.Length != 2)
                    {
                        return "Reject\r\n";
                    }
                    if (!tokenMap.ContainsKey(lines[1]))
                    {
                        return "TokenInvalid\r\n";
                    }
                    await SQLUtils.SetPlayerGold(tokenMap[lines[1]], await SQLUtils.GetPlayerGold(tokenMap[lines[1]]) + await SQLUtils.GetPlayerClick(tokenMap[lines[1]]));
                    return "ClickComplete\r\n";
                }
            case "GetPastCorrectAnswer":
                {
                    if (lines.Length != 1)
                    {
                        return "Reject\r\n";
                    }
                    return "PastCorrectAnswer\r\n" + pastCorrectAnswer + "\r\n";
                }
            case "AddUserAnswer":
            case "SetUserAnswer":
                {
                    if (lines.Length != 3)
                    {
                        return "Reject\r\n";
                    }
                    if (!tokenMap.ContainsKey(lines[1]))
                    {
                        return "TokenInvalid\r\n";
                    }
                    userAnswers[tokenMap[lines[1]]] = lines[2];
                    return "AnswerSet\r\n";
                }
            case "DeleteUserAnswer":
                {
                    if (lines.Length != 2)
                    {
                        return "Reject\r\n";
                    }
                    if (!tokenMap.ContainsKey(lines[1]))
                    {
                        return "TokenInvalid\r\n";
                    }
                    userAnswers.Remove(tokenMap[lines[1]]);
                    return "AnswerDeleted\r\n";
                }
            case "GetCorrectAnswer":
                {
                    if (lines.Length != 2)
                    {
                        return "Reject\r\n";
                    }
                    SHA512 hasher = SHA512.Create();
                    string passwordHash = string.Concat(Array.ConvertAll(hasher.ComputeHash(Encoding.UTF8.GetBytes(lines[1])), hashValue => hashValue.ToString("X2")));
                    if(!passwordHash.Equals(serverAuthenticationKeyHash))
                    {
                        return "KeyInvalid\r\n";
                    }
                    return "CorrectAnswer\r\n" + correctAnswer + "\r\n";
                }
            case "GetCurrentProblem":
                {
                    if (lines.Length != 2)
                    {
                        return "Reject\r\n";
                    }
                    SHA512 hasher = SHA512.Create();
                    string passwordHash = string.Concat(Array.ConvertAll(hasher.ComputeHash(Encoding.UTF8.GetBytes(lines[1])), hashValue => hashValue.ToString("X2")));
                    if (!passwordHash.Equals(serverAuthenticationKeyHash))
                    {
                        return "KeyInvalid\r\n";
                    }
                    return "CurrentProblem\r\n" + wolframProblem + "\r\n";
                }
            case "SetCorrectAnswer":
                {
                    if (lines.Length != 3)
                    {
                        return "Reject\r\n";
                    }
                    SHA512 hasher = SHA512.Create();
                    string passwordHash = string.Concat(Array.ConvertAll(hasher.ComputeHash(Encoding.UTF8.GetBytes(lines[1])), hashValue => hashValue.ToString("X2")));
                    if (!passwordHash.Equals(serverAuthenticationKeyHash))
                    {
                        return "KeyInvalid\r\n";
                    }
                    correctAnswer = lines[2];
                    await Console.Out.WriteLineAsync(correctAnswer);
                    if(correctAnswer == "No short answer available")
                    {
                        correctAnswer = "No solution";
                    }
                    return "CorrectAnswerSet\r\n";
                }
            case "GetHumanProblem":
                {
                    if (lines.Length != 1)
                    {
                        return "Reject\r\n";
                    }
                    return "HumanProblem\r\n" + humanProblem + "\r\n";
                }
            case "GetTimeLeft":
                {
                    if (lines.Length != 1)
                    {
                        return "Reject\r\n";
                    }
                    return "TimeResponse\r\n" + (45 - counter % 45) + "\r\n";
                }
            case "GetLeaderboard":
                {
                    if (lines.Length != 1)
                    {
                        return "Reject\r\n";
                    }
                    List<Tuple<string, int, int>> goldValues = await SQLUtils.GetAllGoldValues();
                    goldValues.Sort((Tuple<string, int, int> tuple1, Tuple<string, int, int> tuple2) =>
                    {
                        return tuple1.Item2.CompareTo(tuple2.Item2);
                    });
                    goldValues.Reverse();
                    return "Leaderboard" + string.Concat(from goldTuple in goldValues select "\r\n" + goldTuple.Item2.ToString() + " " + goldTuple.Item1) + "\r\n";
                }
            default:
                {
                    return "Reject\r\n";
                }
        }
    }

    internal static async void RunRecurring(object sender, ElapsedEventArgs eventArgs)
    {
        List<Tuple<string, int, int>> goldValues = await SQLUtils.GetAllGoldValues();
        foreach(Tuple<string, int, int> goldValue in goldValues)
        {
            SQLUtils.SetPlayerGold(goldValue.Item1, goldValue.Item2 + goldValue.Item3);
        }
        counter++;
        if (counter % 45 == 1)
        {
            List<Tuple<string, int>> xpValues = await SQLUtils.GetAllXPValues();
            foreach (Tuple<string, int> xpValue in xpValues)
            {
                if (!userAnswers.ContainsKey(xpValue.Item1)) continue;
                await SQLUtils.SetPlayerXP(xpValue.Item1, xpValue.Item2 + (int)((userAnswers[xpValue.Item1].Equals(correctAnswer) ? 1.0 : -0.5) * questionValue));
            }
            userAnswers.Clear();
            Random randomSource = new Random();
            int coeff1 = randomSource.Next() % 20 + 1;
            int coeff2 = randomSource.Next() % 20 + 1;
            int coeff3 = randomSource.Next() % 20 + 1;
            int coeff4 = randomSource.Next() % 20 + 1;
            int coeff5 = randomSource.Next() % 20 + 1;
            int coeff6 = randomSource.Next() % 20 + 1;
            int coeff7 = randomSource.Next() % 20 + 1;
            int coeff8 = randomSource.Next() % 20 + 1;
            double randomOutput = randomSource.NextDouble();
            if (randomOutput < 0.1)
            {
                wolframProblem = $"[[{coeff1},{coeff2}],[{coeff3},{coeff4}]] * [[{coeff5},{coeff6}],[{coeff7},{coeff8}]]";
                humanProblem = $"Multiply the following two matrices: [[{coeff1},{coeff2}],[{coeff3},{coeff4}]], [[{coeff5},{coeff6}],[{coeff7},{coeff8}]].";
                questionValue = 700;
            }
            else if(randomOutput < 0.2)
            {
                wolframProblem = $"Limit[({coeff1}x^{coeff2}+{coeff3}x^{coeff4})/({coeff5}x^{coeff2}+{coeff7}x^{coeff4}), x -> Infinity]";
                humanProblem = $"Find the limit as x approaches infinity of the following expression: ({coeff1}x^{coeff2}+{coeff3}x^{coeff4})/({coeff5}x^{coeff6}+{coeff7}x^{coeff8}).";
                questionValue = 700;
            }
            else if (randomOutput < 0.3)
            {
                wolframProblem = $"D[{coeff1}x^{coeff2}+{coeff3}x^{coeff4}+{coeff5}x^{coeff6}+{coeff7}x^{coeff8}, x]";
                humanProblem = $"Find the first derivative of the following expression: {coeff1}x^{coeff2}+{coeff3}x^{coeff4}+{coeff5}x^{coeff6}+{coeff7}x^{coeff8}.";
                questionValue = 700;
            }
            else if(randomOutput < 0.4)
            {
                wolframProblem = $"(-{coeff2} + sqrt({coeff2}^2-4*{coeff1}*{coeff3}))/(2*{coeff1}), (-{coeff2} - sqrt({coeff2}^2-4*{coeff1}*{coeff3}))/(2*{coeff1})";
                humanProblem = $"Solve the following quadratic equation: {coeff1}x^2+{coeff2}x+{coeff3}=0.";
                questionValue = 500;
            }
            else if (randomOutput < 0.5)
            {
                wolframProblem = $"Factor[{coeff1}x^2+{coeff2}x+{coeff3}]";
                humanProblem = $"Factor the following quadratic equation: {coeff1}x^2+{coeff2}x+{coeff3}=0.";
                questionValue = 500;
            }
            else if (randomOutput < 0.6)
            {
                wolframProblem = $"({coeff3}*{coeff5}-{coeff2}*{coeff6})/({coeff1}*{coeff5}-{coeff2}*{coeff4}), ({coeff3}*{coeff4}-{coeff1}*{coeff6})/({coeff2}*{coeff4}-{coeff1}*{coeff5})";
                humanProblem = $"Solve the following system of equations: {coeff1}x+{coeff2}y={coeff3}, {coeff4}x+{coeff5}y={coeff6}.";
                questionValue = 500;
            }
            else if (randomOutput < 0.7)
            {
                wolframProblem = $"{coeff2}/(2*{coeff1})";
                humanProblem = $"Find the x coordinate of the vertex for the following parabola: y={coeff1}x^2+{coeff2}x+{coeff3}.";
                questionValue = 500;
            }
            else if (randomOutput < 0.8)
            {
                wolframProblem = $"LCM[{coeff1 * coeff2},{coeff3 * coeff4}]";
                humanProblem = $"Find the LCM of {coeff1 * coeff2} and {coeff3 * coeff4}.";
                questionValue = 300;
            }
            else if (randomOutput < 0.9)
            {
                wolframProblem = $"Convert 0.{coeff1 % 10}{coeff2 % 10}{coeff3 % 10}{coeff1 % 10}{coeff2 % 10}{coeff3 % 10}{coeff1 % 10}{coeff2 % 10}{coeff3 % 10}... to a fraction.";
                humanProblem = $"Convert 0.{coeff1 % 10}{coeff2 % 10}{coeff3 % 10}{coeff1 % 10}{coeff2 % 10}{coeff3 % 10}{coeff1 % 10}{coeff2 % 10}{coeff3 % 10}... to a fraction.";
                questionValue = 300;
            }
            else
            {
                wolframProblem = $"({coeff3}-{coeff2})/{coeff1}";
                humanProblem = $"Solve the following linear equation: {coeff1}x+{coeff2}={coeff3}.";
                questionValue = 300;
            }
            pastCorrectAnswer = correctAnswer;
            correctAnswer = "Placeholder";
            try
            {
                await (new HttpClient()).GetAsync("http://localhost:3000/correct-answers");
            }
            catch(Exception e)
            {

            }
        }
    }
}
