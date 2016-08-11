'use strict'

const sampleAdatperPath = "/Users/saraford/repos/electron/hubot/node_modules/hubot-sample/src/sample.coffee"

// const hubot_path = "/Users/saraford/repos/electron/hubot/node_modules/hubot/myhubot/bin/hubot";
// const hubot_cwd_path = "/Users/saraford/repos/electron/hubot/node_modules/hubot/myhubot";

//const hubot_path = "/Users/saraford/repos/electron/hubot/node_modules/hubot/bin/hubot";
// const hubot_path = "/Users/saraford/repos/electron/hubot/hubot-launch";
const hubot_cwd_path = "/Users/saraford/repos/electron/hubot/node_modules";
const $ = require('jquery');
const ipcRenderer = require('electron').ipcRenderer;

require('coffee-script/register');
const Path = require('path');
const Hubot = require('hubot');
const TextMessage = Hubot.TextMessage;
const helper = require('./helper');
var robot = undefined;

const callMe = (data) => {
  console.log("callMe has been called w data: " + data);
  updateWindowWithHubotMessage(data);
}

const callMe2 = (data) => {
  console.log("callMe2 has been called w data: " + data);
  updateWindowWithHubotMessage(data, true);
}


var loadScripts = function() {
  var scriptsPath = Path.resolve(".", "scripts");
  robot.load(scriptsPath);

  var rulesScriptPath = Path.resolve(".", "node_modules/hubot-rules/src")
  robot.load(rulesScriptPath);

  var pugmeScriptPath = Path.resolve(".", "node_modules/hubot-pugme/src")
  robot.load(pugmeScriptPath);
};

var is_hubot_response_we_want = false;
let hubotOutputWindow = undefined;

const wireUpButtons = () => {

  let sendButton = $('#send-button');
  let hubotInput = $('#hubot-input');
  hubotOutputWindow = $('#hubot-output');

  sendButton.on('click', function() {

    // update the window first
    var request = $('#hubot-input').val();
    updateWindowWithUserMessage(request);

    // clear input window for next command
    hubotInput.val('');

    // if we immediate request, hubot comes back instantly
    // need a bit of a delay to get that back-and-forth chat feeling
    setTimeout(function() {
      // if user is sending more requests, we're done listening async to hubot
      is_hubot_response_we_want = false;

      // send request to hubot
      console.log("sending ", request);
      console.log("here we go...");
      var user = robot.brain.userForId(1, 'octocat', 'Shell');
      robot.receive(new TextMessage(user, request, 'messageId'));

    }, 750);

  });

  hubotInput.keyup(function (e) {
    if (e.keyCode == 13) {
      sendButton.click();
    }
});
}

document.addEventListener('DOMContentLoaded', function() {
  wireUpButtons();
  startHubot();
//  spawnHubot();
});

function startHubot() {
  //adapterPath, adapterName, enableHttpd, botName, botAlias

  // prints out /Users/saraford/repos/electron/hubot
  // console.log("Start dir" + process.cwd());
  // process.chdir('/Users/saraford/repos/electron/hubot/node_modules');
  // var loc = window.location.pathname;
  // var dir = loc.substring(0, loc.lastIndexOf('/'));
  // console.log("start dir" + process.cwd());
  // process.chdir(hubot_cwd_path);
  // console.log("changed dir" + process.cwd());

  // "adapterPath - the first parameter it is never used"
  robot = Hubot.loadBot(undefined, "sample", true, "Hubot", false);
  robot.adapter.once('connected', loadScripts);
  robot.adapter.foo(callMe);
  robot.adapter.foo2(callMe2);
  robot.run();
  console.log("made it");

  var foo = "";
  var foo2 = "";

}

function spawnHubot() {

  hubotOutputWindow = $('#hubot-output');
  hubotOutputWindow.append("<div class='output-row'><div class='hubot-avatar'><img src='hubot.png'/></div><div class='hubot-message'>hubot loading...</div></div>");

  const spawn = require('child_process').spawn;
  hubot_spawn = spawn(hubot_path, {cwd: hubot_cwd_path, env: process.env});

  var hubotLoaded = false;
  var current_response = "";

  hubot_spawn.stdout.on('data', (data) => {

    // the async response contains a lot of noise
    var hubot_response = data.toString().replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
    console.log("stdout: " + hubot_response);

    /*  there are two reasons why we have to parse this text
        1. hubot echos the commands back for some reasons
            e.g. if you send "hubot ping" he comes back w "hubot ping hubot> PONG"
            I don't know why
        2. these messages are async, so a simple "myhubot ping myhubot> PONG" could be
            all in one event call or across 7+ different event calls, e.g. letter by letter
            aka good times
        so we check...
          1. is hubot loaded? if not, keep parsing text
          2. add up all the current_response (if across multiple events) until
              the "myhubot>" prhase is found
          3. we want everything "myhubot>". this could be all in one event/line
              or across multiple events. We keep parsing...
          4. the only way we know we're done getting response from hubot from #3
              is when the user sends the next message to hubot.
              when is_hubot_response_we_want true, we know we're still parsing #3
              if false (set in the "send hubot message" event), we go back to #2
    */

//    if (hubot_response.indexOf("Data for hubot brain retrieved from Redis") !== -1) {
    if (hubot_response.indexOf("running hubot") !== -1) {
      hubotLoaded = true;
      updateWindowWithHubotMessage("hubot ready");
      return;
    }

    if (!hubotLoaded) {
      return;
    }

    // because hubot is echo'ing commands back, we have to wait until we get "myhubot2>"
    // to avoid displaying that text
    current_response += hubot_response;

    // the response we want comes after the current "myhubot>" response
    if (current_response.includes("Hubot>")) {
      is_hubot_response_we_want = true;

      // the real hubot response might have come with this current_response
      // e.g. "myhubot> PONG" instead of "PONG" on a newline
      // so display everything that comes after "myhubot>"
      var index = current_response.indexOf("Hubot>");
      var length = current_response.length;
      var start_of_response = current_response.substring(index + 8, length - 1);

      console.log("index: " + index + " lenght: " + length + " start_of_response: " + start_of_response);

      if (start_of_response.length != 0) {
        console.log("Yep response was on same line: " + start_of_response);

        // trim whitespace and add
        updateWindowWithHubotMessage(start_of_response);

        // clear current response for next time
        current_response = "";
        return;

      } else {

        // hubot just echo'ing back our previous text
        // just ignore this stdout.on event and continue to next event
        current_response = "";
        return;
      }

    }

    if (is_hubot_response_we_want) {
      console.log("This is next response " + current_response);

      updateWindowWithHubotMessage(current_response);

      current_response = "";
    }

  });

  hubot_spawn.stderr.on('data', (data) => {
    console.log(`stderr: ${data}`);
  });

  hubot_spawn.on('close', (code) => {
    console.log(`child process exited with code ${code}`);
  });
}


function updateWindowWithHubotMessage(response, isEmote) {

  if (typeof isEmote === 'undefined') { isEmote = false; }

  response = response.trim();
  // console.log('response:' + response);
  // console.log("does response contain shell? " + response.includes('Shell:'));

  // only supporting single media responses right now
  if (response.endsWith(".jpg") || response.endsWith(".gif") || response.endsWith(".png")) {
    hubotOutputWindow.append("<div class='output-row'><div class='hubot-avatar'><img src='hubot.png'/></div><div class='hubot-message'><img src='" + response + "'/></div></div>");
  } else if (response.includes('Shell:')) {
    response = response.replace("Shell:", "@octocat:");
    hubotOutputWindow.append("<div class='output-row'><div class='hubot-avatar'><img src='hubot.png'/></div><div class='hubot-message'>" + response + "</div></div>");
  }
  else {
    if (isEmote) {
          hubotOutputWindow.append("<div class='output-row'><div class='hubot-avatar'><img src='hubot.png'/></div><div class='hubot-message'><i>" + response + "</i></div></div>");
    } else {
      hubotOutputWindow.append("<div class='output-row'><div class='hubot-avatar'><img src='hubot.png'/></div><div class='hubot-message'>" + response + "</div></div>");
    }
  }

  scrollDown();
}

function updateWindowWithUserMessage(request) {
  hubotOutputWindow.append("<div class='output-row'><div class='user-avatar'><img src='octocat.png'/></div><div class='user-message'>" + request + "</div></div>");
  scrollDown();
}

function scrollDown() {
  // to keep the latest output visible
  hubotOutputWindow.stop().animate({
    scrollTop: hubotOutputWindow[0].scrollHeight
  }, 200);
}
