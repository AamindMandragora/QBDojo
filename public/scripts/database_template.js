String.prototype.interpolate = function(params) {
    const names = Object.keys(params);
    const vals = Object.values(params);
    return new Function(...names, `return \`${this}\`;`)(...vals);
}

function lowerLetterOne(s) {
    return s[0].toLowerCase() + s.slice(1)
}

function objectForm(p) {
    let irregulars = new Map([["He", "Him"], ["She", "Her"]]);
    if (irregulars.has(p)) {
        return irregulars.get(p)
    } else {
        return p
    }
}

function possessiveForm(p) {
    let irregulars = new Map([["He", "His"], ["She", "Hers"], ["Who", "Whose"]]);
    if (irregulars.has(p)) {
        return irregulars.get(p)
    } else {
        return p + "'s"
    }
}

var d = document.getElementById("delete");
if (d) {
    var data = JSON.parse(d.innerHTML);
    d.remove();
    var p = data.pronouns[data.pronouns.length-2];

    let clues = document.getElementsByClassName('clue');
    for (var i = 0; i < clues.length; i++) {
        clues[i].innerText = clues[i].innerText.interpolate({Pronoun: p, pronoun: lowerLetterOne(p), Possessive: possessiveForm(p), possessive: lowerLetterOne(possessiveForm(p)), OPronoun: objectForm(p), opronoun: lowerLetterOne(objectForm(p))});
    }
}