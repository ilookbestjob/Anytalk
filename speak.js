let backend = "http://192.168.0.61/anyTalk.Backend"
let currentvoice = "";
let playdata;
let lplaying = false;
let audio = new Audio();
let alert = new Audio();
let queeid = 3
let tabs
let selectedids = []
let lastselection = 0;
let queestatus = -1;
let voices;
let lastmousepos = { x: 0, y: 0 }
let objtomove
let objtomovepos
let possdifference
let soundfetching= false;
let playfetching= false;
let queefetching= false;

let queelist = {
    currentid: 777,
    datapath: {
        add: "addquerylist.php?name=Новая очередь", edit: "editquerylist.php", get: "getquerylist.php", del: "deletequerylist.php"
    },
    data: {},
    columns:
        [{
            name: "название",
            src: "name",
            width: "1fr",
            isId: false,
            visible: true
        },
        {
            name: "id",
            src: "id",
            width: "50px",
            isId: true,
            visible: false
        },
        {
            name: "",
            defaultValue: "true",
            defaultdisplaytype: "img",//img, text, all
            defaultimg: "",
            toggleData: ["true", "false"],
            localsrc: "play",
            width: "50px",
            isId: false,
            visible: true,
            responsive: {

                conditions: [{
                    condition: "true",
                    displaytype: "picture",
                    src: "play.png",
                    text: ""
                }
                    , {
                    condition: "false",
                    displaytype: "picture",
                    src: "stop.png",
                    text: ""
                }
                ],
                onclick: {
                    action: function () {
                        let objData = [];
                        let localobj = this;


                        $(this.clicked).attr({
                            "datavalue": this.toggleData[
                                this.toggleData.findIndex(toggleItem => toggleItem == $(this.clicked).attr("datavalue")) + 1 < this.toggleData.length ? this.toggleData.findIndex(toggleItem => toggleItem == $(this.clicked).attr("datavalue")) + 1 : 0]
                        })


                        $(this.clicked).html(checkConditions(this,
                            $(this.clicked).attr("datavalue")))


                        let t = $("#" + $(this.this).attr("id") + "__grid__container")
                        t = t.find(".grid__content")
                        t = t.find('.row')
                        t = t.find("[columnlocalsrc=" + this.localsrc + "]")
                        t = t.each(function () {
                            debugger

                            let k = $(localobj.clicked)
                            k = k.parent()

                            k = k.find("[columnsrc=" + eval($(localobj.this).attr("id")).columns.find(column => column.isId).src + "]")

                            objData.push({
                                value: $(this).attr("datavalue"),
                                id: $(this).parent().find("[columnsrc=" + eval($(localobj.this).attr("id")).columns.find(column => column.isId).src + "]").attr("datavalue")
                            })


                            localStorage.setItem(localobj.localsrc, JSON.stringify(objData));

                        })
                    }
                }
            }
        }


        ],
    localstorage:
    {
        name: "queelist",
        Storagelink: "id"
    }
}



$(function () {

    $(".content").html('<div class="row"> <div class="tableheader"></div><div class="tableheader">Дата</div><div class="tableheader">Автор</div><div class="tableheader">Содержание</div><div class="tableheader">Файл</div><div class="tableheader"></div></div>');
    setInterval("getQuees()", 1000)
    setInterval("getsound()", 1000)
    setInterval("setAPIText()", 1000)

    ///события нажатий
    $("#wipe").click(function () { displayDailog("Очистка очереди", "wipe.png", "Вы собираетесь очистить очередь! Очистить?", markAllExecuted) })
    $("#delete").click(function () { displayDailog("Удаление выделенного", "delete.png", "Вы собираетесь удалить элементы! Удалить?", deleteQueryItems.bind(this, selectedids)) })
    $("#add").click(function () { $(".adddialog").fadeIn(); prepareAddDialog(); })


    $("#setup").click(function () { $(".setupdialog").fillObject().fadeIn(); })



    $("#adddialog__no").click(function () { $(".adddialog").fadeOut() })
    $("#setupdialog__OK").click(function () { $(".setupdialog").fadeOut() })


    $("#adddialog__yes").click(function () { $(".setupdialog"); fetch(prepareAPI()) })


    sliders()
    dropdowns()
    grids()
    $("#date").mask("99.99.9999");
    $("#time").mask("99:99:99");
    fetch(backend + "/getVoices.php").then(res => res.json().then(json => {
        voices = json;

    }))

    $(".adddialog__header,.setupdialog__header").mousedown(function (event) {
        objtomove = $(this).parent()
        lastmousepos = { x: event.clientX, y: event.clientY }
        objtomovepos = $(this).parent().offset()
        possdifference = { x: lastmousepos.x - objtomovepos.left, y: lastmousepos.y - objtomovepos.top }

    })

    $("body").mouseup(function (event) {
        objtomove = null

    })

    $("body").mousemove(function (event) {
        if (objtomove != null) {


            lastmousepos = { x: event.clientX, y: event.clientY }

            objtomove.offset({ top: lastmousepos.y - possdifference.y, left: lastmousepos.x - possdifference.x });



        }



    })


}

)

const setAPIText = () => {
    $("#apitext").val(prepareAPI())

}

const prepareAddDialog = () => {
    let date = new Date()
    $("#date").val((date.getDate() > 9 ? date.getDate() : "0" + date.getDate()) + "." + (date.getMonth() + 1 > 9 ? date.getMonth() + 1 : "0" + (date.getMonth() + 1)) + ".2022")
    date = new Date(date.getTime() + 300000);
    $("#time").val((date.getHours() > 9 ? date.getHours() : "0" + date.getHours()) + ":" + (date.getMinutes() > 9 ? date.getMinutes() : "0" + (date.getMinutes())) + ":00")
    $("#priority").val(1)
    $("#quee").attr({ currenttext: tabs.find(item => item.id == queeid).name });
    setDropdownvalue("quee", tabs.find(item => item.id == queeid).name)
    setDropdownvalue("voice", voices.voicelist[voices.defaultvoice].name)
    setDropdownvalue("amplua", voices.voicelist[voices.defaultvoice].ampluas[voices.defaultamplua])
    setSliderValue("speed", 1)
}

const prepareAPI = () => {
    //http://speech.ru/speak.php?text=Тестовое%20сообщение&voice=2&amplua=0&speed=1&queryid=1
    return backend + "/speak.php?text=" + $("#text").val() + "&priority=" + $("#priority").val() + "&voice=" + $("#voice").attr("currentindex") + "&amplua=" + $("#amplua").attr("currentindex") + "&speed=" + $("#speed").attr("current") + "&queryid=" + $("#quee").attr("currentid") + preparedate()

}


const preparedate = () => {
    const Year = $("#date").val().substr(6, 4) != "" || $("#date").val().substr(6, 4) != "____" ? $("#date").val().substr(6, 4) : ""
    const Month = $("#date").val().substr(3, 2) != "" || $("#date").val().substr(3, 2) != "____" ? $("#date").val().substr(3, 2) : ""
    const Day = $("#date").val().substr(0, 2) != "" || $("#date").val().substr(0, 2) != "____" ? $("#date").val().substr(0, 2) : ""

    let Date = Year + "-" + Month + "-" + Day

    if (Date.length != 10) { return "" }
    if (Date == "____-__-__") { return "" }
    if (Date.indexOf("_") != -1) { return "" }



    if ($("#time").val() == "") { return "" }
    if ($("#time").val().indexOf("_") != -1) { return "" }


    return "&date=" + Date + " " + $("#time").val()



}
////////////////////
////Controls



const sliders = () => {
    $(".slider").each(function () {
        //  $(this).html( $(this).attr("id"));
        $(this).html("");

        $(this).append('<div class="slider__min">' + $(this).attr("min") + '</div><div class="slider__bg" min="' + ($(this).attr("min")) + '"  max="' + ($(this).attr("max")) + '"  container="' + ($(this).attr("id")) + '"><div class="slider__progress"></div><div class="slider__tag"></div></div><div class="slider__max">' + $(this).attr("max") + '</div><div class="slider__value"></div>');

        eval($(this).attr("func"))
        debugger;
        const left = $(this).find(".slider__bg").offset().left
        const top = $(this).find(".slider__bg").offset().top
        const width = $(this).find(".slider__bg").width()

        const min = $(this).attr("min") * 1
        const max = $(this).attr("max") * 1
        const current = $(this).attr("current") * 1

        const pos = (width) / (max - min) * current



        $(this).find(".slider__value").offset({ top: top - 4, left: left + pos });
        $(this).find(".slider__value").html(current)

        $(this).find(".slider__progress").width(pos)


        $(".slider__bg").click(
            function (event) {


                const min = $(this).attr("min") * 1
                const max = $(this).attr("max") * 1
                const pos = Math.round((max - min) * (event.offsetX / $(this).width()) * 10) / 10;
                $("#" + $(this).attr("container")).find(".slider__value").html(pos);

                const left = $("#" + $(this).attr("container")).find(".slider__bg").offset().left
                const top = $("#" + $(this).attr("container")).find(".slider__bg").offset().top
                $("#" + $(this).attr("container")).find(".slider__value").offset({ top: top - 22, left: event.offsetX + left });

                $("#" + $(this).attr("container")).attr({ current: pos })


                $(this).find(".slider__progress").width(event.offsetX);

            })


    })
}
const setDropdownvalue = (itemname, value) => {
    $("#" + itemname).find("#" + itemname + "__input").val(value)

}

const setSliderValue = (itemname, value) => {
    debugger
    const width = ($("#" + itemname).width()) / ($("#" + itemname).attr("max") - $("#" + itemname).attr("min")) * value
    $("#" + itemname).find(".slider__progress").width(width)
    const top = $("#" + itemname).find(".slider__bg").offset().top
    const left = $("#" + itemname).find(".slider__bg").offset().left
    $("#" + itemname).find(".slider__value").offset({ left: width + left, top: top - 22 })


}

const dropdowns = () => {
    $(".dropdown").each(function () {
        //  $(this).html( $(this).attr("id"));
        $(this).html("");

        $(this).append('<div class="dropdown__container" container="' + $(this).attr("id") + '"><input type="text" id="' + $(this).attr("id") + '__input"/><div class="dropdown__arrow"></div></div>')
        $("body").append('<div class="popup" id="' + $(this).attr("id") + '__popup" style="display:none" popped="false">' + $(this).attr("id") + '</div>')



        //  eval($(this).attr("func"))


    })

    $(".dropdown__arrow").click(function () {


        const left = $(this).parent().offset().left;
        const top = $(this).parent().offset().top;
        const width = $(this).parent().width();
        const height = $(this).parent().height()

        const container = $(this).parent().attr("container") + '__popup'



        $("#" + container).width(width);
        $("#" + container).offset({ left: left, top: top + height });


        $(".popup").each(function () {

            if ($("#" + container).attr("id") != $(this).attr("id")) {
                $(this).animate({ opacity: 0 }
                    , function () { $(this).css({ height: 0, display: "none" }); }


                )
            }
        }

        )

        if ($("#" + container).attr("popped") == "false") {
            $("#" + container).css({ position: "fixed", display: "block", height: "200px", left: left + "px", top: (top + height) + "px" });
            $("#" + container).animate({ opacity: 1 })
            $("#" + container).attr({ popped: "true" })


            eval($(this).parent().parent().attr("onselectFunc") + "($(this).parent().parent())")


        }
        else {

            $("#" + container).animate({ opacity: 0 }
                , function () { $("#" + container).css({ height: 0, display: "none" }); }


            )
            $("#" + container).attr({ popped: "false" })
        }






    })

}


/////////////grid

const grids = () => {
    $(".grid").each(function (item, index) {
        $(this).html | ("");

        $(this).append('<div class="grid__container" id="' + $(this).attr("id") + '__grid__container" ><div class="grid__menu"> <div class="button right notext" id="' + $(this).attr("id") + '__grid__add"><img src="img/add.png" /><div></div></div> <div class="button right notext" id="' + $(this).attr("id") + '__grid__delete"><img src="img/delete.png" /><div></div></div> </div><div class="grid__content"></div><div class="grid__footer"></div></div>')
        $(this).height($(this).attr("gridheight") * 1)
        $("#" + $(this).attr("id") + '__grid__container').height($(this).attr("gridheight") * 1)
        const that = this


        $("#" + $(this).attr("id") + "__grid__add").click(
            () => {
                fetch(backend + "/" + eval($(this).attr("id")).datapath.add).then(ok => { $(this).parent().parent().fillObject(eval($(this).attr("id"))) })
            })


        $(this).initObject(eval($(this).attr("id")))



    })

}

///////////////////////////////////

function evalInContext(js, context) {
    //# Return the results of the in-line anonymous function we .call with the passed context
    return function () { return eval(js); }.call(context);
}

const getsound = () => {

    const getIDs = localStorage.getItem("play") ? JSON.parse(localStorage.getItem("play")).filter(playItem => playItem.value == "true").map(playItem => playItem.id).join(",") : ""


    if (!lplaying && !soundfetching) {
        soundfetching = true;
        fetch(backend + "/setexecuted.php?list=" + currentvoice + '&queeid=' + getIDs).then(
            response => {
                soundfetching = false;
                response.json().then(json => {
                    playdata = json

                    buildPlaydata(playdata, queeid)


                    playdata = playdata.filter(playdataItem =>
                        getIDs.split(",").find(item => item == playdataItem.quee_id)

                    )


                    const index = checkDelayed()

                    //  if (index != -1 && (tabs.find(item => item.id == queeid).status == 1)) {

                    if (index != -1) {


                        audio.src = backend + "/" + playdata[index].file
                        alert.src = backend + "/alert.mp3"



                        //  if (!$("#dontplay").is(":checked")) {
                        currentvoice = playdata[index].id;
                        currentquee = playdata[index].quee_id;
                        setplaying(playdata[index].quee_id, 1);
                        alert.play()
                        setTimeout("audio.play()", 2000);


                        lplaying = true;

                        //   }


                    }

                    audio.addEventListener('ended', function () {
                        console.log("currentquee", currentquee)
                        if (currentquee != 0) {
                            setplaying(currentquee, 0);
                        }
                        lplaying = false;
                    });




                })
            }, fail => { soundfetching= false; })
    }
    else{

        console.log("низя!",lplaying,soundfetching);
    }
}
const setplaying = (id, state) => {
    if (!playfetching) {
        playfetching = true;
        fetch(backend + "/setqueryexecuting.php?id=" + id + "&state=" + state).then(res => { playfetching = false }, fail => { playfetching = false })
    }

}

const checkDelayed = () => {
    const delayed = playdata.findIndex(item => {
        const currentDate = new Date()
        const objDate = new Date(item.execdate)

        console.log((tabs.find(queeitem => queeitem.id == item.quee_id)))

        return (currentDate - objDate > 5000) && (tabs.find(queeitem => queeitem.id == item.quee_id)).status == "1" ? true : false



    })

    if (delayed == -1) {

        return playdata.findIndex(item => {
            console.log((tabs.find(queeitem => queeitem.id == item.quee_id)))
            return (item.execdate == null) && (tabs.find(queeitem => queeitem.id == item.quee_id)).status == "1" ? true : false



        })


    }

    else return delayed

}

const buildPlaydata = (data, queeid) => {

    console.log(data);
    $(".content").html('<div class="row"> <div class="tableheader"></div><div class="tableheader">Дата</div><div class="tableheader">Автор</div><div class="tableheader">Содержание</div><div class="tableheader">Файл</div><div class="tableheader"></div></div>')



    data.map((item, index) => {

        if (queeid == item.quee_id) {
            $(".content").append('<div class="' + (selectedids.find(sitem => sitem == item.id) ? "selected row" : "") + 'row" id="' + item.id + '"><div>' + item.priority + '</div><div>' + item.execdate + '</div><div>' + item.author + '</div><div>' + item.text + '</div><div>' + item.file + '</div><div </div></div>');
        }
    })



    $(".row,.selected").click(function (event) {
        if ($(this).attr("id")) {

            const key = event.shiftKey ? 17 : (event.ctrlKey ? 16 : 0)
            switch (key) {
                case 16:
                    selectedids.push($(this).attr("id"))

                    break;

                case 17:
                    if (lastselection != 0) {
                        const lastposition = playdata.findIndex(item => item.id == lastselection)
                        const currentposition = playdata.findIndex(item => item.id == $(this).attr("id"))

                        for (t = Math.min(lastposition, currentposition); t <= Math.max(lastposition, currentposition); t++) {
                            selectedids.push(playdata[t].id)

                        }

                    }
                    break;
                default:

                    selectedids = [$(this).attr("id")]
            }
            lastselection = $(this).attr("id")
            buildPlaydata(playdata)

        }



    })




}

const getQuees = () => {
    if (!queefetching) {
        queefetching = true
        fetch(backend + "/getquerylist.php?").
            then(response => {
                response.json().
                then(json => {
                    tabs = json;
                    buildQuees(json)
                }); queefetching = false
            }, fail => { queefetching = false })

    }
}

const buildQuees = (json) => {

    $(".queetabs").html('')
    const toplay = JSON.parse(localStorage.getItem("play"))

    json.map((item, index) => {
        $(".queetabs").append('<div class="tab ' + (item.id == queeid ? "selected" : "") + (toplay ? (toplay.find(toplayItem => toplayItem.id == item.id && toplayItem.value == "true") ? " playing" : "") : "") + '" id="queetab' + index + '">' + item.name + '</div>');



        $("#queetab" + index).click(function () { queeid = item.id; queestatus = item.status; buildQuees(tabs) })

        if (item.id == queeid) {
            $("#startquee").css("display", item.status != 1 ? "inline-flex" : "none")
            $("#stopquee").css("display", item.status == 1 ? "inline-flex" : "none")
            $("#startquee").click(function () { setQuerystatus(this, queeid, 1) })
            $("#stopquee").click(function () { setQuerystatus(this, queeid, 0) })
            $(".footer").html('<div class="footer__item"> <div class="footer__header">Статус </div><div class="footer__content">' + (item.status == 1 ? "Запущена" : "Остановлена") + '</div></div>')
        }
    })

    const setQuerystatus = (obj, id, status) => {
        $(obj).addClass("alert")
        fetch(backend + "/setquerystatus.php?id=" + id + "&status=" + status).then(res => res.json().then(json => $(obj).removeClass("alert")))
    }
}


const displayDailog = (title, picture, content, yesfunction = null, nofunction = null) => {
    $(".dialog__header").html(title);
    $(".dialog__imagesrc").attr("src", "img/" + picture);
    $("#content").html(content);

    $("#dialog__yes").click(function () { $(".dialog").fadeOut(); yesfunction() })
    $("#dialog__no").click(function () { $(".dialog").fadeOut() })

    $(".dialog").fadeIn()
    $(".dialog").css("display", "grid");



}
const deleteQueryItems = (sids) => {

    fetch(backend + "/deletequeryitems.php?list=" + sids.join(",") + "&queeid=" + queeid).
        then(response => response.json().
            then(json => {
                playdata = json;
                buildPlaydata(playdata)
            }))
}

const markAllExecuted = () => {

    fetch(backend + "/setexecuted.php?list=all&queeid=" + queeid).then(
        response => response.json().then(json => {
            playdata = json

            buildPlaydata(playdata)
        }))

}

const buildQueeDrop = (obj) => {

    $("#" + $(obj).attr("id") + '__popup').html("")

    tabs.forEach((item, index) => {

        $("#" + $(obj).attr("id") + '__popup').append('<div class="popitem" dataindex="' + index + '" dataid="' + item.id + '" dataname="' + item.name + '">' + item.name + '</div>')

        $("#" + $(obj).attr("id") + '__popup').find(".popitem").
            click(


                function () {

                    $(this).parent().animate({ opacity: 0 }
                        , function () { $(this).css({ height: 0, display: "none" }); }


                    )
                    $("#" + $(obj).attr("id") + '__input').val($(this).attr("dataname"))

                    $(obj).attr({
                        currentid: $(this).attr("dataid"),
                        currentindex: $(this).attr("dataindex"),
                        currenttext: $(this).attr("dataname")
                    })

                })

    })

}

const buildVoiceDrop = (obj) => {
    $("#" + $(obj).attr("id") + '__popup').html("")
    fetch(backend + "/getVoices.php").then(res => res.json().then(json => {
        voices = json;
        voices.voicelist.forEach((item, index) => {

            $("#" + $(obj).attr("id") + '__popup').append('<div class="popitem" dataindex="' + index + '" dataid="' + item.id + '" dataname="' + item.name + '">' + item.name + '</div>')




            $("#" + $(obj).attr("id") + '__popup').find(".popitem").
                click(


                    function () {

                        $(this).parent().animate({ opacity: 0 }
                            , function () { $(this).css({ height: 0, display: "none" }); }


                        )
                        $("#" + $(obj).attr("id") + '__input').val($(this).attr("dataname"))

                        $(obj).attr({
                            currentid: $(this).attr("dataid"),
                            currentindex: $(this).attr("dataindex"),
                            currenttext: $(this).attr("dataname")
                        })

                    })




        })

    }))

}



const buildAmpluaDrop = (obj) => {
    $("#" + $(obj).attr("id") + '__popup').html("")
    fetch(backend + "/getVoices.php").then(res => res.json().then(json => {
        voices = json;
        voices.voicelist[$("#voice").attr("currentindex") * 1].ampluas.forEach((item, index) => {

            $("#" + $(obj).attr("id") + '__popup').append('<div class="popitem" dataindex="' + index + '" dataid="" dataname="' + item + '">' + item + '</div>')




            $("#" + $(obj).attr("id") + '__popup').find(".popitem").
                click(


                    function () {

                        $(this).parent().animate({ opacity: 0 }
                            , function () { $(this).css({ height: 0, display: "none" }); }


                        )
                        $("#" + $(obj).attr("id") + '__input').val($(this).attr("dataname"))

                        $(obj).attr({
                            currentid: $(this).attr("dataid"),
                            currentindex: $(this).attr("dataid"),
                            currenttext: $(this).attr("dataname")
                        })

                    })




        })

    }))

}

//////////////////надстройки JQuery
$.fn.initObject = function (obj) {
    /*
    const grid=obj.columns.map(item=>item.width).join(" ")
     
    
        $("#"+$(this).attr("id")+"__grid__container").find(".grid__content").html('<div class="row">'+ obj.columns.map(item=>'<div class="tableheader">'+item.name+'</div>').join("")+'</div>')
        $("#"+$(this).attr("id")+"__grid__container").find(".grid__content").find(".row").css( {"grid-template-columns":grid} )*/
};


$.fn.fillObject = function () {

    $(this).find(".grid").each(function () {
        obj = eval($(this).attr("id"))
        const grid = obj.columns.map(item => {


            return item.visible ? item.width : ""

        }).join(" ")


        $("#" + $(this).attr("id") + "__grid__container").find(".grid__content").html('<div class="row"  style="grid-template-columns:' + grid + '">' + obj.columns.map(item => item.visible ? '<div class="tableheader">' + item.name + '</div>' : "").join("") + '</div>')


        fetch(backend + "/" + obj.datapath.get).then(res => res.json().then(json => {
            json.forEach((dataItem, dataIndex) => {
                $("#" + $(this).attr("id") + "__grid__container").find(".grid__content").append('<div class="row" ctr="' + dataIndex + '"   style="grid-template-columns:' + grid + '">' + obj.columns.map(column => {





                    const tempcoldata =
                        localStorage.getItem(
                            column.localsrc) != "undefined" && localStorage.getItem(
                                column.localsrc) ? JSON.parse(
                                    localStorage.getItem(
                                        column.localsrc)
                                ).find(
                                    item => item.id == dataItem[(obj.columns.find(
                                        colitem => colitem.isId
                                    ) ? obj.columns.find(
                                        colitem => colitem.isId
                                    ).name : undefined

                                    )]) : undefined





                    coldata = tempcoldata ? tempcoldata.value : undefined



                    return '<div ' + (!column.visible ? 'style="display:none"' : "") + (column.isId ? 'id="rowid" rowid="' + dataItem[column.src] + '"' : "") + (column.src != "" ? 'columnsrc="' + (column.src) + '"' : "") + 'columnlocalsrc="' + column.localsrc + '"' + '" datavalue="' + (column.src != "" && column.src ? (dataItem[column.src] ? dataItem[column.src] : "") : (coldata ? coldata : column.defaultValue)) + '">' + checkConditions(column, (column.src != "" && column.src ? (dataItem[column.src] ? dataItem[column.src] : "") : (coldata ? coldata : column.defaultValue))) + '</div>'



                }).join("") + '</div>')


            })

            obj.columns.forEach(item => {

                let that = this
                $("#" + $(this).attr("id") + "__grid__container").find(".grid__content").find('.row').find("[columnsrc=" + item.src + "],[columnlocalsrc=" + item.localsrc + "]").click(function () {
                    if (item.responsive) if (item.responsive.onclick) if (item.responsive.onclick.action) item.responsive.onclick.action.call({ ...item, this: that/*)))))))))))))))))) */, clicked: this })
                })


                $("#" + $(this).attr("id") + "__grid__container").find(".grid__content").find('.row').find("[columnsrc=" + item.src + "],[columnlocalsrc=" + item.localsrc + "]").dblclick(function () {
                    // 

                    $(this).html('<input id="' + item.name + $(this).parent().attr("ctr") + '" type="text" value="' + $(this).attr("datavalue") + '">')


                    let that = this


                    $("#" + item.name + $(this).parent().attr("ctr")).keypress(function (e) {
                        if (e.which == 13) {
                            $(that).html($(this).val())
                            $(that).attr("datavalue", $(this).val())

                            let get = []

                            $(that).parent().find("[columnsrc]").each(function () {
                                const toadd = ($(this).attr("columnsrc") != "" && $(this).attr("columnsrc") != "undefined") ? $(this).attr("columnsrc") + "=" + $(this).attr("datavalue") : ""
                                if (toadd != "") get.push(toadd)

                            })



                            fetch(backend + "/" + obj.datapath.edit + "?" + (get.join('&'))).then(res => { $(this).parent().parent().parent().parent().parent().parent().fillObject() })
                        }
                    });
                })
            })



            $("#" + $(this).attr("id") + "__grid__container").find(".grid__content").find('.row').click(function () {




                if (!obj.lastselection) obj = { ...obj, lastselection: 0 }

                obj.currentid = obj.currentid ? obj.currentid : []
                if ($(this).find("#rowid").attr("rowid")) {

                    const key = event.shiftKey ? 17 : (event.ctrlKey ? 16 : 0)
                    switch (key) {
                        case 16:
                            obj.currentid.push($(this).find("#rowid").attr("rowid"))


                            break;

                        case 17:

                            if (obj.lastselection != 0) {

                                const lastposition = lastselection
                                const currentposition = $(this).attr("ctr")



                                for (t = Math.min(lastposition, currentposition); t <= Math.max(lastposition, currentposition); t++) {
                                    obj.currentid.push($(this).parent().find("[ctr=" + t + "]").find("#rowid").attr("rowid"))

                                }

                            }
                            break;
                        default:

                            obj.currentid = [$(this).find("#rowid").attr("rowid")]
                    }
                    obj.lastselection = $(this).attr("ctr")


                }

                $(this).parent().find('.row').removeClass("selected").each(function () {


                    if (obj.currentid.find(item => item == $(this).find("#rowid").attr("rowid"))) $(this).addClass("selected")

                })








                $("#" + $(this).parent().parent().parent().attr("id") + "__grid__delete").off("click").click({ param1: obj.currentid },
                    function (event) {




                        fetch(backend + "/" + obj.datapath.del + "?ids=" + event.data.param1.join(",")).then(ok => {

                            $(this).parent().parent().parent().parent().fillObject()


                        })
                    })




            })





            ///////////////////////





        }))






    })



    return this;
};

const checkConditions = (condition, value) => {

    /*conditions: [{
                        condition: "true",
                        displaytype: "picture",
                        src: "",
                        text: ""
                    } */
    let result = value
    if (condition.responsive) {
        if (condition.responsive.conditions) {
            condition.responsive.conditions.forEach(item => {
                if (item.condition == value) {
                    switch (item.displaytype) {
                        case "picture":

                            result = '<img src="img/' + item.src + '"/>'
                            break
                        case "text":
                            result = item.text
                            break


                    }
                    return result
                }

            })
        }
    }
    return result
}




