const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb');
const { ServerResponse } = require('http');

const app = express();
app.set('views', __dirname + '/views')
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'))

let uri;

if (process.env.NODE_ENV == "production") {
    uri = process.env.MONGODB_URI;
} else {
    uri = `mongodb+srv://advaythp:${require(__dirname + '/modules/ignore.js')['password']}@quiz-bowl.tdloffa.mongodb.net/?retryWrites=true&w=majority&appName=quiz-bowl`;
}

let client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

//#region helper-functions

function toTitle(s) {
    let slist = s.split("-")
    for (var i = 0; i < slist.length; i++) {
        if (slist[i].includes('__')) {
            slist[i] = (slist[i].slice(0, -2)).toUpperCase();
        } else {
            let letter1 = slist[i].charAt(0);
            let remaining = slist[i].slice(1);
            slist[i] = letter1.toUpperCase() + remaining;
        }
    }
    return slist.join(" ")
}

function antiTitle(s) {
    if ((s[1].toLowerCase()) != s[1]) {
        s += "__";
    }
    s = s.toLowerCase()
    return (s.split(' ')).join('-');
}

//#endregion

app.get("/", (req, res) => {
    res.render("pages/home")
});

app.get("/home", (req, res) => {
    res.redirect("/")
});

const cats = ['fine-arts', 'history', 'literature', 'rmpss__', 'science']
const subcatsMap = new Map([['fine-arts', ['auditory-fine-arts', 'visual-fine-arts', 'other-fine-arts']], ['history', ['american-history', 'european-history', 'world-history', 'ancient-history']], ['literature', ['american-literature', 'british-literature', 'european-literature', 'world-literature']], ['rmpss__', ['religion', 'mythology', 'philosophy', 'social-science']], ['science', ['biology', 'chemistry', 'physics', 'math', 'other-science']]])

async function getQBData(cat, subcat, topic='') {
    let tossups = [];
    try {
        await client.connect();
        cat = client.db(cat);
        subcat = cat.collection(subcat);
        let topics;
        if (topic == '') {
            topics = subcat.find({});
        } else {
            topics = subcat.find({answers: topic});
        }
        for await (const tossup of topics) {
            tossups.push(tossup)
        }
    } finally {
        await client.close();
        return tossups;
    }
}

app.get("/tossup", (req, res) => {
    res.render("pages/tossup")
})

app.get("/card", (req, res) => {
    res.render("pages/card")
})

app.get("/database", (req, res) => {
    res.render("pages/database")
})

app.get('/database/:cat', (req, res) => {
    let rp = req.params;
    if (cats.includes(rp.cat)) {
        let subcats = subcatsMap.get(rp.cat);
        let nameDir = [];
        let pathDir = [];
        for (var x in subcats) {
            nameDir.push(toTitle(subcats[x]));
            pathDir.push(`/database/${rp.cat}/${subcats[x]}`);
        }
        res.render("templates/database_cat", {cat: toTitle(rp.cat), data: nameDir, path: pathDir});
    }
})

app.get('/database/:cat/:subcat', async (req, res) => {
    let rp = req.params;
    if (cats.includes(rp.cat) && (subcatsMap.get(rp.cat)).includes(rp.subcat)) {
        let topics = await getQBData(rp.cat, rp.subcat).catch(console.dir);
        let nameDir = [];
        let pathDir = [];
        for (var x = 0; x < topics.length; x++) {
            nameDir[x] = (topics[x].answers)[0]
            pathDir[x] = `/database/${rp.cat}/${rp.subcat}/${antiTitle(nameDir[x])}`;
        }
        res.render("templates/database_subcat", {cat: toTitle(rp.cat), catraw: rp.cat, subcat: toTitle(rp.subcat), data: nameDir, path: pathDir});
    }
})

app.get('/database/:cat/:subcat/:topic', async (req, res) => {
    let rp = req.params;
    let topicData = await getQBData(rp.cat, rp.subcat, toTitle(rp.topic)).catch(console.dir);
    topicData = topicData[0];
    res.render("templates/database_topic", {cat: toTitle(rp.cat), catraw: rp.cat, subcat: toTitle(rp.subcat), subcatraw: rp.subcat, data: topicData});
})

app.get('/qb', async function(req, res) {
    if (req.query.qs) {
        var query = JSON.parse(req.query.qs);
        await client.connect()
        var cat = client.db(req.query.cat);
        var subcat = cat.collection(req.query.subcat);
        var r = []
        var answers = subcat.find(query)
        for await (const answer of answers) {
            r.push(answer);
        }
        await client.close()
        res.send(r[0]);
    } else {
        var r = new Map();
        await client.connect()
        for (x in cats) {
            var cat = client.db(cats[x])
            var subcats = subcatsMap.get(cats[x])
            for (y in subcats) {
                var hold = []
                var subcat = cat.collection(subcats[y])
                var topics = subcat.find({})
                for await (const topic of topics) {
                    hold.push(topic.answers[0]);
                }
                r.set(subcats[y], hold)
            }
        }
        r = JSON.parse(JSON.stringify(Object.fromEntries(r)));
        await client.close()
        res.json(r);
    }
})

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on port: ${PORT}`))