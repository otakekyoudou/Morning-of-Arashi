/*
 * MobileUI.js - RPGツクールMV用 スマホ仮想パッド
 * 使い方: js/plugins/ フォルダに入れて、プラグイン管理で有効化
 */

(function() {
    'use strict';

    // ===== 設定 =====
    var PAD_SIZE = 130;       // 十字パッドの直径(px)
    var BTN_SIZE = 58;        // ボタンの直径(px)
    var UI_OPACITY = 0.82;    // UI全体の透明度
    var BOTTOM_OFFSET = 18;   // 画面下からの余白(px)

    // ===== スマホ判定 =====
    var isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
        || ('ontouchstart' in window);

    if (!isMobile) return; // PCでは表示しない

    // ===== スタイル注入 =====
    var style = document.createElement('style');
    style.textContent = `
        #mobileUI {
            position: fixed;
            bottom: 0; left: 0; right: 0;
            height: 180px;
            z-index: 99999;
            pointer-events: none;
            user-select: none;
            -webkit-user-select: none;
        }
        #mobileUI * {
            pointer-events: auto;
            -webkit-tap-highlight-color: transparent;
            touch-action: none;
            box-sizing: border-box;
        }

        /* 十字パッド */
        #dpad {
            position: absolute;
            bottom: ${BOTTOM_OFFSET}px;
            left: 20px;
            width: ${PAD_SIZE}px;
            height: ${PAD_SIZE}px;
            opacity: ${UI_OPACITY};
        }
        .dpad-ring {
            position: absolute;
            width: 100%; height: 100%;
            border-radius: 50%;
            background: radial-gradient(circle, rgba(60,60,80,0.85) 0%, rgba(30,30,50,0.9) 100%);
            border: 2px solid rgba(180,180,220,0.35);
            box-shadow: 0 4px 18px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.08);
        }
        .dpad-arrow {
            position: absolute;
            display: flex; align-items: center; justify-content: center;
            color: rgba(210,210,240,0.9);
            font-size: 20px;
            line-height: 1;
        }
        #arr-up    { top: 4px;    left: 50%; transform: translateX(-50%); width: 40px; height: 40px; }
        #arr-down  { bottom: 4px; left: 50%; transform: translateX(-50%); width: 40px; height: 40px; }
        #arr-left  { left: 4px;   top: 50%;  transform: translateY(-50%); width: 40px; height: 40px; }
        #arr-right { right: 4px;  top: 50%;  transform: translateY(-50%); width: 40px; height: 40px; }
        .dpad-center {
            position: absolute;
            width: 36px; height: 36px;
            top: 50%; left: 50%;
            transform: translate(-50%,-50%);
            border-radius: 50%;
            background: rgba(40,40,60,0.7);
            border: 1px solid rgba(180,180,220,0.2);
        }

        /* アクションボタン群 */
        #btns {
            position: absolute;
            bottom: ${BOTTOM_OFFSET}px;
            right: 16px;
            display: flex;
            flex-direction: column;
            gap: 10px;
            align-items: flex-end;
            opacity: ${UI_OPACITY};
        }
        #btns-row1, #btns-row2 {
            display: flex;
            gap: 10px;
        }
        .mBtn {
            width: ${BTN_SIZE}px;
            height: ${BTN_SIZE}px;
            border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            font-size: 13px;
            font-weight: bold;
            font-family: 'Hiragino Sans', 'Yu Gothic', sans-serif;
            letter-spacing: 0.5px;
            color: #fff;
            border: 2px solid rgba(255,255,255,0.25);
            box-shadow: 0 4px 14px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.15);
            transition: transform 0.08s, box-shadow 0.08s;
            cursor: pointer;
        }
        .mBtn:active, .mBtn.pressed {
            transform: scale(0.91);
            box-shadow: 0 1px 6px rgba(0,0,0,0.4);
        }
        #btn-ok     { background: radial-gradient(135deg, #4a7cff 0%, #2355cc 100%); }
        #btn-cancel { background: radial-gradient(135deg, #e05555 0%, #a02020 100%); }
        #btn-menu   { background: radial-gradient(135deg, #3dba6a 0%, #1e7a3e 100%); font-size: 11px; }
        #btn-dash   { background: radial-gradient(135deg, #c07b20 0%, #7a4c0a 100%); font-size: 11px; }
    `;
    document.head.appendChild(style);

    // ===== HTML構築 =====
    var ui = document.createElement('div');
    ui.id = 'mobileUI';
    ui.innerHTML = `
        <div id="dpad">
            <div class="dpad-ring"></div>
            <div class="dpad-arrow" id="arr-up">▲</div>
            <div class="dpad-arrow" id="arr-down">▼</div>
            <div class="dpad-arrow" id="arr-left">◀</div>
            <div class="dpad-arrow" id="arr-right">▶</div>
            <div class="dpad-center"></div>
        </div>
        <div id="btns">
            <div id="btns-row1">
                <div class="mBtn" id="btn-dash">ダッシュ</div>
                <div class="mBtn" id="btn-menu">メニュー</div>
            </div>
            <div id="btns-row2">
                <div class="mBtn" id="btn-cancel">キャン</div>
                <div class="mBtn" id="btn-ok">決定</div>
            </div>
        </div>
    `;
    document.body.appendChild(ui);

    // ===== キー入力マッピング =====
    var KEY = {
        up:     [38, 87],  // ↑ W
        down:   [40, 83],  // ↓ S
        left:   [37, 65],  // ← A
        right:  [39, 68],  // → D
        ok:     [13, 90],  // Enter Z
        cancel: [27, 88],  // Esc X
        menu:   [27],      // Esc
        dash:   [16],      // Shift
    };

    function triggerKey(codes, down) {
        codes.forEach(function(code) {
            var type = down ? 'keydown' : 'keyup';
            var ev = new KeyboardEvent(type, { keyCode: code, which: code, bubbles: true });
            document.dispatchEvent(ev);
        });
    }

    // ===== ボタンイベント =====
    function bindBtn(id, keys) {
        var el = document.getElementById(id);
        if (!el) return;
        el.addEventListener('touchstart', function(e) {
            e.preventDefault();
            el.classList.add('pressed');
            triggerKey(keys, true);
        }, { passive: false });
        el.addEventListener('touchend', function(e) {
            e.preventDefault();
            el.classList.remove('pressed');
            triggerKey(keys, false);
        }, { passive: false });
    }

    bindBtn('btn-ok',     KEY.ok);
    bindBtn('btn-cancel', KEY.cancel);
    bindBtn('btn-menu',   KEY.menu);
    bindBtn('btn-dash',   KEY.dash);

    // ===== 十字パッドのジョイスティック処理 =====
    var dpad = document.getElementById('dpad');
    var activeDir = { up: false, down: false, left: false, right: false };

    function getDir(cx, cy, rect) {
        var x = cx - (rect.left + rect.width / 2);
        var y = cy - (rect.top + rect.height / 2);
        var r = rect.width / 2;
        if (Math.sqrt(x*x + y*y) < r * 0.18) return null; // 中心デッドゾーン
        var angle = Math.atan2(y, x) * 180 / Math.PI;
        if (angle >= -135 && angle < -45)  return 'up';
        if (angle >= -45  && angle < 45)   return 'right';
        if (angle >= 45   && angle < 135)  return 'down';
        return 'left';
    }

    function setDir(dir) {
        var map = { up: KEY.up, down: KEY.down, left: KEY.left, right: KEY.right };
        Object.keys(activeDir).forEach(function(d) {
            if (d === dir && !activeDir[d]) {
                activeDir[d] = true;
                triggerKey(map[d], true);
            } else if (d !== dir && activeDir[d]) {
                activeDir[d] = false;
                triggerKey(map[d], false);
            }
        });
    }

    function clearDir() {
        var map = { up: KEY.up, down: KEY.down, left: KEY.left, right: KEY.right };
        Object.keys(activeDir).forEach(function(d) {
            if (activeDir[d]) {
                activeDir[d] = false;
                triggerKey(map[d], false);
            }
        });
    }

    dpad.addEventListener('touchstart', function(e) {
        e.preventDefault();
        var t = e.touches[0];
        var dir = getDir(t.clientX, t.clientY, dpad.getBoundingClientRect());
        if (dir) setDir(dir); else clearDir();
    }, { passive: false });

    dpad.addEventListener('touchmove', function(e) {
        e.preventDefault();
        var t = e.touches[0];
        var dir = getDir(t.clientX, t.clientY, dpad.getBoundingClientRect());
        if (dir) setDir(dir); else clearDir();
    }, { passive: false });

    dpad.addEventListener('touchend', function(e) {
        e.preventDefault();
        clearDir();
    }, { passive: false });

    dpad.addEventListener('touchcancel', function(e) {
        e.preventDefault();
        clearDir();
    }, { passive: false });

    // ===== 画面スクロール防止 =====
    document.addEventListener('touchmove', function(e) {
        if (e.target.closest('#mobileUI')) e.preventDefault();
    }, { passive: false });

})();
