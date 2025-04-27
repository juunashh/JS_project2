const KEY = "RGAPI-f2a2539e-fd5a-48a0-baff-c6660c84fbf1";
var gameName = "";
var tagLine = "";



        function getSummoner() {
            var fullRiotID = document.getElementById("name-input").value;
            
            // Check if empty
            if (fullRiotID == "" || fullRiotID == null) {
                alert("Please add your Riot ID!");
                return false;
            }
            
            // Check for tagline separator
            if (!(fullRiotID.includes("#"))) {
                alert("No tagline detected!");
                return false;
            }
            var splitRiotID = fullRiotID.split("#");
            gameName = splitRiotID[0];
            tagLine = splitRiotID[1];
            
            // Validate tagline
            if (tagLine.length > 6 ) {
                alert("Tagline too long!");
                return false;
            } else if (tagLine == "") {
                alert("Tagline empty!")
            }
            // Change to the results screen
            document.getElementById("startscreen").style.display = "none";
            document.getElementById("result").style.display = "block";
            getData(gameName, tagLine);

        }
        // fetch data, source: https://www.freecodecamp.org/news/make-api-calls-in-javascript/ 
        // source https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch

        async function getPuuID(gameName, tagLine) {   
            const response = await fetch("https://europe.api.riotgames.com/riot/account/v1/accounts/by-riot-id/" + gameName + "/" + tagLine + "?api_key=" + KEY);
            if (!response.ok) {
                throw new Error("getPuuID: Network response not ok")
            }
            const json = await response.json();
            return json.puuid; 
        }

        async function getMatchHistory(puuID) {
            var APICALL = "https://europe.api.riotgames.com/lol/match/v5/matches/by-puuid/" + puuID +"/ids?queue=1700&api_key=" + KEY;
            const response = await fetch(APICALL);
            if (!response.ok) {
                throw new Error("getMatchHistory: Network response not ok")
            }
            const json = await response.json();
            return json;
        }

        async function getMatchData(matchID) {
            var APICALL = "https://europe.api.riotgames.com/lol/match/v5/matches/" + matchID + "?api_key=" + KEY;
            const response = await fetch(APICALL);
            if (!response.ok) {
                throw new Error("getMatchData: Network response not ok")
            }
            const json = await response.json();
            return json;
        }

        function parseMatchData(matchData, puuID) {
            // IDK maybe this shouldnt be async but whatever, it makes this work
            
            console.log(matchData);

            // Find the right player
            var participantID = -1;
            for (summoner in matchData.info.participants) {
                if (matchData.info.participants[summoner].puuid === puuID) {
                    participantID = summoner;
                }
            }
            var teamID = matchData.info.participants[participantID].playerSubteamId;

            // Find Teammate
            var teammateID = -1;
            for (summoner in matchData.info.participants) {
                if (matchData.info.participants[summoner].playerSubteamId === teamID && summoner != participantID) {
                    teammateID = summoner;
                }
            }
                
            // variable data from json

            // Date converted src: https://www.geeksforgeeks.org/how-to-convert-unix-timestamp-to-time-in-javascript
            var dateOfMatch = new Date(matchData.info.gameCreation);
            var matchID = matchData.metadata.matchId;

            var championName = matchData.info.participants[participantID].championName;
            var champID = matchData.info.participants[participantID].championId;

            var teammateName = matchData.info.participants[teammateID].riotIdGameName;
            var teammateChampion = matchData.info.participants[teammateID].championName;
            var teammateChampID = matchData.info.participants[teammateID].championId;
            
            var finishPosition = matchData.info.participants[teammateID].subteamPlacement;
            



            // DOM handling
            var photo1 = "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/" + champID + ".png";
            var photo2 = "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/" + teammateChampID + ".png";

            const table = document.getElementById("data");
            var newRow = document.createElement('tr');
            newRow.setAttribute('class','matchcard');
            newRow.setAttribute('id',matchID);
            newRow.setAttribute('onclick','moreMatchInformation("'+ gameName + '", "' + matchID + '")')
            newRow.innerHTML = "<td><img class='championphoto' src='" + photo1 + "' alt='" + championName + "'></td><td><img class='championphoto' src='" + photo2 + "' alt='" + teammateChampion + "'></td><td>" + teammateName + "</td><td>" + finishPosition + "</td>"
            table.appendChild(newRow);

            //var elements = document.getElementsByClassName("matchcard");
            //for (let i = 0; i < elements.length; i++) {
            //    elements[i].addEventListener('click', async function() {moreMatchInformation(gameName, this.id)}, false)
            //}
        }

        async function getData(gameName, tagLine) {
            try {
                const puuID = await getPuuID(gameName, tagLine);
                const history = await getMatchHistory(puuID);
                for (match in history) {
                    const matches = await getMatchData(history[match]);
                    parseMatchData(matches, puuID)
                }
            } catch(error) {
                console.error('Error: ', error);
            }
        }

        async function getAugments(arrayOfAugments) {
            try {
                const response = await fetch("https://raw.communitydragon.org/latest/cdragon/arena/en_us.json");
                if (!response.ok) {
                throw new Error("getAugments: Network response not ok")
            }
                const json = await response.json();
                const details = [];
                for (i in arrayOfAugments) {
                    for (j in json.augments) {
                        if (json.augments[j].id === arrayOfAugments[i]) {
                            var aname = json.augments[j].name;
                            var adesc = json.augments[j].desc;
                            var aicon = "https://raw.communitydragon.org/latest/game/" + json.augments[j].iconLarge;
                            details.push({name: aname, desc: adesc, icon: aicon});
                        }
                    }
                }
                return details;
            } catch(error) {
                console.error('Error: ', error);
                return false;
            }
        }

        async function getItems(arrayOfItems) {
            try {
                const response = await fetch("https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/items.json");
                if (!response.ok) {
                    throw new Error("getItems: Network response not ok")
                }
                const json = await response.json();
                const details = [];
                for (i in arrayOfItems) {
                    for (j in json) {
                        if (json[j].id === arrayOfItems[i]) {
                            var iname = json[j].name;
                            var iconPathArray = json[j].iconPath.split("/");
                            var iconName = iconPathArray[iconPathArray.length - 1].toLowerCase();
                            var iicon = "https://raw.communitydragon.org/latest/game/assets/items/icons2d/" + iconName;
                            details.push({name: iname, icon: iicon});
                        }
                    }
                }
                return details;
            } catch (error) {
                console.error('Error: ', error);
                return false;
            }
        }

        async function moreMatchInformation(gameName, matchID) {
            const matchData = await getMatchData(matchID);
            var participantID = -1;
            for (summoner in matchData.info.participants) {
                if (matchData.info.participants[summoner].riotIdGameName == gameName) {
                    participantID = summoner;
                }
            }
            // All Augments 
            // src for eval() https://www.pluralsight.com/resources/blog/guides/convert-strings-to-json-objects-in-javascript-with-eval
            const augmentList = []
            for (let i = 1; i <= 6; i++) {
                var augmentN = "matchData.info.participants[participantID].playerAugment" + i;
                var augmentID = eval(augmentN);
                augmentList.push(augmentID);
            }
            const augmentData = await getAugments(augmentList);

            var gameRow = document.getElementById(matchID);
            var newRow           
            newRow = document.createElement('td');
            newRow.setAttribute('class', 'augments')
            for (i in augmentData) {
                newRow.innerHTML += "<img src='" + augmentData[i].icon + "'>"
            }
            gameRow.appendChild(newRow);


            const itemList = [];
            for (let i = 0; i <= 6; i++) {
                var itemN = "matchData.info.participants[participantID].item" + i;
                var itemID = eval(itemN);
                itemList.push(itemID);
            }
            const itemData = await getItems(itemList);

            var newRow2 = "";
            newRow2 = document.createElement('td');
            newRow2.setAttribute('class','items')
            for (i in itemData) {
                newRow2.innerHTML += "<img src='" + itemData[i].icon + "'>"
            }
            gameRow.appendChild(newRow2);
        }

