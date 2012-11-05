iquery
======

it's a light framwork for the web developer
/*** This's me. Just a joke!!!

var rin = {
			_name : "rin",
			_age : 26,
			_qq  : 723217026,
			_hobby : new RegExp(/(guitar|singing|swimming|badminton)/i),
			_sex : "male",
			_birthday : "1987-01-28",
			
			checkNewFriend : function(you){
				if("female" === you.sex){
					alert("oh,yeah,it's the first step");
					if(you.age>=0&&you.age<=this._age){
						alert("hi,girl,u can enter the next step!")
						if(this._hobby.test(you.hobby)){
							alert("Girl,let's go to the lake,we can singing together");
						}else{
							alert("U can add my QQnumber:" + this._qq);
						}
					}else{
						alert("sorry,girl!!But i can introduce my friends to u");
					}
				}else{
					alert("hey,man!Are u kidding???");
				}
			}
		}
	
