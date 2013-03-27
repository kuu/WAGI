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
/*
  var tStyle = result.style;
  tStyle.position = 'absolute';
  tStyle.width = '100%';
  tStyle.height = '100%';
  tStyle.top = 0;
  tStyle.left = 0;
  //tStyle.background = '#222';
*/

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
    drawGraph(result, event.context);
/*
    var tElement = document.getElementById(tSessionId);
    if (tElement) {
      tElement.innerHTML= event.context;
    } else {
      tElement = document.createElement('div');
      tElement.innerHTML= event.context;
      result.appendChild(tElement);
    }
*/
  });

  function drawGraph(pContainer, pData) {
    // Instanciate sigma.js and customize rendering :
    var sigInst = sigma.init(pContainer)
    .drawingProperties({
      defaultLabelColor: '#fff',
      defaultLabelSize: 14,
      defaultLabelBGColor: '#fff',
      defaultLabelHoverColor: '#000',
      labelThreshold: 6,
      defaultEdgeType: 'curve'
    }).graphProperties({
      minNodeSize: 0.5,
      maxNodeSize: 5,
      minEdgeSize: 1,
      maxEdgeSize: 1
    }).mouseProperties({
      maxRatio: 32
    });
 
    // Parse a JSON object to fill the graph
    // (requires "sigma.parseAudioGraph.js" to be included)
    sigInst.parseAudioGraph(pData);
 
    // Draw the graph :
    sigInst.draw();
  }

};
