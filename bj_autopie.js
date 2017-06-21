/* autopie for Balloon Juice, by cleek@ok-cleek.com */
(function(autoPie, $, undefined) {
    var pieStringsURI = "https://www.balloon-juice.com/pie_strings.json";

    // localstorage item name
    var lsPieNames = "BJAutoPieNamesList";

    // show.hide pie texts
    var showPieText = "&raquo;";
    var hidePieText = "&laquo;";

    // emergency pie text
    var noPieText = "I can't find my pie!";

    // turn this on to pie replies to pie'd commenters
    var pieReplies = true;
    
    //////////////////////////////////

    var bads = new Array();

    autoPie.init = function() {
        var pieStrings = new Array();

        jQuery.getJSON(pieStringsURI, null,
                function(d) {
                    pieStrings = d.slice();
                    run(pieStrings);
                })
            .fail(
                function(jqXHR, textStatus, errorThrown) {
                    console.log("Pie fetch fail: " + errorThrown);
                    run(pieStrings);
                })
    }

    function run(pieStrings) {
        if (pieStrings.length==0) {
            pieStrings.push(noPieText);
        }

        readBads();
        modComments(pieStrings);
        addPieControls();
    }

    ////////////////////////////// Mod comments

    String.prototype.trim = function() {
        return this.replace(/^\s+|\s+$/g, "");
    }

    String.prototype.ellipses = function(num) {
        if (this.length > num) return this.substring(0, num - 3) + "...";
        return this;
    }

    function firstChild(par, t, cls) {
        if (!!par) {
            if (cls === undefined || cls === null) {
                for (var i = 0; i < par.childNodes.length; i++) {
                    var parChI = par.childNodes[i];
                    if (!!parChI.tagName &&
                        parChI.tagName.toLowerCase() == t) {
                        return parChI;
                    }
                }
            } else {
                for (var i = 0; i < par.childNodes.length; i++) {
                    var parChI = par.childNodes[i];
                    if (!!parChI.tagName &&
                        parChI.tagName.toLowerCase() == t &&
                        parChI.className.toLowerCase() == cls) {
                        return parChI;
                    }
                }
            }
        }
        return null;
    }

    function pNodes(par) {
        var ptxt = "";
        if (!!par) {
            for (var i = 0; i < par.childNodes.length; i++) {
                var parChI = par.childNodes[i];
                if (parChI.tagName != null &&
                    (parChI.tagName.toLowerCase() == "p" ||
                        parChI.tagName.toLowerCase() == "blockquote")) {
                    var pwrap = document.createElement(parChI.tagName);
                    pwrap.appendChild(parChI.cloneNode(true));
                    ptxt += pwrap.innerHTML;
                }
            }
        }

        return ptxt;
    }

    function idxBad(authName) {
        var nameText = authName.toLowerCase();

        // see if the text of that href matches anyone in our bads list
        for (var badsIdx = 0; badsIdx < bads.length; badsIdx++) {
            if (nameText == bads[badsIdx].toLowerCase()) {
                return badsIdx;
            }
        }

        return -1;
    }

    function cmtAuthName(comment) {
        var authorName = "";

        if (!!comment) {
            var vcard = firstChild(comment, "div", "comment-author vcard");
            var cite = firstChild(vcard, "cite", "fn");
            if (!!cite) {
                var a = firstChild(cite, "a");
                if (!!a) {
                    authorName = a.innerHTML;
                } else {
                    authorName = cite.innerHTML;
                }
            }
        }
        return authorName;
    }

    function replyToBad(cmt) {
        if (!!cmt) {
            // console.log("replyToBad: checking");
            for (var i = 0; i < cmt.childNodes.length; i++) {
                var ch = cmt.childNodes[i];
                if (!!ch.tagName && ch.tagName.toLowerCase() == "p") {
                    for (var j = 0; j < ch.childNodes.length; j++) {
                        var gc = ch.childNodes[j];
                        if (!!gc.tagName && gc.tagName.toLowerCase()=="a") {
                            // console.log("replyToBad: testing " + gc.innerHTML);
                            var idx = idxBad(gc.innerHTML);
                            if (idx != -1) {
                                // console.log("replyToBad: match");
                                return idx;
                            }
                        }
                    }
                }
            }
        }

        // console.log("replyToBad: no match");
        return -1;
    }

    function pieText(pieStrings) {
        var randomNum = Math.floor(Math.random() * pieStrings.length);
        return pieStrings[randomNum];
    }

    function modComments(pieStrings) {
        var allLIs, thisLI;
        allLIs = document.evaluate(
            "//li[starts-with(@id, 'li-comment-')]",
            document.body,
            null,
            XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,
            null);

        // console.log("modComments: comment LIs: " + allLIs.snapshotLength);

        for (var story = 0; story < allLIs.snapshotLength; story++) {
            
            // console.log("modComments: comment " + story + 1);
            
            thisLI = allLIs.snapshotItem(story);

            var re = /(li\-comment\-)(.*)/;
            var m = re.exec(thisLI.id);
            var commentID = m[2];

            // find comment author, look for match
            if (thisLI.childNodes != null) {
                var cm = "comment-" + commentID;

                var comment = document.getElementById(cm);

                if (!!comment) {

                    var authName = cmtAuthName(comment);
                    
                    // console.log("modComments: looking at comment from " + authName);

                    var badIdx = idxBad(authName);

                    // console.log("modComments: badidx ? " + badIdx);

                    var badInReply = pieReplies ? replyToBad(comment) : -1;
                    
                    // console.log("modComments: bad reply ? " + badInReply);
                    
                    // did we find anyone?
                    if (badIdx != -1 || badInReply!=-1) {

                        // console.log("modComments: pieing");
            
                        var pie = pieText(pieStrings);
                        
                        if (badIdx == -1 && badInReply != -1) {
                            // console.log("bad reply");
                            pie = "<em>Pied reply to @" + bads[badInReply] + ":</em><blockquote>" + pie + "</blockquote>";
                        }

                        // to tag our wrapper DIV
                        var pieID = "pie_" + commentID;

                        var vcard = firstChild(comment, "div", "comment-author vcard");
                        var cmeta = firstChild(comment, "div", "comment-meta commentmetadata");
                        var yarr = firstChild(comment, "div", "yarr");
                        var reply = firstChild(comment, "div", "reply");
                        var commentText = pNodes(comment);


                        var txt = "",
                            tmp = "";

                        tmp = (!!vcard) ? vcard.innerHTML : "";
                        txt += "<div class=\"comment-author vcard\">" + tmp + "</div>";

                        tmp = (!!cmeta) ? cmeta.innerHTML : "";
                        txt += "<div class=\"comment-meta commentmetadata\">" + tmp + "</div>";

                        txt +=
                            "<div id='show_" + pieID + "'>" +
                            "<p>" +
                            pie +
                            "</p>" +
                            "</div>" +

                            "<div style='display:none' id='hide_" + pieID + "'>" +
                            commentText +
                            "</div>" +
                            "<a title='Show original?' id='tgl1_" + pieID + "' href='javascript:;' onClick='document.getElementById(\"hide_" + pieID + "\").style.display=\"block\";document.getElementById(\"show_" + pieID + "\").style.display=\"none\";document.getElementById(\"tgl2_" + pieID + "\").style.display=\"block\";this.style.display=\"none\"'>" + showPieText + "</a>" +
                            "<a title='Return to pie!' style='display:none' id='tgl2_" + pieID + "' href='javascript:;' onClick='document.getElementById(\"hide_" + pieID + "\").style.display=\"none\";document.getElementById(\"show_" + pieID + "\").style.display=\"block\";document.getElementById(\"tgl1_" + pieID + "\").style.display=\"block\";this.style.display=\"none\"'>" + hidePieText + "</a>";

                        tmp = (!!yarr) ? yarr.innerHTML : "";
                        txt += "<div class=\"yarr\">" + tmp + "</div>";

                        tmp = (!!reply) ? reply.innerHTML : "";
                        txt += "<div class=\"reply\">" + tmp + "</div>";

                        comment.innerHTML = txt;
                    }
                }
            }
        }
    }

    ////////////////////////////// UI

    function cmntAuthByNum(targetNum) {
        var xp = "//div[@class='commentnumber' and text()='" + targetNum + "']";

        var commentByNum = document.evaluate(
            xp,
            document.body,
            null,
            XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,
            null);

        if (commentByNum.snapshotLength == 1) {
            var commentNumDiv = commentByNum.snapshotItem(0);
            var divParent = commentNumDiv.parentNode;
            if (!!divParent) {
                var re = /(li\-comment\-)(.*)/;
                var m = re.exec(divParent.id);

                if (!!m) {
                    var commentID = m[2];

                    var cm = "comment-" + commentID;
                    var comment = document.getElementById(cm);
                    if (!!comment) {
                        return cmtAuthName(comment);
                    }
                }
            }
        }

        return "";
    }

    function readBads() {
        var ambientListJSON = localStorage.getItem(lsPieNames);
        if (!!ambientListJSON) {
            var ambientList = JSON.parse(ambientListJSON);
            if (ambientList != null) {
                bads = ambientList.slice();
            }
        }
    }

    function arrayHasString(arr, arrayElement) {
        for (var i = 0; i < arr.length; i++) {
            if (arr[i] == arrayElement)
                return 1;
        }
        return 0;
    }

    function removeByElement(arr, arrayElement) {
        for (var i = 0; i < arr.length; i++) {
            if (arr[i] == arrayElement)
                arr.splice(i, 1);
        }
    }

    function removeTags(html) {
        var tagBody = '(?:[^"\'>]|"[^"]*"|\'[^\']*\')*';

        var tagOrComment = new RegExp(
            '<(?:'
            // Comment body.
            + '!--(?:(?:-*[^->])*--+|-?)'
            // Special "raw text" elements whose content should be elided.
            + '|script\\b' + tagBody + '>[\\s\\S]*?</script\\s*'
            + '|style\\b' + tagBody + '>[\\s\\S]*?</style\\s*'
            // Regular name
            + '|/?[a-z]'
            + tagBody
            + ')>',
            'gi');

      var oldHtml;
      do {
        oldHtml = html;
        html = html.replace(tagOrComment, '');
      } while (html !== oldHtml);
      return html.replace(/</g, '&lt;');
    }

    function prettyName(txt) {
        // console.log("prettyName: txt " + txt);
        var newName = removeTags(txt);
        // console.log("prettyName: cleaned " + newName);
        newName = newName.ellipses(50);
        newName = newName.trim()
        // console.log("prettyName: output " + newName);
        return newName;
    }

    function nameProc(txt) {
        // console.log("nameProc: " + txt);
        txt = txt.trim()
        // console.log("nameProc: trimmed: " + txt);
        if (txt != "") {
            if (txt.substring(0, 1) == '#') {
                // console.log("nameProc: found #");
                var num = Number(txt.substring(1));
                // console.log("nameProc: num is " + num);
                
                if (num <= 0 || num == NaN) {
                    alert("Sorry - I can't find a comment with that number");
                    return "";
                }

                txt = cmntAuthByNum(num);
                
                // console.log("nameProc: comment auth from num " + txt);
                
                if (txt == "") {
                    alert("Sorry - I can't find the author of comment #" + num);
                    return "";
                }
            }
        }
        
        // console.log("nameProc: output " + txt);
        
        return txt;
    }

    function doAddBad() {
        // console.log("doAddBad");
        
        var txt = getEditText() + ''; // + '' to cvt to string

        // console.log("doAddBad: raw txt for add:" + txt);
        
        txt = nameProc(txt);
        
        // console.log("doAddBad: processed name for add:" + txt);
        
        if (txt != "") {
            var showText = prettyName(txt);
            
            // console.log("doAddBad: pretty name for add:" + showText);
            
            if (confirm('Add commenter "' + showText + '" to pie filter?')) {
                
                // console.log("doAddBad: add confirmed, adding to list");
                
                addBad(txt);
                location.reload(true);
                // console.log("doAddBad: skipping refresh so we can see what's happening");
            }
        }
    }

    function addBad(targetName) {
        // console.log("addBad: adding '" + targetName);
        
        var listJSON = localStorage.getItem(lsPieNames);

        // console.log("addBad: current list JSON:" + listJSON);

        var list;
        if (!!listJSON) {
            list = JSON.parse(listJSON);

            // console.log("addBad: parsed list :" + list);

            if (arrayHasString(list, targetName)==0) {
                // console.log("addBad: target not found. adding");
                list.push(targetName);
            }
        } else {
            // console.log("addBad: no list found. making new list. adding");
            list = new Array(targetName)
        }

        // console.log("addBad: new list:" + list);

        var js_list = JSON.stringify(list);
        
        // console.log("addBad: new list JSON:" + js_list);
        
        localStorage.setItem(lsPieNames, js_list);

        bads.push(targetName);
        
        // console.log("addBad: new bads list:" + bads);
    }

    function doRemBad() {
        var txt = getEditText() + ''; // + '' to cvt to string
        txt = nameProc(txt);
        if (txt != "") {
            var showText = prettyName(txt);
            if (confirm('Remove commenter "' + showText + '" from pie filter?')) {
                remBad(txt);
                location.reload(true);
            }
        }
    }

    function remBad(targetName) {
        var listJSON = localStorage.getItem(lsPieNames);

        var list;
        if (listJSON != "") {
            list = JSON.parse(listJSON);

            if (arrayHasString(list, targetName)) {
                removeByElement(list, targetName);
                removeByElement(bads, targetName);
                location.reload(true);
            }
            else
            {
                alert("Sorry - You weren't filtering anyone by that name");
            }
        } else {
            list = new Array(targetName)
        }

        var js_list = JSON.stringify(list);

        localStorage.setItem(lsPieNames, js_list);
    }

    function doShowBads() {
        var listJSON = localStorage.getItem(lsPieNames);
        if (!!listJSON) {
            var list = JSON.parse(listJSON);
            if (list.length > 0) {
                list.sort();
                var listText = "";
                for (var i = 0; i < list.length - 1; i++) {
                    var t = i + 1;
                    listText = listText + "    " + t + ". " + prettyName(list[i]) + "\n";
                }
                listText = listText + "    "  + list.length + ". " + prettyName(list[list.length - 1]);

                alert("Here are the people you're filtering:\n" + listText);
            } else {
                alert("You aren't filtering anyone.");
            }
        } else {
            alert("You aren't filtering anyone.");
        }
    }

    function getEditText() {
        var txt = document.getElementById("apNameTxt");
        if (txt != null) {
            return txt.value
        }
        return "";
    }

    function addButtonListeners() {
        document.getElementById("apAddBtn").addEventListener('click', doAddBad, true);
        document.getElementById("apRemBtn").addEventListener('click', doRemBad, true);
        document.getElementById("apShowBtn").addEventListener('click', doShowBads, true);
    }

    function addPieControls() {
        var commentForm;
        commentForm = document.evaluate(
            "//div[@id='respond']",
            document,
            null,
            XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,
            null);

        if (commentForm.snapshotLength == 0) {
            commentForm = document.evaluate(
                "//div[contains(@class,'comment-entry')]",
                document,
                null,
                XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,
                null);          
        }
        
        if (commentForm.snapshotLength == 1) {
            var frm = commentForm.snapshotItem(0);

            var taw = "100%";
            if (frm != null) {
                var ta = firstChild(frm, "textarea");
                if (ta != null) {
                    taw = ta.offsetWidth;
                    taw += 'px';
                }

                var el = document.createElement("div");
                el.innerHTML =
                    `<form id="apForm" style="margin-bottom:0px" >
                    <span title="Use Cleek's Pie filter to manage unpleasant commenters">Pie filter&nbsp;&nbsp;</span>
                    <input id="apAddBtn" type="button" value="Add" title="Add this person to the pie filter"/>
                    <input id="apRemBtn" type="button" value="Remove" title="Remove this person from the pie filter"/>
                    <input id="apNameTxt" type="text" autocomplete="on" placeholder="Name or comment # (ex. Bob or #123)" title="The name or comment number (ex. #123) of person to add/remove." style="display:inline-block;width:260px;padding:2px;margin:0px"  value="" />
                    <input id="apShowBtn" type="button" value="Show List" title="Show the list of all the people in your pie filter"/ style="float:right">
                    </form>`;

                el.style.color = '#707070';
                el.style.border = 'solid 1px #c0c0c0';
                el.style.padding = '4px';
                el.style.marginTop = '4px';
                el.style.marginBottom = '4px';
                el.id = "autopie";

                el.style.width = taw;

                frm.appendChild(el);

                addButtonListeners();
            }
        }
    }
}(window.autoPie = window.autoPie || {}, jQuery));

!function(e,n,o){function s(e,n){return typeof e===n}function a(){var e,n,o,a,t,l,f;for(var c in r)if(r.hasOwnProperty(c)){if(e=[],n=r[c],n.name&&(e.push(n.name.toLowerCase()),n.options&&n.options.aliases&&n.options.aliases.length))for(o=0;o<n.options.aliases.length;o++)e.push(n.options.aliases[o].toLowerCase());for(a=s(n.fn,"function")?n.fn():n.fn,t=0;t<e.length;t++)l=e[t],f=l.split("."),1===f.length?Modernizr[f[0]]=a:(!Modernizr[f[0]]||Modernizr[f[0]]instanceof Boolean||(Modernizr[f[0]]=new Boolean(Modernizr[f[0]])),Modernizr[f[0]][f[1]]=a),i.push((a?"":"no-")+f.join("-"))}}function t(e){var n=f.className,o=Modernizr._config.classPrefix||"";if(c&&(n=n.baseVal),Modernizr._config.enableJSClass){var s=new RegExp("(^|\\s)"+o+"no-js(\\s|$)");n=n.replace(s,"$1"+o+"js$2")}Modernizr._config.enableClasses&&(n+=" "+o+e.join(" "+o),c?f.className.baseVal=n:f.className=n)}var i=[],r=[],l={_version:"3.5.0",_config:{classPrefix:"",enableClasses:!0,enableJSClass:!0,usePrefixes:!0},_q:[],on:function(e,n){var o=this;setTimeout(function(){n(o[e])},0)},addTest:function(e,n,o){r.push({name:e,fn:n,options:o})},addAsyncTest:function(e){r.push({name:null,fn:e})}},Modernizr=function(){};Modernizr.prototype=l,Modernizr=new Modernizr,Modernizr.addTest("localstorage",function(){var e="modernizr";try{return localStorage.setItem(e,e),localStorage.removeItem(e),!0}catch(n){return!1}});var f=n.documentElement,c="svg"===f.nodeName.toLowerCase();a(),t(i),delete l.addTest,delete l.addAsyncTest;for(var u=0;u<Modernizr._q.length;u++)Modernizr._q[u]();e.Modernizr=Modernizr}(window,document);

if (Modernizr.localstorage) {
    jQuery(document).ready(function($) {
        autoPie.init();
    });
}
