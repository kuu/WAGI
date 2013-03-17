chrome.extension.onMessage.addListener(function(message) {
  if (message.from !== 'devtools') return;
  //console.log('[ContentScript] onMessage from the devtools.', message);
  window.postMessage(message, '*');
});

window.addEventListener('message', function (event) {
  if (event.source != window) return;
  var data = (typeof event.data === 'string' ? JSON.parse(event.data) : event.data);
  if (data.from !== 'webpage') return;
  //console.log('[ContentScript] postMessage received from the webpage.', data);
  chrome.extension.sendMessage(data);
}, false);
