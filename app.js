const express = require("express");
const app = express();
app.use(express.json());
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

let dbpath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;

const InitializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error:${e.message}`);
    process.exit(1);
  }
};
InitializeDBAndServer();

//API 1
//Returns a list of all the players in the player table
function convertToPlayerResponse(player) {
  return {
    playerId: player.player_id,
    playerName: player.player_name,
  };
}

app.get("/players/", async (request, response) => {
  const getAllPlayersQuery = `SELECT * FROM player_details ORDER BY player_id`;
  const allPlayers = await db.all(getAllPlayersQuery);
  const dbResponse = [];
  for (let player of allPlayers) {
    dbResponse.push(convertToPlayerResponse(player));
  }
  response.send(dbResponse);
});

//API 2
//Returns a specific player based on the player ID
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `SELECT * FROM player_details WHERE player_id=${playerId}`;
  const player = await db.get(getPlayerQuery);
  response.send(convertToPlayerResponse(player));
});

//API 3
//Updates the details of a specific player based on the player ID
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const updatePlayer = request.body;
  const { playerName } = updatePlayer;
  const updatePlayerQuery = `UPDATE player_details SET 
        player_name='${playerName}'`;
  await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

//API 4
//Returns the match details of a specific match
function convertToMatchResponse(match) {
  return {
    matchId: match.match_id,
    match: match.match,
    year: match.year,
  };
}

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchDetailsQuery = `SELECT * FROM match_details WHERE match_id=${matchId};`;
  const match = await db.get(getMatchDetailsQuery);
  response.send(convertToMatchResponse(match));
});

//API 5
//Returns a list of all the matches of a player
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerMatchDetailsQuery = `SELECT match_details.match_id AS matchId,match,year
        FROM match_details INNER JOIN player_match_score ON 
        player_match_score.match_id=match_details.match_id
        WHERE player_id=${playerId};`;
  const allMatches = await db.all(getPlayerMatchDetailsQuery);
  response.send(allMatches);
});

//API 6
//Returns a list of players of a specific match

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getAllplayersMatchQuery = `SELECT * FROM player_match_score INNER JOIN player_details ON 
        player_match_score.player_id=player_details.player_id WHERE
        match_id=${matchId};`;
  const allPlayersMatch = await db.all(getAllplayersMatchQuery);
  const r = [];
  for (let player of allPlayersMatch) {
    r.push(convertToPlayerResponse(player));
  }
  response.send(r);
});

//API 7
//Returns the statistics of the total score, fours, sixes of a specific player based on the player ID
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const statsQuery = `SELECT player_details.player_id AS playerId,
        player_name AS playerName,SUM(score) AS totalScore,
        SUM(fours) AS totalFours,SUM(sixes) AS totalSixes
        FROM player_match_score INNER JOIN player_details ON
         player_match_score.player_id=player_details.player_id 
         GROUP BY playerId HAVING playerId=${playerId}`;
  const stat = await db.get(statsQuery);
  response.send(stat);
});

module.exports = app;
