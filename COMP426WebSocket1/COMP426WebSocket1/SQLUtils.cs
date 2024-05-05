using System.Collections.Generic;
using System;
using System.Data;
using System.Data.SqlClient;
using System.Threading.Tasks;
using System.Linq;
internal static class SQLUtils
{
    internal static async Task AddUser(string username, string passwordHash)
    {
        await RunSQLCommand("INSERT INTO Players (XP, Gold, Username, PasswordHash, PassiveIncome, ClickMultiplier) VALUES (0, 0, @username, @passwordHash, 0, 1)", new Tuple<string, object>("@username", username), new Tuple<string, object>("@passwordHash", passwordHash));
    }

    internal static async Task<bool> ContainsUser(string username)
    {
        DataTable sqlOutput = await GetSQLOutput("SELECT * FROM Players WHERE Username = @username", new Tuple<string, object>("@username", username));
        return sqlOutput.Rows.Count > 0;
    }

    internal static async Task<bool> AcceptsUser(string username, string passwordHash)
    {
        DataTable sqlOutput = await GetSQLOutput("SELECT * FROM Players WHERE Username = @username", new Tuple<string, object>("@username", username));
        return sqlOutput.Rows.Count > 0 && sqlOutput.Rows[0]["PasswordHash"].Equals(passwordHash);
    }

    internal static async Task<List<Tuple<int, int, int, double, int, string>>> GetPowerUps()
    {
        DataTable sqlOutput = await GetSQLOutput("SELECT * FROM PowerUps");
        return (from DataRow row in sqlOutput.Rows select Tuple.Create(Val<int>(row, "Id"), Val<int>(row, "PassiveIncome"), Val<int>(row, "ClickMultiplier"), Val<double>(row, "StealProportion"), Val<int>(row, "XPCost"), Val<string>(row, "ItemName"))).ToList();
    }

    internal static async Task<Tuple<int, int, int, double, int, string>> GetPowerUp(int powerUpID)
    {
        DataTable sqlOutput = await GetSQLOutput("SELECT * FROM PowerUps WHERE Id = @id", new Tuple<string, object>("@id", powerUpID));
        DataRow row = sqlOutput.Rows[0];
        return Tuple.Create(Val<int>(row, "Id"), Val<int>(row, "PassiveIncome"), Val<int>(row, "ClickMultiplier"), Val<double>(row, "StealProportion"), Val<int>(row, "XPCost"), Val<string>(row, "ItemName"));
    }

    internal static async Task<bool> HasPowerUp(int powerUpID)
    {
        DataTable sqlOutput = await GetSQLOutput("SELECT * FROM PowerUps WHERE Id = @id", new Tuple<string, object>("@id", powerUpID));
        return sqlOutput.Rows.Count > 0;
    }

    internal static async Task<int> GetPlayerGold(string username)
    {
        DataTable sqlOutput = await GetSQLOutput("SELECT * FROM Players WHERE Username = @username", new Tuple<string, object>("@username", username));
        return (int)sqlOutput.Rows[0]["Gold"];
    }

    internal static async Task<int> GetPlayerXP(string username)
    {
        DataTable sqlOutput = await GetSQLOutput("SELECT * FROM Players WHERE Username = @username", new Tuple<string, object>("@username", username));
        return (int)sqlOutput.Rows[0]["XP"];
    }
    internal static async Task<int> GetPlayerPassive(string username)
    {
        DataTable sqlOutput = await GetSQLOutput("SELECT * FROM Players WHERE Username = @username", new Tuple<string, object>("@username", username));
        return (int)sqlOutput.Rows[0]["PassiveIncome"];
    }
    internal static async Task<int> GetPlayerClick(string username)
    {
        DataTable sqlOutput = await GetSQLOutput("SELECT * FROM Players WHERE Username = @username", new Tuple<string, object>("@username", username));
        return (int)sqlOutput.Rows[0]["ClickMultiplier"];
    }

    internal static async Task SetPlayerGold(string username, int gold)
    {
        await RunSQLCommand("UPDATE Players SET Gold = @gold WHERE Username = @username", new Tuple<string, object>("@gold", gold), new Tuple<string, object>("@username", username));
    }

    internal static async Task SetPlayerXP(string username, int xp)
    {
        await RunSQLCommand("UPDATE Players SET XP = @xp WHERE Username = @username", new Tuple<string, object>("@xp", xp), new Tuple<string, object>("@username", username));
    }

    internal static async Task SetPlayerPassive(string username, int passive)
    {
        await RunSQLCommand("UPDATE Players SET PassiveIncome = @passive WHERE Username = @username", new Tuple<string, object>("@passive", passive), new Tuple<string, object>("@username", username));
    }

    internal static async Task SetPlayerClick(string username, int click)
    {
        await RunSQLCommand("UPDATE Players SET ClickMultiplier = @click WHERE Username = @username", new Tuple<string, object>("@click", click), new Tuple<string, object>("@username", username));
    }

    internal static async Task<List<Tuple<string, int, int>>> GetAllGoldValues()
    {
        DataTable sqlOutput = await GetSQLOutput("SELECT * FROM Players");
        return (from DataRow row in sqlOutput.Rows select Tuple.Create(Val<string>(row, "Username"), Val<int>(row, "Gold"), Val<int>(row, "PassiveIncome"))).ToList();
    }
    internal static async Task<List<Tuple<string, int>>> GetAllXPValues()
    {
        DataTable sqlOutput = await GetSQLOutput("SELECT * FROM Players");
        return (from DataRow row in sqlOutput.Rows select Tuple.Create(Val<string>(row, "Username"), Val<int>(row, "XP"))).ToList();
    }

    private static T Val<T>(DataRow row, string property)
    {
        return row[property] == DBNull.Value ? default : (T)row[property];
    }

    private static async Task<DataTable> GetSQLOutput(string command, params Tuple<string, object>[] parameterArray)
    {
        SqlConnectionStringBuilder connectionStringBuilder = new SqlConnectionStringBuilder();
        connectionStringBuilder["Data Source"] = "[SQL SERVER ADDRESS HERE]";
        connectionStringBuilder["Initial Catalog"] = "[SQL DATABASE HERE]";
        connectionStringBuilder["User ID"] = "[SQL USERNAME HERE]";
        connectionStringBuilder["Password"] = "[SQL PASSWORD HERE]";
        SqlConnection connection = new SqlConnection(connectionStringBuilder.ConnectionString);
        SqlCommand commandObject = new SqlCommand(command, connection);
        foreach (Tuple<string, object> parameter in parameterArray)
        {
            commandObject.Parameters.AddWithValue(parameter.Item1, parameter.Item2);
        }
        await connection.OpenAsync();
        SqlDataReader dataReader = await commandObject.ExecuteReaderAsync();
        DataTable outputTable = new DataTable();
        outputTable.Load(dataReader);
        connection.Close();
        return outputTable;
    }

    private static async Task RunSQLCommand(string command, params Tuple<string, object>[] parameterArray)
    {
        await GetSQLOutput(command, parameterArray);
    }
}
