/* autopie for Balloon Juice, by cleek@ok-cleek.com */
(function(autoPie, $, undefined) {
    var pieStringsURI = "https://cdn.rawgit.com/ok-cleek/bjautopie/fc482a6d/pie_strings.json";

    // localstorage item name
    var lsPieNames = "BJAutoPieNamesList";

	// show.hide pie texts
	var showPieText = "&raquo;";
	var hidePieText = "&laquo;";

	// emergency pie text
	var noPieText = "I can't find my pie!";
	
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

        for (var story = 0; story < allLIs.snapshotLength; story++) {
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

                    var badIdx = idxBad(authName);

                    // did we find anyone?
                    if (badIdx != -1) {
                        var pie = pieText(pieStrings);

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

	function arrayHasString(arrayName, arrayElement) {
        for (var i = 0; i < arrayName.length; i++) {
            if (arrayName[i] == arrayElement)
                return 1;
        }
        return 0;
	}
	
    function removeByElement(arrayName, arrayElement) {
        for (var i = 0; i < arrayName.length; i++) {
            if (arrayName[i] == arrayElement)
                arrayName.splice(i, 1);
        }
    }

    function addBad(targetName) {
        var listJSON = localStorage.getItem(lsPieNames);

        var list;
        if (!!listJSON) {
            list = JSON.parse(listJSON);

			if (arrayHasString(list, targetName)==0) {
                list.push(targetName);
            }
        } else {
            list = new Array(targetName)
        }

        var js_list = JSON.stringify(list);
        localStorage.setItem(lsPieNames, js_list);

        bads.push(targetName);
    }

    function doAddBad() {
        var txt = getEditText() + ''; // + '' to cvt to string
        txt = txt.trim();

        if (txt != "") {
            if (txt.substring(0, 1) == '#') {
                var num = Number(txt.substring(1));
                doAddBadN(num);
            } else if (confirm('Add "' + txt + '" to pie filter?')) {
                addBad(txt);
            }
            location.reload(true);
        }
    }

    function doAddBadN(num) {
        if (num > 0 && num != NaN) {
            var txt = cmntAuthByNum(num);

            if (txt != "") {
                var showText = txt.ellipses(50);
                if (confirm('Add "' + showText + '" to pie filter?')) {
                    addBad(txt);
                    location.reload(true);
                }
            } else {
                alert("Sorry - I can't find the author of comment #" + num);
            }
        } else {
            alert("Sorry - I can't find a comment with that number");
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

    function doRemBad() {
        var txt = getEditText() + ''; // + '' to cvt to string
        txt = txt.trim();

        if (txt != "") {
            if (txt.substring(0, 1) == '#') {
                var num = Number(txt.substring(1));
                doRemBadN(num);
            } else if (confirm('Remove "' + txt + '" from pie filter?')) {
                remBad(txt);
            }
            location.reload(true);
        }
    }

    function doRemBadN(num) {
        if (num > 0 && num != NaN) {
            var txt = cmntAuthByNum(num);

            if (txt != "") {
                var showText = txt.ellipses(50);
                if (confirm('Remove "' + showText + '" from pie filter?')) {
                    remBad(txt);
                }
            } else {
                alert("Sorry - I can't find the author of comment #" + num);
            }
        } else {
            alert("Sorry - I can't find a comment with that number");
        }
    }

    function doShowBads() {
        var listJSON = localStorage.getItem(lsPieNames);
        if (!!listJSON) {
            var list = JSON.parse(listJSON);
            if (list.length > 0) {
                var listText = "";
                for (var i = 0; i < list.length - 1; i++) {
                    listText = listText + '    ' + list[i].ellipses(50) + '\n';
                }
                listText = listText + '    ' + list[list.length - 1].ellipses(50);

                alert("You are filtering:\n" + listText);
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
                    `Pie filter&nbsp;&nbsp;
					<input id="apAddBtn" type="button" value="Add" title="Add this person to the pie filter"/>
					<input id="apRemBtn" type="button" value="Remove" title="Remove this person from the pie filter"/>
					<input id="apNameTxt" type="text" placeholder="Name or comment # (ex. Bob or #123)" title="The name or comment number (ex. #123) of person to add/remove." style="display:inline-block;width:260px;padding:2px;margin:0px"  value="" />
					<input id="apShowBtn" type="button" value="Show List" title="Show the list of all the people in your pie filter"/ style="float:right">
					`;

                el.style.color = '#707070';
                el.style.border = 'solid 1px #c0c0c0';
                el.style.padding = '4px';
                el.style.marginTop = '4px';
                el.style.marginBottom = '4px';

                el.style.width = taw;

                frm.appendChild(el);

                addButtonListeners();
            }
        }
    }
}(window.autoPie = window.autoPie || {}, jQuery));

jQuery(document).ready(function($) {
    autoPie.init();
});