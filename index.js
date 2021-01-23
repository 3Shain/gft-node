
const express = require('express');
const got = require('got');
const bodyParser = require('body-parser');
const convert = require('xml-js');


const app = express();
const port = process.env.PORT || 80;

async function getServerList(request) {
    const androidRes = (await got.default.post(`http://gfcn-transit.gw.sunborngame.com/index.php`, {
        headers:{
            "content-type":"application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
            c: 'game',
            a: 'newserverList',
            channel: 'cn_mica',
            device: 'adr',
            platformChannelId: 'GWGW',
            check_version: request.body.check_version,
            rnd: request.body.rnd
        }).toString()
    })).body;
    const iosRes = (await got.default.post(`http://gfcn-transit.ios.sunborngame.com/index.php`, {
        headers:{
            "content-type":"application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
            c: 'game',
            a: 'newserverList',
            channel: 'cn_appstore',
            device: 'ios',
            platformChannelId: 'ios',
            rnd: request.body.rnd
        }).toString()
    })).body;
    const objAndroidRes = JSON.parse(convert.xml2json(androidRes, { compact: true }));
    const objiosRes = JSON.parse(convert.xml2json(iosRes, { compact: true }));
    const constructed = {
        "_declaration": { "_attributes": { "version": "1.0", "encoding": "utf-8" } },
        "servers": {
            "server": [
                objAndroidRes["servers"]["server"].map(x=>{
                    x.name._text = "[安卓]"+x.name._text;
                    return x;
                })[0],
                objiosRes["servers"]["server"].map(x=>{
                    x.name._text = "[iOS]"+x.name._text;
                    return x;
                })[0]
            ],
            "config": objiosRes["servers"]["config"]
        }
    };

    return convert.json2xml(constructed, { compact: true });
}
app.use(bodyParser.urlencoded({
    extended: true
}));
app.post('/index.php', async (request, response) => {
    if (request.body.a == 'newserverList') {
        const list = await getServerList(request);
        response.status(200).send(list);
    } else {
        const res = (await got.default.post(`http://${request.hostname}${request.originalUrl}`, {
            headers: request.headers,
            body: new URLSearchParams(request.body).toString(),
        }));
        for (const key in res.headers) {
            response.header(key, res.headers[key]);
        }
        response.status(res.statusCode).send(res.body);
    }
});

app.listen(port);

console.log("server started");

process.on('SIGINT', () => {
  console.info("interrupted")
  process.exit(0)
});