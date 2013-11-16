var express = require('express');
var app = express();
var spheron = require('spheron');
var sphero = spheron.sphero();
var fs = require('fs');

var spheroPort = '/dev/cu.Sphero-YGY-AMP-SPP';
var apiPort = parseInt(process.env.PORT) || 5000;

app.configure(function () 
{
    app.use(express.json());
    app.use(express.urlencoded());
    app.use(cors);
});

app.get('/api.raml', getRaml);
app.get('/color', getColor);
app.put('/color', putColor);
app.put('/motion', putMotion);

start();

// Handlers:

function getRaml(request, response) 
{
    var raml = fs.readFileSync('.' + request.route.path);
    response.type('text/yaml').send(raml);
}

function getColor(request, response)
{
    var seqId = sequenceId++;
    packetHandlers[seqId] = function (packet)
    {
        var colorInHex = packet.DATA.toString('hex');
        console.log({ color: '0x' + colorInHex });
        response.send(200);
    }
    console.log({ requestAcknowledgement: true, SEQ: seqId });
    sphero.getRGB({ requestAcknowledgement: true, SEQ: seqId });
}

var _sequenceId = 1;
var packetHandlers = {};
function registerPacketHandler(callback)
{
    var seqId = _sequenceId++;
    packetHandlers[seqId] = callback;
    return seqId;
}
sphero.on('packet', function (packet)
{
    var seqId = packet.SEQ;
    console.log('Spheron fired SEQ: ' + seqId);
    if (seqId in packetHandlers)
    {
        packetHandlers[seqId](packet);
        delete packetHandlers[seqId];
    }
});

function putColor(request, response)
{
    var COLORS = spheron.toolbelt.COLORS;
    var color = request.body.color.toUpperCase();
    console.log('putColor: ' + color);
    var nColor = null;
    if (color in COLORS)
    {
        nColor = COLORS[color];
    }
    else if (isHex(color))
    {
        nColor = fromHex(color);
    }
    if (nColor !== null)
    {
        console.log('--> setting color to 0x' + toHex(nColor));
        sphero.setRGB(nColor, true);
        response.send({ color: ' 0x' + toHex(nColor) });
    }
    else
    {
        response.status(422).send({ message: 'Color not processable: ' + color });
    }
}

function putMotion(request, response)
{
    var heading = toInt(request.body.heading);
    var speed = toInt(request.body.speed);
    var state = toInt(request.body.state);
    console.log('putMotion: ' + [heading, speed, state]);
    if ((heading != null) && (heading != null) && (heading != null))
    {
        sphero.roll(speed, heading, state);
        response.send({ speed: speed, heading: heading, state: state });
    }
    else
    {
        response.status(422).send({ message: 'Motion not processable: ', received: request.body });
    }
}

// General stuff:

function isHex(string)
{
    var regexp = /[0-9A-F]{6}/i;
    return regexp.test(string);
}
function fromHex(hexString) 
{ 
    return parseInt(hexString, 16); 
}
function toHex(number) 
{ 
    var hexString = number.toString(16); 
    return '000000'.substr(0, 6 - hexString.length) + hexString.toUpperCase(); 
}

function toInt(string, min, max)
{
    var int = parseInt(string);
    if ((typeof int != 'number') || isNaN(int)) return null;
    if ((typeof (min) == 'number') && (int < min)) return null;
    if ((typeof (max) == 'number') && (int > max)) return null;
    return int;
}

function cors(request, response, next)
{
    if (request.method == 'OPTIONS')
    {
        response.header('Access-Control-Allow-Origin', '*');
        response.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
        response.header('Access-Control-Allow-Headers', 'Content-Type');
        response.send(200);
        console.log('Answered OPTIONS')
    }
    else
    {
        next();
    }
}

function start()
{
    // Start sphero communications:
    sphero.on('open', function()
    {
        sphero.setInactivityTimeout(6000);
        // Visually indicate the sphero is responsive:
        sphero.setRGB(0xFF00FF, true);
        setTimeout(function() { sphero.setRGB(0x0000FF, true); }, 1000);
    });
    sphero.open(spheroPort);

    // Start API server:
    app.listen(apiPort);
    console.log('API listening on port ' + apiPort);
}
