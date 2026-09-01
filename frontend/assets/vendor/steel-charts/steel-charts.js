/* SteelCharts — tiny offline Chart.js-compatible subset for SteelControl. */
(function(global){
  "use strict";
  class Chart {
    constructor(canvas, config={}) {
      this.canvas = canvas;
      this.ctx = canvas?.getContext?.("2d") || null;
      this.config = config;
      this.type = config.type || "line";
      this.data = config.data || { labels: [], datasets: [] };
      this.options = config.options || {};
      this._resize = () => this.update();
      if (global.ResizeObserver && canvas) {
        this._observer = new ResizeObserver(this._resize);
        this._observer.observe(canvas.parentElement || canvas);
      } else {
        global.addEventListener?.("resize", this._resize);
      }
      this.update();
    }
    destroy(){ this._observer?.disconnect(); global.removeEventListener?.("resize",this._resize); }
    _size(){
      const rect=this.canvas.getBoundingClientRect();
      const dpr=Math.max(1,global.devicePixelRatio||1);
      const w=Math.max(260,Math.round(rect.width||this.canvas.clientWidth||600));
      const h=Math.max(180,Math.round(rect.height||this.canvas.clientHeight||260));
      if(this.canvas.width!==Math.round(w*dpr)||this.canvas.height!==Math.round(h*dpr)){
        this.canvas.width=Math.round(w*dpr);this.canvas.height=Math.round(h*dpr);
      }
      this.ctx.setTransform(dpr,0,0,dpr,0,0); return {w,h};
    }
    update(){
      if(!this.ctx||!this.canvas)return;
      const {w,h}=this._size(),ctx=this.ctx;
      ctx.clearRect(0,0,w,h);
      const cs=getComputedStyle(document.documentElement);
      const fg=cs.getPropertyValue("--text-color").trim()||cs.getPropertyValue("--text").trim()||"#64748b";
      const accent=cs.getPropertyValue("--primary-color").trim()||cs.getPropertyValue("--primary").trim()||"#2563eb";
      const grid="rgba(148,163,184,.22)";
      const left=48,right=18,top=28,bottom=34,pw=w-left-right,ph=h-top-bottom;
      const ds=this.data.datasets?.[0]||{data:[]};
      const vals=(ds.data||[]).map(Number).filter(Number.isFinite);
      const labels=this.data.labels||[];
      const maxOpt=this.options?.scales?.y?.max;
      let max=Number.isFinite(Number(maxOpt))?Number(maxOpt):Math.max(1,...vals);
      if(this.options?.scales?.y?.beginAtZero!==false) max=Math.max(max,1);
      max*=Number.isFinite(Number(maxOpt))?1:1.12;
      ctx.font="12px system-ui,-apple-system,Segoe UI,sans-serif";ctx.fillStyle=fg;ctx.strokeStyle=grid;ctx.lineWidth=1;
      for(let i=0;i<=4;i++){const y=top+(ph*i/4);ctx.beginPath();ctx.moveTo(left,y);ctx.lineTo(w-right,y);ctx.stroke();const v=Math.round(max*(1-i/4));ctx.fillText(String(v),6,y+4)}
      if(!vals.length){ctx.fillText(ds.label||"Sem dados",left,top+18);return;}
      const x=i=>left+(vals.length<=1?pw/2:(pw*i/(vals.length-1)));
      const y=v=>top+ph-(Math.max(0,v)/max)*ph;
      ctx.fillStyle=accent;ctx.strokeStyle=accent;
      if(this.type==="bar"){
        const bw=Math.max(8,Math.min(42,pw/Math.max(vals.length,1)*.55));
        vals.forEach((v,i)=>ctx.fillRect(x(i)-bw/2,y(v),bw,top+ph-y(v)));
      }else{
        ctx.lineWidth=3;ctx.beginPath();vals.forEach((v,i)=>i?ctx.lineTo(x(i),y(v)):ctx.moveTo(x(i),y(v)));ctx.stroke();
        vals.forEach((v,i)=>{ctx.beginPath();ctx.arc(x(i),y(v),3.5,0,Math.PI*2);ctx.fill()});
      }
      ctx.fillStyle=fg;
      const step=Math.max(1,Math.ceil(labels.length/5));
      labels.forEach((lab,i)=>{if(i%step===0||i===labels.length-1){const s=String(lab);ctx.fillText(s.slice(0,8),Math.max(left,x(i)-18),h-10)}});
      if(ds.label){ctx.fillStyle=fg;ctx.fillText(String(ds.label),left,16)}
    }
  }
  global.Chart=Chart;
})(window);
