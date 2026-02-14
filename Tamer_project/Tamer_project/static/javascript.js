
const plot = document.getElementById("viewer");

let fullX = [];
let channels = []; // [{name, data, visible, color}]
let windowSize = 200; // visible points (pts)
let speed = 30; // ms between frames
let currentIndex = 0;
let timer = null;
let isPlaying = false;

// colors
const TRACE_COLORS = ['#FF00FF','#FFA500','#00FFFF','#00FF00','#FF0000','#800080','#FFFF00'];
//uploading
document.getElementById("file_input").addEventListener("change", function(e){
    const file = e.target.files[0];
    if(!file) return;

    const reader = new FileReader();
    reader.onload = (ev)=>{
        const text = ev.target.result;
        let data;
        try {
            if(file.name.endsWith(".json")){
                data = JSON.parse(text);
            } else {
                data = parseCSV(text);
            }
            loadSignalData(data);
        } catch(err){
            alert("Error parsing file");
            console.error(err);
        }
    }
    reader.readAsText(file);
    e.target.value = "";
});
function goHome(){
   // window.history.back();             //if exit
    window.location.href = '/'; 
}

function parseCSV(text){
    const lines = text.trim().split("\n");
    const headers = lines[0].split(",");
    const data = {};
    headers.forEach(h=>data[h]=[]);
    for(let i=1;i<lines.length;i++){
        const values = lines[i].split(",");
        headers.forEach((h,j)=>data[h].push(parseFloat(values[j])));
    }
    const time = data[headers[0]];
    let signal;
    if(headers.length > 2){
        signal = {};
        headers.slice(1).forEach(h=>signal[h]=data[h]);
    } else {
        signal = data[headers[1]];
    }
    return { time, signal };
}

function loadSignalData(data){
    fullX = data.time;
    currentIndex = 0;

    if(typeof data.signal === "object" && !Array.isArray(data.signal)){
        channels = Object.keys(data.signal).map((key,i)=>({
            name: key,
            data: data.signal[key],
            visible: true,
            color: TRACE_COLORS[i % TRACE_COLORS.length]
        }));
    } else {
        channels = [{
            name: "Signal",
            data: data.signal,
            visible: true,
            color: TRACE_COLORS[0]
        }];
    }

    createChannelCheckboxes();
    drawPlot();
}

//  Checkboxes (hide or show)
function createChannelCheckboxes(){
    const container = document.getElementById("channel-controls");
    container.innerHTML = "";
    channels.forEach((ch, idx)=>{
        const label = document.createElement("label");
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = ch.visible;
        checkbox.onchange = ()=>{
            ch.visible = checkbox.checked;
        };
        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(ch.name));
        container.appendChild(label);
    });
}

//  Plotting
function drawPlot(){
    const traces = channels.filter(ch=>ch.visible)
        .map(ch=>({
            x: fullX.slice(currentIndex, currentIndex+windowSize),
            y: ch.data.slice(currentIndex, currentIndex+windowSize),
            mode: "lines",
            name: ch.name,
            line: { color: ch.color, width: 2 }
        }));

    Plotly.react(plot, traces, {
        title: "Dynamic Signal Viewer",
        paper_bgcolor: '#1e1e1e',
        plot_bgcolor: '#1e1e1e',
        font: { color: 'white' },
        xaxis: { title: "Time (s)", color:'white', fixedrange:true },
        yaxis: { title: "Amplitude", color:'white', fixedrange:true },
        margin: { t:80, b:80, l:80, r:80 }
    });
}

//  animation
function startAnimation(){
    if(timer) clearInterval(timer);

    timer = setInterval(()=>{
        drawPlot();
        currentIndex++;

        if(currentIndex + windowSize >= fullX.length)
            currentIndex = 0;

    }, speed);

    isPlaying = true;
}

function stopAnimation(){
    if(timer) clearInterval(timer);
    timer = null;
    isPlaying = false;
}


function playPause(){
    if(isPlaying){
        stopAnimation();
    } else {
        startAnimation();
    }
}


function rewind(){
    currentIndex = Math.max(0, currentIndex - windowSize);
    drawPlot();
}

function fastForward(){
    currentIndex = Math.min(fullX.length - windowSize, currentIndex + windowSize);
    drawPlot();
}


const speedValue = document.getElementById("speedValue");

speedSlider.addEventListener("input", function(){
    speed = parseInt(this.value);
    speedValue.textContent = speed + " ms";

    if(isPlaying){
        stopAnimation();
        startAnimation();
    }
});
const windowSlider = document.getElementById("windowSlider");
const windowValue = document.getElementById("windowValue");

windowSlider.addEventListener("input", function(){
    windowSize = parseInt(this.value);
    windowValue.textContent = windowSize + " pts";

    if(currentIndex + windowSize >= fullX.length){
        currentIndex = Math.max(0, fullX.length - windowSize);
    }

    drawPlot();
});

