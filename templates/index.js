// Initialize the name variable
let name = null;

let roomName = document.getElementById("roompyVar").dataset.value;

function toggleChatPopup() {
  document.getElementById("chatPopup").classList.toggle("hidden");
}

if (roomName == "??????") {
  document.getElementById("x-button").innerHTML =
    '<form method="POST" action="/create_room"><button type="submit" id="closePopup" class="absolute top-2 right-2 text-white text-lg font-bold rounded-full">&times;</button></form>';
} else {
  document.getElementById("x-button").innerHTML =
    '<button id="closePopup" class="absolute top-2 right-2 text-white text-lg font-bold rounded-full">&times;</button>';
  toggleChatPopup();
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
  { bg: "bg-blue-500", border: "border-blue-600", text: "text-white" },
  { bg: "bg-gray-200", border: "border-gray-300", text: "text-black" },
  { bg: "bg-green-500", border: "border-green-600", text: "text-white" },
  { bg: "bg-yellow-400", border: "border-yellow-500", text: "text-black" },
  { bg: "bg-purple-500", border: "border-purple-600", text: "text-white" },
  { bg: "bg-red-500", border: "border-red-600", text: "text-white" },
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
  const isCurrentUser = name !== null && username === name;

  // Create message element
  const messageDiv = document.createElement("div");
  messageDiv.className = isCurrentUser
    ? "flex justify-end"
    : "flex justify-start";

  // Create message bubble with new Tailwind styles
  const bubble = document.createElement("div");
  bubble.className = `relative max-w-[75%] px-4 py-2 rounded-2xl shadow-md ${color.bg} ${color.border} ${color.text} ${isCurrentUser ? "bubble-tail-right self-end text-right" : "bubble-tail-left self-start text-left"}`;

  // System messages (joins/leaves)
  if (
    messageContent.includes("Joined The Chat") ||
    messageContent.includes("Left The Chat") ||
    messageContent.includes("Message too long!")
  ) {
    bubble.className =
      "relative max-w-[75%] px-3 py-2 rounded-lg bg-gray-200 border border-gray-300 text-gray-800 font-semibold shadow";
  }

  // Add username
  const usernameSpan = document.createElement("span");
  usernameSpan.className = "block font-bold uppercase text-xs text-gray-500";
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

    // Create image element
    const imgElement = document.createElement("img");
    imgElement.src = imageUrl;
    imgElement.className = "max-w-full mt-2 rounded-xl shadow";
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

    // Create iframe element
    const iframeElement = document.createElement("iframe");
    iframeElement.src = iframeUrl;
    iframeElement.className =
      "w-full mt-2 rounded-lg border border-gray-300 shadow";
    iframeElement.style.height = "300px";
    iframeElement.setAttribute("allowfullscreen", "true");
    iframeElement.setAttribute("loading", "lazy");
    iframeElements.push(iframeElement);
  }

  // Add the text content
  const textSpan = document.createElement("span");
  textSpan.className = "text-lg";
  textSpan.textContent = processedContent.trim();
  bubble.appendChild(textSpan);

  // Add images and iframes
  imgElements.forEach((img) => bubble.appendChild(img));
  iframeElements.forEach((iframe) => bubble.appendChild(iframe));

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
