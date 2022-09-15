var defaultKey = "EliminatePicStoreKey";
class Store {
   constructor(){

   }
   static getStorage(key) {
      key = key ? key : defaultKey;
      if (localStorage) {
          if (localStorage[key]) {
              return JSON.parse(localStorage[key]);
          }
          return null;
      }
      return null;
  }
  static setStorage(data, key) {
      key = key ? key : defaultKey;
      if (localStorage) {
          if (!data) {
              localStorage[key] = null;
          } else {
              localStorage[key] = JSON.stringify(data);
          }
      }
      return null;
  }
}
class Position {
   x
   y
   constructor(x, y){
      this.x = x;
      this.y = y;
   }
}


//Picture fragment
class Fragment {
   p0 // orign point
   width
   image
   zindex
   fathers = []
   childrens = []
   id
   constructor(id, x, y, width, img){
      this.id = `fragment_${id}`;
      this.p0 = new Position(x,y);
      this.width = width;
      this.image = img;
      this.createEL();
   }
   createEL(){
      var transX = this.p0.x;
      var transY = this.p0.y;
      var el = $(`<div id="${this.id}" class="fragment" style="width:${this.width}px;height:${this.width}px;transform: translate(${transX}px, ${transY}px);background: url(${this.image}) no-repeat;background-size: ${this.width}px ${this.width}px;"></div>`);
      $(".box").append(el);
   }
   moveTo(x, y){
      this.p0.x = x;
      this.p0.y = y;
      $(`#${this.id}`).css(`transform`,`translate(${x}px, ${y}px)`);
   }
   addMask(){
      $(`#${this.id}`).addClass("mask");
   }
   removeMask(){
      $(`#${this.id}`).removeClass("mask");
   }
   addFather(target){
      this.fathers.push(target);
      this.addMask();
   }
   removeFather(target){
      for (let index = 0; index < this.fathers.length; index++) {
         const element = this.fathers[index];
         if (target.id == element.id) {
            this.fathers.splice(index, 1);
            break;
         }
      }
      if (this.fathers.length == 0) {
         this.removeMask();
      }
   }
   addSon(target){
      this.childrens.push(target);
   }
   removeSon(target){
      for (let index = 0; index < this.childrens.length; index++) {
         const element = this.childrens[index];
         if (target.id == element.id) {
            this.childrens.splice(index, 1);
            break;
         }
      }
   }
   disappear(){
      $(`#${this.id}`).css(`transform`,`translate(${this.p0.x}px, ${this.p0.y}px) scale(0)`);
      setTimeout(() => {
         this.delete();
      }, 310);
   }
   delete(){
      $(`#${this.id}`).remove();
   }
}

class Game {
   BoxWidth = 480
   CardWidth = 60
   BaseNum = 2
   EachLevelNum = 15
   LoseTip = "你输了\n点击确定从头再来吧~~"
   WinTip = "胜利!!!\n点击确定进入下一关~~"
   ImageNum = 21
   Ready = 0
   Win = 1
   Processing = 2
   CardBoxNum = 8 //check box max num
   _level = 1
   _frags = []
   _sw = 0
   _time = 0
   _imgs = []
   _state = this.Ready// 1 win
   _checkBox
   getCardNum(){
      return this._level * this.EachLevelNum;
   }
   getImg(cardNum){
      var total = (this.BaseNum + this._level);
      var imgs = [];
      while (imgs.length < cardNum) {
         for (let index = 0; index < total; index++) {
            var tempIndex = index % this.ImageNum;
            imgs.push(`img/${tempIndex}.jpeg`)
            imgs.push(`img/${tempIndex}.jpeg`)
            imgs.push(`img/${tempIndex}.jpeg`)
            if (imgs.length == cardNum) {
               break;
            }
         }
      }
      var result = [];
      for (let index = 0; index < cardNum; index++) {
         var temp = this.getRandom(imgs.length - 1);
         result.push(imgs[temp]);
         imgs.splice(temp,1);
      }
      
      return result;
   }
   clearFragment(){
      for (let index = 0; index < this._frags.length; index++) {
         const element = this._frags[index];
         element.delete();
      }
      this._frags = [];
   }
   createFragment(){
      var cardNum = this.getCardNum();
      this._imgs = this.getImg(cardNum);
      this.clearFragment();
      var max = this.BoxWidth - this.CardWidth;
      for (let index = 0; index < cardNum; index++) {
         var y = this.getRandom(max);
         var x = this.getRandom(max);
         var temp = new Fragment(index, x, y, this.CardWidth, this._imgs[0]);
         this._imgs.shift();
         this._frags.push(temp);
      }
   }
   getRandom(max){
      return Math.floor(Math.random()*(max+1));
   }
   randomOrder(){
      var max = this.BoxWidth - this.CardWidth;
      for (let index = 0; index < this._frags.length; index++) {
         var element = this._frags[index];
         var y = this.getRandom(max);
         var x = this.getRandom(max);
         element.moveTo(x, y);
         element.fathers = [];
         element.childrens = [];
         element.removeMask();
      }
      this.associate();
   }
   constructor(){
      if (window.innerWidth < 480) {
         this.BoxWidth = 320;
         this.CardWidth = 40;
      }
      var store = Store.getStorage();
      if (store && store.level) {
         this._level = store.level;
      }
   }
   initEvent(){
      $(".fragment").on("click",(e => {
         if (e.target.classList.contains("mask")) {
            return;
         }
         this.click(e.target.id);
      }));
   }
   start(){
      this._state = this.Ready;
      this._time = 0;
      if (this._checkBox) {
         this._checkBox.clear();
      }
      else{
         var p0 = new Position(0, this.BoxWidth + 20);
         this._checkBox = new CheckBox(p0, this.CardWidth);
      }
      
      this.createFragment();
      $("#level").text(this._level);
      this.initEvent();
      this.associate();
      this.startSW();
   }
   associate(){
      for (let index = 0; index < this._frags.length - 1; index++) {
         var tar = this._frags[index];
         for (let faIndex = index + 1; faIndex < this._frags.length; faIndex++) {
            var father = this._frags[faIndex];
            if (Math.abs(tar.p0.x - father.p0.x) < tar.width && Math.abs(tar.p0.y - father.p0.y) < tar.width) {
               //is
               tar.zindex = index;
               father.zindex = index + 1;
               tar.addFather(father);
               father.addSon(tar);
            }
         }
      }
   }
   startSW(){
      var timeStr = this.formatSeconds(this._time);
      $("#time").text(timeStr);
      this._sw = setInterval(() => {
         this._time++;
         var timeStr = this.formatSeconds(this._time);
         $("#time").text(timeStr);
      }, 1000);
   }
   pauseSW(){
      this.stopSW();
   }
   stopSW(){
      clearInterval(this._sw);
   }
   formatSeconds(value) {
      let theTime = parseInt(value);
      let theTime1 = 0;
      let theTime2 = 0;
       
      if(theTime > 60) {
      theTime1 = parseInt(theTime/60);
      theTime = parseInt(theTime%60);
       
      if(theTime1 > 60) {
      theTime2 = parseInt(theTime1/60);
      theTime1 = parseInt(theTime1%60);
      }
      }
      let result = ''+parseInt(theTime)+' 秒';
      if(theTime1 > 0) {
      result = ''+parseInt(theTime1)+' 分 '+result;
      }
      if(theTime2 > 0) {
      result = ''+parseInt(theTime2)+' 小时 '+result;
      }
      return result;
   }
   click(id){
      // if (this._state != this.Processing) {
      //    return;
      // }
      var checkNum;
      for (let index = 0; index < this._frags.length; index++) {
         var frag = this._frags[index];
         if (frag.id == id) {
            for (let inde = 0; inde < frag.childrens.length; inde++) {
               var element = frag.childrens[inde];
               element.removeFather(frag);
            }
            checkNum = this._checkBox.addFrag(frag);
            this._frags.splice(index, 1);
            break;
         }
      }
      if (checkNum == this.CardBoxNum) {
         //lose
         this.stopSW();
         alert(this.LoseTip);
         this.start();
      }
      else if (this._frags.length == 0) {
         //win
         this._level++;
         Store.setStorage({level: this._level});
         this.stopSW();
         var msg = `${this.WinTip}\n用时：${this.formatSeconds(this._time)}`
         alert(msg);
         this.start();
      }

   }
}

class CheckBox{
   _frags = []
   p0
   fragWidth
   constructor(p0, fragWidth){
      this.p0 = p0;
      this.fragWidth = fragWidth;
   }
   addFrag(frag){
      if (this._frags.length == 0) {
         //add here
         frag.moveTo(this.p0.x, this.p0.y);
         this._frags.push(frag);
      }
      else{
         var addFlag = false;
         var needRightMove = [];
         for (let index = this._frags.length - 1; index >= 0; index--) {
            const element = this._frags[index];
            if (frag.image == element.image) {
               addFlag = true;
               //add here
               frag.moveTo(this.p0.x + (index + 1) * this.fragWidth, this.p0.y);
               this._frags.splice(index,0,frag);
               needRightMove.forEach(el => {
                  el.moveTo(el.p0.x + this.fragWidth, this.p0.y);
               });
               //check need eliminate
               if (index - 1 >= 0 && this._frags[index - 1].image == frag.image) {
                  //eliminate
                  element.disappear();
                  this._frags[index - 1].disappear();
                  frag.disappear();
                  this._frags.splice(index - 1, 1);
                  this._frags.splice(index - 1, 1);
                  this._frags.splice(index - 1, 1);
                  setTimeout(() => {
                     needRightMove.forEach(el => {
                        el.moveTo(el.p0.x - 3 * this.fragWidth, this.p0.y);
                     });
                  }, 10);
               }
               break;
            }
            needRightMove.push(element);
         }
         if (!addFlag) {
            //add here
            frag.moveTo(this.p0.x + this._frags.length * this.fragWidth, this.p0.y);
            this._frags.push(frag);
         }
      }

      return this._frags.length;
   }
   clear(){
      for (let index = 0; index < this._frags.length; index++) {
         const element = this._frags[index];
         element.delete();
      }
      this._frags = [];
   }

}

$(function() {
   var game = new Game();
   $("#start").on("click",(e => {
      $("#start").hide();
      game.start();
   }));
   $("#pause").on("click",(e => {
      game.pauseSW();
      $("#pausepanel").show();
   }));
   $("#restart").on("click",(e => {
      game.stopSW();
      game.start();
   }));
   $("#continue").on("click",(e => {
      $("#pausepanel").hide();
      game.startSW();
   }));
   $("#helper").on("click",(e => {
      let tip = "鑫哥NB";
      var res = prompt("请输入暗号:",tip);
      if (res == tip) {
         alert("说啥都没用了!");
      }
      else{
         alert("说别的没用!!");
      }
   }));
})