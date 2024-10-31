let tossup = '';
let enterFunction = "write";
let buzz = false;
let data;

//#region helper-functions

String.prototype.interpolate = function(params) {
    const names = Object.keys(params);
    const vals = Object.values(params);
    return new Function(...names, `return \`${this}\`;`)(...vals);
}

function setCookie(cname, cvalue, exdays) {
    const d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    let expires = "expires="+ d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
    let name = cname + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    for(let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

function checkCookie(name) {
    if (getCookie(name) != "") {
        return getCookie(name);
    }
    return false;
}

function replacePronouns(clue, p) {
    return clue.interpolate({Pronoun: p, pronoun: lowerLetterOne(p), Possessive: possessiveForm(p), possessive: lowerLetterOne(possessiveForm(p)), OPronoun: objectForm(p), opronoun: lowerLetterOne(objectForm(p)), Plural: pluralForm(p), plural: lowerLetterOne(pluralForm(p))});
}

function randint(max, min=0) {
    return Math.floor(min + Math.random() * max);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function toTitle(s) {
    var irregulars = ['the', 'a'];
    if (s.includes('__')) {
        return (s.slice(0, -2)).toUpperCase()
    }
    let slist = s.split("-")
    if (slist.length == 1) {
        slist = s.split(" ");
    }
    for (var i = 0; i < slist.length; i++) {
        if (!irregulars.includes(slist[i])) {
            let letter1 = slist[i].charAt(0)
            let remaining = slist[i].slice(1)
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

function lowerLetterOne(s) {
    return s[0].toLowerCase() + s.slice(1);
}

function raiseLetterOne(s) {
    return s[0].toUpperCase() + s.slice(1);
}

function objectForm(p) {
    let irregulars = new Map([["He", "Him"], ["She", "Her"], ["They", "Them"]]);
    if (irregulars.has(p)) {
        return irregulars.get(p)
    } else {
        return p
    }
}

function possessiveForm(p) {
    let irregulars = new Map([["He", "His"], ["She", "Hers"], ["Who", "Whose"], ['They', "Their"]]);
    if (irregulars.has(p)) {
        return irregulars.get(p)
    } else {
        return p + "'s"
    }
}

function pluralForm(p) {
    let irregulars = new Map([["It", "These"], ["This", "These"]]);
    var ps = p.split(" ");
    var pout = '';
    for (var s in ps) {
        if (irregulars.has(ps[s])) {
            pout += irregulars.get(ps[s]) + ' ';
        } else {
            pout += ps[s] + 's ';
        }
    }
    return pout.slice(0, -1);
}

//#endregion

//#region main-functions

let cat2subcat = new Map([['fine-arts', ['auditory-fine-arts', 'visual-fine-arts', 'other-fine-arts']], ['history', ['american-history', 'european-history', 'world-history', 'ancient-history']], ['literature', ['american-literature', 'british-literature', 'european-literature', 'world-literature']], ['rmpss__', ['religion', 'mythology', 'philosophy', 'social-science']], ['science', ['biology', 'chemistry', 'physics', 'math', 'other-science']]]);
let subcat2topic = new Map();

async function onEnter(e) {
    if (e.keyCode === 13) {
        if (enterFunction == 'write') {
            requestTossup();
        } else if (enterFunction == 'buzz') {
            buzz = true;
            enterFunction = 'write';
        }
        await sleep(100);
    }
}

async function getSearchBtns(searchby, searchkey) {
    var searchbtns = document.getElementsByClassName('searchbtn');
    while (searchbtns[0]) {
        searchbtns[0].parentNode.removeChild(searchbtns[0]);
    }
    var searchbtns = [];
    if (searchby.value == 'cat') {
        var cats = Array.from(cat2subcat.keys())
        for (var x in cats) {
            if ((toTitle(cats[x]).toLowerCase()).includes((searchkey.value).toLowerCase())) {
                searchbtns[searchbtns.length] = document.createElement('button');
                    searchbtns[searchbtns.length - 1].index = searchbtns.length - 1;
                    searchbtns[searchbtns.length - 1].innerHTML = toTitle(cats[x]);
                    searchbtns[searchbtns.length - 1].classList = 'searchbtn';
                    searchbtns[searchbtns.length - 1].addEventListener('click', function(e) {
                        searchkey.value = searchbtns[e.currentTarget.index].innerHTML;
                        getSearchBtns(searchby, searchkey);
                    })
                    document.getElementsByClassName('searchbtns')[0].appendChild(searchbtns[searchbtns.length - 1]);
            }
        }
    } else if (searchby.value == 'subcat') {
        var cats = Array.from(cat2subcat.keys())
        for (var x in cats) {
            var subcats = cat2subcat.get(cats[x])
            for (var y in subcats) {
                if ((toTitle(subcats[y]).toLowerCase()).includes((searchkey.value).toLowerCase())) {
                    searchbtns[searchbtns.length] = document.createElement('button');
                    searchbtns[searchbtns.length - 1].index = searchbtns.length - 1;
                    searchbtns[searchbtns.length - 1].innerHTML = toTitle(subcats[y]);
                    searchbtns[searchbtns.length - 1].classList = 'searchbtn';
                    searchbtns[searchbtns.length - 1].addEventListener('click', function(e) {
                        searchkey.value = searchbtns[e.currentTarget.index].innerHTML;
                        getSearchBtns(searchby, searchkey);
                    })
                    document.getElementsByClassName('searchbtns')[0].appendChild(searchbtns[searchbtns.length - 1]);
                }
            }
        }
    } else if (searchby.value == 'topic') {
        var cats = Array.from(cat2subcat.keys())
        for (var x in cats) {
            var subcats = cat2subcat.get(cats[x])
            for (var y in subcats) {
                var topics = subcat2topic.get(subcats[y])
                for (var z in topics) {
                    if ((toTitle(topics[z]).toLowerCase()).includes((searchkey.value).toLowerCase())) {
                        searchbtns[searchbtns.length] = document.createElement('button');
                        searchbtns[searchbtns.length - 1].index = searchbtns.length - 1;
                        searchbtns[searchbtns.length - 1].innerHTML = toTitle(topics[z]);
                        searchbtns[searchbtns.length - 1].classList = 'searchbtn';
                        searchbtns[searchbtns.length - 1].addEventListener('click', function(e) {
                            searchkey.value = searchbtns[e.currentTarget.index].innerHTML;
                            getSearchBtns(searchby, searchkey);
                        })
                        document.getElementsByClassName('searchbtns')[0].appendChild(searchbtns[searchbtns.length - 1]);
                        break;
                    }
                }
            }
        }
    }
}

//#endregion

//#region tossup

const writeby = document.getElementById('writeby');
const write = document.getElementById('writebtn');
const writekey = document.getElementById('writekey');

function afterBuzz(data) {
    const answerbox = document.getElementById("answerbox");
    const answer = document.getElementById("answer");
    answer.style.display = 'initial';
    const writereq = document.getElementById('writereq');
    writereq.style.display = 'initial';
    document.getElementById('buzzer').style.display = 'none';

    let answers = data['answers'];
    answer.innerHTML = "Incorrect!"
    for (var i = 0; i < answers.length; i++) {
        if (toTitle(answers[i]).toLowerCase() == (answerbox.value).toLowerCase()) {
            answer.innerHTML = "Correct!";
            break;
        }
    }

    answerbox.innerHTML = '';
    answerbox.style.display = 'none';
    answer.innerHTML += ` <b>Answer: </b>${answers[0]}`;
}

async function slowType(element, timer, text, data) {
    let texts = text.split(" ");
    for (var i = 0; i < texts.length; i++) {
        if (!buzz) {
            element.innerHTML += `${texts[i]} `;
            await sleep(400);
        } else {
            element.innerHTML = text
            afterBuzz(data);
            break;
        }
    }
    if (!buzz) {
        for (var i = 0; i < 100; i++) {
            if (!buzz) {
                await sleep(100);
                timer.innerHTML = Math.round(10*(parseFloat(timer.innerHTML) - 0.1))/10;
            } else {
                element.innerHTML = text;
                afterBuzz(data);
                break;
            }
        }
    }
    if (!buzz) {
        afterBuzz(data);
    }
}

async function writeTossup(data) {
    let clues = data['personal'];
    let pronouns = data['pronouns'];
    let diffs = ['hard', 'medium', 'easy'];
    tossup = '';
    let cluenums = 6;

    for (var i = 0; i < cluenums; i++) {
        let p = pronouns[randint(pronouns.length)];
        let t = randint(clues[diffs[Math.floor(i/2)]].length)
        let clue = clues[diffs[Math.floor(i/2)]][t];
        clues[diffs[Math.floor(i/2)]].splice(t, 1);
        if (i == 0) {
            p = pronouns[0];
            clue = replacePronouns(clue, p);
            tossup += clue + ". ";
        } else if (i == cluenums - 1) {
            if (['it', 'they'].includes(pronouns[pronouns.length - 2].toLowerCase())) {
                p = 'what';
            } else {
                p = 'who';
            }
            clue = replacePronouns(clue, p);
            tossup += `For ten points, ${lowerLetterOne(clue)}?`;
        } else {
            clue = replacePronouns(clue, p);
            tossup += clue + ". ";
        }
    }
    const writereq = document.getElementById('writereq');
    writereq.style.display = 'none';
    const tossupcontainer = document.getElementById('tossupcontainer');
    tossupcontainer.style.display = 'initial';
    const tossupbox = document.getElementById('tossupbox');
    tossupbox.innerHTML = '';
    const timer = document.getElementById('timer');
    timer.innerHTML = '10.0';
    timer.style.display = 'initial';
    const answerbox = document.getElementById('answerbox');
    answerbox.style.display = 'initial';
    answerbox.value = '';
    const answer = document.getElementById('answer');
    answer.style.display = 'none';
    const buzzer = document.getElementById('buzzer');
    buzzer.style.display = 'initial';
    buzz = false;
    enterFunction = 'buzz';
    buzzer.addEventListener('click', function() {
        buzz = true;
        enterFunction = 'write';
    })
    slowType(tossupbox, timer, tossup, data);
}

async function requestTossup() {
    if (writeby.value == 'random') {
        var index = randint(cat2subcat.size)
        var cat = Array.from(cat2subcat.keys())[index];
        var index2 = randint((cat2subcat.get(cat)).length)
        var subcat = (cat2subcat.get(cat))[index2]
        console.log(subcat, subcat2topic.get(subcat))
        var index3 = randint((subcat2topic.get(subcat)).length)
        var topic = subcat2topic.get(subcat)[index3];
        var queryString = JSON.stringify({"answers": topic})
        const Http = new XMLHttpRequest();
        const url = '/qb?cat='+cat+'&subcat='+subcat+'&qs='+queryString
        Http.open("GET", url);
        Http.onreadystatechange = function() {
            if (Http.readyState == 4 && Http.status == 200) {
                console.log(Http.response)
                writeTossup(JSON.parse(Http.response));
            }
        }
        Http.send();
    } else if (writeby.value == 'cat') {
        var cat = antiTitle(writekey.value)
        var index = randint((cat2subcat.get(cat)).length)
        var subcat = (cat2subcat.get(cat))[index]
        var index2 = randint((subcat2topic.get(subcat)).length)
        var topic = subcat2topic.get(subcat)[index2];
        var queryString = JSON.stringify({"answers": topic})
        const Http = new XMLHttpRequest();
        const url = '/qb?cat='+cat+'&subcat='+subcat+'&qs='+queryString
        Http.open("GET", url);
        Http.onreadystatechange = function() {
            if (Http.readyState == 4 && Http.status == 200) {
                writeTossup(JSON.parse(Http.response));
            }
        }
        Http.send();
    } else if (writeby.value == 'subcat') {
        var v = antiTitle(writekey.value)
        cat2subcat.forEach(function(value, key, map) {
            if (value.includes(v)) {
                var index = randint((subcat2topic.get(v)).length)
                var topic = (subcat2topic.get(v))[index];
                var queryString = JSON.stringify({"answers": topic})
                const Http = new XMLHttpRequest();
                const url = '/qb?cat='+key+'&subcat='+v+'&qs='+queryString
                Http.open("GET", url);
                Http.onreadystatechange = function() {
                    if (Http.readyState == 4 && Http.status == 200) {
                        writeTossup(JSON.parse(Http.response));
                    }
                }
                Http.send();
            }
        })
    } else if (writeby.value == 'topic') {
        subcat2topic.forEach(function(value, key, map) {
            if (value.includes(writekey.value)) {
                cat2subcat.forEach(function(value2, key2, map2) {
                    if (value2.includes(key)) {
                        var queryString = JSON.stringify({"answers": (writekey.value)})
                        const Http = new XMLHttpRequest();
                        const url = '/qb?cat='+key2+'&subcat='+key+'&qs='+queryString
                        Http.open("GET", url);
                        Http.onreadystatechange = function() {
                            if (Http.readyState == 4 && Http.status == 200) {
                                writeTossup(JSON.parse(Http.response));
                            }
                        }
                        Http.send();
                    }
                })
            }
        })
    }
}

writeby.addEventListener('change', function() {
    if (writeby.value != 'random') {
        document.getElementsByClassName('searchcontainer')[0].style.display = 'inline flex';
        getSearchBtns(writeby, writekey);
    } else {
        document.getElementsByClassName('searchcontainer')[0].style.display = 'none';
    }
})

document.getElementsByClassName('searchcontainer')[0].style.display = 'none';

writekey.addEventListener('input', function () {
    getSearchBtns(writeby, writekey);
})

//#endregion
