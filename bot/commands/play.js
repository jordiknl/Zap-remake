const request = require("superagent");
const ytdl = require("ytdl-core");
const youtubeSearch = require("../util/youtubeSearch.js");

let queue = [];
let playing = [];
let voiceChannels = [];

function play(member, url, message, client) {
    if (playing[message.guild.id] == false) {
        const channel = voiceChannels[message.guild.id];
        if (channel) {
            channel.join().then(connection => {
                const stream = ytdl(url, {filter: "audioonly"});
                const dispatcher = connection.playStream(stream, {seek: 0, volume: .5});
    
                dispatcher.on("end", () => {
                    end(url, message);
                });
    
                ytdl.getInfo(url, (err, info) => {
                    playing[message.guild.id] = true;
    
                    message.channel.send("Now playing: **" + info.title + "**");
                });
            });
        } else {
            message.reply("Unable to find the current voice channel. Music has been stopped.");
        };
    } else {
        message.reply("Already playing a song. This song has been added to the queue.");
        queue.push(url);
    };
};

function end(url, message) {
    message.channel.send("Song has ended.");

    if (queue[message.guild.id].length > 0) {
        play(queue[message.guild.id][0]);
        delete queue[message.guild.id][0];
    } else {
        playing[message.guild.id] = false;
        voiceChannels[message.guild.id] = null;

        message.channel.send("Queue finished.");
    };
};

exports.run = function(client, message, args) {
    if (playing[message.guild.id] == undefined)
        playing[message.guild.id] = false;
    
    if (queue[message.guild.id] == undefined)
        queue[message.guild.id] = [];
    
    if (message.member.voiceChannel) {
        voiceChannels[message.guild.id] = message.member.voiceChannel;

        let urls = [];
        let searchingURL = null;

        if (typeof args[0] == "string" && args[0].startsWith("https://www.youtube.com/watch")) {
            urls.push(args[index]);
        } else {
            searchingURL = true;
            youtubeSearch.search(args.join(), url => {
                urls.push(url);

                searchingURL = false;
            });
        };

        function urlsFound() {
            if (urls.length > 0) {
                for (let index in urls) {
                    request.get(urls[index], (err, response) => {
                        if (err || response.statusCode != 200) {
                            return message.reply("An error occured while trying to find the song.");
                        };
    
                        play(message.member, urls[index], message);
                    });
                };
            } else {
                return message.reply("Please specify a url to YouTube. Or type a song name.");
            };
        };

        if (searchingURL) {
            message.channel.send("Searching for the given song...").then(searchingMessage => {
                let index = 3;

                let clearedInterval = false;
                client.setInterval(interval => {
                    if (searchingURL) {
                        let count = index % 3;
                        
                        searchingMessage.edit("Searching for the given song" + ".".repeat(count));  
                    } else if (!clearedInterval) {
                        clearedInterval = true;
                        client.clearInterval(interval);

                        urlsFound();
                    };
                }, 1000);
            });
        };
    } else {
        return message.reply("You need to be in a voice channel to play music. Please join one.");
    };
};

exports.help = {
    "name": "Play",
    "usage": "<YouTube URL(s)>",
    "permission-level": 1,
    "catergory": "Music",
}