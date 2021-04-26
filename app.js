(async () => {
  //乐谱加载
  const osmd = new opensheetmusicdisplay.OpenSheetMusicDisplay(document.getElementById("score"),{
      autoResize: true,
      backend: "canvas",
      drawingParameters: "compacttight", // more compact spacing, less padding
      drawTitle: false, // included in "compacttight"
      pageFormat: "A4_P",
      followCursor:true,
      spacingBetweenTextLines: 1000,
  });
  const audioPlayer = new OsmdAudioPlayer();

  const scoreXml = await fetch(
    /*"https://opensheetmusicdisplay.github.io/demo/sheets/MuzioClementi_SonatinaOpus36No1_Part2.xml"*/
    "https://cdn.jsdelivr.net/gh/NightSlightCold/Music-practice/MuzioClementi_SonatinaOpus36No1_Part1.xml"
  ).then(r => r.text()); 
  //console.log("Score xml: ", scoreXml);
  await osmd.load(scoreXml);
  await osmd.render();
  console.log("完成乐谱加载");
  //播放器加载
  await audioPlayer.loadScore(osmd);
  audioPlayer.on("iteration", notes => {//播放过程中
    console.log(notes);//打印音符信息
     console.log(audioPlayer.currentIterationStep);
  });
  hideLoadingMessage();
  registerButtonEvents(audioPlayer);
  //录音功能部分
  var base64str = '';//音频数据
  var bolbSrc = '';//录音bolb路径
  var timer = '';//录音计时定时器
  var maxtime = 1; // 录音计时器
  var recorder;
  let formData = new FormData();
  //录音倒计时
  function CountDown() {
      minutes = Math.floor(maxtime / 60);
      seconds = Math.floor(maxtime % 60);
      if (minutes == 0) {
          msg = "已录制" + seconds + "秒";
      } else if (seconds == 0) {
          msg = "已录制" + minutes + "分";
      } else {
          msg = "已录制" + minutes + "分" + seconds + "秒";
      }
      $('.countDown').text(msg)
      ++maxtime;
  }

  recorder = Recorder({ type: "mp3", sampleRate: 16000, bitRate: 16 });//录音初始化
  console.log(recorder)
  document.getElementById("startRecord").addEventListener("click",()=>{
    //录音按钮点击 开始录音 显示暂停 和停止按钮
    recorder.open(function () {//打开麦克风授权获得相关资源
      //dialog&&dialog.Cancel(); 如果开启了弹框，此处需要取消
      if ($(this).hasClass('disBtn') == false) {
          recorder.start();//开始录音
          if (timer) {
              clearInterval(timer);//清空倒计时
          }
          timer = setInterval(CountDown, 1000);
          $('.countDown').show();
          $('.recordHandleBox').show();
          $('.curRecorderBox').hide();
          $('.uploadBox').hide();
          $('.countDown').show();
          $(this).addClass('disBtn');
      }
  }, function (msg, isUserNotAllow) {//用户拒绝未授权或不支持
      //dialog&&dialog.Cancel(); 如果开启了弹框，此处需要取消
      alert(msg);
      console.log((isUserNotAllow ? "UserNotAllow，" : "") + "无法录音:" + msg);
  });
  })
  document.getElementById("pauseRecord").addEventListener("click",()=>{
    //录音暂停按钮点击 显示恢复按钮
    if ($(this).hasClass('disBtn') == false) {
      $(this).addClass('disBtn');
      $('#resumeRecord').removeClass('disBtn');
      recorder.pause();
      clearInterval(timer);//清空倒计时
    }
  })
  document.getElementById("resumeRecord").addEventListener("click",()=>{
    //录音恢复按钮点击 显示暂停按钮
    if ($(this).hasClass('disBtn') == false) {
      $(this).addClass('disBtn');
      $('#pauseRecord').removeClass('disBtn');
      recorder.resume();
      timer = setInterval(CountDown, 1000);//重新开始录音倒计时
    }
  })
  document.getElementById("endRecord").addEventListener("click",()=>{//录音停止按钮点击
    setRecorderFinish();
  })
  document.getElementById("upload").addEventListener("click",()=>{//上传按钮
     $.ajax({
                url: "https://nightslightcold.github.io/Music-practice/",
                type: "get",
                data: formData,
                processData:false, 
                contentType:false, 
                mimeType: "multipart/form-data",
                 success: function (data, status) {
                    alert("上传成功");
                },
             });
  })
  function setRecorderFinish() {
    $('.recordHandleBox').hide();
    $('.curRecorderBox').show();
    $('.uploadBox').show();
    $('.countDown').hide();
    recorder.stop(function (blob) {//到达指定条件停止录音
        //console.log(blob)
        recorder.close();//释放录音资源
        clearInterval(timer);//清空倒计时
        $('.countDown').text("未开始录制")
        maxtime = 1; // 录音倒计时五分钟
        readBlobAsBase64(blob, function (dataurl) {
            base64str = dataurl.split('base64,')[1];
            bolbSrc = window.URL.createObjectURL(blob);
            $('.audio').attr('src', bolbSrc);
            console.log(bolbSrc);
            let mp3File = new File([blob], 'ex.mp3', {type: 'audio/mp3'});
            console.log(mp3File);
            var formData=new FormData();
            formData.append("uploadfile",mp3File,recorder);
        });
  
    }, function (msg) {
        console.log("录音失败:" + msg);
    });
  }
  // 把blob对象转换为Base64
  function readBlobAsBase64(blob, callback) {
    var a = new FileReader();
    a.onload = function (e) { callback(e.target.result); };
    a.readAsDataURL(blob);
  }
})();

function hideLoadingMessage() {
  document.getElementById("loading").style.display = "none";
}

function registerButtonEvents(audioPlayer) {
  let ifstart = false;
  document.getElementById("btn-play").addEventListener("click", () => {
    ifstart = true;
    if (audioPlayer.state === "STOPPED" || audioPlayer.state === "PAUSED") {
      audioPlayer.play();
    }
    if(audioPlayer.state==="PLAYING"){
      audioPlayer.pause();
    }
    var btn1= document.getElementById("btn-play");//动态修改类名，根据类名指定分配的样式
    if(btn1.classList.contains('pause'))
      btn1.classList.remove('pause');
    else  
      btn1.classList.add('pause');

  });
  document.getElementById("btn-stop").addEventListener("click", () => {
    if (audioPlayer.state === "PLAYING" || audioPlayer.state === "PAUSED") {
      audioPlayer.stop();
    }
    var btn1= document.getElementById("btn-play");//动态修改类名，根据类名指定分配的样式
    if(btn1.classList.contains('pause'))
      btn1.classList.remove('pause');
  });
}


