// Initialize the name variable
let name = null;

let roomName = document.getElementById("roompyVar").dataset.value;

if (roomName == "??????") {
  document.getElementById("x-button").innerHTML =
    '<form method="POST" action="/create_room"><button type="submit" id="closePopup" class="absolute top-2 right-2 text-white text-lg font-bold rounded-full">&times;</button></form>';
  toggleChatPopup();
} else {
  document.getElementById("x-button").innerHTML =
    '<button id="closePopup" class="absolute top-2 right-2 text-white text-lg font-bold rounded-full">&times;</button>';
}

function toggleChatPopup() {
  document.getElementById("chatPopup").classList.toggle("hidden");
}

document
  .getElementById("closePopup")
  .addEventListener("click", toggleChatPopup);

document.getElementById("joinChat").addEventListener("click", function () {
  const chatRoomId = document.getElementById("chatRoomId").value.toUpperCase();
  if (chatRoomId.length === 6) {
    window.location.href = `/chat/${chatRoomId}`;
  } else {
    alert("Chat Room ID must be 6 characters long.");
  }
});

function showLoggedInScreen() {
  document.getElementById("loggedOut-main").classList.add("hidden");
  document.getElementById("loggedIn-main").classList.remove("hidden");
}

function showLoggedOutScreen() {
  document.getElementById("loggedOut-main").classList.remove("hidden");
  document.getElementById("loggedIn-main").classList.add("hidden");
}

function deleteCookie(name) {
  document.cookie = name + "=; Max-Age=-99999999; path=/;";
}

function loginoutButton() {
  deleteCookie("session_cookie");
  deleteCookie("person_name");
  name = null;
  showLoggedOutScreen();

  // Notify others that user has left
  sayBye();

  // No need to reload, just update the UI
  // location.reload();
}

const baseUrl = window.location.origin;
const fullUrl = `${baseUrl}/index.json`;

function loginButton() {
  window.location.href = `http://login.rafemedia.com/login?scjson=${fullUrl}`;
}
// Available pastel colors for message bubbles
const bubbleColors = [
  {
    bg: "bg-pink-200",
    border: "border-pink-400",
    text: "text-pink-800",
  },
  {
    bg: "bg-green-200",
    border: "border-green-400",
    text: "text-green-800",
  },
  {
    bg: "bg-blue-200",
    border: "border-blue-400",
    text: "text-blue-800",
  },
  {
    bg: "bg-yellow-200",
    border: "border-yellow-400",
    text: "text-yellow-800",
  },
  {
    bg: "bg-indigo-200",
    border: "border-indigo-400",
    text: "text-indigo-800",
  },
  {
    bg: "bg-red-200",
    border: "border-red-400",
    text: "text-red-800",
  },
  {
    bg: "bg-purple-200",
    border: "border-purple-400",
    text: "text-purple-800",
  },
];

function getCookie(name) {
  let cookieArr = document.cookie.split(";");
  for (let cookie of cookieArr) {
    let [key, value] = cookie.trim().split("=");
    if (key === name) return value;
  }
  return null;
}

// Username to color mapping to keep consistent colors
const userColors = {};
let colorIndex = 0;

window.onload = function () {
  let cookieName = getCookie("person_name");

  if (cookieName !== null) {
    name = cookieName;
    showLoggedInScreen();
    setTimeout(() => {
      sayHi();
      pastChat();
    }, 500);
  } else {
    showLoggedOutScreen();
    pastChat();
  }

  // Scroll to the bottom of the chat
  setTimeout(scrollToBottom, 100);
};

window.addEventListener("beforeunload", function () {
  if (name !== null) {
    sayBye();
  }
});

var socket = io.connect("https://" + document.domain + ":" + location.port);
var room = roomName;
socket.emit("join", room);

socket.on("message", function (msg) {
  addMessage(msg);
  saveChat();
  scrollToBottom();
});

function getUserColor(username) {
  if (!userColors[username]) {
    userColors[username] = bubbleColors[colorIndex % bubbleColors.length];
    colorIndex++;
  }
  return userColors[username];
}

function addMessage(msg) {
  const messagesDiv = document.getElementById("messages");
  // Parse message to get username and message content
  let username = "Anonymous";
  let messageContent = msg;
  const separatorIndex = msg.indexOf(" - ");
  if (separatorIndex > -1) {
    username = msg.substring(0, separatorIndex);
    messageContent = msg.substring(separatorIndex + 3);
  }
  // Get color for this user
  const color = getUserColor(username);
  // Determine if message is from current user
  const isCurrentUser = name !== null && username === name;
  // Create message element
  const messageDiv = document.createElement("div");
  messageDiv.className = isCurrentUser
    ? "flex justify-end"
    : "flex justify-start";
  // Create message bubble with comic style
  const bubble = document.createElement("div");
  bubble.className = `relative max-w-3/4 p-4 border-4 ${color.bg} ${color.border} ${color.text} font-bold transform ${isCurrentUser ? "bubble-tail-right" : "bubble-tail-left"}`;
  // For system messages (joins/leaves)
  if (
    messageContent.includes("Joined The Chat") ||
    messageContent.includes("Left The Chat") ||
    messageContent.includes("Message too long!")
  ) {
    bubble.className =
      "relative max-w-3/4 p-3 border-4 bg-gray-200 border-gray-400 text-gray-800 font-bold transform rotate-0";
  }

  // Add username
  const usernameSpan = document.createElement("span");
  usernameSpan.className = "block font-extrabold uppercase text-xs";
  usernameSpan.textContent = username;
  bubble.appendChild(usernameSpan);

  // Process message content
  let processedContent = messageContent;

  // Handle image embeds
  const imgRegex = /IMG-"(https?:\/\/\S+?)"/g;
  let imgMatch;
  let imgElements = [];

  while ((imgMatch = imgRegex.exec(messageContent)) !== null) {
    const imageUrl = imgMatch[1];
    processedContent = processedContent.replace(imgMatch[0], "");

    // Create image element to add later
    const imgElement = document.createElement("img");
    imgElement.src = imageUrl;
    imgElement.className = "max-w-full mt-2 rounded";
    imgElement.alt = "Embedded image";
    imgElements.push(imgElement);
  }

  // Handle iframe embeds
  const iframeRegex = /WEB-"(https?:\/\/\S+?)"/g;
  let iframeMatch;
  let iframeElements = [];

  while ((iframeMatch = iframeRegex.exec(messageContent)) !== null) {
    const iframeUrl = iframeMatch[1];
    processedContent = processedContent.replace(iframeMatch[0], "");

    // Create iframe element to add later
    const iframeElement = document.createElement("iframe");
    iframeElement.src = iframeUrl;
    iframeElement.className = "w-full mt-2 border-0 rounded";
    iframeElement.style.height = "300px";
    iframeElement.setAttribute("allowfullscreen", "true");
    iframeElement.setAttribute("loading", "lazy");
    iframeElements.push(iframeElement);
  }

  // Add the text content (without the embed commands)
  const textSpan = document.createElement("span");
  textSpan.textContent = processedContent.trim();
  bubble.appendChild(textSpan);

  // Add all image elements
  imgElements.forEach((img) => {
    bubble.appendChild(img);
  });

  // Add all iframe elements
  iframeElements.forEach((iframe) => {
    bubble.appendChild(iframe);
  });

  messageDiv.appendChild(bubble);
  messagesDiv.appendChild(messageDiv);
}

let canSendMessage = true; // Throttle flag

function sendMessage() {
  if (!canSendMessage) return; // Prevent sending if throttled

  const messageInput = document.getElementById("message");
  let messageContent = messageInput.value.trim();

  if (!messageContent) {
    return; // Don't send empty messages
  }

  const maxLength = name ? 400 : 200;

  if (messageContent.length > maxLength) {
    let userperson = name || "Anonymous"; // Assign directly using logical OR

    socket.send(
      `ADMIN - Message too long! ${userperson} Max allowed: ${maxLength} characters.`,
      room,
    );

    return;
  }

  // Send message with name if logged in, otherwise send normally
  if (name) {
    let messages = name + " - " + messageContent;
    socket.send(messages, room);
  } else {
    socket.send(messageContent, room);
  }

  messageInput.value = "";
  messageInput.focus();

  // Throttle sending (1 message per 3 seconds)
  canSendMessage = false;
  setTimeout(() => {
    canSendMessage = true;
  }, 2000); // 3 seconds cooldown
}

function pastChat() {
  var roomid = roomName;
  var storedMessages = localStorage.getItem(roomid);

  if (storedMessages) {
    document.getElementById("messages").innerHTML = storedMessages;
    scrollToBottom();
  }
}

function saveChat() {
  var divElement = document.getElementById("messages");
  var messageContent = divElement.innerHTML;
  var roomid = "roomName";

  try {
    localStorage.setItem(roomid, messageContent);
  } catch (e) {
    // If localStorage is full, clear some old messages
    if (e.code === 22 || e.name === "QuotaExceededError") {
      // Keep only the most recent messages
      var messagesDiv = document.getElementById("messages");
      var messageElements = messagesDiv.children;

      // Remove oldest messages if there are more than 50
      while (messageElements.length > 50) {
        messagesDiv.removeChild(messageElements[0]);
      }

      // Try saving again
      localStorage.setItem(roomid, messagesDiv.innerHTML);
    }
  }
}

function sayHi() {
  if (name) {
    let messages = name + " - Has Joined The Chat";
    socket.send(messages, room);
  }
}

function sayBye() {
  if (name) {
    let messages = name + " - Has Left The Chat";
    socket.send(messages, room);
  }
}

function scrollToBottom() {
  const chatContainer = document.getElementById("chat-container");
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

function getCookie(name) {
  let cookieArr = document.cookie.split(";");
  for (let cookie of cookieArr) {
    let [key, value] = cookie.trim().split("=");
    if (key === name) return value;
  }
  return null;
}

function getUrlParameter(name) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}

const cookie = getUrlParameter("cookie");
const personname = getUrlParameter("personname");
if (cookie) {
  document.cookie = `session_cookie=${cookie}; path=/`;
  document.cookie = `person_name=${personname}; path=/`;
  window.location.href = "/";
} else if (getCookie("session_cookie")) {
  // Show the logged-in screen if session_cookie exists
  showLoggedInScreen();
}

function showLoggedInScreen() {
  document.getElementById("loggedOut-main").classList.add("hidden");
  document.getElementById("loggedIn-main").classList.remove("hidden");
  personcookieValue = getCookie("person_name");
}
