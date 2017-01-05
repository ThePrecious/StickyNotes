var db=null;
if (window.openDatabase) {
	db= openDatabase("NoteTest", "1.0", "Stickys Database", 1000000);
	if (!db) {alert("Failed to open Database");
};
} else{
alert("Failed to open Database. Make sure ur browser supports HTML5 webstorage");
}

var capture = null;
var highestZ = 0;
var highestId = 0; //to tell the most recent note id

function Note(){
	var self = this;
	var note = document.createElement('div');
	note.className='note';
	note.addEventListner('mousedown',function(e) {
		return self.onMouseDown(e)
	},false);
	note.addEventListner('click', function() { 
		return self.onNoteClick()}, false );
}
this.note = note;

var close = document.createElement('div');
close.className='closeButton';
close.addEventListner('click',function(e) {
		return self.close(e)
	},false);
note.appendChild(close);

var edit = createElement('div');
edit.className ='edit';
edit.setAttribute('contenteditable',false);// turns note into editable input field, it wont save the content
edit.addEventListner('keyup',function() {
		return self.onKeyUp()
	},false);
note.appendChild(edit);
this.editField = edit;

var ts = document.createElement('div');
ts.className = 'timeStamp';
ts.addEventListner('mousedown',function(e) {
		return self.onMouseDown(e)
	},false);
note.appendChild(ts);
this.lastModified = ts;

document.body.appendChild(note);
return this;
}
//prototype is the extension of note object where we can defn all the methods
Note.prototype = {
	//Getter and setter to get the internal data of the note object
	get id(){ // returns id of the note
		if(!("_id" in this))
        this._id = 0;
        return this._id;
	},
	set id(x){
		this._id=x;
	},

	get text(){ //returns whatever is typed
		return this.editField.innerHTML;
	},
	set text(x){
		this.editField.innerHTML =x;
	},

	get timeStamp(){
		if(!("_timeStamp" in this))
			this.timeStamp =0;
		return this._timeStamp;
	},
	set timeStamp(x){
		if(this._timeStamp == x){
			return;
		}
		this.timeStamp = x;
		var date = new Date();
		date.setTime(parseFloat (x));
		this.lastModified.textContent = modifiedString(date);
	},
	//position of notes
	get left(){
		return this.note.style.left;
	},
	set left(x){
		this.note.style.left =x;
	},

	get top(){
		return this.note.style.top;
	},
	set top(x){
		this.note.style.top =x;
	},

	get zIndex(){
		return this.note.style.zIndex;
	},
	set zIndex(x){
		this.note.style.zIndex =x;
	},
//runs everytym we close a note
	close: function(e){
		this.cancelPendingSave();// everytym we press a key it saves it to the database, this cancels it
		var note = this;
		db.transaction(function(tx){
			tx.executeSql("DELETE FROM MyStickys WHERE id = ?,[note.id]");
		});
		document.body.removeChild(this.note);

	},
// call save function if the user has not pressed a key for say 200 ms
	saveSoon: function(){
		this.cancelPendingSave();
		var self = this;
		this._saveTimer = setTimeout(function(){ //setTimeout method is used to run something every 200ms<time that we specify>
		self.save();

		}, 200);
	},
// here we delete the savetimer
	cancelPendingSave: function(){
		if(!"_saveTimer" in this){ 
			return;
		}
	
	clearTimeout(this._saveTimer);
	delete this._saveTimer;
}
// if there is existing note and we have to update the note - this fn is used
save: function(){
	this.cancelPendingSave();
	if("dirty" in this){
		this.timeStamp = new Date().getTime();
		delete this.dirty;
	}

	var note = this;
	db.transaction(function(tx){
		tx.executeSql("UPDATE MyStickys SET note = ?,timeStamp, left=?, top=?, zIndex=? WHERE id=?",
			[note.text, note.timeStamp, note.left, note.top, note.zIndex, note._id]);
	});
},
saveAsNew: function(){
	this.timeStamp = new Date.getTime();
	var note = this;
	db.transaction(function(tx)){
		tx.executeSql("INSERT INTO MyStickys (id, note, timeStamp, left, top, zIndex) VALUES (?,?,?,?,?,?)",
			[note.id, note.text, note.timeStamp, note.left, note.top, note.zIndex] );
	});
}
//click and hold the note
onMouseDown: function(e){
    capture = this;
    this.startX = e.clientX - this.note.offsetLeft; //offsetLeft gives the number of pixels the left most of the elemet is offset to
    this.startY = e.clientY - this.note.offsetRight;
    this.zIndex =++highestZ;// 

    var self = this;
       if(!("mouseMoveHandler" in this)){
	   this.mouseMoveHandler = function(e){return self.onMouseMove(e)}
       this.mouseUpHandler = function(e){return self.onMouseUp(e)}
    }
    document.addEventListner("mousemove", this.mouseMoveHandler, true);
    document.addEventListner("mouseup", this.mouseUpHandler, true);

},
onMouseMove: function(e){
	if(this != captured){ return true;}
	this.left = e.clientX - this.startX +'px'; 
	//clientx returns horizontal position of mouse pointer when the event is triggered
	this.top = e.clientY - this.startY +'px'; 
	return false;
},
onMouseUp: function(e){
	document.removeEventListener("mousemove", this.mouseOverHandler, true);
	document.removeEventListener("mouseup", this.mouseUpHandler, true);
	this.save();
	return false;
},
onNoteClick: function(e){
	this.editField.focus();
	getSelection().collapseToEnd();

},
onKeyUp(){
	this.dirty = true;
	this.saveSoon();
}

}

function loaded(){
	db.transaction(function(tx){
		tx.executeSql("SELECT COUNT (*) FROM MyStickys", [], function(result){
			loadNotes();
		}, function(tx,error){
			tx.executeSql("CREATE TABLE MyStickys (id REAL UNIQUE, note TEXT, timestamp REAL, left TEXT, top TEXT, zIndex REAL)"
				[], function(result){
				      loadNotes();
			        });
		//}
		    });
	});
 
}
function loadNotes(){
	db.transaction(function(tx){
		tx.executeSql("SELECT id, note, timestamp, left, top, zIndex FROM MyStickys", [], function(tx, result){

			for(var i=0; i<result.rows.length;++i){
				var row = result.rows.item(i);
				var note = new Note();
				note.id = row['id'];
				note.text=row['note'];
				note.timeStamp = row['timestamp'];
				note.left = row['left'];
				note.top=row['top'];
				note.zIndex=row['zIndex'];

				if(row['id']>highestId){
					highestId = row['id'];
				}
				if(row['zIndex']>highestZ){
					highestZ = row['zIndex'];
				}

			}
			if(!result.rows.length){
				newNote();
			}

		}, function(tx, error){
			alert("Failed to get notes -"+ error.message);
		});
	});
}
function modifiedString(date){
	return"Sticky Last Modified: " +date.getFullYear() + " - " + (date.getMonth() + 1) +" - " 
	+ date.getHours() +" : " + date.getMinutes() +" : " + date.getSeconds();
}
function newNote(){
	var note = new Note();
	note.id = ++highestId;
	note.timeStamp = new Date().getTime();
	note.left = Math.round(Math.random() * 400) + "px";
	note.top = Math.round(Math.random() * 500) + "px";
	note.zIndex == ++highestZ;
	note.saveAsNew();
	
	

}

if (db != null){
	document.addEventListner("load", loaded, false);
}