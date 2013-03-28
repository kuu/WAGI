/* 
 * registerPanelListeners
 * The code for handling the events from the web pages needs to be implemented here.
 * @param {Window} global The global object that represents the window of the panel.
 */
function registerPanelListeners(global) {

  var myPanel = global.devtoolsBridge;
  var document = global.document;
  var root = document.getElementById('root');
  var control = document.getElementById('control');
  var button = document.getElementsByTagName('button')[0];
  var stage = document.getElementById('stage');
  control.style.position = 'absolute';
  control.style.width = '100%';
  control.style.height = '10%';
  control.style.top = 0;
  control.style.left = 0;
  stage.style.position = 'absolute';
  stage.style.width = '100%';
  stage.style.height = '90%';
  stage.style.top = '10%';
  stage.style.left = 0;
  stage.style.background = '#222';

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
    drawGraph(stage, JSON.parse(event.context));
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
