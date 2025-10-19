// ==UserScript==
// @name         网易云音乐MP3链接获取器
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  在网易云音乐网页中获取音乐ID，通过解析API获取MP3链接并复制到剪贴板
// @author       xiaohan(write by glm4.6)
// @match        https://music.163.com/*
// @grant        GM_xmlhttpRequest
// @grant        GM_setClipboard
// @connect      *
// ==/UserScript==

(function() {
    'use strict';

    // 创建UI按钮
    function createDownloadButton() {
        const button = document.createElement('div');
        button.id = 'netease-music-downloader';
        button.innerHTML = '获取MP3链接';
        button.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            background-color: #C20C0C;
            color: white;
            padding: 10px 15px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            transition: all 0.3s ease;
        `;
        
        button.addEventListener('mouseover', function() {
            button.style.backgroundColor = '#A00A0A';
            button.style.transform = 'scale(1.05)';
        });
        
        button.addEventListener('mouseout', function() {
            button.style.backgroundColor = '#C20C0C';
            button.style.transform = 'scale(1)';
        });
        
        button.addEventListener('click', getMusicUrl);
        
        document.body.appendChild(button);
        
        // 添加提示信息
        const tooltip = document.createElement('div');
        tooltip.id = 'netease-tooltip';
        tooltip.style.cssText = `
            position: fixed;
            top: 70px;
            right: 20px;
            z-index: 9999;
            background-color: rgba(0,0,0,0.8);
            color: white;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 12px;
            max-width: 200px;
            display: none;
        `;
        document.body.appendChild(tooltip);
        
        return { button, tooltip };
    }

    // 获取当前页面的音乐ID
    function getMusicId() {
        // 从URL中获取音乐ID
        const urlMatch = window.location.href.match(/song\?id=(\d+)/);
        if (urlMatch) {
            return urlMatch[1];
        }
        
        // 尝试从页面元素中获取音乐ID
        // 歌曲详情页
        const songDetailElement = document.querySelector('.song-detail-abstract .name') || 
                                 document.querySelector('.song-name') || 
                                 document.querySelector('.f-ff2');
        
        if (songDetailElement) {
            const href = songDetailElement.getAttribute('href') || 
                        songDetailElement.parentElement.getAttribute('href');
            if (href) {
                const idMatch = href.match(/id=(\d+)/);
                if (idMatch) {
                    return idMatch[1];
                }
            }
        }
        
        // 播放器中的当前歌曲
        const playerSong = document.querySelector('.player .name') || 
                          document.querySelector('.j-flag');
        
        if (playerSong) {
            const href = playerSong.getAttribute('href') || 
                        playerSong.parentElement.getAttribute('href');
            if (href) {
                const idMatch = href.match(/id=(\d+)/);
                if (idMatch) {
                    return idMatch[1];
                }
            }
        }
        
        return null;
    }

    // 获取音乐信息
    function getMusicInfo() {
        const title = document.querySelector('.song-name-abstract .name') || 
                     document.querySelector('.song-name') || 
                     document.querySelector('.f-ff2') || 
                     document.querySelector('.player .name');
        
        const artist = document.querySelector('.song-detail-abstract .singer') || 
                      document.querySelector('.descrip.s-fc4') || 
                      document.querySelector('.player .by');
        
        return {
            title: title ? title.textContent.trim() : '未知歌曲',
            artist: artist ? artist.textContent.trim() : '未知歌手'
        };
    }

    // 显示提示信息
    function showTooltip(message, duration = 3000) {
        const tooltip = document.getElementById('netease-tooltip');
        if (tooltip) {
            tooltip.textContent = message;
            tooltip.style.display = 'block';
            
            setTimeout(() => {
                tooltip.style.display = 'none';
            }, duration);
        }
    }

    // 通过API获取音乐链接
    function getMusicUrl() {
        const musicId = getMusicId();
        
        if (!musicId) {
            showTooltip('无法获取音乐ID，请确保您在音乐播放页面');
            return;
        }
        
        const musicInfo = getMusicInfo();
        showTooltip(`正在获取《${musicInfo.title}》的MP3链接...`);
        

        const apiUrl = `https://music-api.xiaohan-kaka.top/song/url?id=${musicId}&randomCNIP=true`;
        
        GM_xmlhttpRequest({
            method: 'GET',
            url: apiUrl,
            headers: {
                'Content-Type': 'application/json'
            },
            onload: function(response) {
                try {
                    const data = JSON.parse(response.responseText);
                    
                    if (data && data.data && data.data.length > 0) {
                        const musicUrl = data.data[0].url;
                        
                        if (musicUrl) {
                            // 复制到剪贴板
                            GM_setClipboard(musicUrl);
                            showTooltip(`MP3链接已复制到剪贴板！`);
                        } else {
                            showTooltip('获取音乐链接失败，可能需要VIP权限或者无版权');
                        }
                    } else {
                        showTooltip('API返回数据格式错误');
                    }
                } catch (error) {
                    console.error('解析API响应失败:', error);
                    showTooltip('解析API响应失败，请查看控制台');
                }
            },
            onerror: function(error) {
                console.error('API请求失败:', error);
                showTooltip('API请求失败，请检查网络连接');
            }
        });
    }

    // 初始化
    function init() {
        // 等待页面加载完成
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', createDownloadButton);
        } else {
            createDownloadButton();
        }
    }

    // 启动脚本
    init();
})();