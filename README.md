A local, practically-RESTful API on the Sphero robotic ball by Orbotix.

It's based on the spheron module (registered in npm) and uses the Express framework and RAML.

Only tested on a Mac running Mavericks version of OSX and a Sphero 2.0.

Installation
-----------

    npm install

You must also have paired your Sphero with your Mac via bluetooth.

When your Sphero is on, it'll flash three colors, e.g. Yellow Green Yellow.
Look in your `/dev` folder for something like `/dev/cu.Sphero-YGY-AMP-SPP`
and note that 'YGY' is replaced with the three colors your Sphero is flashing;
e.g. if it's flashing Red Blue Red you'll find `/dev/cu.Sphero-RBR-AMP-SPP`.
Open up app.js and change the `spheroPort` accordingly.

Usage
-----

    node app

Your API is available at http://localhost:5000 and the API definition
is at http://localhost:5000/api.raml -- see http://raml.org for more information.
