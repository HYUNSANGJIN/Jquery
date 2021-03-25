//variables
let cardBeignDragged;
let dropzones = document.querySelectorAll('.dropzone');
let priorities;
// let cards = document.querySelectorAll('.kanbanCard');
let dataColors = [ // dataColors함수 안에 객체배열 초기화(color, title)
    {color:"yellow", title:"추가 항목"},
    {color:"blue", title:"진행중"},
    {color:"purple", title:"수정중"},
    {color:"red", title:"완료"}
];

let dataCards = {  //JSON 형태로 저장하려고 만든겁니다.
    config:{ maxid:0 },
    cards :[]
};

let theme="light";
//initialize

$(document).ready(()=>{
    $("#loadingScreen").addClass("d-none"); //id값에 클래스를 추가해줌(d-none)
    theme = localStorage.getItem('@kanban:theme'); //@kanban:theme 를 불러와서 darkmode 썻는지 여부 확인
    if(theme){
        $("body").addClass(`${theme === "light" ?    "":"darkmode"}`); //삼항연산자(강사님이쓴거아님)로 theme 조정.
        //@kanban:theme로 불러온 theme값을 비교해서 하나봄
        //이 코드의 문제점 : 중간에 Dark/Light 누르면 배경은 바뀌는데 localStorage가 갱신이안됨 ㅎ
    }

    initializeBoards(); //보드만드는함수 실행 , 다크면 다크, 라이트면 라이트로 생성됨

    if(JSON.parse(localStorage.getItem('@kanban:data'))){  //@kanban:data key로 불러온값을 JSON으로 변환 , null값 들어가면 if문은 실행안됨
        dataCards = JSON.parse(localStorage.getItem('@kanban:data'));
        initializeComponents(dataCards);
    }
    initializeCards();
    /* initializeCards() 가무엇이냐? 보기편하라고 여기 주석으로 붙였습니다 ^^
    function initializeCards(){
        cards = document.querySelectorAll('.kanbanCard');

        cards.forEach(card=>{
            card.addEventListener('dragstart', dragstart); // addEventListener -> 하나의 이벤트 타입에 여러개의 이벤트 리스너 등록 쌉가능
            card.addEventListener('drag', drag);
            card.addEventListener('dragend', dragend);
        });
    }
    */

	// 추가
    $('#add').click((e)=>{ // preventDefault 함수 적용시 event파라메터 필수
	e.preventDefault(); //클릭시 기본동작인 기능 작동을 중단시킴  (submit)
        //const title = $('#titleInput').val()!=='' ? $('#titleInput').val() : null; //인풋태그 비어있으면 null
        if ($('#titleInput').val()!=='') { // 만약 id값의 val이 ''이 아니면 val값이 나오게 하고 맞으면 null
			title = $('#titleInput').val(); 
		} else {
			title = null; 
			add_alert(); // alert창 띄우려고 했우요
		};
        const description = $('#descriptionInput').val()!=='' ? $('#descriptionInput').val()  : null; //얘도 삼항. 인풋태그 비어있으면 null
        $('#titleInput').val('');       //인풋 빈문자열로 변경 (setter)
        $('#descriptionInput').val(''); //인풋 빈문자열로 변경 (setter)
        if(title && description){       //마찬가지로 둘중 하나라도 null이면 실행안됩니다.
            let id = dataCards.config.maxid+1; //id를 계속 1씩 늘려줘서 고유값 보존하기(PK)
            const newCard = {           //card 객체생성
                id,
                title,
                description,
                position:"yellow",
                priority: false  //별
            }
            dataCards.cards.push(newCard);  //dataCards 객체는 13번째 줄에서 틀을 만들어두었습니다. JSON객체로 구현하려고 저렇게했다네요 대견하죠
            dataCards.config.maxid = id; // 새로운 card객체가 생성되었으니 maxid도 갱신해줍니다.
            save();    // save()를 함수로 만들어두었음. localStorage.setItem('@kanban:data', JSON.stringify(dataCards)); 대충 로컬스토리지를 새롭게 덮어쓴다는 뜻ㅎ
            appendComponents(newCard); // 새로운카드는 append됨
            initializeCards(); //36번줄 ㄱㄱ
        }
    });

	// 삭제
    $("#deleteAll").click(()=>{ // id값 click event 발생시
        dataCards.cards = []; //13번 줄의 있는 배열의 cards 배열 생성
        save(); // local 저장
    });

    $("#theme-btn").click((e)=>{ // id값 click event 파라메터 발생(preventDefault)
        e.preventDefault();  //버튼 클릭시 발생하는 디폴트 함수 막음
        $("body").toggleClass("darkmode"); // body태그 안에 darkmode라는 클래스를 추가, 다시 한번 클릭시 제거
				// ㄴ 선택한 요소에 클래스가 없으면 인수로 전달받은 클래스를 추가하고, 전달받은 클래스가 추가되어 있으면 제거함.
        if(theme){
            localStorage.setItem("@kanban:theme", `${theme  ===   "light"    ?   "darkmode": ""}`)
        }
        else{
            localStorage.setItem("@kanban:theme", "darkmode")
        }

    });
});

function initializeCards(){ //36번줄, 카드 드래그
    cards = document.querySelectorAll('.kanbanCard');
    //querySelectorAll 은 해당하는 조건에 맞는 element를 모두 가져와 배열형태로 만든다.
    //.은 클래스 #은 아이디였던걸 기억하자. 즉 class가 kanbanCard 인 녀석들을 모두 불러와서 하나의 배열로 만든다.
    //이 코드의 경우 kanbanCard 클래스를 가질수 있던건 할일이 들어있는 div뿐이다.
    cards.forEach(card=>{   //앞서 만든 배열내에 있는 모든 div들에게 dragestart, darg, dragend 속성을 설정해준다.
        card.addEventListener('dragstart', dragstart);
        card.addEventListener('drag', drag);
        card.addEventListener('dragend', dragend);
    });
}

//functions
function initializeBoards(){   //DataColors 배열 자원을 참조하여 색깔에 맞는 dropzone class div를 만드는 함수입니다.
    dataColors.forEach(item=>{
        let htmlString = `
        <div class="board">
            <h3 class="text-center">${item.title.toUpperCase()}</h3>
            <div class="dropzone" id="${item.color}">

            </div>

        </div>
        `
        //class text-center는 bootstrap에서 지원하는 class 입니다.가운데정렬해줍니다. https://zzznara2.tistory.com/469
        $("#boardsContainer").append(htmlString) // #boardsContainer 에 htmlString에서 만든거 추가
    });

    //각각의 dropzone 영역에 drag&drop을 위한 EventListener 설정
    let dropzones = document.querySelectorAll('.dropzone');
    dropzones.forEach(dropzone=>{
        dropzone.addEventListener('dragenter', dragenter);
        dropzone.addEventListener('dragover', dragover);
        dropzone.addEventListener('dragleave', dragleave);
        dropzone.addEventListener('drop', drop);
    });
}


function initializeComponents(dataArray){
    //저장된 모든 카드를 만들고 작업 영역 내에 넣습니다.
    dataArray.cards.forEach(card=>{  //cards 배열에 있는 자원들을 appendComponents() 함수에 집어넣는다
        appendComponents(card);
        //https://www.debugcn.com/ko/article/17375472.html
        //forEach문은 배열이 비었다면 안의 함수를 실행시키지 않고 그냥 넘어가버린다.
        //따라서 당신이 DeleteAll 을해서 cards 배열이 비었다면, appendComponents(card)부분은 실행되지않고 넘어가버리는것이다.
    })
}

function appendComponents(card){
    //왜 div id를 설정할때 toString()을 썻는가? 그것은 네이버에도 나와있지 않다.
    let htmlString = `
        <div id=${card.id.toString()} class="kanbanCard ${card.position}" draggable="true">
            <div class="content">
                <h4 class="title">${card.title}</h4>
                <p class="description">${card.description}</p>
            </div>
            <form class="row mx-auto justify-content-between">
                <span id="span-${card.id.toString()}" onclick="togglePriority(event)" class="material-icons priority ${card.priority? "is-priority": ""}">
                    check
                </span>
                <button class="invisibleBtn">
                    <span class="material-icons delete" onclick="deleteCard(${card.id.toString()})">
                        remove_circle
                    </span>
                </button>
            </form>
        </div>
    `
    $(`#${card.position}`).append(htmlString);
    priorities = document.querySelectorAll(".priority");
}

function togglePriority(event){
    event.target.classList.toggle("is-priority");
    dataCards.cards.forEach(card=>{
        if(event.target.id.split('-')[1] === card.id.toString()){
            card.priority=card.priority?false:true;
        }
    })
    save();
}

function deleteCard(id){
    dataCards.cards.forEach(card=>{
        if(card.id === id){
            let index = dataCards.cards.indexOf(card);
            console.log(index)
            dataCards.cards.splice(index, 1);
            console.log(dataCards.cards);
            save();
        }
    })
}


function removeClasses(cardBeignDragged, color){
    cardBeignDragged.classList.remove('red');
    cardBeignDragged.classList.remove('blue');
    cardBeignDragged.classList.remove('purple');
    cardBeignDragged.classList.remove('yellow');
    cardBeignDragged.classList.add(color);
    position(cardBeignDragged, color);
}

function save(){
    localStorage.setItem('@kanban:data', JSON.stringify(dataCards));
}

function position(cardBeignDragged, color){
    const index = dataCards.cards.findIndex(card => card.id === parseInt(cardBeignDragged.id));
    dataCards.cards[index].position = color;
    save();
}

//cards
function dragstart(){
    dropzones.forEach( dropzone=>dropzone.classList.add('highlight'));
    this.classList.add('is-dragging');
}

function drag(){
    //?????????????????????????????????????????????????????????????????????
}

function dragend(){
    dropzones.forEach( dropzone=>dropzone.classList.remove('highlight'));
    this.classList.remove('is-dragging');
}

// Release cards area
function dragenter(){

}

function dragover({target}){
    this.classList.add('over');
    cardBeignDragged = document.querySelector('.is-dragging');
    if(this.id ==="yellow"){
        removeClasses(cardBeignDragged, "yellow");

    }
    
    else if(this.id ==="blue"){
        removeClasses(cardBeignDragged, "blue");
    }
    else if(this.id ==="purple"){
        removeClasses(cardBeignDragged, "purple");
    }
    else if(this.id ==="red"){
        removeClasses(cardBeignDragged, "red");
    }

    this.appendChild(cardBeignDragged);
}

function dragleave(){

    this.classList.remove('over');
}

function drop(){
    this.classList.remove('over');
}

function alldelete(){
   swal({
  title: "전체 삭제하시겠습니까?",
  text: "한번 삭제시 복구가 불가능합니다!",
  icon: "warning",
  buttons: true,
  dangerMode: true,
})
.then((willDelete) => {
  if (willDelete) {
   dataCards.cards = [];
        save();
      location.reload();
        
    swal("전체 삭제되었습니다!", {
      icon: "success",
      
    });
  } else {
    swal("취소하였습니다!");
  }
});
}

function add_alert(){
	swal("내용이 없습니다.")
.then((value) => {
  swal(`내용을 입력해 주세요: ${value}`);
});
}