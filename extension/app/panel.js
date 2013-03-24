/* 
 * registerPanelListeners
 * The code for handling the events from the web pages needs to be implemented here.
 * @param {Window} global The global object that represents the window of the panel.
 */
function registerPanelListeners(global) {

  var myPanel = global.devtoolsBridge;
  var document = global.document;
  var button = document.getElementsByTagName('button')[0];
  var result = document.getElementById('result');
  var windowInfo = {};

  /* 
   * global.devtoolsBridge.on
   * @param {string} eventType The event type to listen for.
   * @param {function} listener A callback function.
   * The callback function takes the following arguments:
   *    {object} event The event received from the web page.
   *    {function} sendEvent A function for sending an event to the web page.
   * The sendEvent takes the following arguments:
   *    {string} eventType The event type to send.
   *    {object} params The optional data associated with the event.
   *    {number} windowId The optional id that represents a specific frame within the tab.
   */
  myPanel.on('load', function (event, sendEvent) {
    button.addEventListener('click', function () {
      sendEvent('capture', null, event.session);
    }, false);

    windowInfo[event.session + ''] = {
      title: event.title,
      context: null
    };
  });

  myPanel.on('snapshot', function (event, sendEvent) {
    var tSessionId = event.session + '';
    var tSessionData = windowInfo[tSessionId];
    if (!tSessionData) {
      return;
    }
    tSessionData.context = event.context;
    var tElement = document.getElementById(tSessionId);
    if (tElement) {
      tElement.innerHTML= event.context;
    } else {
      tElement = document.createElement('div');
      tElement.innerHTML= event.context;
      result.appendChild(tElement);
    }
  });
};
