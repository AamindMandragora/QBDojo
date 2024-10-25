let tossup = '';
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
    if (e.keyCode === 13 && searchby.value != '') {
        searchDB();
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
        console.log("woo")
        var cats = Array.from(cat2subcat.keys())
        for (var x in cats) {
            var subcats = cat2subcat.get(cats[x])
            for (var y in subcats) {
                var topics = subcat2topic.get(subcats[y])
                for (var z in topics) {
                    console.log(topics[z])
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

//#region search

const searchby = document.getElementById('searchby');
const search = document.getElementById('searchbtn');
const searchkey = document.getElementById('searchkey');

async function searchDB() {
    if (searchby.value == 'cat') {
        var cats = Array.from(cat2subcat.keys());
        for (var x in cats) {
            if (toTitle(cats[x]).toLowerCase() == (searchkey.value).toLowerCase()) {
                location.href = `/database/${cats[x]}`;
            }
        }
    } else if (searchby.value == 'subcat') {
        var cats = Array.from(cat2subcat.keys());
        for (var x in cats) {
            var subcats = cat2subcat.get(cats[x]);
            for (var y in subcats) {
                if (toTitle(subcats[y]).toLowerCase() == (searchkey.value).toLowerCase()) {
                    location.href = `/database/${cats[x]}/${subcats[y]}`;
                }
            }
        }
    } else if (searchby.value == 'topic') {
        var cats = Array.from(cat2subcat.keys());
        for (var x in cats) {
            var subcats = cat2subcat.get(cats[x]);
            for (var y in subcats) {
                var topics = subcat2topic.get(subcats[y])
                for (var z in topics) {
                    if (toTitle(topics[z]).toLowerCase() == (searchkey.value).toLowerCase()) {
                        location.href = `/database/${cats[x]}/${subcats[y]}/${topics[z]}`;
                    }
                }
            }
        }
    }
}

getSearchBtns(searchby, searchkey);

search.addEventListener('click', searchDB);

searchkey.addEventListener('input', function () {
    getSearchBtns(searchby, searchkey);
})

searchby.addEventListener('change', function() {
    searchkey.value = '';
    getSearchBtns(searchby, searchkey);
})

//#endregion
