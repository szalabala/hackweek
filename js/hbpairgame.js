//
// Copyright 2021
// Balazs Szalai, szalabala@gmail.com, https://www.buymeacoffee.com/szalabala
// HBPariGame: Hangyas Bob - pair game engine
// description: TBD
//
// see mypage.html tag expectation at the end of the file, might be generalized later
    var _shortMs = 500;
    var _longMs = 1500;
    var gameDesc = { W: 6, H: 3
        , _name: "Hangyás Bob - memory game"
        , _version: '0.4'
//        , start_message: "<span style=\"color:blue;text-decoration:blink;\">" + "lovas" + "</span>"
//        , restart_message: "<span style=\"color:blue;text-decoration:blink;\">Kattints a Puffinra az újrakezdéshez</span>"
//        , tabla: "kincsaminincs-terkep1000d.jpg", tabla0: "images/nincs2header_46d.jpg", tabla_end: "ending.jpg"
//        , tabla_w:"", tabla_h:""
//        , music: "audio/movin-cruisin-xylo.mp3", music0: "audio/movin-crusin-cover1.mp3"
        , figure_scale: 15 // % of table-height, cc 15vh
        , image: { doorClosed: 'images/door3a.png', doorOpen: 'images/door3b.png', empty:"data:,", 
            tabla_w:"", tabla_h:"",
            path:"images", prefix: "" }
        , misc: { demo1: 'd1', demo2: 'd2' }
        , modes: [
            { id:1, match:'-', n1: 2, good: 8, pairs: [1, 2, 3, 4], name:"leve 1" },
            { id:2, match:'ab', n1: 3, good: 18, pairs: [1, 2, 3, 4, 5, 6, 7, 8, 9 ], name:"level 2" },
            { id:3, match:'ab', n1: 4, good: 50, pairs: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16], name:"level 3" },
        ]
        , messages: {
            intro: "Some intro text",
            showMode: "override with sg like find the pairs",
            win: "Gratulations!",
            eval_good: [ "Good!" ],
            eval_bad: [ "Better luck, next time." ],
            eval_end: [ "Gratulations! You finished all levels!" ]
        }    
    };
    var gameData = {
        steps: [], turn: 0, aktiv: 0, players: [], started: false, pics: [], gameModeIdx:0, 
        state: "splash",  // "splash", "menu", "wait4first", "zoomOut1st", "wait4second", "zoomOut2nd", "closing", "about", 
        state2: 0,
        targetList: [],  // { id, img_src, posid }
        totalPairs: 0,
        foundPairs: [],
        attempts: 0,
        startTime: 0,   // use new Date().getTime()
        endTime:0,
        selectA: 0,
        selectB: 0,
        isPairFound: false,
        numStart: 0
    };
    var cookies = {      // arrays indexed per difficulty level
        started: [],     // games started
        finished: [],
        bestMove: [],   // array of best moves per difficulty level
        bestTime: []
    };
    var gameUI = {
        //mainAreaWidthPc: 80, mainAreaHeightPc: 90, // figureSizePc: 10,
        zoomedPosPc: 35, //spinTimeMs:hbgui._shortMs, spinDeg:360,
        fullscr: 0, muted: false,
        //cache: { imgSizePx: 100, offsetXPx:1, offsetYPx:1 }
    };

    hbgui.getPosPcOfSpecial = function (id) {
        var pos = { x_pc:gameUI.zoomedPosPc, y_pc:50, z:20, scale: hbgui.zoomOutScale, rotX: hbgui.spinDeg };
        if (id == "selectA") { // || id == gameData.selectA) {
            ;
        } else  if (id == "selectB") { //} || id == gameData.selectB ) {
            pos.x_pc = 100 - pos.x_pc;  // invert X
            pos.z = 40
        } else {
            var pos = hbgui.getPosPcOfPosId(id);
            pos.rotX = hbgui.spinDeg;
            pos.scale = hbgui.zoomOutScale;
        }

        if (gameDesc.W < gameDesc.H) {  // rotate 90, aka swap x - y
            const tmp = pos.x_pc;
            pos.x_pc = pos.y_pc;
            pos.y_pc = tmp;
        }
        return pos;
    }


    function myLoad() {
        const queryString = window.location.search;
        console.log(`url params: ${queryString}`)
        if (queryString != '') {
            console.log(queryString);

            const urlParams = new URLSearchParams(queryString);
            if (urlParams.has('fast')) {
                hbgui._longMs = 200;
                hbgui._shortMs = 100;
                hbgui.spinTimeMs = 100;
            }

            if (urlParams.has('frameMs')) {
                hbgui.frameMs = parseInt(urlParams.get('frameMs'))
            }
            if (urlParams.has('lvl')) {
                var lvl = parseInt(urlParams.get('lvl'));
                for  (var i = 0; i < lvl; i++) {
                    cookies.started[i] = Math.max(cookies.started[i], 1);
                    cookies.finished[i] = Math.max(cookies.finished[i], 1);
                }
            }
        }
    }

    function startOnce() {
        console.log(` startOnce.. modes.len:${gameDesc.modes.length}`);
        //if ()
        restoreCookies();
        if (startOnce0) {
            startOnce0();
        }

        for (var i=1;i <= gameDesc.modes.length; i++ ) {
            addImgButton(i, 'selectModeDiv', i, '');
        }
        addCard(gameDesc.misc.demo1, gameDesc.image.cardBackImg, 'toptable'); // image.imgEmpty
        addCard(gameDesc.misc.demo2, gameDesc.image.cardBackImg, 'toptable');
        document.getElementById(gameDesc.misc.demo1).style.display = 'none';
        document.getElementById(gameDesc.misc.demo2).style.display = 'none';
        if (gameDesc.image.tabla_w) {
            document.getElementById('tabla').src = gameDesc.image.tabla_w;
            document.getElementById('tabla').style.filter = 'invert(25%)';
        } else {
            document.getElementById('tabla').style.display = 'none';
        }
        if (document.getElementById('myaudio')) {
            document.getElementById('myaudio').volume = 0.2;
        }
        document.getElementById('btnAbout').src = gameDesc.image.cardBackImg;
        myLoad();
        if (startOnce2) {
            startOnce2();
        }
        if (gameDesc.modes.length == 1) {
            document.getElementById('selectModeDiv').style.display = 'none';
            setTimeout(hbgui.myResize, 10);  // do initial re-placement
            //selectMode(1);
            setTimeout(selectMode, 20, 1);
        } else {
            start();
        }
    }
    
    function start() {
        console.log(` start.. ${gameData.numStart}`);
        gameData.state = 'menu';
        gameData.numStart += 1;
        document.getElementById('selectModeDiv').style.top = '10%';
        document.getElementById('selectModeDiv').style.display = 'inline';
        
        if (gameData.numStart > 1) {
            document.getElementById('restartbutton').style.display = 'none';
            if (gameData.numStart == 2) {
                hbgui.toggleAudio();
            }
        }
        document.getElementById(gameDesc.misc.demo1).style.display = 'none';
        document.getElementById(gameDesc.misc.demo2).style.display = 'none';
        hbgui.setMsg(gameDesc._name, "bigtext");
        hbgui.setStatusMsg('Hangyás Bob bemutatja...');
        
        setTimeout(hbgui.myResize, 10);  // do initial re-placement
        
        for (var i=1;i <= gameDesc.modes.length; i++ ) {
            //console.log(` start.. ${JSON.stringify(gameDesc.modes[i-1])}`);
            var but = document.getElementById(`b${i}`);
            but.style.display = 'initial';
            console.log(`sss ${i} ${cookies.finished} ${cookies.finished.length} ${cookies.finished[i-1]}`)
            if (gameData.numStart == 1) {
                but.style.display = (i == 1) ? 'inline' : 'none';
            } else if (i == 1 || (cookies.finished.length >= i && cookies.finished[i-2] > 0)) {
                but.style.display = 'inline';
                but.disabled = false;
                but.src = gameDesc.image.doorOpen;
                hbgui.myBlink(but,false);
                setTimeout(hbgui.myBlink, i * Math.floor(hbgui._longMs/8) + 5, but);
            } else {
                but.disabled = true;
                but.style.color = 'pink';
                but.style.display = 'inline';
            }
        }
        
        for (var i = 0; i < gameData.targetList.length; i++) {
            document.getElementById(gameData.targetList[i].id).remove();
        }
        gameData.targetList = [];

        /*
        for (var i=1;i < 2; i++ ) { // whatever
            //document.getElementById('p'+i).style.filter = 'invert(0%)';
            if (!(new URLSearchParams(window.location.search)).has('start')) {
                setTimeout(myBlink, 5 + i*200, "p"+i);
            }
        }
        */

        //myLoad();
        //restartGame();
    }

    function selectMode(n=1) {
        //console.log(` selectMode.. n:${n} idx:${gameData.gameModeIdx} ${gameData.numStart}  start:${gameData.numStart} `);
        //console.log(`?? ${(gameData.numStart > 1)} && ${(n == 1 || cookies.finished[n-2] > 0)}`)

        //if (gameData.numStart > 1 && (n == 1 || cookies.finished[n-2] > 0)) {
        if (n == 1 || cookies.finished[n-2] > 0) {
            gameData.gameModeIdx = n - 1;
            for (var i=1;i <= gameDesc.modes-length; i++ ) {
                document.getElementById(`b${i}`).style.display = 'none';
            }
            showSelectedMode(gameData.gameModeIdx);
            setTimeout(restartGame,  hbgui._longMs + hbgui.spinTimeMs);
        } else {
            document.getElementById(`b${n}`).style.animation=`closed ${_shortMs}ms ease 0s 1 normal both`;
            setTimeout(hbgui.myBlink, _shortMs, document.getElementById(`b${n}`), false )
        }
    }

    function showSelectedMode(n) {
        console.log(` showSelectMode.. n:${n} ${gameDesc.modes[gameData.gameModeIdx].match} ${n} ${n} `);
        var d1 = document.getElementById(gameDesc.misc.demo1);
        var d2 = document.getElementById(gameDesc.misc.demo2);

        hbgui.setStatusMsg(gameDesc.messages.showMode);
        var mode = gameDesc.modes[gameData.gameModeIdx];
        var num = mode.pairs[Math.floor(Math.random() * mode.pairs.length)];

        //console.log(` showSelectMode.. mode:${mode.match} ${n} ${n} `);
        var sn1 = (mode.match == '-') ? '' : mode.match.charAt(0);
        var sn2 = (mode.match == '-') ? '' : mode.match.charAt(1);
        d1.src = `${gameDesc.image.path}/${gameDesc.image.prefix}${num}${sn1}.${gameDesc.image.imgext}`;
        d2.src = `${gameDesc.image.path}/${gameDesc.image.prefix}${num}${sn2}.${gameDesc.image.imgext}`;
        d1.style.display='inline';
        d2.style.display='inline';
        
        var pos1 = hbgui.getPosPxOfPospc(hbgui.getPosPcOfSpecial("selectA"));
        var pos2 = hbgui.getPosPxOfPospc(hbgui.getPosPcOfSpecial("selectB"));
        // console.log(` showSelectMode.. posA:${JSON.stringify(hbgui.getPosPcOfSpecial("selectA"))} posB:${JSON.stringify(pos1)} ${n} `);
        hbgui.zoomOutPic(gameDesc.misc.demo1, hbgui.getPosPxOfPospc(hbgui.getPosPcOfSpecial("selectA")), false);
        hbgui.zoomOutPic(gameDesc.misc.demo2, hbgui.getPosPxOfPospc(hbgui.getPosPcOfSpecial("selectB")), false);
        //d1.style.transition=`transform ${hbgui.spinTimeMs}ms ease-in-out`; // linear ease 
        //d1.style.transform=`translate(${pos1.x}px, ${pos1.y}px) scale(${pos1.scale},${pos1.scale}) rotateX(${pos1.rotX}deg)`; // size:enlarge .. rotate:flip
        //d2.style.transition=`transform ${hbgui.spinTimeMs}ms ease-in-out`; // linear ease 
        //d2.style.transform=`translate(${pos2.x}px, ${pos2.y}px) scale(${pos2.scale},${pos2.scale}) rotateX(${pos2.rotX}deg)`; // size:enlarge .. rotate:flip

        setTimeout(function() {
                d1.style.transform=`translate3d(${pos1.x}px, ${pos1.y}px, ${pos1.z}px)`;
                d2.style.transform=`translate3d(${pos2.x}px, ${pos2.y}px, ${pos1.z}px)`;
                d1.style.display='none';
                d2.style.display='none';
            }, hbgui._longMs + hbgui.spinTimeMs)
        /*
        d1.style.transition=`transform ${gameUI.spinTimeMs}ms ease-in-out`; // linear ease 
        zoomOutPic(gameDesc.misc.demo1, getPosPxOfPospc(getPosPcOfSpecial("selectA")));
        zoomOutPic(gameDesc.misc.demo2, getPosPxOfPospc(getPosPcOfSpecial("selectB")));
        setTimeout(zoomInPic,  _longMs + gameUI.spinTimeMs, gameDesc.misc.demo1, getPosPxOfPospc(getPosPcOfSpecial("selectA")));
        setTimeout(zoomInPic,  _longMs + gameUI.spinTimeMs, gameDesc.misc.demo2, getPosPxOfPospc(getPosPcOfSpecial("selectA")));
        */
    }

    function restartGame() {
        gameData.targetList = [];  // creating a random list of number, the pictures to show
        var mode = gameDesc.modes[gameData.gameModeIdx];
        var N = mode.n1 * mode.n1;      // gameDesc.W * gameDesc.H;   //number of pairs to match
        var N2 = mode.pairs.length;     // Math.floor(N / 2 );   //number of pairs to match
        var list = mode.pairs.slice();  // creating a random list of number, the pictures to show
        var poslist = [];
        gameData.totalPairs = 0;
        gameData.attempts = 0;
        gameData.startTime = new Date().getTime();

        shuffle(list);

        for (var i = 0; i < 2*N; i++) { // random list of positions
            poslist.push(i);
        }
        shuffle(poslist);
        
        //console.log(`start mode:${mode.name}:${mode.match} ${list} x ${poslist}`);
        for (var i = 0; i < N; i++) {  // add tiles
            var img2sel = (mode.match == 'aa') ? 'a' : 'b';
            var sn1 = (mode.match == '-') ? '' : mode.match.charAt(0);
            var sn2 = (mode.match == '-') ? '' : mode.match.charAt(1);
            gameData.targetList.push( { id: `p${1+2*i}`, pairId: i, src: `${gameDesc.image.path}/${gameDesc.image.prefix}${list[i]}${sn1}.${gameDesc.image.imgext}`, posid: poslist[i*2] } );
            gameData.targetList.push( { id: `p${2+2*i}`, pairId: i, src: `${gameDesc.image.path}/${gameDesc.image.prefix}${list[i]}${sn2}.${gameDesc.image.imgext}`, posid: poslist[i*2+1] } );
        }
        gameData.foundPairs = [];
        gameData.totalPairs = N;
        
        removeAllCards();
        for (var i = 0; i < 2*N; i++) {
            addCard(gameData.targetList[i].id, gameDesc.image.cardBackImg);// gameData.targetList[i].src);
        }
        setTimeout(hbgui.myResize, 10);  // initial placement

        hbgui.setStatusMsg("");

        document.getElementById('selectModeDiv').style.display = 'none';
        hbgui.setMsg("", "bigtext");
        hbwega.extendArray(cookies.started, gameData.gameModeIdx, 0);
        cookies.started[gameData.gameModeIdx] += 1;
        storeCookies();

        gameData.state = 'wait4first'
    }

    gameData.getGameStatusMsg = function() {
        return `${gameData.attempts}. lépés`;
    }

    function onClickPic(id) {
        //console.log(`click ${id} ${gameData.state}`);
        if (gameData.state == 'wait4first') {
            gameData.attempts += 1;
            gameData.selectA = id;
            gameData.state = "wait4second";
            gameData.isPairFound = false;
            if (gameData.getGameStatusMsg) {
                hbgui.setStatusMsg(gameData.getGameStatusMsg());
            }
            //console.log(` zo.. posA:${JSON.stringify(hbgui.getPosPcOfSpecial("selectA"))} `);
            //hbgui.zoomOutPic(id, hbgui.getPosPxOfPospc(hbgui.getPosPcOfPicId(id)));
            hbgui.zoomOutPic(id, hbgui.getPosPxOfPospc(hbgui.getPosPcOfSpecial("selectA")));
        } else if (gameData.state == 'wait4second' && id != gameData.selectA) {
            gameData.selectB = id;
            gameData.state = "wait4first";     // "evaluate";
            gameData.state = "evaluate";
            //hbgui.zoomOutPic(id, hbgui.getPosPxOfPospc(hbgui.getPosPcOfPicId(id)));
            hbgui.zoomOutPic(id, hbgui.getPosPxOfPospc(hbgui.getPosPcOfSpecial("selectB")));
            setTimeout(evaluateSelection(), hbgui._longMs * 2);
        //} else {
        }
    }
    function evaluateSelection() {
        //console.log(`evaluate ${gameData.selectA} ? ${gameData.selectB}`);
        const itemA = gameData.targetList.find(element => element.id == gameData.selectA);
        const itemB = gameData.targetList.find(element => element.id == gameData.selectB);

        if (itemA.pairId == itemB.pairId) {
            gameData.foundPairs.push(itemA.pairId);
            gameData.isPairFound = true;
            document.getElementById(gameData.selectA).onclick = "";
            document.getElementById(gameData.selectB).onclick = "";
        }

        if (gameData.foundPairs.length < gameData.totalPairs) {
            setTimeout(changeState, hbgui._longMs, "wait4first");
        } else {
            gameData.endTime = new Date().getTime();
            setTimeout(playClosing, hbgui._longMs);
        }
    }

    function changeState(newState) {
        //if (gameData.state == "about") { gameData.state2 = newState; } else {
        if (newState == "wait4first") {
            if (gameData.selectA != '') {
                const picId = gameData.selectA;
                gameData.selectA = 0;
                hbgui.zoomInPic(picId);
            }
            if (gameData.selectB != '') {
                const picId = gameData.selectB;
                gameData.selectB = 0;
                hbgui.zoomInPic(picId);
            }
            
            gameData.isPairFound = false;
                
            if (gameData.gameModeIdx == 4 && gameData.attempts % 5 == 0) {
                hbgui.swapTwoCards();
            }
        } else if (newState == "wait4first") {
            var pic = document.getElementById(selectAid);
            pic.classList.remove("med");
            pic.classList.add("top");
        }
        gameData.state = newState;
    }

    function swapTwoCards() {
        var r1 = Math.floor(Math.random() * gameData.targetList.length);
        var r2 = Math.floor(Math.random() * gameData.targetList.length);
        //console.log(`swap ${r1} -- ${r2}`);
        var tmp = gameData.targetList[r1].posid;
        gameData.targetList[r1].posid = gameData.targetList[r2].posid;
        gameData.targetList[r2].posid = tmp;
        
        moveHomePic(gameData.targetList[r1].id);
        moveHomePic(gameData.targetList[r2].id);
    }
        
    function playClosing() {
        //console.log(`closing`)
        //document.getElementById('tabla').style.filter = 'invert(25%)';
        gameData.state = "closing";
        gameData.selectA = 0;
        gameData.selectB = 0;
        for (var i = 0; i < gameData.targetList.length; i++) {
            var pic = document.getElementById(gameData.targetList[i].id);
            const item = gameData.targetList.find(element => element.id == gameData.targetList[i].id);     // for url:end cheat only
            hbgui.swapPicImage(gameData.targetList[i].id, item.src);                                       // cheat

            var pos = hbgui.getPosPxOfPospc(hbgui.getEndingPosPcOf(gameData.targetList[i].posid)); // i vs gameData.targetList[i].posid
            pic.style.transition=`transform ${hbgui.spinTimeMs}ms ease-in-out`; // linear ease 
            pic.style.transform=`translate(${pos.x}px, ${pos.y}px) scale(${pos.scale}, ${pos.scale})`; // size:enlarge .. rotate:flip
        }
        
        document.getElementById('selectModeDiv').style.display = 'inline';
        document.getElementById('selectModeDiv').style.top = '30%';
        hbgui.setMsg(getClosingMsg(), "bigtext");
        //document.getElementById('restartbutton').style.display = 'inline';
        
        cookies.finished[gameData.gameModeIdx] += 1;
        hbwega.updateStatMin(cookies.bestMove, gameData.gameModeIdx, gameData.attempts);
        var xtime = Math.max(1, Math.floor((gameData.endTime - gameData.startTime)/1000));    // to prevent strange negative numbers
        hbwega.updateStatMin(cookies.bestTime, gameData.gameModeIdx, xtime);
        storeCookies();
    }

    function getClosingMsg() {
        var msgArr = gameDesc.messages.eval_bad;
        if (cookies.finished[gameDesc.modes.length - 1] > 0) {
            msgArr = gameDesc.messages.eval_end;
        } else  if (gameData.attempts < gameDesc.modes[gameData.gameModeIdx].good) {
            msgArr = gameDesc.messages.eval_good;
        }
        var r = Math.floor(Math.random() * msgArr.length);
        return msgArr[r];
    }

    function showAbout() {
        console.log(`  showabout ${gameData.state}`);

        if (gameData.state == 'about' || gameData.state == 'evaluate') {
            return;
        }

        if (gameData.state != 'about') {
            gameData.state2 = gameData.state;
            gameData.state = 'about';
        }
        document.getElementById('selectModeDiv').style.display = 'none';
        document.getElementById('aboutDiv').style.display = 'inline';
        document.getElementById('tabla').style.display = 'none';
        var text = document.getElementById('texta');
        text.innerHTML = ''; //<h1>Nincs kettő négy nélkül!</h1>';
        for (var i = 0; i < gameData.targetList.length; i++) {
            var pic = document.getElementById(gameData.targetList[i].id);
            var pos = hbgui.getPosPxOfPospc(hbgui.getPosPcOfPicIdx(i));
            pic.style.transition=`transform ${hbgui.spinTimeMs}ms ease-in-out, opacity ${hbgui.spinTimeMs}ms ease-in-out`; // linear ease 
            pic.style.transform=`translate(${pos.x}px, ${pos.y}px) scale(${pos.scale}, ${pos.scale})`; // size:enlarge .. rotate:flip
            pic.style.opacity = 0.6;
        }

        text.innerHTML += "<br>"
        for (var i = 0; i < gameDesc.modes.length; i++) {
            text.innerHTML += `- ${gameDesc.modes[i].name} mód: ${cookies.finished[i]} játék`
            if (cookies.finished[i] && cookies.finished[i] > 0) {
                text.innerHTML += `, legkevesebb lépés: ${cookies.bestMove[i]}, legjobb idő:${cookies.bestTime[i]}s`
            }
            text.innerHTML += ".<br>"
        }
        //disable all images
        // add some return button
        //windows.onClick = function() {}
    }

    function closeAbout() {
        console.log(`  closeabout ${gameData.state}:${gameData.state2}`);
        gameData.state = gameData.state2;
        document.getElementById('aboutDiv').style.display = 'none';
        document.getElementById('tabla').style.display = 'inline';
        if (gameData.state == "menu") {
            document.getElementById('selectModeDiv').style.display = 'inline';
        } else {
            if (gameData.state == "closing") {
                document.getElementById('selectModeDiv').style.display = 'inline';
            }
            for (var i = 0; i < gameData.targetList.length; i++) {
                var pic = document.getElementById(gameData.targetList[i].id);
                var pos = hbgui.getPosPxOfPospc(hbgui.getPosPcOfPicIdx(i));
                pic.style.transition=`transform ${hbgui.spinTimeMs}ms ease-in-out, opacity ${hbgui.spinTimeMs}ms ease-in-out`; // linear ease 
                pic.style.transform=`translate(${pos.x}px, ${pos.y}px) scale(${pos.scale}, ${pos.scale}) rotateX(${pos.rotX}deg)`; // size:enlarge .. rotate:flip
                pic.style.opacity = 1;
            }
        }
        //document.getElementById('selectModeDiv').style.display = 'inline';
    }

    // -- some extra utility functions -----

    function addCard(id, isrc, parentid='cardscontainer') {
        //console.log(` add ${id} of ${isrc}`);
        //<button id="b3" class="xl modebutton" onClick="selectMode(3)">3</button>
        var img = document.createElement('img'); 
        img.id = id;
        img.src = isrc;
        img.classList.add("mozgo");
        img.style.borderRadius = "25%";
        img.style.maxWidth = "30vw";
        img.style.maxHeight = "30vh";
        img.style.border = '2px solid white';
        img.style.zIndex = 1; // 3d
        img.onclick = function() { onClickPic(id); };
        document.getElementById(parentid).appendChild(img);
    }

    function removeAllCards(parent='cardscontainer') {
        const myNode = document.getElementById(parent);
        while (myNode.firstChild) {
          myNode.removeChild(myNode.lastChild);
        }
    }

    function addImgButton(idx, parent, text, defstyle) {
        //console.log(` add ${idx}`);
        var but = document.createElement('img'); 
        but.id = `b${idx}`;
        but.src = gameDesc.image.doorClosed;
        but.style.maxWidth = "25vw";
        but.style.maxHeight = "30vh";
        but.onclick = function() { selectMode(idx); };
        /*
        but.classList.add("modebutton");
        but.style.border = '2px solid white';
        var but = document.createElement('button'); 
        but.classList.add("xl");
        but.innerHTML = text;
        */
        document.getElementById(parent).appendChild(but);
    }


    function shuffle(a) {
        var j, x, i;
        for (i = a.length - 1; i > 0; i--) {
            j = Math.floor(Math.random() * (i + 1));
            x = a[i];
            a[i] = a[j];
            a[j] = x;
        }
        return a;
    }

    function storeCookies() {
        hbcookies.bake('gamesStarted', cookies.started);
        hbcookies.bake('gamesFinished', cookies.finished);
        hbcookies.bake('bestMove', cookies.bestMove);
        hbcookies.bake('bestTime', cookies.bestTime);
    }
    function restoreCookies() {
        cookies.started = hbcookies.read('gamesStarted');
        cookies.finished = hbcookies.read('gamesFinished');
        cookies.bestMove = hbcookies.read('bestMove');
        cookies.bestTime = hbcookies.read('bestTime');

        hbwega.extendArray(cookies.started, gameDesc.modes.length, 0);
        hbwega.extendArray(cookies.finished, gameDesc.modes.length, 0);
        hbwega.extendArray(cookies.bestMove, gameDesc.modes.length, 0);
        hbwega.extendArray(cookies.bestTime, gameDesc.modes.length, 0);
    }
