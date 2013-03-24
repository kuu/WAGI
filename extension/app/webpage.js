/* 
 * registerWebPageListeners
 * The code for handling the events from the devtools panel needs to be implemented here.
 * @param {Window} global The global object that represents the top-level window or a frame of the web page.
 * Please note that this function will be injected into every frame of the inspected page.
 */
function registerWebPageListeners(global) {

  var myWebPage = global.devtoolsBridge;
  var mAudioContextClass = null;
  var mSource = [];
  var mDestination = [];
  var mIntermediate = [];
  // Unique id for the individual instance of AudioNode.
  var mNodeId = 0;
  var mCurrentAudioContext = null;

  /* 
   * global.devtoolsBridge.on
   * @param {string} eventType The event type to listen for.
   * @param {function} listener A callback function.
   * The callback function takes the following arguments:
   *    {object} event The event received from the devtools panel.
   *    {function} sendEvent A function for sending an event to the devtools panel.
   * The sendEvent takes the following arguments:
   *    {string} eventType The event type to send.
   *    {object} params The optional data associated with the event.
   */
  myWebPage.on('preload', function (event, sendEvent) {
      // Overriding the original Web Audio API
      if ('AudioContext' in global) {
        mAudioContextClass = global.AudioContext;
        global.AudioContext = wagiAudioContext;
      }
      if ('webkitAudioContext' in global) {
        mAudioContextClass = global.webkitAudioContext;
        global.webkitAudioContext = wagiAudioContext;
      }
      if (mAudioContextClass === null) {
        console.error('Web Audio is not supported.');
      }

      function nameOf(pFunction) {
        var tString = pFunction.toString();
        var tIndex = tString.indexOf('function ');
        if (tIndex === -1) {
          return tString;
        }
        tString = tString.substring(tIndex + 9);
        var tIndex = tString.indexOf('(');
        if (tIndex === -1) {
          return tString;
        }
        return tString.substring(0, tIndex);
      }

      function extendAndExpose(pCtor, pSuper, pName) {
        pCtor.prototype = Object.create(pSuper.prototype);
        pCtor.prototype.constructor = pCtor;
        myWebPage[nameOf(pCtor)] = pCtor;
      }

      // Graph node class for tracking the audio graph.
      function GraphNode(pType, pAudioNode) {
        this.type = pType;
        this.id = mNodeId++;
        this.upstream = [];
        this.downstream = [];
        this.data = pAudioNode;
      }


      // Inheritance (for classes to extend GraphNode)
      (function (pSuper) {
        var doOverrideConnect = function () {
          var tSelf = this;
          var tWebAudioNode = this.data;
          var tConnect = tWebAudioNode.connect;
          tWebAudioNode.connect = function () {
            var tFirstParam = arguments[0];
            var tOutputIndex = arguments[1];
            var tInputIndex = arguments[2];
            if (!tFirstParam) {
              console.warn('[WAGI] AudioNode.connect: Called without the first param.');
            } else {
              var tDestination = tFirstParam.__wagiNodeInfo;
              if (!tDestination) {
                // TODO: support connect(AudioParam destination)
              } else {
                var tUpstream = tDestination.upstream, i, tCanConnect = true;
                for (i = tUpstream.length; i--; ) {
                  if (tUpstream[i].node === tSelf && tUpstream[i].output === tOutputIndex) {
                    console.warn('[WAGI] AudioNode.connect: Allready connected');
                    tCanConnct = false;
                    break;
                  }
                }
                if (tCanConnect) {
                  var tDownstream = tSelf.downstream;
                  for (i = tDownstream.length; i--; ) {
                    if (tDownstream[i].node === tDestination && tDownstream[i].input === tInputIndex) {
                      console.warn('[WAGI] AudioNode.connect: Allready connected');
                      tCanConnct = false;
                      break;
                    }
                  }
                }

                if (tCanConnect) {
                  tDestination.upstream.push({
                    node: tSelf,
                    output: tOutputIndex
                  });
                  tSelf.downstream.push({
                    node: tDestination,
                    input: tInputIndex
                  });
                }
              }
            }
            return tConnect.apply(tWebAudioNode, arguments);
          };
        };

        var doOverrideDisonnect = function () {
          var tSelf = this;
          var tWebAudioNode = this.data;
          var tDisconnect = tWebAudioNode.disconnect;
          tWebAudioNode.disconnect = function () {
            var tOutputIndex = arguments[0];
            var tDownstream = tSelf.downstream, tUpstream;
            var doDisconnect = function (pDownstream, pIndex, pOutputIndex) {
              var tRemoved = pDownstream.splice(pIndex, 1);
              var tUpstream = tRemoved[0].node.upstream;
              for (var i = tUpstream.length; i--; ) {
                if (tUpstream[i].node === tSelf) {
                  if (pOutputIndex === void 0) {
                    tUpstream.splice(i, 1);
                  } else {
                    if (tUpstream[i].output === pOutputIndex) {
                      tUpstream.splice(i, 1);
                    }
                  }
                }
              }
            }; // doDisconnect

            for (var i = tDownstream.length; i--; ) {
              doDisconnect(tDownstream, i, tOutputIndex);
            }
            return tDisconnect.apply(tWebAudioNode, arguments);
          };
        };

        // AudioSourceNode
        function AudioSourceNode(pType, pAudioNode) {
          pSuper.call(this, pType, pAudioNode);
          mSource.push(this);
          doOverrideConnect.call(this);
          doOverrideDisonnect.call(this);
        }
        extendAndExpose(AudioSourceNode, pSuper);

        // IntermediateNode
        function IntermediateNode(pType, pAudioNode) {
          pSuper.call(this, pType, pAudioNode);
          mIntermediate.push(this);
          doOverrideConnect.call(this);
          doOverrideDisonnect.call(this);
        }
        extendAndExpose(IntermediateNode, pSuper);

        // AudioDestinationNode
        function AudioDestinationNode(pType, pAudioNode) {
          pSuper.call(this, pType, pAudioNode);
          mDestination.push(this);
        }
        extendAndExpose(AudioDestinationNode, pSuper);
      } (GraphNode));

      // Inheritance (for classes to extend AudioSourceNode)
      (function (pSuper) {
        // BufferSourceNode
        function BufferSourceNode (pAudioNode) {
          pSuper.call(this, 'BufferSouceNode', pAudioNode);
        }
        extendAndExpose(BufferSourceNode, pSuper);

        // MediaElementSourceNode
        function MediaElementSourceNode(pAudioNode) {
          pSuper.call(this, 'MediaElementSourceNode', pAudioNode);
        }
        extendAndExpose(MediaElementSourceNode, pSuper);

        // MediaStreamSourceNode
        function MediaStreamSourceNode(pAudioNode) {
          pSuper.call(this, 'MediaStreamSourceNode', pAudioNode);
        }
        extendAndExpose(MediaStreamSourceNode, pSuper);

        // OscillatorNode
        function OscillatorNode(pAudioNode) {
          pSuper.call(this, 'OscillatorNode', pAudioNode);
        }
        extendAndExpose(OscillatorNode, pSuper);

      } (myWebPage.AudioSourceNode));

      var BufferSourceNode = myWebPage.BufferSourceNode;
      var MediaElementSourceNode = myWebPage.MediaElementSourceNode;
      var MediaStreamSourceNode = myWebPage.MediaStreamSourceNode;
      var OscillatorNode = myWebPage.OscillatorNode;

      // Inheritance (for classes to extend IntermediateNode)
      (function (pSuper) {

        // ScriptProcessorNode
        function ScriptProcessorNode (pAudioNode) {
          pSuper.call(this, 'ScriptProcessorNode', pAudioNode);
        }
        extendAndExpose(ScriptProcessorNode, pSuper);

        // AnalyserNode
        function AnalyserNode (pAudioNode) {
          pSuper.call(this, 'AnalyserNode', pAudioNode);
        }
        extendAndExpose(AnalyserNode, pSuper);

        // GainNode
        function GainNode (pAudioNode) {
          pSuper.call(this, 'GainNode', pAudioNode);
        }
        extendAndExpose(GainNode, pSuper);

        // DelayNode
        function DelayNode (pAudioNode) {
          pSuper.call(this, 'DelayNode', pAudioNode);
        }
        extendAndExpose(DelayNode, pSuper);

        // BiquadFilterNode
        function BiquadFilterNode (pAudioNode) {
          pSuper.call(this, 'BiquadFilterNode', pAudioNode);
        }
        extendAndExpose(BiquadFilterNode, pSuper);

        // WaveShaperNode
        function WaveShaperNode (pAudioNode) {
          pSuper.call(this, 'WaveShaperNode', pAudioNode);
        }
        extendAndExpose(WaveShaperNode, pSuper);

        // PannerNode
        function PannerNode (pAudioNode) {
          pSuper.call(this, 'PannerNode', pAudioNode);
        }
        extendAndExpose(PannerNode, pSuper);

        // ConvolverNode
        function ConvolverNode (pAudioNode) {
          pSuper.call(this, 'ConvolverNode', pAudioNode);
        }
        extendAndExpose(ConvolverNode, pSuper);

        // ChannelSplitterNode
        function ChannelSplitterNode (pAudioNode) {
          pSuper.call(this, 'ChannelSplitterNode', pAudioNode);
        }
        extendAndExpose(ChannelSplitterNode, pSuper);

        // ChannelMergerNode
        function ChannelMergerNode (pAudioNode) {
          pSuper.call(this, 'ChannelMergerNode', pAudioNode);
        }
        extendAndExpose(ChannelMergerNode, pSuper);

        // DynamicsCompressorNode
        function DynamicsCompressorNode (pAudioNode) {
          pSuper.call(this, 'DynamicsCompressorNode', pAudioNode);
        }
        extendAndExpose(DynamicsCompressorNode, pSuper);

      } (myWebPage.IntermediateNode));

      var ScriptProcessorNode = myWebPage.ScriptProcessorNode;
      var AnalyserNode = myWebPage.AnalyserNode;
      var GainNode = myWebPage.GainNode;
      var DelayNode = myWebPage.DelayNode;
      var BiquadFilterNode = myWebPage.BiquadFilterNode;
      var WaveShaperNode = myWebPage.WaveShaperNode;
      var PannerNode = myWebPage.PannerNode;
      var ConvolverNode = myWebPage.ConvolverNode;
      var ChannelSplitterNode = myWebPage.ChannelSplitterNode;
      var ChannelMergerNode = myWebPage.ChannelMergerNode;
      var DynamicsCompressorNode = myWebPage.DynamicsCompressorNode;

      // Inheritance (for classes to extend AudioDestinationNode)
      (function (pSuper) {
        // AudioContext.destination 
        function AudioContextDestinationNode(pAudioNode) {
          pSuper.call(this, 'AudioContextDestinationNode', pAudioNode);
        }
        extendAndExpose(AudioContextDestinationNode, pSuper);

        // MediaStreamDestinationNode
        function MediaStreamDestinationNode(pAudioNode) {
          pSuper.call(this, 'MediaStreamDestinationNode', pAudioNode);
        }
        extendAndExpose(MediaStreamDestinationNode, pSuper);

      } (myWebPage.AudioDestinationNode));

      var AudioContextDestinationNode = myWebPage.AudioContextDestinationNode;
      var MediaStreamDestinationNode = myWebPage.MediaStreamDestinationNode;


      // Fake AudioContext for interception.
      function wagiAudioContext() {
        this._context = new mAudioContextClass();
        mCurrentAudioContext = this;
        mSource.length = 0;
        mIntermediate.length = 0;
        mDestination.length = 0;
        mNodeId = 0;
        var tDestination = this._context.destination;
        tDestination.__wagiNodeInfo = new AudioContextDestinationNode(tDestination);
      }

      // Readonly properties.
      wagiAudioContext.prototype.__defineGetter__('destination', function () {
          return this._context.destination;
          });
      wagiAudioContext.prototype.__defineGetter__('sampleRate', function () {
          return this._context.sampleRate;
          });
      wagiAudioContext.prototype.__defineGetter__('currentTime', function () {
          return this._context.currentTime;
          });
      wagiAudioContext.prototype.__defineGetter__('listener', function () {
          return this._context.listener;
          });
      wagiAudioContext.prototype.__defineGetter__('activeSourceCount', function () {
          return this._context.activeSourceCount;
          });

      // Source node creation methods.
      wagiAudioContext.prototype.createBufferSource = function () {
        var tNode = this._context.createBufferSource.apply(this._context, arguments);
        tNode.__wagiNodeInfo = new BufferSourceNode(tNode);
        return tNode;
      };
      wagiAudioContext.prototype.createMediaElementSource = function () {
        var tNode = this._context.createMediaElementSource.apply(this._context, arguments);
        tNode.__wagiNodeInfo = new MediaElementSourceNode(tNode);
        return tNode;
      };
      wagiAudioContext.prototype.createMediaStreamSource = function () {
        var tNode = this._context.createMediaStreamSource.apply(this._context, arguments);
        tNode.__wagiNodeInfo = new MediaStreamSourceNode(tNode);
        return tNode;
      };
      wagiAudioContext.prototype.createOscillator = function () {
        var tNode = this._context.createOscillator.apply(this._context, arguments);
        tNode.__wagiNodeInfo = new OscillatorNode(tNode);
        return tNode;
      };

      // Intermediate node creation methods.
      wagiAudioContext.prototype.createScriptProcessor = function () {
        var tNode = this._context.createScriptProcessor.apply(this._context, arguments);
        tNode.__wagiNodeInfo = new ScriptProcessorNode(tNode);
        return tNode;
      };
      wagiAudioContext.prototype.createJavaScriptNode = function () {
        var tNode = this._context.createJavaScriptNode.apply(this._context, arguments);
        tNode.__wagiNodeInfo = new ScriptProcessorNode(tNode);
        return tNode;
      };
      wagiAudioContext.prototype.createAnalyser = function () {
        var tNode = this._context.createAnalyser.apply(this._context, arguments);
        tNode.__wagiNodeInfo = new AnalyserNode(tNode);
        return tNode;
      };
      wagiAudioContext.prototype.createGain = function () {
        var tNode = this._context.createGain.apply(this._context, arguments);
        tNode.__wagiNodeInfo = new GainNode(tNode);
        return tNode;
      };
      wagiAudioContext.prototype.createGainNode = function () {
        var tNode = this._context.createGainNode.apply(this._context, arguments);
        tNode.__wagiNodeInfo = new GainNode(tNode);
        return tNode;
      };
      wagiAudioContext.prototype.createDelay = function () {
        var tNode = this._context.createDelay.apply(this._context, arguments);
        tNode.__wagiNodeInfo = new DelayNode(tNode);
        return tNode;
      };
      wagiAudioContext.prototype.createDelayNode = function () {
        var tNode = this._context.createDelayNode.apply(this._context, arguments);
        tNode.__wagiNodeInfo = new DelayNode(tNode);
        return tNode;
      };
      wagiAudioContext.prototype.createBiquadFilter = function () {
        var tNode = this._context.createBiquadFilter.apply(this._context, arguments);
        tNode.__wagiNodeInfo = new BiquadFilterNode(tNode);
        return tNode;
      };
      wagiAudioContext.prototype.createWaveShaper = function () {
        var tNode = this._context.createWaveShaper.apply(this._context, arguments);
        tNode.__wagiNodeInfo = new WaveShaperNode(tNode);
        return tNode;
      };
      wagiAudioContext.prototype.createPanner = function () {
        var tNode = this._context.createPanner.apply(this._context, arguments);
        tNode.__wagiNodeInfo = new PannerNode(tNode);
        return tNode;
      };
      wagiAudioContext.prototype.createConvolver = function () {
        var tNode = this._context.createConvolver.apply(this._context, arguments);
        tNode.__wagiNodeInfo = new ConvolverNode(tNode);
        return tNode;
      };
      wagiAudioContext.prototype.createChannelSplitter = function () {
        var tNode = this._context.createChannelSplitter.apply(this._context, arguments);
        tNode.__wagiNodeInfo = new ChannelSplitterNode(tNode);
        return tNode;
      };
      wagiAudioContext.prototype.createChannelMerger = function () {
        var tNode = this._context.createChannelMerger.apply(this._context, arguments);
        tNode.__wagiNodeInfo = new ChannelMergerNode(tNode);
        return tNode;
      };
      wagiAudioContext.prototype.createDynamicsCompressor = function () {
        var tNode = this._context.createDynamicsCompressor.apply(this._context, arguments);
        tNode.__wagiNodeInfo = new DynamicsCompressorNode(tNode);
        return tNode;
      };

      // Destination node creation methods.
      wagiAudioContext.prototype.createMediaStreamDestination = function () {
        var tNode = this._context.createMediaStreamDestination.apply(this._context, arguments);
        tNode.__wagiNodeInfo = new MediaStreamDestinationNode(tNode);
        return tNode;
      };

      // Other methods (just wrappers)
      wagiAudioContext.prototype.createBuffer = function () {
        return mAudioContextClass.prototype.createBuffer.apply(this._context, arguments);
      };
      wagiAudioContext.prototype.decodeAudioData = function () {
        mAudioContextClass.prototype.decodeAudioData.apply(this._context, arguments);
      };
      wagiAudioContext.prototype.createWaveTable = function () {
        return mAudioContextClass.prototype.createWaveTable.apply(this._context, arguments);
      };

      wagiAudioContext.prototype.toJSON = function () {
        var tList = [], i, il, tNode, tStream;
        var printAdjacent = function (pAdjacent) {
          var tList = [], i, il;
          tList.push('[');
          for (i = 0, il = pAdjacent.length; i < il; i++) {
            tInfo = pAdjacent[i];
            tList.push('{');
            tList.push('"node" : ' + printNode(tInfo.node));
            if (tInfo.input !== void 0) {
              tList.push(', "input" : ' + tInfo.input);
            }
            if (tInfo.output !== void 0) {
              tList.push(', "output" : ' + tInfo.output);
            }
            if (i === il - 1) {
              tList.push('}');
            } else {
              tList.push('},');
            }
          }
          tList.push(']');
          return tList.join('');
        };
        var printNode = function (pNode, pPrintAdjacent) {
          var tList = [];
          tList.push('{');
          tList.push('"type" : ' + pNode.type + ',');
          tList.push('"id" : ' + pNode.id + ',');
          if (pPrintAdjacent) {
            tList.push('"upstream" : ' + printAdjacent(pNode.upstream) + ',');
            tList.push('"downstream" : ' + printAdjacent(pNode.downstream));
          }
          tList.push('}');
          return tList.join('');
        };
        tList.push('{');
        tList.push('"source" : [');
        for (i = 0, il = mSource.length; i < il; i++) {
          tList.push(printNode(mSource[i], true));
          if (i !== il - 1) {
            tList.push(',');
          }
        }
        tList.push('],');
        tList.push('"intermediate" : [');
        for (i = 0, il = mIntermediate.length; i < il; i++) {
          tList.push(printNode(mIntermediate[i], true));
          if (i !== il - 1) {
            tList.push(',');
          }
        }
        tList.push('],');
        tList.push('"desitination" : [');
        for (i = 0, il = mDestination.length; i < il; i++) {
          tList.push(printNode(mDestination[i], true));
          if (i !== il - 1) {
            tList.push(',');
          }
        }
        tList.push(']');
        tList.push('}');
        return tList.join('');
      };
  });

  myWebPage.on('capture', function (event, sendEvent) {
    sendEvent('snapshot', {context: mCurrentAudioContext});
  });
};
