// Copyright 2021
// Szalai Balázs szalabala@gmail.com
// HBWEGA: Hangyas Bob WEb GAme
// description: TBD

var _hbwega_version = '0.1';
        
var hbwega = {
    extendArray: function(arr, len, val) {
        while (arr.length < len) {
            arr.push(val);
        }
    },

    updateStatMin: function (arr, idx, val) {
        this.extendArray(arr, idx, 0);
        if (arr[idx] == 0) {
            arr[idx] = val;
        } else {
            arr[idx] = Math.min(val, arr[idx]);
        }
        return arr[idx];
    },

    updateStatMax: function (arr, idx, val) {
        this.extendArray(arr, idx, 0);
        if (arr[idx] == 0) {
            arr[idx] = val;
        } else {
            arr[idx] = Math.max(val, arr[idx]);
        }
        return arr[idx];
    }
}

var hbgui = {
    W: 1,
    H: 1,
    fullscr: 0,
    muted: true,
    _shortMs: 500,
    _longMs: 1500,
    mainAreaWidthPc: 80,
    mainAreaHeightPc: 90, // figureSizePc: 10,
    spinTimeMs: 500, 
    spinDeg:360,
    zoomOutScale: 1.6,
    //cardBackImg: "images/back.jpg",
    cache: { 
        imgSizePx:100, 
        offsetXPx:1, 
        offsetYPx:1
    },

    zoomOutPic: function(id, pos, isSwap=true) {
        //console.log(`zo id:${id} pos:${JSON.stringify(pos)} spin:${hbgui.spinTimeMs}`);
        var pic = document.getElementById(id);
        pic.style.zIndex = pos.z;
        pic.style.transition=`transform ${hbgui.spinTimeMs}ms ease-in-out`; // linear ease 
        pic.style.transform=`translate3d(${pos.x}px, ${pos.y}px, ${pos.z}px) scale(${pos.scale},${pos.scale}) rotateX(${pos.rotX}deg)`; // size:enlarge .. rotate:flip
        // lovas 2*pos.z ??
        if (isSwap) {
            const item = gameData.targetList.find(element => element.id == id);
            setTimeout(this.swapPicImage, Math.floor(hbgui.spinTimeMs / 2), id, item.src);
        }
        setTimeout(this.resetPicTransition, hbgui.spinTimeMs, id);
    },

    zoomInPic: function(id, pos) {
        var pic = document.getElementById(id);
        const item = gameData.targetList.find(element => element.id == id);
        if (!pos) {
            pos = this.getPosPxOfPospc(this.getPosPcOfPic(item));
        }

        pic.style.transition=`transform ${hbgui.spinTimeMs}ms ease-in-out`; // linear ease 
        pic.style.transform=`translate3d(${pos.x}px, ${pos.y}px, ${pos.z}px) scale(1,1) rotateX(0deg)`; // size:enlarge .. rotate:flip
        if (false == gameData.isPairFound) {
            setTimeout(this.swapPicImage, Math.floor(hbgui.spinTimeMs / 2), id);
        }
        setTimeout(this.resetPicZindex, hbgui.spinTimeMs, id, this);
    },
    
    moveHomePic: function(id) {
        var pic = document.getElementById(id);
        const item = gameData.targetList.find(element => element.id == id);
        var pos = this.getPosPxOfPospc(this.getPosPcOfPic(item));
        pic.style.transition=`transform ${hbgui.spinTimeMs}ms ease-in-out`; // linear ease 
        pic.style.transform=`translate3d(${pos.x}px, ${pos.y}px, ${pos.z}px)`;
        setTimeout(this.resetPicZindex, hbgui.spinTimeMs, id, this);
    },
    
    setImgZ: function(id, z) {
        var img = document.getElementById(id);
        //img.style.transition='';
        img.style.transitionDuration = 0; // instant
        img.style.zIndex = z;
        //img.style.transform=`translateZ(${z}px))`; // size:enlarge .. rotate:flip
    },
    
    resetPicZindex: function(id, obj) {
        obj.setImgZ(id, 1);
        //var pic = document.getElementById(id);
        //pic.style.transition='';
    },

    resetPicTransition: function(id) {
        var pic = document.getElementById(id);
        pic.style.transition='';
        //pic.style.transitionDuration = 0; // instant
    },
    
    swapPicImage: function (id, imgsrc=gameDesc.image.cardBackImg) {
        var pic = document.getElementById(id);
        pic.src = imgsrc;
    },
    
    getPosPcOfPicId: function(id) {        // return { xpc, ypc }
        const item = gameData.targetList.find(element => element.id == id);
        var pos = this.getPosPcOfPic(item);
        if (gameData.selectA == id || gameData.selectB == id) {
            pos.scale = hbgui.zoomOutScale;
            pos.rotX = hbgui.spinDeg;
        }
        return pos;
    },
    
    getPosPcOfPicIdx: function(idx) {      // return { xpc, ypc }s
        const item = gameData.targetList[idx]; //.find(element => element.id == gameData.selectA);
        var pos = this.getPosPcOfPic(item);
        if (gameData.selectA == item.id || gameData.selectB == item.id) {
            pos.scale = hbgui.zoomOutScale;
            pos.rotX = hbgui.spinDeg;
        }
        return pos;
    },
    
    getPosPcOfPic: function(item) {          // return { x_pc, y_pc }
        if (gameData.state == 'menu') {
            return { x_pc: 50, y_pc:-50, z:10, scale: 1, rotX: 0 };
        } else if (gameData.state == 'about') {
            return this.getAboutPosPcOf(item.posid);
        } else if (gameData.state == 'end' || gameData.state == 'closing') {
            return this.getEndingPosPcOf(item.posid);
        } else {     // arg maybe imgId, it would be better used, to handled selectd position as well
            /*if (gameData.selectA == item.id) {
                return this.getPosPcOfSpecial("selectA");
            } else if (gameData.selectB == item.id) {
                return this.getPosPcOfSpecial("selectB");
            }*/
            return this.getPosPcOfPosId(item.posid);
        }
    },

    getPosPcOfPosId: function (posId) { // return { x_pc, y_pc } -- standard in-game layout
        return {
            x_pc: Math.floor( ((100 - hbgui.mainAreaWidthPc) / 2) + ((posId % gameDesc.W) * (hbgui.mainAreaWidthPc) / (gameDesc.W -1))),
            y_pc: Math.floor( ((100 - hbgui.mainAreaHeightPc) / 2) + (Math.floor(posId / gameDesc.W) * (hbgui.mainAreaHeightPc / (gameDesc.H - 1)))),
            z: 10,
            scale: 1,
            rotX: 0
        };
    },

    getPosPcOfSpecial: function (id) {
        var pos = { x_pc:50, y_pc:50, z:10, scale: hbgui.zoonOutScale, rotX: hbgui.spinDeg };
        return pos;
    },

    getEndingPosPcOf: function (posId) {                // return { x_pc, y_pc } -- 'parking positions'
        // align images on the long-edge of the screen
        if (gameDesc.W > gameDesc.H) {
            return { x_pc: Math.floor( Math.floor(posId / 2) * 100 / (gameData.totalPairs - 1) ),
                     y_pc: Math.floor( (posId % 2 == 0) ? 2 : 98),
                     z: 10,
                     scale: 0.4,
                     rotX: 0 };
        } else {
            return { x_pc: Math.floor( (posId % 2 == 0) ? 2 : 98),
                     y_pc: Math.floor( Math.floor(posId / 2) * 100 / (gameData.totalPairs - 1) ),
                     z: 10,
                     scale: 0.4,
                     rotX: 0 };
       }
    },
        
    getPosPxOfPospc: function( pos_pc, img=null ) {     // { xpc, ypc }
        var cw = document.documentElement.clientWidth;
        var ch = document.documentElement.clientHeight;
        var iw = (img ? img.clientWidth : hbgui.cache.imgSizePx);
        var ih = (img ? img.clientHeight : hbgui.cache.imgSizePx);
        
        //console.log(`  pospc .. ${pos_pc.x_pc} ${pos_pc.y_pc}  cw:${cw} iw:${iw} ${Math.floor((cw - iw) * pos_pc.x_pc / 100)}`);
        return {
            x: Math.floor((cw - iw) * pos_pc.x_pc / 100),  // + hbgui.OffsetXPx
            y: Math.floor((ch - ih) * pos_pc.y_pc / 100),   // + hbgui.OffsetYPx
            z: pos_pc.z,
            scale: pos_pc.scale,
            rotX: pos_pc.rotX
        };
    },

    setStatusMsg: function(msg) {
        document.getElementById('status').innerHTML = msg;
    },
    setMsg: function (msg, target="status") {
        document.getElementById(target).innerHTML = msg;
    },

    myResize: function () {
        //console.log(`resize`);
        var cw = document.documentElement.clientWidth;
        var ch = document.documentElement.clientHeight;
        var iw = window.innerWidth;
        
        var isAndroid = /(android)/i.test(navigator.userAgent);
        if (isAndroid) {
            document.getElementById('toptable').style.width = cw + 'px';
        } else {
            document.getElementById('toptable').style.width = iw + 'px';
        }
        
        var mode = gameDesc.modes[gameData.gameModeIdx];
        var isBeforeLandscape = gameDesc.W > gameDesc.H
        if (cw > ch) {
            gameDesc.W = mode.n1 * 2;
            gameDesc.H = mode.n1;
            if (!isBeforeLandscape) {
                document.getElementById('tabla').src = gameDesc.image.tabla_w;
            }
        } else {
            gameDesc.W = mode.n1;
            gameDesc.H = mode.n1 * 2; 
            if (isBeforeLandscape) {
                document.getElementById('tabla').src = gameDesc.image.tabla_h;
            }
        }
        
        var backimg = document.getElementById('tabla');
        var dh = backimg.offsetHeight;
        var r0 = backimg.naturalWidth / backimg.naturalHeight;
        var r = backimg.offsetWidth / backimg.offsetHeight;
        var tw = Math.floor(cw * hbgui.mainAreaWidthPercent / 100);
        var th = Math.floor(ch * hbgui.mainAreaHeightPercent / 100);
        var th0= Math.floor(tw / r0);
        var posCenter = hbgui.getPosPxOfPospc( {x_pc:50, y_pc:50}, backimg );
        backimg.style.transform =`translate(${posCenter.x}px, ${posCenter.y}px)`;
        
        //var img_w = Math.floor( (cw * 80) / gameDesc.W / 100 );
        var img_maxw = Math.floor((cw * hbgui.mainAreaWidthPc / 100) / gameDesc.W);
        var img_maxh = Math.floor((ch * hbgui.mainAreaHeightPc / 100) / gameDesc.H);
        hbgui.cache.imgSizePx = Math.min(
            Math.floor( (cw * hbgui.mainAreaWidthPc / 100) / gameDesc.W ),
            Math.floor( (ch * hbgui.mainAreaHeightPc / 100) / gameDesc.H )
        );
        hbgui.cache.offsetXPx = Math.floor( (cw * (100-hbgui.mainAreaWidthPc) / 100) / 2 );
        hbgui.cache.offsetYPx = Math.floor( (ch * (100-hbgui.mainAreaHeightPc) / 100) / 2 );
        
        var N = gameDesc.W * gameDesc.H;   //number of images to match
        for (var i = 0; i < gameData.targetList.length; i++) {
            var pospc = hbgui.getPosPcOfPicIdx(i);
            var pos = hbgui.getPosPxOfPospc(pospc);
            //console.log(` r ${i} ${gameData.targetList[i].id} ${JSON.stringify(pospc)}`)
            
            var img = document.getElementById(gameData.targetList[i].id);
            img.style.transition=''; // instant
            img.style.maxWidth = hbgui.cache.imgSizePx + 'px';    // instead of 'width' to keep ratio
            img.style.maxHeight = hbgui.cache.imgSizePx + 'px';
            img.style.transform=`translate3d(${pos.x}px, ${pos.y}px, ${pos.z}px) scale(${pospc.scale}, ${pospc.scale}) rotateX(${pospc.rotX}deg)`; // size:enlarge .. rotate:flip
            //  rotateX(${pospc.rotX}deg)
            //console.log(`  res ${i} ${gameData.targetList[i].id} ${img.style.left} ${img.style.top}` );
        }
        document.getElementById(gameDesc.misc.demo1).style.maxWidth = hbgui.cache.imgSizePx + 'px';    // todo: move to hbpairgame
        document.getElementById(gameDesc.misc.demo2).style.maxWidth = hbgui.cache.imgSizePx + 'px';    //
    },

    setStyle: function (elem,styleitem,value) {
        document.getElementById(elem).style.setProperty(styleitem,value);
    },
    getPPosX: function (step,player=0) {
        return gameDesc.steps[step].x;
    },
    getPPosY: function (playeridx=0) {
        return gameDesc.steps[players[gameData.players[playeridx]].step].y + (players[gameData.players[playeridx]].step==0 ? playeridx*15 : 0);
    },
    myBlink: function (elem, isSet=true) {
        if (isSet) {
            elem.style.animation=`blink1 ${2 * hbgui._longMs}ms infinite`;
        } else {
            elem.style.removeProperty('animation');
        }
        elem.style.tranform="none";
    },
    
    toggleFullScr: function () {
        console.log(`full ${hbgui.fullscr}`)
        if (hbgui.fullscr == 0) {
            if ( document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen();
            } else if ( document.documentElement.webkitrequestFullscreen) {
                document.documentElement.webkitrequestFullscreen();
            } else if ( document.documentElement.mozrequestFullscreen) {
                document.documentElement.mozrequestFullscreen();
            } else if ( document.documentElement.msrequestFullscreen) {
                document.documentElement.msrequestFullscreen();
            }
            hbgui.fullscr = 1;
            document.getElementById("fullscr").src = "images/fullscr2b.png";
        } else {
            if ( document.documentElement.exitFullscreen) {
                document.documentElement.exitFullscreen();
            } else if ( document.documentElement.cancelFullscreen) {
                document.documentElement.cancelFullscreen();
            } else if ( document.documentElement.webkitexitFullscreen) {
                document.documentElement.webkitexitFullscreen();
            } else if ( document.documentElement.mozexitFullscreen) {
                document.documentElement.mozexitFullscreen();
            } else if ( document.documentElement.msexitFullscreen) {
                document.documentElement.msexitFullscreen();
            } else {
                alert('exit fullscreen, doesnt work');
            }
            hbgui.fullscr = 0;    
            document.getElementById("fullscr").src = "images/fullscr2a.png";
        }
        hbgui.myResize();
        //setTimeout(function(){window.scrollTo(0, 0); }, 5);
    },
    
    toggleAudio: function () {
        console.log(` toggleAudio.. muted:${hbgui.muted}`);

        var audio = document.getElementById('myaudio');
        if (audio) {
            if (hbgui.muted == false) {
                hbgui.muted = true;
                audio.pause();
                document.getElementById('bvol').src = "images/volume2b.png";
            } else {
                hbgui.muted = false;
                audio.play();
                document.getElementById('bvol').src = "images/volume2a.png";
            }
        }
    },
    
    debugPos: function (dx,dy,player=0) {
        idx=players[player].step
        gameDesc.steps[idx].x+=dx;
        gameDesc.steps[idx].y+=dy;
        movePlayerImg(player,idx);
        document.getElementById('status').innerHTML=`x:${gameDesc.steps[idx].x}, y:${gameDesc.steps[idx].y}`;
    }
}
hbgui.getAboutPosPcOf = hbgui.getEndingPosPcOf;

var hbcookies = {
    bake: function(name, value) {
        //var cookiestr = [name, '=', JSON.stringify(value), '; domain=.', window.location.host.toString(), '; path=/;'].join('');
        var cookiestr = `${name}=${encodeURIComponent(JSON.stringify(value))};max-age=${1000*24*60*60*1000};domain=.${window.location.host.toString()}.com:; path=/;`;
        //var cookiestr = `${name}=${encodeURIComponent(JSON.stringify(value))};max-age=${1000*24*60*60*1000};path=/;`;
        document.cookie = cookiestr;
    },
    delete: function(name) {
        var cookiestr = `${name}=;max-age=0;path=/;`;
        document.cookie = cookiestr;
    },
    
    read: function(name) {
        var result = document.cookie.match(new RegExp(name + '=([^;]+)'));
        
        if (result) {
            console.log(` load cookie1 ${name} : ${result}`);
            console.log(` load cookie2 ${name} : ${decodeURIComponent(result[1])}`);
            console.log(` load cookie3 ${name} : ${JSON.parse(decodeURIComponent(result[1]))}`);
            
            result = JSON.parse(decodeURIComponent(result[1]));
        } else {
            result = [];
        }
        
        console.log(` load cookie ${name} : ${result}`);
        
        return result;
    },
    set: function(name, value) {
        var cookiestr = `${name}=${encodeURIComponent(value)};max-age=${1000*24*60*60*1000};path=/`; //;path=/lovas12/nincs2
        console.log(` set cookie ${cookiestr}`);
        document.cookie = cookiestr; //;path=/lovas12/nincs2
    },
    get: function(name) {
        var cookieArr = document.cookie.split(";");
        for (var i = 0; i < cookieArr.length; i++) {
            var cookiePair = cookieArr[i].split("=");
            if (name == cookiePair[0].trim()) {
                return decodeURIComponent(cookiePair[1]);
            }
        }
        return null;
    }
}
    /*width:10%;height:10%;padding:0;display:inline-block;
    display:inline-block;
    */
   