from __future__ import annotations
import json, queue, threading, time, tkinter as tk
from tkinter import ttk, messagebox, simpledialog
import requests
try:
    from serial.tools import list_ports
except Exception:
    list_ports=None
from edge_profiles import MachineProfile, EdgeStore, DRIVER_NAMES, load_store, save_store, profiles_path
from edge_client import SteelControlClient
from edge_runtime import EdgeRuntimeManager
from adapters import infer_driver
from edge_discovery import EdgeDiscoveryService

APP_TITLE='SteelControl Edge'; APP_VERSION='2.1.2'
BG='#0d1318'; PANEL='#151d24'; PANEL2='#1b252e'; INPUT='#0f171d'; TEXT='#edf3f7'; MUTED='#93a4b3'; ACCENT='#32c36c'; WARN='#e4ab42'; DANGER='#e35d63'; BORDER='#2a3944'; BLUE='#4aa3ff'

class App(tk.Tk):
    def __init__(self):
        super().__init__(); self.title(f'{APP_TITLE} {APP_VERSION}'); self.geometry('1220x760'); self.minsize(1050,680); self.configure(bg=BG)
        self.protocol('WM_DELETE_WINDOW',self._close); self.store=load_store(); self.selected_id=None; self.draft_profile=None; self.status_by_id={}; self.logq=queue.Queue(); self.manager=EdgeRuntimeManager(self._runtime_log,self._runtime_status)
        self._style(); self._vars(); self._ui(); self._refresh_list(); self.discovery=EdgeDiscoveryService(self._discovery_log); self.discovery.start(); self.after(100,self._drain); self.after(500,self._refresh_ports); self.after(2500,self._reload_external_profiles)
        if self.store.profiles:self._select(self.store.profiles[0].id)
    def _discovery_log(self,msg):
        self.logq.put(('edge_discovery','edge',msg))
    def _reload_external_profiles(self):
        try:
            fresh=load_store()
            known={(p.machine_id,p.server_url) for p in self.store.profiles}
            incoming={(p.machine_id,p.server_url) for p in fresh.profiles}
            if incoming != known:
                self.store=fresh; self._refresh_list()
                if self.store.profiles and not self.selected_id:self._select(self.store.profiles[0].id)
        except Exception:pass
        self.after(2500,self._reload_external_profiles)
    def _style(self):
        s=ttk.Style(self)
        try:s.theme_use('clam')
        except Exception:pass
        for n,bg in [('TFrame',BG),('Panel.TFrame',PANEL),('Panel2.TFrame',PANEL2)]:s.configure(n,background=bg)
        s.configure('TLabel',background=BG,foreground=TEXT,font=('Segoe UI',10)); s.configure('Panel.TLabel',background=PANEL,foreground=TEXT,font=('Segoe UI',10)); s.configure('Muted.TLabel',background=PANEL,foreground=MUTED,font=('Segoe UI',9)); s.configure('Header.TLabel',background=BG,foreground=TEXT,font=('Segoe UI Semibold',24)); s.configure('Section.TLabel',background=PANEL,foreground=TEXT,font=('Segoe UI Semibold',12)); s.configure('TEntry',fieldbackground=INPUT,foreground=TEXT,insertcolor=TEXT,bordercolor=BORDER); s.configure('TCombobox',fieldbackground=INPUT,foreground=TEXT,background=PANEL2,arrowcolor=TEXT); s.map('TCombobox',fieldbackground=[('readonly',INPUT)],foreground=[('readonly',TEXT)])
        s.configure('TButton',font=('Segoe UI Semibold',9),padding=(11,8),background=PANEL2,foreground=TEXT,bordercolor=BORDER); s.map('TButton',background=[('active','#273640')]); s.configure('Accent.TButton',background=ACCENT,foreground='#07130c',bordercolor=ACCENT); s.configure('Danger.TButton',background=DANGER,foreground='white',bordercolor=DANGER); s.configure('TCheckbutton',background=PANEL,foreground=TEXT)
    def _vars(self):
        self.label=tk.StringVar(); self.server=tk.StringVar(value='http://127.0.0.1:3000'); self.mid=tk.StringVar(); self.key=tk.StringVar(); self.driver=tk.StringVar(value='AUTO'); self.enabled=tk.BooleanVar(value=True); self.allow=tk.BooleanVar(value=False); self.interval=tk.StringVar(value='2000'); self.show_key=tk.BooleanVar(value=False)
        self.host=tk.StringVar(); self.port=tk.StringVar(); self.unit=tk.StringVar(value='1'); self.serial=tk.StringVar(value='AUTO'); self.baud=tk.StringVar(value='115200'); self.endpoint=tk.StringVar(); self.topic=tk.StringVar(); self.command_endpoint=tk.StringVar()
    def _ui(self):
        h=ttk.Frame(self); h.pack(fill='x',padx=24,pady=(20,12)); left=ttk.Frame(h); left.pack(side='left',fill='x',expand=True); ttk.Label(left,text='SteelControl Edge',style='Header.TLabel').pack(anchor='w'); ttk.Label(left,text='Gateway multi-máquina • drivers industriais • provisionamento sem código',foreground=MUTED,background=BG).pack(anchor='w',pady=(2,0)); tk.Label(h,text='EDGE 2.1.2',bg='#163622',fg='#6be99b',font=('Segoe UI Semibold',9),padx=12,pady=6).pack(side='right')
        body=ttk.Frame(self); body.pack(fill='both',expand=True,padx=24,pady=(0,20)); body.columnconfigure(0,weight=0); body.columnconfigure(1,weight=1); body.rowconfigure(0,weight=1)
        nav=ttk.Frame(body,style='Panel.TFrame',padding=14,width=315); nav.grid(row=0,column=0,sticky='nsw',padx=(0,10)); nav.grid_propagate(False); nav.columnconfigure(0,weight=1); nav.rowconfigure(3,weight=1)
        ttk.Label(nav,text='Máquinas configuradas',style='Section.TLabel').grid(row=0,column=0,sticky='w'); ttk.Label(nav,text='Um Edge pode operar várias máquinas.',style='Muted.TLabel').grid(row=1,column=0,sticky='w',pady=(2,10))
        btns=ttk.Frame(nav,style='Panel.TFrame'); btns.grid(row=2,column=0,sticky='ew',pady=(0,10)); ttk.Button(btns,text='+ Adicionar',command=self._new).pack(side='left'); ttk.Button(btns,text='Importar',command=self._import_clip).pack(side='left',padx=6); ttk.Button(btns,text='Remover',command=self._remove).pack(side='right')
        self.list=tk.Listbox(nav,bg='#0e151b',fg=TEXT,selectbackground='#24435a',selectforeground='white',highlightthickness=1,highlightbackground=BORDER,relief='flat',font=('Segoe UI',10),activestyle='none'); self.list.grid(row=3,column=0,sticky='nsew'); self.list.bind('<<ListboxSelect>>',self._on_select)
        allbar=ttk.Frame(nav,style='Panel.TFrame'); allbar.grid(row=4,column=0,sticky='ew',pady=(10,0)); ttk.Button(allbar,text='Iniciar todas',style='Accent.TButton',command=self._start_all).pack(side='left',fill='x',expand=True,padx=(0,4)); ttk.Button(allbar,text='Parar todas',command=self.manager.stop_all).pack(side='left',fill='x',expand=True,padx=(4,0))
        main=ttk.Frame(body,style='Panel.TFrame',padding=18); main.grid(row=0,column=1,sticky='nsew'); main.columnconfigure(0,weight=1); main.rowconfigure(2,weight=1)
        top=ttk.Frame(main,style='Panel.TFrame'); top.grid(row=0,column=0,sticky='ew'); top.columnconfigure(0,weight=1); self.title_lbl=ttk.Label(top,text='Selecione uma máquina',style='Section.TLabel'); self.title_lbl.grid(row=0,column=0,sticky='w'); self.badge=tk.Label(top,text='PARADA',bg='#2a333a',fg=MUTED,font=('Segoe UI Semibold',9),padx=10,pady=4); self.badge.grid(row=0,column=1,sticky='e')
        self.tabs=ttk.Notebook(main); self.tabs.grid(row=2,column=0,sticky='nsew',pady=(12,0)); self.cfg=ttk.Frame(self.tabs,style='Panel.TFrame'); self.diag=ttk.Frame(self.tabs,style='Panel.TFrame',padding=12); self.tabs.add(self.cfg,text=' Configuração '); self.tabs.add(self.diag,text=' Diagnóstico / logs '); self._cfg_ui(); self._diag_ui(); self._actions_ui(main)
    def _entry(self,parent,label,var,row,col=0,span=1,show=None):
        ttk.Label(parent,text=label,style='Panel.TLabel').grid(row=row,column=col,columnspan=span,sticky='w',pady=(7,3)); e=ttk.Entry(parent,textvariable=var,show=show); e.grid(row=row+1,column=col,columnspan=span,sticky='ew',padx=(0,8) if col==0 else 0); return e
    def _cfg_ui(self):
        # Área de configuração rolável. O rodapé de ações fica fora desta área
        # para que Salvar/Cancelar estejam sempre visíveis em qualquer resolução.
        outer=self.cfg; outer.columnconfigure(0,weight=1); outer.rowconfigure(0,weight=1)
        self.cfg_canvas=tk.Canvas(outer,bg=PANEL,highlightthickness=0,borderwidth=0)
        self.cfg_scroll=ttk.Scrollbar(outer,orient='vertical',command=self.cfg_canvas.yview)
        self.cfg_canvas.configure(yscrollcommand=self.cfg_scroll.set)
        self.cfg_canvas.grid(row=0,column=0,sticky='nsew'); self.cfg_scroll.grid(row=0,column=1,sticky='ns')
        p=ttk.Frame(self.cfg_canvas,style='Panel.TFrame',padding=16); self.cfg_inner=p
        self._cfg_window=self.cfg_canvas.create_window((0,0),window=p,anchor='nw')
        def _sync_scroll(_event=None):
            self.cfg_canvas.configure(scrollregion=self.cfg_canvas.bbox('all'))
        def _sync_width(event):
            self.cfg_canvas.itemconfigure(self._cfg_window,width=event.width)
        p.bind('<Configure>',_sync_scroll); self.cfg_canvas.bind('<Configure>',_sync_width)
        self.cfg_canvas.bind('<MouseWheel>',lambda e:self.cfg_canvas.yview_scroll(int(-1*(e.delta/120)),'units'))
        p.columnconfigure(0,weight=1); p.columnconfigure(1,weight=1)
        self._entry(p,'Nome local',self.label,0); self._entry(p,'Servidor SteelControl',self.server,0,1)
        self._entry(p,'ID da máquina',self.mid,2); self._entry(p,'Device Key',self.key,2,1,show='•'); self.key_entry=p.grid_slaves(row=3,column=1)[0]
        r=ttk.Frame(p,style='Panel.TFrame'); r.grid(row=4,column=0,columnspan=2,sticky='ew',pady=(8,2)); ttk.Checkbutton(r,text='Máquina habilitada neste Edge',variable=self.enabled).pack(side='left'); ttk.Checkbutton(r,text='Mostrar chave',variable=self.show_key,command=lambda:self.key_entry.configure(show='' if self.show_key.get() else '•')).pack(side='right')
        ttk.Separator(p).grid(row=5,column=0,columnspan=2,sticky='ew',pady=10)
        ttk.Label(p,text='Driver / adaptador',style='Panel.TLabel').grid(row=6,column=0,sticky='w'); self.driver_combo=ttk.Combobox(p,textvariable=self.driver,state='readonly',values=list(DRIVER_NAMES.keys())); self.driver_combo.grid(row=7,column=0,sticky='ew',padx=(0,8)); self.driver_combo.bind('<<ComboboxSelected>>',lambda e:self._driver_hint())
        self._entry(p,'Intervalo de leitura (ms)',self.interval,6,1)
        self.driver_hint=ttk.Label(p,text='',style='Muted.TLabel'); self.driver_hint.grid(row=8,column=0,columnspan=2,sticky='w',pady=(4,6))
        comm=ttk.LabelFrame(p,text=' Comunicação com a máquina ',padding=12); comm.grid(row=9,column=0,columnspan=2,sticky='ew',pady=(4,8)); comm.columnconfigure(0,weight=1); comm.columnconfigure(1,weight=1); self._entry(comm,'Host / IP / broker',self.host,0); self._entry(comm,'Porta TCP',self.port,0,1); self._entry(comm,'Unit ID (Modbus)',self.unit,2); self._entry(comm,'Porta serial',self.serial,2,1); self._entry(comm,'Baud rate',self.baud,4); self._entry(comm,'Endpoint / caminho',self.endpoint,4,1); self._entry(comm,'Tópico MQTT',self.topic,6); self._entry(comm,'Endpoint/tópico de comando',self.command_endpoint,6,1)
        self.port_combo=ttk.Combobox(comm,textvariable=self.serial,values=['AUTO']); self.port_combo.grid(row=5,column=1,sticky='ew'); ttk.Button(comm,text='Detectar COM',command=self._refresh_ports).grid(row=8,column=1,sticky='e',pady=(7,0))
        safety=ttk.Frame(p,style='Panel2.TFrame',padding=11); safety.grid(row=10,column=0,columnspan=2,sticky='ew',pady=(5,8)); safety.columnconfigure(0,weight=1); tk.Label(safety,text='SEGURANÇA DE COMANDOS',bg=PANEL2,fg=WARN,font=('Segoe UI Semibold',9)).grid(row=0,column=0,sticky='w'); ttk.Checkbutton(safety,text='Permitir comandos físicos desta máquina',variable=self.allow,command=self._allow_changed).grid(row=1,column=0,sticky='w',pady=(5,0)); ttk.Label(safety,text='Desativado por padrão. Telemetria continua funcionando. STOP de segurança é tratado separadamente.',background=PANEL2,foreground=MUTED).grid(row=2,column=0,sticky='w',pady=(3,0))

    def _actions_ui(self,parent):
        # Rodapé fixo: nunca some quando a configuração é maior que a janela.
        acts=ttk.Frame(parent,style='Panel.TFrame'); acts.grid(row=3,column=0,sticky='ew',pady=(10,0))
        ttk.Button(acts,text='Testar credencial',command=self._test).pack(side='left')
        ttk.Button(acts,text='Salvar máquina',style='Accent.TButton',command=self._save_selected).pack(side='left',padx=7)
        ttk.Button(acts,text='Cancelar',command=self._cancel_draft).pack(side='left')
        ttk.Button(acts,text='Iniciar esta máquina',style='Accent.TButton',command=self._start_selected).pack(side='right')
        ttk.Button(acts,text='Parar',command=self._stop_selected).pack(side='right',padx=7)

    def _diag_ui(self):
        p=self.diag; p.columnconfigure(0,weight=1); p.rowconfigure(1,weight=1); self.diag_lbl=ttk.Label(p,text='Selecione uma máquina para acompanhar.',style='Muted.TLabel'); self.diag_lbl.grid(row=0,column=0,sticky='w',pady=(0,8)); self.log=tk.Text(p,bg='#0a1014',fg='#c9d5dd',insertbackground=TEXT,font=('Cascadia Mono',9),relief='flat',wrap='word',padx=10,pady=10); self.log.grid(row=1,column=0,sticky='nsew'); self.log.configure(state='disabled')
    def _profile(self):
        if self.draft_profile and self.draft_profile.id==self.selected_id:return self.draft_profile
        return next((p for p in self.store.profiles if p.id==self.selected_id),None)
    def _new(self):
        if self.draft_profile:
            if not messagebox.askyesno(APP_TITLE,'Já existe uma nova máquina não salva. Descartar e começar outra?'):return
        self.draft_profile=MachineProfile(); self.selected_id=self.draft_profile.id; self._load_form(self.draft_profile); self.title_lbl.configure(text='Nova máquina • não salva'); self.list.selection_clear(0,'end'); self.tabs.select(self.cfg)
    def _cancel_draft(self):
        if not self.draft_profile:return
        if not messagebox.askyesno(APP_TITLE,'Cancelar esta nova máquina e descartar os dados preenchidos?'):return
        self.draft_profile=None; self.selected_id=None; self._clear_form(); self._refresh_list(); self.badge.configure(text='PARADA',bg='#2a333a',fg=MUTED)
    def _remove(self):
        p=self._profile()
        if not p:return
        if not messagebox.askyesno(APP_TITLE,f'Remover a configuração local de “{p.label}”?\n\nIsso não remove a máquina do SteelControl.'):return
        self.manager.stop(p.id); self.store.profiles=[x for x in self.store.profiles if x.id!=p.id]; self.selected_id=None; self._persist(); self._refresh_list(); self._clear_form()
    def _refresh_list(self):
        current=self.selected_id; self.list.delete(0,'end')
        for p in self.store.profiles:
            st=self.status_by_id.get(p.id,{}).get('state','STOPPED'); dot='●' if st=='ONLINE' else '◉' if st=='ERROR' else '○'; self.list.insert('end',f' {dot}  {p.label}   [ID {p.machine_id or "—"}]')
        if current:self._select(current,form=False)
    def _select(self,pid,form=True):
        for i,p in enumerate(self.store.profiles):
            if p.id==pid:
                self.selected_id=pid; self.list.selection_clear(0,'end'); self.list.selection_set(i); self.list.see(i)
                if form:self._load_form(p)
                self._update_status_visual(); return
    def _on_select(self,e):
        sel=self.list.curselection()
        if sel:self._select(self.store.profiles[sel[0]].id)
    def _load_form(self,p):
        self.label.set(p.label); self.server.set(p.server_url); self.mid.set(str(p.machine_id or '')); self.key.set(p.device_key); self.driver.set(p.driver); self.enabled.set(p.enabled); self.allow.set(p.allow_commands); self.interval.set(str(p.interval_ms)); q=p.params or {}; self.host.set(str(q.get('host') or '')); self.port.set(str(q.get('port') or '')); self.unit.set(str(q.get('unitId') or '1')); self.serial.set(str(q.get('serialPort') or q.get('portName') or 'AUTO')); self.baud.set(str(q.get('baud') or '115200')); self.endpoint.set(str(q.get('endpoint') or '')); self.topic.set(str(q.get('topic') or '')); self.command_endpoint.set(str(q.get('commandEndpoint') or q.get('commandTopic') or '')); self.title_lbl.configure(text=p.label); self._driver_hint()
    def _clear_form(self):
        for v in [self.label,self.mid,self.key,self.host,self.port,self.endpoint,self.topic,self.command_endpoint]:v.set('')
        self.title_lbl.configure(text='Selecione uma máquina')
    def _collect(self,p):
        try:mid=int(self.mid.get().strip()); interval=int(self.interval.get().strip()); unit=int(self.unit.get().strip() or 1); baud=int(self.baud.get().strip() or 115200)
        except ValueError:raise ValueError('ID, intervalo, Unit ID e baud devem ser números.')
        params={'host':self.host.get().strip(),'port':int(self.port.get()) if self.port.get().strip().isdigit() else None,'unitId':unit,'serialPort':self.serial.get().strip() or 'AUTO','baud':baud,'endpoint':self.endpoint.get().strip(),'topic':self.topic.get().strip()}
        if self.command_endpoint.get().strip():
            if self.driver.get()=='MQTT':params['commandTopic']=self.command_endpoint.get().strip()
            else:params['commandEndpoint']=self.command_endpoint.get().strip()
        params={k:v for k,v in params.items() if v not in ('',None)}
        p.label=self.label.get().strip() or f'Máquina {mid}'; p.server_url=self.server.get().strip(); p.machine_id=mid; p.device_key=self.key.get().strip(); p.driver=self.driver.get(); p.enabled=self.enabled.get(); p.allow_commands=self.allow.get(); p.interval_ms=interval; p.params=params; p.validate(); return p
    def _persist(self):
        if self.store.profiles:save_store(self.store)
        else:
            path=profiles_path();
            if path.exists():path.unlink()
    def _save_selected(self):
        p=self._profile()
        if not p:return messagebox.showwarning(APP_TITLE,'Adicione ou selecione uma máquina.')
        try:
            self._collect(p)
            if self.draft_profile and p.id==self.draft_profile.id:
                self.store.profiles.append(p); self.draft_profile=None
            self._persist(); self._refresh_list(); self._select(p.id); messagebox.showinfo(APP_TITLE,'Máquina salva no Edge. A Device Key foi protegida pelo Windows (DPAPI).')
        except Exception as e:messagebox.showerror(APP_TITLE,str(e))
    def _import_clip(self):
        try:raw=self.clipboard_get().strip(); d=json.loads(raw)
        except Exception:return messagebox.showerror(APP_TITLE,'Não encontrei um pacote SteelControl Edge no clipboard.\n\nNo Desktop/Mobile, gere a Device Key e use “Copiar para Edge”. Depois volte aqui e clique em Importar.')
        server=str(d.get('server') or d.get('serverUrl') or '').strip(); mid=d.get('machineId') or d.get('machine_id'); key=str(d.get('deviceKey') or d.get('device_key') or '').strip()
        if not server or not mid or not key:return messagebox.showerror(APP_TITLE,'Pacote incompleto. Copie a Device Key novamente pelo SteelControl.')
        existing=next((p for p in self.store.profiles if p.machine_id==int(mid) and p.server_url.rstrip('/')==server.rstrip('/')),None); p=existing or MachineProfile(); p.server_url=server.rstrip('/'); p.machine_id=int(mid); p.device_key=key; p.label=f'Máquina {mid}'
        if not existing:self.store.profiles.append(p)
        self.draft_profile=None
        self._persist(); self._refresh_list(); self._select(p.id); self._append(p.id,'Pacote importado. Testando configuração do servidor…'); self._test()
    def _test(self):
        p=self._profile()
        if not p:return
        try:self._collect(p)
        except Exception as e:return messagebox.showerror(APP_TITLE,str(e))
        threading.Thread(target=self._test_worker,args=(p,),daemon=True).start()
    def _test_worker(self,p):
        try:
            t=time.perf_counter(); cfg=SteelControlClient(p.server_url,p.machine_id,p.device_key).config(); ms=int((time.perf_counter()-t)*1000); auto=infer_driver(cfg.get('controlador'),cfg.get('protocolo'),False); self.after(0,lambda:self._test_ok(p,cfg,auto,ms))
        except Exception as e:self.after(0,lambda:self._test_fail(p,str(e)))
    def _test_ok(self,p,cfg,auto,ms):
        p.label=str(cfg.get('nome') or p.label); self.label.set(p.label)
        if p.driver=='AUTO':self.driver.set('AUTO')
        # Prefill cadastro do servidor sem sobrescrever ajustes locais existentes.
        q=p.params
        mapping=[('host',self.host),('porta',self.port),('unitId',self.unit),('endpoint',self.endpoint),('topico',self.topic)]
        for k,var in mapping:
            if not var.get().strip() and cfg.get(k) not in (None,''):var.set(str(cfg.get(k)))
        meta=cfg.get('integracaoMeta') or {}; dobot=meta.get('dobot') if isinstance(meta,dict) else None
        if isinstance(dobot,dict):
            if self.serial.get() in ('','AUTO'):self.serial.set(str(dobot.get('port') or 'AUTO'))
            self.baud.set(str(dobot.get('baudRate') or 115200))
        self._collect(p); self._persist(); self._refresh_list(); self._select(p.id,form=False); self._append(p.id,f'Credencial OK • {ms} ms • controlador={cfg.get("controlador") or "—"} • protocolo={cfg.get("protocolo") or "—"} • driver auto={auto}'); self.diag_lbl.configure(text=f'Credencial válida • {p.label} • {ms} ms • driver automático: {auto}'); messagebox.showinfo(APP_TITLE,f'Conexão validada.\n\nMáquina: {p.label}\nDriver automático: {auto}\nLatência: {ms} ms')
    def _test_fail(self,p,error):self._append(p.id,'ERRO de credencial: '+error);messagebox.showerror(APP_TITLE,error)
    def _driver_hint(self):
        d=self.driver.get(); self.driver_hint.configure(text=DRIVER_NAMES.get(d,d)+(' — usa automaticamente controlador/protocolo cadastrados no SteelControl.' if d=='AUTO' else ''))
    def _allow_changed(self):
        if not self.allow.get():return
        ans=simpledialog.askstring('Liberação de comandos','Comandos físicos podem movimentar máquinas. Valide E-stop, intertravamentos, limites e área segura.\n\nDigite LIBERAR para confirmar:',parent=self)
        if ans!='LIBERAR':self.allow.set(False);messagebox.showinfo(APP_TITLE,'Comandos físicos permaneceram bloqueados.')
    def _start_selected(self):
        p=self._profile()
        if not p:return
        try:self._collect(p); self._persist(); self.manager.start(p); self.tabs.select(self.diag)
        except Exception as e:messagebox.showerror(APP_TITLE,str(e))
    def _stop_selected(self):
        p=self._profile();
        if p:self.manager.stop(p.id)
    def _start_all(self):
        try:
            for p in self.store.profiles:p.validate()
            self._persist(); self.manager.start_all(self.store.profiles); self.tabs.select(self.diag)
        except Exception as e:messagebox.showerror(APP_TITLE,str(e))
    def _runtime_log(self,pid,msg):self.logq.put(('log',pid,msg))
    def _runtime_status(self,pid,state,extra):self.logq.put(('status',pid,(state,extra)))
    def _drain(self):
        try:
            while True:
                kind,pid,data=self.logq.get_nowait()
                if kind=='log':self._append(pid,data)
                elif kind=='edge_discovery':
                    stamp=time.strftime('%H:%M:%S'); self.log.configure(state='normal'); self.log.insert('end',f'[{stamp}] [DESCOBERTA] {data}\n'); self.log.see('end'); self.log.configure(state='disabled')
                else:
                    state,extra=data; self.status_by_id[pid]={'state':state,**extra}; self._refresh_list(); self._update_status_visual()
        except queue.Empty:pass
        self.after(120,self._drain)
    def _append(self,pid,text):
        p=next((x for x in self.store.profiles if x.id==pid),None); prefix=p.label if p else pid[:6]; stamp=time.strftime('%H:%M:%S'); self.log.configure(state='normal'); self.log.insert('end',f'[{stamp}] [{prefix}] {text}\n'); self.log.see('end'); self.log.configure(state='disabled')
    def _update_status_visual(self):
        p=self._profile(); st=self.status_by_id.get(self.selected_id,{}).get('state','STOPPED') if p else 'STOPPED'; cfg={'ONLINE':('ONLINE','#163622','#6be99b'),'ERROR':('ERRO','#3b1d20','#ff8b91'),'STOPPED':('PARADA','#2a333a',MUTED)}.get(st,(st,'#3a3321',WARN)); self.badge.configure(text=cfg[0],bg=cfg[1],fg=cfg[2])
        if p:self.diag_lbl.configure(text=f'{p.label} • ID {p.machine_id} • {DRIVER_NAMES.get(p.driver,p.driver)} • comandos {"LIBERADOS" if p.allow_commands else "BLOQUEADOS"}')
    def _refresh_ports(self):
        vals=['AUTO']
        if list_ports:
            try:vals += [x.device for x in list_ports.comports() if x.device]
            except Exception:pass
        try:self.port_combo['values']=vals
        except Exception:pass
    def _close(self):
        self.manager.stop_all();
        try:self.discovery.stop()
        except Exception:pass
        self.destroy()

def main():App().mainloop()
if __name__=='__main__':main()
