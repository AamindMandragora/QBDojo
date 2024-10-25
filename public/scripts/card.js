let tossup = '';
let enterFunction = "card";
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

const Http = new XMLHttpRequest();
Http.open("GET", '/qb')
Http.onreadystatechange = function() {
    if (Http.readyState == 4 && Http.status == 200) {
        subcat2topic = new Map(Object.entries(JSON.parse(Http.response)));
        var cats = Array.from(cat2subcat.keys())
        for (var x in cats) {
            var subcats = cat2subcat.get(cats[x])
            for (var y in subcats) {
                if (!checkCookie(subcats[y]) || getCookie(subcats[y]).length != (subcat2topic.get(subcats[y])).length) {
                    var hold = '';
                    for (var z in subcat2topic.get(subcats[y])) {
                        hold += '0';
                    }
                    setCookie(y, hold, 365);
                }
            }
        }
    }
}
Http.send();

async function onEnter(e) {
    if (e.keyCode === 13) {
        if (enterFunction == 'card') {
            requestCard();
        } else if (enterFunction == 'flip') {
            flipCard();
            enterFunction = 'card';
        }
        await sleep(100);
    }
}

document.addEventListener('keydown', onEnter);

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

//#region card

const cardby = document.getElementById('cardby');
const card = document.getElementById('cardbtn');
const cardkey = document.getElementById('cardkey');

async function flipCard() {
    let answers = data['answers'];
    const cardinput = document.getElementById('cardinput');
    cardinput.style.display = 'none';
    const cardanswer = document.getElementById('cardanswer');
    cardanswer.innerHTML = "Incorrect!";
    for (var x in answers) {
        if (toTitle(answers[x]).toLowerCase() == toTitle(cardinput.value).toLowerCase()) {
            cardanswer.innerHTML = "Correct!";
        }
    }
    var cats = Array.from(cat2subcat.keys())
    for (var x in cats) {
        var subcats = cat2subcat.get(cats[x])
        for (var y in subcats) {
            var topics = subcat2topic.get(subcats[y])
            for (var z in topics) {
                if (topics[z] == answers[0]) {
                    if (cardanswer.innerHTML == "Correct!") {
                        var oldcookie = getCookie(subcats[y]);
                        var cookie = '';
                        for (var c = 0; c < oldcookie.length; c++) {
                            if (c == z) {
                                cookie += Math.min(parseInt(oldcookie[c]) + 1, 3);
                            } else {
                                cookie += oldcookie[c];
                            }
                        }
                        setCookie(subcats[y], cookie, 365);
                    } else {
                        var oldcookie = getCookie(subcats[y]);
                        var cookie = '';
                        for (var c = 0; c < oldcookie.length; c++) {
                            if (c == z) {
                                cookie += Math.max(parseInt(oldcookie[c]) - 1, 0);
                            } else {
                                cookie += oldcookie[c];
                            }
                        }
                        setCookie(subcats[y], cookie, 365);
                    }
                }
            }
        }
    }
    cardinput.value = '';
    cardanswer.style.display = 'initial';
    cardanswer.innerHTML += ` <b>Answer:</b> ${answers[0]}`;
    const flipcard = document.getElementById('flipcard');
    flipcard.style.display = 'none';
}

let pastclue = ''

async function makeCard(d) {
    let clues = data['personal'];
    let pronouns = data['pronouns'];
    let diffs = ['easy', 'medium', 'hard'];
    let diff = diffs[d];
    clues = clues[diff];
    var clue;
    do {
        clue = clues[randint(clues.length)];
    } while (clue == pastclue)
    clue = replacePronouns(clue, pronouns[0]);
    pastclue = clue; 
    const cardcontainer = document.getElementById('cardcontainer');
    cardcontainer.style.display = 'flex';
    const cardbox = document.getElementById('cardbox');
    cardbox.innerHTML = `${raiseLetterOne(diff)} Clue: ${clue}.`;
    const cardinput = document.getElementById('cardinput');
    cardinput.style.display = 'initial';
    const cardanswer = document.getElementById('cardanswer');
    cardanswer.style.display = 'none';
    const flipcard = document.getElementById('flipcard');
    flipcard.style.display = 'initial';
    enterFunction = 'flip';
    flipcard.addEventListener('click', function () {
        flipCard();
        enterFunction = 'card';
    })
}
async function requestCard() {
    if (cardby.value == 'random') {
        do {
            var index = randint(cat2subcat.size)
            var cat = Array.from(cat2subcat.keys())[index];
            var index2 = randint((cat2subcat.get(cat)).length)
            var subcat = (cat2subcat.get(cat))[index2]
            var index3 = randint((subcat2topic.get(subcat)).length)
            var c = getCookie(subcat)[index3];
            c = c.split("");
            c = new Set(c);
            c = [...c].join("");
        } while (getCookie(subcat)[index3] == 3 && c != 3)
        var topic = subcat2topic.get(subcat)[index3];
        var queryString = JSON.stringify({"answers": topic})
        const Http = new XMLHttpRequest();
        const url = '/qb?cat='+cat+'&subcat='+subcat+'&qs='+queryString
        Http.open("GET", url);
        Http.onreadystatechange = async function() {
            await sleep(100)
            if (Http.readyState == 4 && Http.status == 200) {
                data = JSON.parse(Http.response);
                makeCard(Math.min(getCookie(subcat)[index3]), 2);
            }
        }
        Http.send();
    } else if (cardby.value == 'cat') {
        var cat = antiTitle(cardkey.value);
        do {
            var index = randint((cat2subcat.get(cat)).length)
            var subcat = (cat2subcat.get(cat))[index]
            var index2 = randint((subcat2topic.get(subcat)).length)
            var c = getCookie(subcat)[index2];
            c = c.split("");
            c = new Set(c);
            c = [...c].join("");
        } while (getCookie(subcat)[index2] == 3 && c != 3)
        var topic = subcat2topic.get(subcat)[index2];
        var queryString = JSON.stringify({"answers": topic})
        const Http = new XMLHttpRequest();
        const url = '/qb?cat='+cat+'&subcat='+subcat+'&qs='+queryString
        Http.open("GET", url);
        Http.onreadystatechange = function() {
            if (Http.readyState == 4 && Http.status == 200) {
                data = JSON.parse(Http.response);
                makeCard(Math.min(getCookie(subcat)[index2], 2));
            }
        }
        Http.send();
    } else if (cardby.value == 'subcat') {
        var v = antiTitle(cardkey.value)
        cat2subcat.forEach(function(value, key, map) {
            if (value.includes(v)) {
                do {
                    var index = randint((subcat2topic.get(v)).length)
                    var c = getCookie(v)[index];
                    c = c.split("");
                    c = new Set(c);
                    c = [...c].join("");
                } while (getCookie(v)[index] == 3 && c != 3)
                var topic = (subcat2topic.get(v))[index];
                var queryString = JSON.stringify({"answers": topic})
                const Http = new XMLHttpRequest();
                const url = '/qb?cat='+key+'&subcat='+v+'&qs='+queryString
                Http.open("GET", url);
                Http.onreadystatechange = function() {
                    if (Http.readyState == 4 && Http.status == 200) {
                        data = JSON.parse(Http.response);
                        makeCard(Math.min(getCookie(v)[index], 2));
                    }
                }
                Http.send();
            }
        })
    } else if (cardby.value == 'topic') {
        subcat2topic.forEach(function(value, key, map) {
            if (value.includes(cardkey.value)) {
                var index = value.findIndex(function(topic) {
                    return topic.toLowerCase() == (cardkey.value).toLowerCase()
                })
                cat2subcat.forEach(function(value2, key2, map2) {
                    if (value2.includes(key)) {
                        var queryString = JSON.stringify({"answers": (cardkey.value)})
                        const Http = new XMLHttpRequest();
                        const url = '/qb?cat='+key2+'&subcat='+key+'&qs='+queryString
                        Http.open("GET", url);
                        Http.onreadystatechange = function() {
                            if (Http.readyState == 4 && Http.status == 200) {
                                data = JSON.parse(Http.response);
                                makeCard(Math.min(getCookie(key)[index], 2));
                            }
                        }
                        Http.send();
                    }
                })
            }
        })
    }
}

card.addEventListener('click', requestCard);
cardby.addEventListener('change', function() {
    if (cardby.value != 'random') {
        document.getElementsByClassName('searchcontainer')[0].style.display = 'inline flex';
        getSearchBtns(cardby, cardkey);
    } else {
        document.getElementsByClassName('searchcontainer')[0].style.display = 'none';
    }
})

cardkey.addEventListener('input', function() {
    getSearchBtns(cardby, cardkey);
})

document.getElementsByClassName('searchcontainer')[0].style.display = 'none';

//endregion