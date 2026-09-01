const STEELCONTROL_BUILD = "20260902_SINGLE_ORIGIN_APP_ROUTES";
console.info("[SteelControl] build", STEELCONTROL_BUILD);
// =========================================================
// ENDPOINTS — LOCAL + PRODUÇÃO
// =========================================================
// Frontend e API são servidos pelo backend na mesma origem. O fallback
// separado permanece apenas para abrir cópias antigas durante a migração.

(function configurarEndpointsSteelControl() {
  const override =
    String(window.STEELCONTROL_API_URL || "").trim();

  if (override) {
    window.STEELCONTROL_API_URL =
      override.replace(/\/$/, "");
    return;
  }

  const host = window.location.hostname;
  const porta = window.location.port;
  const local =
    host === "localhost" ||
    host === "127.0.0.1";

  const frontendSeparado =
    window.location.protocol === "file:" ||
    (local && porta && porta !== "3000");

  window.STEELCONTROL_API_URL =
    frontendSeparado
      ? "http://localhost:3000"
      : window.location.origin;
})();

// =========================================================
// STEELCONTROL
// CONFIGURAÇÃO GLOBAL
// IDIOMA + TEMA
// =========================================================
//
// IMPORTANTE:
// carregue este arquivo ANTES do JS de cada página:
//
// <script src="config.js"></script>
// <script src="pagina.js"></script>
//
// =========================================================


// =========================================================
// CONFIGURAÇÕES
// =========================================================

const IDIOMAS_SUPORTADOS = [
  "pt",
  "en",
  "es",
  "fr",
  "de",
  "it"
];


// =========================================================
// PORTUGUÊS
// =========================================================

const PT = {

  simulationMode: "Modo simulação",
  realIntegration: "Integração real",
  machineConnected: "Máquina conectada",
  machineOffline: "Máquina offline",
  liveTelemetry: "Dados em tempo real",
  awaitingRealTelemetry: "Aguardando telemetria real",
  connectionNotConfigured: "Conexão não configurada",
  simulationGeneratedData: "Dados gerados pelo SteelControl",

  apiOffline: "API offline",
  erroApiTexto: "Não foi possível carregar os dados da máquina.",
  statusAlertaTexto: "A máquina requer atenção.",
  statusManutencaoTexto: "A máquina está em manutenção.",
  statusOkTexto: "Operação normal.",
  verificarEnergia: "Verificar carga elétrica",
  verificarSuperaquecimento: "Verificar superaquecimento",

  manutencaoPreventivaNecessaria: "Manutenção preventiva necessária",

  // =======================================================
  // GERAL
  // =======================================================

  usuario: "Usuário",
  cargo: "Cargo",
  sair: "Sair",
  voltar: "Voltar",
  salvar: "Salvar",
  cancelar: "Cancelar",
  editar: "Editar",
  excluir: "Excluir",
  fechar: "Fechar",
  buscar: "Buscar",
  carregando: "Carregando...",
  carregandoInformacoes: "Carregando informações...",
  naoInformado: "Não informado",
  semRegistro: "Sem registro",
  normal: "Normal",
  sim: "Sim",
  nao: "Não",
  ativo: "Ativo",
  inativo: "Inativo",

  // =======================================================
  // NAVEGAÇÃO
  // =======================================================

  inicio: "Início",
  sobre: "Sobre",
  recursos: "Recursos",
  seguranca: "Segurança",
  tecnologia: "Tecnologia",
  contato: "Contato",

  maquinas: "Máquinas",
  producao: "Produção",
  manutencao: "Manutenção",
  logs: "Logs",
  alertas: "Alertas",
  configuracoes: "Configurações",

  minhaEmpresa: "Minha Empresa",

  entrar: "Entrar",
  entrarSistema: "Entrar no sistema",

  dashboard: "Dashboard",

  // =======================================================
  // HOME
  // =======================================================

  homeTituloPagina:
    "SteelControl | Gestão Industrial Inteligente",

  homeMetaDescricao:
    "SteelControl é uma plataforma de monitoramento industrial, manutenção, segurança e gestão empresarial.",

  homeIndustrialIntelligence:
    "Industrial Intelligence",

  homePlataformaGestao:
    "Plataforma de gestão industrial",

  homeHeroTituloAntes:
    "Controle industrial",

  homeHeroTituloDestaque:
    "inteligente",

  homeHeroTituloDepois:
    "em uma única plataforma.",

  homeHeroDescricao:
    "Monitore máquinas, produção, manutenção, alertas, segurança e equipes em tempo real com uma solução criada para ambientes industriais.",

  homeConhecerPlataforma:
    "Conhecer a plataforma",

  homeMonitoramentoTempoReal:
    "Monitoramento em tempo real",

  homeSegurancaEmpresarial:
    "Segurança empresarial",

  homeGestaoEquipes:
    "Gestão de equipes",

  homeOnline:
    "Online",

  homeAdministrador:
    "Administrador",

  homeEmpresaExemplo:
    "Empresa Exemplo",

  homeTemperatura:
    "Temperatura",

  homeProducao:
    "Produção",

  homeCiclos:
    "Ciclos",

  homeEnergia:
    "Energia",

  homeHoje:
    "hoje",

  homeProducaoUltimasHoras:
    "Produção nas últimas horas",

  homeUltimas8Horas:
    "Últimas 8 horas",

  homeAlertasRecentes:
    "Alertas recentes",

  homeTemperaturaAlta:
    "Temperatura alta",

  homeMaquina03:
    "Máquina 03",

  homeManutencaoPreventiva:
    "Manutenção preventiva",

  homeMaquina07:
    "Máquina 07",

  homeConsumoElevado:
    "Carga elevada",

  homeMaquina02:
    "Máquina 02",

  homeVerAlertas:
    "Ver todos os alertas",

  homeMonitoramentoContinuo:
    "Monitoramento contínuo",

  homeGestaoCentralizada:
    "Gestão centralizada",

  homeDadosOperacionais:
    "Dados operacionais",

  homeMultiusuario:
    "Multiusuário",

  homeControleEquipes:
    "Controle de equipes",

  homeSobreNos:
    "Sobre nós",

  homeSobreTitulo:
    "Tecnologia criada para tornar a gestão industrial mais inteligente.",

  homeSobreTexto1:
    "O SteelControl nasceu com o objetivo de centralizar informações importantes de uma operação industrial em um único ambiente.",

  homeSobreTexto2:
    "Nossa plataforma reúne monitoramento, produção, manutenção, segurança, equipes e informações empresariais, oferecendo maior visibilidade da operação.",

  homeSobreTexto3:
    "A proposta é permitir que empresas acompanhem seus processos de maneira simples, moderna e preparada para futuras integrações com automação industrial.",

  homeInteligenciaIndustrial:
    "Inteligência industrial",

  homeMonitoramentoMaquinas:
    "Monitoramento de máquinas",

  homeControleProducao:
    "Controle de produção",

  homeGestaoManutencao:
    "Gestão de manutenção",

  homeSegurancaBiometrica:
    "Segurança biométrica",

  homeGestaoFuncionarios:
    "Gestão de funcionários",

  homeIntegracaoAutomacao:
    "Integração com automação",

  homeRecursosTitulo:
    "Tudo que sua operação precisa em um só lugar.",

  homeRecursosTexto:
    "Uma plataforma criada para centralizar as principais informações de uma operação industrial.",

  homeMaquinasTexto:
    "Cadastre e acompanhe equipamentos, setores, modelos, status e dados operacionais.",

  homeProducaoTexto:
    "Visualize indicadores e acompanhe a evolução da produtividade.",

  homeManutencaoTexto:
    "Registre manutenções preventivas, corretivas e acompanhe históricos.",

  homeAlertasTexto:
    "Identifique rapidamente situações que precisam da atenção da equipe.",

  homeEquipes:
    "Equipes",

  homeEquipesTexto:
    "Gerencie funcionários, cargos, permissões e acessos empresariais.",

  homeReconhecimentoFacial:
    "Reconhecimento facial",

  homeReconhecimentoFacialTexto:
    "Autenticação biométrica integrada para adicionar uma camada extra de segurança.",

  homeSegurancaTitulo:
    "Controle de acesso preparado para ambientes corporativos.",

  homeSegurancaTexto:
    "Cada funcionário pode possuir sua própria conta e diferentes níveis de permissão, proporcionando maior controle sobre o acesso às informações.",

  homeCargosPermissoes:
    "Cargos e permissões",

  homeCargosPermissoesTexto:
    "Controle de acesso por função.",

  homeEmpresasSeparadas:
    "Empresas separadas",

  homeEmpresasSeparadasTexto:
    "Dados organizados por organização.",

  homeTecnologiaTitulo:
    "Tecnologia preparada para crescer com a indústria.",

  homeNodeTexto:
    "APIs e regras",

  homePostgresTexto:
    "Banco de dados",

  homePrismaTexto:
    "ORM moderno",

  homePythonTexto:
    "Visão computacional",

  homeIoT:
    "IoT",

  homeIoTTexto:
    "Sensores e dispositivos",

  homeRobotica:
    "Robótica",

  homeRoboticaTexto:
    "Integração industrial",

  homePreparadoFuturo:
    "Preparado para o futuro",

  homeFuturoTitulo:
    "Sensores, automação e robótica industrial.",

  homeFuturoTexto:
    "O SteelControl foi pensado para evoluir junto com a operação industrial, permitindo futuras integrações com sensores, microcontroladores e equipamentos.",

  homeSensores:
    "Sensores",

  homeAutomacao:
    "Automação",

  homeCtaTitulo:
    "Mais controle para sua operação. Mais informação para suas decisões.",

  homeCtaTexto:
    "Entre na plataforma e acompanhe sua operação industrial em um ambiente centralizado e seguro.",

  homeEntrarSteelControl:
    "Entrar no SteelControl",

  homeConhecerMais:
    "Conhecer mais",

  homePlataforma:
    "Plataforma",

  homeEmpresa:
    "Empresa",

  homeContato:
    "Contato",

  homeTodosDireitos:
    "Todos os direitos reservados.",

  alterarTema:
    "Alterar tema",

  abrirMenu:
    "Abrir menu",

  // =======================================================
  // LOGIN
  // =======================================================

  loginAcessoEmpresarial:
    "Acesso empresarial",

  loginTitulo:
    "Acesse sua empresa",

  loginSubtitulo:
    "Entre no ambiente industrial da sua organização e acompanhe tudo pelo SteelControl.",

  loginConfiancaTitulo:
    "Confie sua operação ao SteelControl",

  loginConfiancaTexto:
    "Centralize máquinas, produção, manutenção, alertas, equipes e segurança em uma única plataforma.",

  emailLabel:
    "E-mail",

  senhaLabel:
    "Senha",

  emailPlaceholder:
    "nome@empresa.com",

  senhaPlaceholder:
    "Digite sua senha",

  loginAcessarEmpresa:
    "Acessar minha empresa",

  reconhecimentoFacial:
    "Reconhecimento facial",

  loginBiometria:
    "Entre com sua biometria",

  loginEmpresaNaoEsta:
    "SUA EMPRESA AINDA NÃO ESTÁ AQUI?",

  loginLeveIndustria:
    "Leve sua indústria para o SteelControl",

  loginCadastroDescricao:
    "Cadastre sua empresa e tenha um ambiente próprio para gerenciar máquinas, funcionários, segurança, produção e manutenção.",

  monitoramentoCentralizado:
    "Monitoramento centralizado",

  gestaoEquipes:
    "Gestão de equipes",

  segurancaBiometrica:
    "Segurança biométrica",

  cadastrarMinhaEmpresa:
    "Cadastrar minha empresa",

  novaOrganizacao:
    "Nova organização",

  cadastrarEmpresaTitulo:
    "Cadastre sua empresa",

  cadastrarEmpresaSubtitulo:
    "Crie o ambiente industrial da sua organização e cadastre o primeiro administrador.",

  primeiroAdministrador:
    "Primeiro administrador",

  primeiroAdministradorTexto:
    "Esse usuário terá acesso administrativo para configurar sua empresa no SteelControl.",

  informacoesEmpresa:
    "Informações da empresa",

  nomeEmpresa:
    "Nome da empresa",

  nomeEmpresaPlaceholder:
    "Ex: SteelTech Indústria",

  cnpj:
    "CNPJ",

  cnpjPlaceholder:
    "00.000.000/0000-00",

  administradorEmpresa:
    "Administrador da empresa",

  nomeAdministrador:
    "Nome do administrador",

  nomeAdministradorPlaceholder:
    "Seu nome completo",

  emailCorporativo:
    "E-mail corporativo",

  emailCorporativoPlaceholder:
    "admin@empresa.com",

  senhaCadastroPlaceholder:
    "Mínimo 6 caracteres",

  criarMinhaEmpresa:
    "Criar minha empresa",

  voltarLogin:
    "Voltar para o login",

  ambienteSeguro:
    "Ambiente seguro",

  plataformaEmpresarial:
    "Plataforma empresarial",

  loginSideTag:
    "STEELCONTROL",

  loginSideTituloAntes:
    "Sua indústria",

  loginSideTituloDestaque:
    "conectada,",

  loginSideTituloDepois:
    "segura e inteligente.",

  loginSideTexto:
    "Tecnologia para acompanhar sua operação, melhorar processos e transformar dados industriais em decisões.",

  monitoramento:
    "Monitoramento",

  gestaoIndustrial:
    "Gestão industrial",

  loginInfoTitulo:
    "Todo o controle da sua operação em um único lugar.",

  loginInfoTexto:
    "Máquinas, logs, temperatura, produção, manutenção, alertas, equipes e autenticação integrados em uma única plataforma.",

  loginTecnologiaIndustrial:
    "Tecnologia desenvolvida para ambientes industriais",

  faceTitulo:
    "Reconhecimento facial",

  facePrepareTitulo:
    "Prepare-se para o reconhecimento facial",

  facePrepareTexto:
    "Centralize seu rosto dentro do oval. O reconhecimento acontece automaticamente.",

  faceAutomatico:
    "Reconhecimento automático — não é necessário apertar nenhum botão.",

  faceTexto:
    "Posicione seu rosto em frente à câmera",

  iniciandoCamera:
    "Iniciando câmera...",

  procurandoRosto:
    "Procurando rosto...",

  olharCamera:
    "Olhe diretamente para a câmera",

  cameraSomenteAutenticacao:
    "A câmera é utilizada somente durante a autenticação.",

  mostrarSenha:
    "Mostrar senha",

  fecharReconhecimentoFacial:
    "Fechar reconhecimento facial",

  loginSucesso:
    "Login realizado com sucesso!",

  erroLogin:
    "E-mail ou senha inválidos.",

  erroCampos:
    "Preencha todos os campos.",

  // =======================================================
  // DASHBOARD
  // =======================================================

  dashboardTitulo:
    "Dashboard de Máquinas Industriais",

  dashboardSubtitulo:
    "Sistema de monitoramento em tempo real",

  temperatura:
    "Temperatura",

  temperaturaDesc:
    "Temperatura atual da máquina",

  producaoCard:
    "Produção",

  producaoDesc:
    "Peças produzidas",

  ciclos:
    "Ciclos",

  ciclosDesc:
    "Ciclos executados",

  energia:
    "Energia",

  energiaDesc:
    "Percentual normalizado (0–100%)",

  producaoTempoReal:
    "Produção em tempo real",

  situacaoMaquina:
    "Situação da máquina",

  manutencaoResumo:
    "Manutenção",

  temperaturaMaquina:
    "Temperatura da máquina",

  consumoEnergia:
    "Carga elétrica (%)",

  maquinaSelecionada:
    "Máquina selecionada",

  maquinaSelecionadaDesc:
    "Visualização da máquina monitorada pelo sistema",

  verDetalhes:
    "Ver detalhes",

  producaoMaquina:
    "Produção da máquina",

  producaoMaquinaDesc:
    "Acompanhamento da produção realizada em tempo real",

  graficoProducao:
    "Gráfico de produção",

  resumoProdutivo:
    "Resumo produtivo",

  totalProduzido:
    "Total produzido:",

  ciclosExecutados:
    "Ciclos executados:",

  status:
    "Status:",

  manutencaoTitulo:
    "Manutenção",

  manutencaoDesc:
    "Controle de manutenção preventiva e corretiva da máquina",

  ultimaManutencao:
    "Última manutenção",

  ultimaManutencaoDesc:
    "Registro mais recente",

  proximaManutencao:
    "Próxima manutenção",

  proximaManutencaoDesc:
    "Previsão preventiva",

  situacao:
    "Situação",

  situacaoDesc:
    "Status atual",

  ciclosManutencaoDesc:
    "Base para revisão",

  cadastrarManutencao:
    "Cadastrar manutenção",

  tipoManutencao:
    "Tipo de manutenção",

  selecioneTipo:
    "Selecione o tipo",

  preventiva:
    "Preventiva",

  corretiva:
    "Corretiva",

  nomeTecnico:
    "Nome do técnico",

  nomeTecnicoPlaceholder:
    "Digite o nome do técnico",

  descricao:
    "Descrição",

  descricaoManutencaoPlaceholder:
    "Descreva o serviço realizado",

  salvarManutencao:
    "Salvar manutenção",

  historicoManutencoes:
    "Histórico de manutenções",

  carregandoHistorico:
    "Carregando histórico...",

  logsTitulo:
    "Logs da máquina",

  logsDesc:
    "Histórico de eventos gerados automaticamente",

  alertasTitulo:
    "Alertas",

  alertasDesc:
    "Ocorrências que precisam de atenção",

  nenhumLog:
    "Nenhum log registrado.",

  nenhumAlerta:
    "Nenhum alerta registrado.",

  nenhumaManutencao:
    "Nenhuma manutenção registrada.",

  manutencaoSucesso:
    "Manutenção cadastrada com sucesso!",

  erroCadastrarManutencao:
    "Erro ao cadastrar manutenção.",

  configDesc:
    "Personalize o idioma e o tema visual do sistema.",

  idioma:
    "Idioma",

  tema:
    "Tema",

  claro:
    "Claro",

  escuro:
    "Escuro",

  gerenciarEmpresaTitle:
    "Gerenciar empresa, funcionários e reconhecimento facial",

  // =======================================================
  // MÁQUINAS
  // =======================================================

  equipamentosEmpresa:
    "Equipamentos da sua empresa",

  equipamentosIntro:
    "Cadastre máquinas, robôs industriais e outros equipamentos da sua operação. O SteelControl organiza os dados e acompanha temperatura, produção, ciclos, energia, manutenção e alertas.",

  monitoramentoIndustrial:
    "Monitoramento industrial em tempo real",

  historicoOperacional:
    "Histórico operacional",

  manutencaoIntegrada:
    "Manutenção integrada",

  equipamentos:
    "Equipamentos",

  emOperacao:
    "Em operação",

  emManutencao:
    "Em manutenção",

  comAlerta:
    "Com alerta",

  gestaoEquipamentos:
    "Gestão de equipamentos",

  cadastrarEquipamento:
    "Cadastrar novo equipamento",

  cadastrarEquipamentoTexto:
    "Informe os dados de identificação. O monitoramento será iniciado automaticamente após o cadastro.",

  novoEquipamento:
    "Novo equipamento",

  cadastrarQualquerEquipamento:
    "Cadastre qualquer equipamento industrial",

  cadastrarQualquerEquipamentoTexto:
    "Inclusive braços robóticos, esteiras, prensas, tornos, máquinas de corte e equipamentos personalizados.",

  vaiCadastrarBraco:
    "Vai cadastrar um braço robótico?",

  vaiCadastrarBracoTexto:
    "Preencha automaticamente um exemplo e altere apenas os dados do seu equipamento.",

  usarModelo:
    "Usar modelo",

  identificacaoEquipamento:
    "Identificação do equipamento",

  nomeEquipamento:
    "Nome do equipamento",

  nomeEquipamentoPlaceholder:
    "Ex: Braço robótico 01",

  setorLabel:
    "Setor",

  setorPlaceholder:
    "Ex: Automação",

  tipoEquipamento:
    "Tipo de equipamento",

  selecionarTipo:
    "Selecione o tipo",

  bracoRobotico:
    "Braço robótico",

  roboIndustrial:
    "Robô industrial",

  esteiraIndustrial:
    "Esteira industrial",

  prensa:
    "Prensa",

  torno:
    "Torno",

  solda:
    "Solda",

  corte:
    "Corte",

  embalagem:
    "Embalagem",

  cnc:
    "CNC",

  impressora3D:
    "Impressora 3D",

  outro:
    "Outro",

  modeloLabel:
    "Modelo",

  modeloPlaceholder:
    "Ex: RB-500",

  fabricanteLabel:
    "Fabricante",

  fabricantePlaceholder:
    "Ex: ABB, KUKA, FANUC...",

  codigoLabel:
    "Código / Patrimônio",

  codigoPlaceholder:
    "Ex: ROB-001",

  funcaoProcesso:
    "Função no processo industrial",

  descricaoEquipamento:
    "Descrição",

  descricaoEquipamentoPlaceholder:
    "Ex: Braço robótico responsável pela movimentação e posicionamento de peças na linha de automação.",

  cancelarCadastro:
    "Cancelar",

  cadastrarEquipamentoBotao:
    "Cadastrar equipamento",

  parqueIndustrial:
    "Parque industrial",

  equipamentosCadastrados:
    "Equipamentos cadastrados",

  equipamentosCadastradosTexto:
    "Consulte e acesse os equipamentos da sua empresa.",

  buscarEquipamento:
    "Buscar equipamento...",

  todosTipos:
    "Todos os tipos",

  robotica:
    "Robótica",

  esteiras:
    "Esteiras",

  prensas:
    "Prensas",

  outros:
    "Outros",

  todosStatus:
    "Todos os status",

  carregandoEquipamentos:
    "Carregando equipamentos...",

  fabricante:
    "Fabricante",

  modelo:
    "Modelo",

  codigo:
    "Código",

  setor:
    "Setor",

  tipo:
    "Tipo",

  pecas:
    "peças",

  situacaoManutencao:
    "Situação de manutenção",

  abrirMonitoramento:
    "Abrir monitoramento",

  nenhumEquipamento:
    "Nenhum equipamento encontrado",

  nenhumEquipamentoTexto:
    "Cadastre uma máquina ou braço robótico para iniciar o monitoramento industrial.",

  erroCarregarEquipamentos:
    "Não foi possível carregar os equipamentos",

  erroBackend:
    "Verifique se o backend SteelControl está funcionando.",

  preenchendoRobo:
    "Modelo de braço robótico preenchido. Altere os dados conforme seu equipamento.",

  erroCamposEquipamento:
    "Preencha todos os dados do equipamento.",

  cadastrandoEquipamento:
    "Cadastrando equipamento...",

  equipamentoCadastrado:
    "Equipamento cadastrado com sucesso! Monitoramento iniciado.",

  erroCadastrarEquipamento:
    "Erro ao cadastrar equipamento.",

  erroServidor:
    "Erro ao conectar com o servidor.",

  ligado:
    "Ligada",

  alertaStatus:
    "Alerta",

  manutencaoStatus:
    "Manutenção",

  // =======================================================
  // EMPRESA
  // =======================================================

  empresaTitulo:
    "Minha Empresa",

  empresaSubtitulo:
    "Gerencie dados institucionais, localização, funcionários e segurança.",

  dadosEmpresa:
    "Dados da empresa",

  editarDados:
    "Editar dados",

  salvarAlteracoes:
    "Salvar alterações",

  telefone:
    "Telefone",

  site:
    "Site",

  endereco:
    "Endereço",

  numero:
    "Número",

  complemento:
    "Complemento",

  bairro:
    "Bairro",

  cidade:
    "Cidade",

  estado:
    "Estado",

  pais:
    "País",

  cep:
    "CEP",

  localizacao:
    "Localização",

  abrirMapa:
    "Abrir no mapa",

  enderecoNaoCadastrado:
    "Endereço não cadastrado",

  adicionarLocalizacao:
    "Adicione a localização da empresa.",

  funcionarios:
    "Funcionários",

  novoFuncionario:
    "Novo funcionário",

  totalFuncionarios:
    "Funcionários",

  totalComFacial:
    "Com facial",

  administradores:
    "Administradores",

  nomeFuncionario:
    "Nome",

  cargoFuncionario:
    "Cargo",

  criarFuncionario:
    "Cadastrar funcionário",

  facialAtiva:
    "Reconhecimento facial ativo",

  facialNaoCadastrada:
    "Facial não cadastrada",

  cadastrarFacial:
    "Cadastrar facial",

  adicionarFacial:
    "Adicionar facial",

  removerFaciais:
    "Remover faciais",

  // =======================================================
  // CARGOS
  // =======================================================

  cargoAdministrador:
    "Administrador",

  cargoSupervisor:
    "Supervisor",

  cargoTecnico:
    "Técnico",

  cargoOperador:
    "Operador",

  cargoVisitante:
    "Visitante"
};


// =========================================================
// INGLÊS
// =========================================================

const EN = {

  simulationMode: "Simulation mode",
  realIntegration: "Real integration",
  machineConnected: "Machine connected",
  machineOffline: "Machine offline",
  liveTelemetry: "Live data",
  awaitingRealTelemetry: "Waiting for real telemetry",
  connectionNotConfigured: "Connection not configured",
  simulationGeneratedData: "Data generated by SteelControl",

  ...PT,

  apiOffline: "API offline",
  erroApiTexto: "Could not load machine data.",
  statusAlertaTexto: "The machine requires attention.",
  statusManutencaoTexto: "The machine is under maintenance.",
  statusOkTexto: "Normal operation.",
  verificarEnergia: "Check electrical load",
  verificarSuperaquecimento: "Check overheating",

  manutencaoPreventivaNecessaria: "Preventive maintenance required",

  usuario: "User",
  cargo: "Role",
  sair: "Logout",
  voltar: "Back",
  salvar: "Save",
  cancelar: "Cancel",
  editar: "Edit",
  excluir: "Delete",
  fechar: "Close",
  buscar: "Search",
  carregando: "Loading...",
  carregandoInformacoes: "Loading information...",
  naoInformado: "Not provided",
  semRegistro: "No record",
  ativo: "Active",
  inativo: "Inactive",

  inicio: "Home",
  sobre: "About",
  recursos: "Features",
  seguranca: "Security",
  tecnologia: "Technology",
  contato: "Contact",

  maquinas: "Machines",
  producao: "Production",
  manutencao: "Maintenance",
  logs: "Logs",
  alertas: "Alerts",
  configuracoes: "Settings",

  minhaEmpresa: "My Company",

  entrar: "Sign in",
  entrarSistema: "Sign in",
  dashboard: "Dashboard",

  homeTituloPagina:
    "SteelControl | Intelligent Industrial Management",

  homeMetaDescricao:
    "SteelControl is an industrial monitoring, maintenance, security and business management platform.",

  homePlataformaGestao:
    "Industrial management platform",

  homeHeroTituloAntes:
    "Industrial control",

  homeHeroTituloDestaque:
    "intelligent",

  homeHeroTituloDepois:
    "on a single platform.",

  homeHeroDescricao:
    "Monitor machines, production, maintenance, alerts, security and teams in real time with a solution designed for industrial environments.",

  homeConhecerPlataforma:
    "Discover the platform",

  homeMonitoramentoTempoReal:
    "Real-time monitoring",

  homeSegurancaEmpresarial:
    "Business security",

  homeGestaoEquipes:
    "Team management",

  homeOnline:
    "Online",

  homeAdministrador:
    "Administrator",

  homeEmpresaExemplo:
    "Example Company",

  homeTemperatura:
    "Temperature",

  homeProducao:
    "Production",

  homeCiclos:
    "Cycles",

  homeEnergia:
    "Energy",

  homeHoje:
    "today",

  homeProducaoUltimasHoras:
    "Production in recent hours",

  homeUltimas8Horas:
    "Last 8 hours",

  homeAlertasRecentes:
    "Recent alerts",

  homeTemperaturaAlta:
    "High temperature",

  homeMaquina03:
    "Machine 03",

  homeManutencaoPreventiva:
    "Preventive maintenance",

  homeMaquina07:
    "Machine 07",

  homeConsumoElevado:
    "High electrical load",

  homeMaquina02:
    "Machine 02",

  homeVerAlertas:
    "View all alerts",

  homeMonitoramentoContinuo:
    "Continuous monitoring",

  homeGestaoCentralizada:
    "Centralized management",

  homeDadosOperacionais:
    "Operational data",

  homeMultiusuario:
    "Multi-user",

  homeControleEquipes:
    "Team control",

  homeSobreNos:
    "About us",

  homeSobreTitulo:
    "Technology created to make industrial management smarter.",

  homeSobreTexto1:
    "SteelControl was created to centralize important industrial operation information in a single environment.",

  homeSobreTexto2:
    "Our platform brings together monitoring, production, maintenance, security, teams and business information, providing greater operational visibility.",

  homeSobreTexto3:
    "Our goal is to enable companies to monitor their processes in a simple, modern way prepared for future industrial automation integrations.",

  homeInteligenciaIndustrial:
    "Industrial intelligence",

  homeMonitoramentoMaquinas:
    "Machine monitoring",

  homeControleProducao:
    "Production control",

  homeGestaoManutencao:
    "Maintenance management",

  homeSegurancaBiometrica:
    "Biometric security",

  homeGestaoFuncionarios:
    "Employee management",

  homeIntegracaoAutomacao:
    "Automation integration",

  homeRecursosTitulo:
    "Everything your operation needs in one place.",

  homeRecursosTexto:
    "A platform designed to centralize the main information of an industrial operation.",

  homeMaquinasTexto:
    "Register and monitor equipment, sectors, models, statuses and operational data.",

  homeProducaoTexto:
    "View indicators and monitor productivity development.",

  homeManutencaoTexto:
    "Register preventive and corrective maintenance and monitor history.",

  homeAlertasTexto:
    "Quickly identify situations requiring team attention.",

  homeEquipes:
    "Teams",

  homeEquipesTexto:
    "Manage employees, roles, permissions and business access.",

  homeReconhecimentoFacial:
    "Facial recognition",

  homeReconhecimentoFacialTexto:
    "Integrated biometric authentication adds an extra layer of security.",

  homeSegurancaTitulo:
    "Access control designed for business environments.",

  homeSegurancaTexto:
    "Each employee can have their own account and different permission levels, providing greater control over information access.",

  homeCargosPermissoes:
    "Roles and permissions",

  homeCargosPermissoesTexto:
    "Role-based access control.",

  homeEmpresasSeparadas:
    "Separated companies",

  homeEmpresasSeparadasTexto:
    "Data organized by company.",

  homeTecnologiaTitulo:
    "Technology ready to grow with industry.",

  homeNodeTexto:
    "APIs and business rules",

  homePostgresTexto:
    "Database",

  homePrismaTexto:
    "Modern ORM",

  homePythonTexto:
    "Computer vision",

  homeIoTTexto:
    "Sensors and devices",

  homeRobotica:
    "Robotics",

  homeRoboticaTexto:
    "Industrial integration",

  homePreparadoFuturo:
    "Ready for the future",

  homeFuturoTitulo:
    "Sensors, automation and industrial robotics.",

  homeFuturoTexto:
    "SteelControl was designed to evolve with industrial operations, allowing future integrations with sensors, microcontrollers and equipment.",

  homeSensores:
    "Sensors",

  homeAutomacao:
    "Automation",

  homeCtaTitulo:
    "More control for your operation. More information for your decisions.",

  homeCtaTexto:
    "Access the platform and monitor your industrial operation in a centralized and secure environment.",

  homeEntrarSteelControl:
    "Enter SteelControl",

  homeConhecerMais:
    "Learn more",

  homePlataforma:
    "Platform",

  homeEmpresa:
    "Company",

  homeContato:
    "Contact",

  homeTodosDireitos:
    "All rights reserved.",

  alterarTema:
    "Change theme",

  abrirMenu:
    "Open menu",

  loginAcessoEmpresarial:
    "Business access",

  loginTitulo:
    "Access your company",

  loginSubtitulo:
    "Enter your organization's industrial environment and manage everything through SteelControl.",

  loginConfiancaTitulo:
    "Trust your operation to SteelControl",

  loginConfiancaTexto:
    "Centralize machines, production, maintenance, alerts, teams and security on a single platform.",

  emailLabel:
    "Email",

  senhaLabel:
    "Password",

  emailPlaceholder:
    "name@company.com",

  senhaPlaceholder:
    "Enter your password",

  loginAcessarEmpresa:
    "Access my company",

  reconhecimentoFacial:
    "Facial recognition",

  loginBiometria:
    "Sign in with biometrics",

  loginEmpresaNaoEsta:
    "IS YOUR COMPANY NOT HERE YET?",

  loginLeveIndustria:
    "Bring your industry to SteelControl",

  loginCadastroDescricao:
    "Register your company and get your own environment to manage machines, employees, security, production and maintenance.",

  monitoramentoCentralizado:
    "Centralized monitoring",

  gestaoEquipes:
    "Team management",

  segurancaBiometrica:
    "Biometric security",

  cadastrarMinhaEmpresa:
    "Register my company",

  novaOrganizacao:
    "New organization",

  cadastrarEmpresaTitulo:
    "Register your company",

  cadastrarEmpresaSubtitulo:
    "Create your organization's industrial environment and register the first administrator.",

  primeiroAdministrador:
    "First administrator",

  primeiroAdministradorTexto:
    "This user will have administrative access to configure your company in SteelControl.",

  informacoesEmpresa:
    "Company information",

  nomeEmpresa:
    "Company name",

  nomeEmpresaPlaceholder:
    "Ex: SteelTech Industry",

  cnpj:
    "Company ID",

  administradorEmpresa:
    "Company administrator",

  nomeAdministrador:
    "Administrator name",

  nomeAdministradorPlaceholder:
    "Your full name",

  emailCorporativo:
    "Business email",

  emailCorporativoPlaceholder:
    "admin@company.com",

  senhaCadastroPlaceholder:
    "Minimum 6 characters",

  criarMinhaEmpresa:
    "Create my company",

  voltarLogin:
    "Back to login",

  ambienteSeguro:
    "Secure environment",

  plataformaEmpresarial:
    "Business platform",

  loginSideTituloAntes:
    "Your industry",

  loginSideTituloDestaque:
    "connected,",

  loginSideTituloDepois:
    "secure and intelligent.",

  loginSideTexto:
    "Technology to monitor your operation, improve processes and transform industrial data into decisions.",

  monitoramento:
    "Monitoring",

  gestaoIndustrial:
    "Industrial management",

  loginInfoTitulo:
    "Complete control of your operation in one place.",

  loginInfoTexto:
    "Machines, logs, temperature, production, maintenance, alerts, teams and authentication integrated into a single platform.",

  loginTecnologiaIndustrial:
    "Technology developed for industrial environments",

  faceTitulo:
    "Facial recognition",

  facePrepareTitulo:
    "Get ready for facial recognition",

  facePrepareTexto:
    "Center your face inside the oval. Recognition happens automatically.",

  faceAutomatico:
    "Automatic recognition — you do not need to press any button.",

  faceTexto:
    "Position your face in front of the camera",

  iniciandoCamera:
    "Starting camera...",

  procurandoRosto:
    "Looking for a face...",

  olharCamera:
    "Look directly at the camera",

  cameraSomenteAutenticacao:
    "The camera is used only during authentication.",

  mostrarSenha:
    "Show password",

  fecharReconhecimentoFacial:
    "Close facial recognition",

  loginSucesso:
    "Login successful!",

  erroLogin:
    "Invalid email or password.",

  erroCampos:
    "Fill in all fields.",

  dashboardTitulo:
    "Industrial Machines Dashboard",

  dashboardSubtitulo:
    "Real-time monitoring system",

  temperatura:
    "Temperature",

  temperaturaDesc:
    "Current machine temperature",

  producaoCard:
    "Production",

  producaoDesc:
    "Parts produced",

  ciclos:
    "Cycles",

  ciclosDesc:
    "Executed cycles",

  energia:
    "Energy",

  energiaDesc:
    "Normalized percentage (0–100%)",

  producaoTempoReal:
    "Real-time production",

  situacaoMaquina:
    "Machine status",

  manutencaoResumo:
    "Maintenance",

  temperaturaMaquina:
    "Machine temperature",

  consumoEnergia:
    "Electrical load (%)",

  maquinaSelecionada:
    "Selected machine",

  maquinaSelecionadaDesc:
    "View of the machine monitored by the system",

  verDetalhes:
    "View details",

  producaoMaquina:
    "Machine production",

  producaoMaquinaDesc:
    "Real-time production monitoring",

  graficoProducao:
    "Production chart",

  resumoProdutivo:
    "Production summary",

  totalProduzido:
    "Total produced:",

  ciclosExecutados:
    "Executed cycles:",

  manutencaoDesc:
    "Preventive and corrective machine maintenance control",

  ultimaManutencao:
    "Last maintenance",

  ultimaManutencaoDesc:
    "Most recent record",

  proximaManutencao:
    "Next maintenance",

  proximaManutencaoDesc:
    "Preventive forecast",

  situacao:
    "Situation",

  situacaoDesc:
    "Current status",

  ciclosManutencaoDesc:
    "Review basis",

  cadastrarManutencao:
    "Register maintenance",

  tipoManutencao:
    "Maintenance type",

  selecioneTipo:
    "Select type",

  preventiva:
    "Preventive",

  corretiva:
    "Corrective",

  nomeTecnico:
    "Technician name",

  nomeTecnicoPlaceholder:
    "Enter technician name",

  descricao:
    "Description",

  descricaoManutencaoPlaceholder:
    "Describe the service performed",

  salvarManutencao:
    "Save maintenance",

  historicoManutencoes:
    "Maintenance history",

  carregandoHistorico:
    "Loading history...",

  logsTitulo:
    "Machine logs",

  logsDesc:
    "History of automatically generated events",

  alertasTitulo:
    "Alerts",

  alertasDesc:
    "Events that require attention",

  nenhumLog:
    "No logs registered.",

  nenhumAlerta:
    "No alerts registered.",

  nenhumaManutencao:
    "No maintenance registered.",

  manutencaoSucesso:
    "Maintenance registered successfully!",

  erroCadastrarManutencao:
    "Error registering maintenance.",

  configDesc:
    "Customize the system language and visual theme.",

  idioma:
    "Language",

  tema:
    "Theme",

  claro:
    "Light",

  escuro:
    "Dark",

  gerenciarEmpresaTitle:
    "Manage company, employees and facial recognition",

  equipamentosEmpresa:
    "Your company's equipment",

  equipamentosIntro:
    "Register machines, industrial robots and other equipment in your operation. SteelControl organizes data and monitors temperature, production, cycles, energy, maintenance and alerts.",

  monitoramentoIndustrial:
    "Real-time industrial monitoring",

  historicoOperacional:
    "Operational history",

  manutencaoIntegrada:
    "Integrated maintenance",

  equipamentos:
    "Equipment",

  emOperacao:
    "In operation",

  emManutencao:
    "Under maintenance",

  comAlerta:
    "With alerts",

  gestaoEquipamentos:
    "Equipment management",

  cadastrarEquipamento:
    "Register new equipment",

  cadastrarEquipamentoTexto:
    "Enter the identification details. Monitoring will start automatically after registration.",

  novoEquipamento:
    "New equipment",

  cadastrarQualquerEquipamento:
    "Register any industrial equipment",

  cadastrarQualquerEquipamentoTexto:
    "Including robotic arms, conveyors, presses, lathes, cutting machines and custom equipment.",

  vaiCadastrarBraco:
    "Are you registering a robotic arm?",

  vaiCadastrarBracoTexto:
    "Automatically fill in an example and change only your equipment details.",

  usarModelo:
    "Use template",

  identificacaoEquipamento:
    "Equipment identification",

  nomeEquipamento:
    "Equipment name",

  nomeEquipamentoPlaceholder:
    "Ex: Robotic arm 01",

  setorLabel:
    "Sector",

  setorPlaceholder:
    "Ex: Automation",

  tipoEquipamento:
    "Equipment type",

  selecionarTipo:
    "Select type",

  bracoRobotico:
    "Robotic arm",

  roboIndustrial:
    "Industrial robot",

  esteiraIndustrial:
    "Industrial conveyor",

  prensa:
    "Press",

  torno:
    "Lathe",

  solda:
    "Welding",

  corte:
    "Cutting",

  embalagem:
    "Packaging",

  impressora3D:
    "3D printer",

  outro:
    "Other",

  modeloLabel:
    "Model",

  modeloPlaceholder:
    "Ex: RB-500",

  fabricanteLabel:
    "Manufacturer",

  fabricantePlaceholder:
    "Ex: ABB, KUKA, FANUC...",

  codigoLabel:
    "Code / Asset",

  codigoPlaceholder:
    "Ex: ROB-001",

  funcaoProcesso:
    "Function in the industrial process",

  descricaoEquipamento:
    "Description",

  descricaoEquipamentoPlaceholder:
    "Ex: Robotic arm responsible for moving and positioning parts on the automation line.",

  cancelarCadastro:
    "Cancel",

  cadastrarEquipamentoBotao:
    "Register equipment",

  parqueIndustrial:
    "Industrial equipment",

  equipamentosCadastrados:
    "Registered equipment",

  equipamentosCadastradosTexto:
    "View and access your company's equipment.",

  buscarEquipamento:
    "Search equipment...",

  todosTipos:
    "All types",

  robotica:
    "Robotics",

  esteiras:
    "Conveyors",

  prensas:
    "Presses",

  outros:
    "Others",

  todosStatus:
    "All statuses",

  carregandoEquipamentos:
    "Loading equipment...",

  fabricante:
    "Manufacturer",

  modelo:
    "Model",

  codigo:
    "Code",

  setor:
    "Sector",

  tipo:
    "Type",

  pecas:
    "parts",

  situacaoManutencao:
    "Maintenance status",

  abrirMonitoramento:
    "Open monitoring",

  nenhumEquipamento:
    "No equipment found",

  nenhumEquipamentoTexto:
    "Register a machine or robotic arm to start industrial monitoring.",

  erroCarregarEquipamentos:
    "Could not load equipment",

  erroBackend:
    "Check whether the SteelControl backend is running.",

  preenchendoRobo:
    "Robotic arm template filled in. Change the details according to your equipment.",

  erroCamposEquipamento:
    "Fill in all equipment details.",

  cadastrandoEquipamento:
    "Registering equipment...",

  equipamentoCadastrado:
    "Equipment registered successfully! Monitoring started.",

  erroCadastrarEquipamento:
    "Error registering equipment.",

  erroServidor:
    "Error connecting to the server.",

  ligado:
    "On",

  alertaStatus:
    "Alert",

  manutencaoStatus:
    "Maintenance",

  empresaTitulo:
    "My Company",

  empresaSubtitulo:
    "Manage company information, location, employees and security.",

  dadosEmpresa:
    "Company information",

  editarDados:
    "Edit information",

  salvarAlteracoes:
    "Save changes",

  telefone:
    "Phone",

  site:
    "Website",

  endereco:
    "Address",

  numero:
    "Number",

  complemento:
    "Additional information",

  bairro:
    "District",

  cidade:
    "City",

  estado:
    "State",

  pais:
    "Country",

  cep:
    "Postal code",

  localizacao:
    "Location",

  abrirMapa:
    "Open map",

  enderecoNaoCadastrado:
    "Address not registered",

  adicionarLocalizacao:
    "Add the company location.",

  funcionarios:
    "Employees",

  novoFuncionario:
    "New employee",

  totalFuncionarios:
    "Employees",

  totalComFacial:
    "With facial recognition",

  administradores:
    "Administrators",

  nomeFuncionario:
    "Name",

  cargoFuncionario:
    "Role",

  criarFuncionario:
    "Register employee",

  facialAtiva:
    "Facial recognition active",

  facialNaoCadastrada:
    "Facial recognition not registered",

  cadastrarFacial:
    "Register facial recognition",

  adicionarFacial:
    "Add facial sample",

  removerFaciais:
    "Remove facial samples",

  cargoAdministrador:
    "Administrator",

  cargoSupervisor:
    "Supervisor",

  cargoTecnico:
    "Technician",

  cargoOperador:
    "Operator",

  cargoVisitante:
    "Visitor"
};


// =========================================================
// ESPANHOL
// =========================================================

const ES = {

  simulationMode: "Modo simulación",
  realIntegration: "Integración real",
  machineConnected: "Máquina conectada",
  machineOffline: "Máquina fuera de línea",
  liveTelemetry: "Datos en tiempo real",
  awaitingRealTelemetry: "Esperando telemetría real",
  connectionNotConfigured: "Conexión no configurada",
  simulationGeneratedData: "Datos generados por SteelControl",

  ...EN,

  apiOffline: "API fuera de línea",
  erroApiTexto: "No se pudieron cargar los datos de la máquina.",
  statusAlertaTexto: "La máquina requiere atención.",
  statusManutencaoTexto: "La máquina está en mantenimiento.",
  statusOkTexto: "Operación normal.",
  verificarEnergia: "Verificar carga eléctrica",
  verificarSuperaquecimento: "Verificar sobrecalentamiento",

  manutencaoPreventivaNecessaria: "Mantenimiento preventivo necesario",

  usuario: "Usuario",
  cargo: "Cargo",
  sair: "Salir",
  voltar: "Volver",
  salvar: "Guardar",
  cancelar: "Cancelar",
  editar: "Editar",
  excluir: "Eliminar",
  fechar: "Cerrar",
  buscar: "Buscar",
  carregando: "Cargando...",
  naoInformado: "No informado",

  inicio: "Inicio",
  sobre: "Nosotros",
  recursos: "Recursos",
  seguranca: "Seguridad",
  tecnologia: "Tecnología",
  contato: "Contacto",

  maquinas: "Máquinas",
  producao: "Producción",
  manutencao: "Mantenimiento",
  alertas: "Alertas",
  configuracoes: "Configuración",

  minhaEmpresa: "Mi Empresa",

  entrar: "Entrar",
  entrarSistema: "Entrar al sistema",

  homeTituloPagina:
    "SteelControl | Gestión Industrial Inteligente",

  homePlataformaGestao:
    "Plataforma de gestión industrial",

  homeHeroTituloAntes:
    "Control industrial",

  homeHeroTituloDestaque:
    "inteligente",

  homeHeroTituloDepois:
    "en una sola plataforma.",

  homeHeroDescricao:
    "Monitorea máquinas, producción, mantenimiento, alertas, seguridad y equipos en tiempo real con una solución diseñada para entornos industriales.",

  homeConhecerPlataforma:
    "Conocer la plataforma",

  homeMonitoramentoTempoReal:
    "Monitoreo en tiempo real",

  homeSegurancaEmpresarial:
    "Seguridad empresarial",

  homeGestaoEquipes:
    "Gestión de equipos",

  homeAdministrador:
    "Administrador",

  homeEmpresaExemplo:
    "Empresa Ejemplo",

  homeTemperatura:
    "Temperatura",

  homeProducao:
    "Producción",

  homeCiclos:
    "Ciclos",

  homeEnergia:
    "Energía",

  homeHoje:
    "hoy",

  homeProducaoUltimasHoras:
    "Producción en las últimas horas",

  homeUltimas8Horas:
    "Últimas 8 horas",

  homeAlertasRecentes:
    "Alertas recientes",

  homeTemperaturaAlta:
    "Temperatura alta",

  homeMaquina03:
    "Máquina 03",

  homeManutencaoPreventiva:
    "Mantenimiento preventivo",

  homeMaquina07:
    "Máquina 07",

  homeConsumoElevado:
    "Carga elevada",

  homeMaquina02:
    "Máquina 02",

  homeVerAlertas:
    "Ver todas las alertas",

  homeMonitoramentoContinuo:
    "Monitoreo continuo",

  homeGestaoCentralizada:
    "Gestión centralizada",

  homeDadosOperacionais:
    "Datos operativos",

  homeMultiusuario:
    "Multiusuario",

  homeControleEquipes:
    "Control de equipos",

  homeSobreNos:
    "Sobre nosotros",

  homeSobreTitulo:
    "Tecnología creada para hacer más inteligente la gestión industrial.",

  homeSobreTexto1:
    "SteelControl nació con el objetivo de centralizar información importante de una operación industrial en un único entorno.",

  homeSobreTexto2:
    "Nuestra plataforma reúne monitoreo, producción, mantenimiento, seguridad, equipos e información empresarial, ofreciendo mayor visibilidad de la operación.",

  homeSobreTexto3:
    "La propuesta es permitir que las empresas acompañen sus procesos de forma simple, moderna y preparada para futuras integraciones con automatización industrial.",

  homeInteligenciaIndustrial:
    "Inteligencia industrial",

  homeMonitoramentoMaquinas:
    "Monitoreo de máquinas",

  homeControleProducao:
    "Control de producción",

  homeGestaoManutencao:
    "Gestión de mantenimiento",

  homeSegurancaBiometrica:
    "Seguridad biométrica",

  homeGestaoFuncionarios:
    "Gestión de empleados",

  homeIntegracaoAutomacao:
    "Integración con automatización",

  homeRecursosTitulo:
    "Todo lo que su operación necesita en un solo lugar.",

  homeRecursosTexto:
    "Una plataforma creada para centralizar la información principal de una operación industrial.",

  homeMaquinasTexto:
    "Registra y monitorea equipos, sectores, modelos, estados y datos operativos.",

  homeProducaoTexto:
    "Visualiza indicadores y monitorea la evolución de la productividad.",

  homeManutencaoTexto:
    "Registra mantenimientos preventivos y correctivos y consulta el historial.",

  homeAlertasTexto:
    "Identifica rápidamente situaciones que requieren atención del equipo.",

  homeEquipes:
    "Equipos",

  homeEquipesTexto:
    "Gestiona empleados, cargos, permisos y accesos empresariales.",

  homeReconhecimentoFacial:
    "Reconocimiento facial",

  homeReconhecimentoFacialTexto:
    "Autenticación biométrica integrada para añadir una capa extra de seguridad.",

  homeSegurancaTitulo:
    "Control de acceso preparado para entornos empresariales.",

  homeSegurancaTexto:
    "Cada empleado puede tener su propia cuenta y diferentes niveles de permisos.",

  homeCargosPermissoes:
    "Cargos y permisos",

  homeCargosPermissoesTexto:
    "Control de acceso por función.",

  homeEmpresasSeparadas:
    "Empresas separadas",

  homeEmpresasSeparadasTexto:
    "Datos organizados por empresa.",

  homeTecnologiaTitulo:
    "Tecnología preparada para crecer con la industria.",

  homeNodeTexto:
    "APIs y reglas",

  homePostgresTexto:
    "Base de datos",

  homePrismaTexto:
    "ORM moderno",

  homePythonTexto:
    "Visión computacional",

  homeIoTTexto:
    "Sensores y dispositivos",

  homeRobotica:
    "Robótica",

  homeRoboticaTexto:
    "Integración industrial",

  homePreparadoFuturo:
    "Preparado para el futuro",

  homeFuturoTitulo:
    "Sensores, automatización y robótica industrial.",

  homeFuturoTexto:
    "SteelControl fue diseñado para evolucionar junto con la operación industrial, permitiendo futuras integraciones con sensores, microcontroladores y equipos.",

  homeSensores:
    "Sensores",

  homeAutomacao:
    "Automatización",

  homeCtaTitulo:
    "Más control para su operación. Más información para sus decisiones.",

  homeCtaTexto:
    "Entra en la plataforma y monitorea tu operación industrial en un entorno centralizado y seguro.",

  homeEntrarSteelControl:
    "Entrar en SteelControl",

  homeConhecerMais:
    "Conocer más",

  homePlataforma:
    "Plataforma",

  homeEmpresa:
    "Empresa",

  homeContato:
    "Contacto",

  homeTodosDireitos:
    "Todos los derechos reservados.",

  alterarTema:
    "Cambiar tema",

  abrirMenu:
    "Abrir menú",

  loginAcessoEmpresarial:
    "Acceso empresarial",

  loginTitulo:
    "Accede a tu empresa",

  loginSubtitulo:
    "Entra al entorno industrial de tu organización y gestiona todo con SteelControl.",

  loginConfiancaTitulo:
    "Confía tu operación a SteelControl",

  loginConfiancaTexto:
    "Centraliza máquinas, producción, mantenimiento, alertas, equipos y seguridad en una sola plataforma.",

  emailLabel:
    "Correo electrónico",

  senhaLabel:
    "Contraseña",

  emailPlaceholder:
    "nombre@empresa.com",

  senhaPlaceholder:
    "Introduce tu contraseña",

  loginAcessarEmpresa:
    "Acceder a mi empresa",

  reconhecimentoFacial:
    "Reconocimiento facial",

  loginBiometria:
    "Entrar con biometría",

  loginEmpresaNaoEsta:
    "¿TU EMPRESA TODAVÍA NO ESTÁ AQUÍ?",

  loginLeveIndustria:
    "Lleva tu industria a SteelControl",

  loginCadastroDescricao:
    "Registra tu empresa y obtén un entorno propio para gestionar máquinas, empleados, seguridad, producción y mantenimiento.",

  monitoramentoCentralizado:
    "Monitoreo centralizado",

  gestaoEquipes:
    "Gestión de equipos",

  segurancaBiometrica:
    "Seguridad biométrica",

  cadastrarMinhaEmpresa:
    "Registrar mi empresa",

  novaOrganizacao:
    "Nueva organización",

  cadastrarEmpresaTitulo:
    "Registra tu empresa",

  cadastrarEmpresaSubtitulo:
    "Crea el entorno industrial de tu organización y registra al primer administrador.",

  primeiroAdministrador:
    "Primer administrador",

  primeiroAdministradorTexto:
    "Este usuario tendrá acceso administrativo para configurar tu empresa en SteelControl.",

  informacoesEmpresa:
    "Información de la empresa",

  nomeEmpresa:
    "Nombre de la empresa",

  nomeEmpresaPlaceholder:
    "Ej: SteelTech Industria",

  cnpj:
    "Identificación fiscal",

  administradorEmpresa:
    "Administrador de la empresa",

  nomeAdministrador:
    "Nombre del administrador",

  nomeAdministradorPlaceholder:
    "Tu nombre completo",

  emailCorporativo:
    "Correo corporativo",

  emailCorporativoPlaceholder:
    "admin@empresa.com",

  senhaCadastroPlaceholder:
    "Mínimo 6 caracteres",

  criarMinhaEmpresa:
    "Crear mi empresa",

  voltarLogin:
    "Volver al inicio de sesión",

  ambienteSeguro:
    "Entorno seguro",

  plataformaEmpresarial:
    "Plataforma empresarial",

  loginSideTituloAntes:
    "Tu industria",

  loginSideTituloDestaque:
    "conectada,",

  loginSideTituloDepois:
    "segura e inteligente.",

  loginSideTexto:
    "Tecnología para monitorear tu operación, mejorar procesos y transformar datos industriales en decisiones.",

  monitoramento:
    "Monitoreo",

  gestaoIndustrial:
    "Gestión industrial",

  loginInfoTitulo:
    "Todo el control de tu operación en un solo lugar.",

  loginInfoTexto:
    "Máquinas, registros, temperatura, producción, mantenimiento, alertas, equipos y autenticación integrados en una sola plataforma.",

  loginTecnologiaIndustrial:
    "Tecnología desarrollada para entornos industriales",

  faceTitulo:
    "Reconocimiento facial",

  facePrepareTitulo:
    "Prepárate para el reconocimiento facial",

  facePrepareTexto:
    "Centra tu rostro dentro del óvalo. El reconocimiento ocurre automáticamente.",

  faceAutomatico:
    "Reconocimiento automático — no es necesario pulsar ningún botón.",

  faceTexto:
    "Coloca tu rostro frente a la cámara",

  iniciandoCamera:
    "Iniciando cámara...",

  procurandoRosto:
    "Buscando rostro...",

  olharCamera:
    "Mira directamente a la cámara",

  cameraSomenteAutenticacao:
    "La cámara se utiliza únicamente durante la autenticación.",

  loginSucesso:
    "¡Inicio de sesión exitoso!",

  erroLogin:
    "Correo o contraseña inválidos.",

  erroCampos:
    "Completa todos los campos.",

  dashboardTitulo:
    "Panel de Máquinas Industriales",

  dashboardSubtitulo:
    "Sistema de monitoreo en tiempo real",

  temperatura:
    "Temperatura",

  temperaturaDesc:
    "Temperatura actual de la máquina",

  producaoCard:
    "Producción",

  producaoDesc:
    "Piezas producidas",

  ciclos:
    "Ciclos",

  ciclosDesc:
    "Ciclos ejecutados",

  energia:
    "Energía",

  energiaDesc:
    "Percentual normalizado (0–100%)",

  producaoTempoReal:
    "Producción en tiempo real",

  situacaoMaquina:
    "Estado de la máquina",

  manutencaoResumo:
    "Mantenimiento",

  temperaturaMaquina:
    "Temperatura de la máquina",

  consumoEnergia:
    "Carga eléctrica (%)",

  maquinaSelecionada:
    "Máquina seleccionada",

  maquinaSelecionadaDesc:
    "Vista de la máquina monitoreada por el sistema",

  verDetalhes:
    "Ver detalles",

  producaoMaquina:
    "Producción de la máquina",

  producaoMaquinaDesc:
    "Seguimiento de producción en tiempo real",

  graficoProducao:
    "Gráfico de producción",

  resumoProdutivo:
    "Resumen productivo",

  totalProduzido:
    "Total producido:",

  ciclosExecutados:
    "Ciclos ejecutados:",

  manutencaoDesc:
    "Control de mantenimiento preventivo y correctivo de la máquina",

  ultimaManutencao:
    "Último mantenimiento",

  ultimaManutencaoDesc:
    "Registro más reciente",

  proximaManutencao:
    "Próximo mantenimiento",

  proximaManutencaoDesc:
    "Previsión preventiva",

  situacao:
    "Situación",

  situacaoDesc:
    "Estado actual",

  ciclosManutencaoDesc:
    "Base para revisión",

  cadastrarManutencao:
    "Registrar mantenimiento",

  tipoManutencao:
    "Tipo de mantenimiento",

  selecioneTipo:
    "Selecciona el tipo",

  preventiva:
    "Preventivo",

  corretiva:
    "Correctivo",

  nomeTecnico:
    "Nombre del técnico",

  nomeTecnicoPlaceholder:
    "Introduce el nombre del técnico",

  descricao:
    "Descripción",

  descricaoManutencaoPlaceholder:
    "Describe el servicio realizado",

  salvarManutencao:
    "Guardar mantenimiento",

  historicoManutencoes:
    "Historial de mantenimientos",

  carregandoHistorico:
    "Cargando historial...",

  logsTitulo:
    "Registros de la máquina",

  logsDesc:
    "Historial de eventos generados automáticamente",

  alertasTitulo:
    "Alertas",

  alertasDesc:
    "Eventos que requieren atención",

  nenhumLog:
    "No hay registros.",

  nenhumAlerta:
    "No hay alertas registradas.",

  nenhumaManutencao:
    "No hay mantenimientos registrados.",

  manutencaoSucesso:
    "¡Mantenimiento registrado correctamente!",

  erroCadastrarManutencao:
    "Error al registrar mantenimiento.",

  configDesc:
    "Personaliza el idioma y el tema visual del sistema.",

  idioma:
    "Idioma",

  tema:
    "Tema",

  claro:
    "Claro",

  escuro:
    "Oscuro",

  equipamentosEmpresa:
    "Equipos de tu empresa",

  equipamentosIntro:
    "Registra máquinas, robots industriales y otros equipos de tu operación. SteelControl organiza los datos y monitorea temperatura, producción, ciclos, energía, mantenimiento y alertas.",

  monitoramentoIndustrial:
    "Monitoreo industrial en tiempo real",

  historicoOperacional:
    "Historial operativo",

  manutencaoIntegrada:
    "Mantenimiento integrado",

  equipamentos:
    "Equipos",

  emOperacao:
    "En funcionamiento",

  emManutencao:
    "En mantenimiento",

  comAlerta:
    "Con alertas",

  gestaoEquipamentos:
    "Gestión de equipos",

  cadastrarEquipamento:
    "Registrar nuevo equipo",

  cadastrarEquipamentoTexto:
    "Introduce los datos de identificación. El monitoreo comenzará automáticamente después del registro.",

  novoEquipamento:
    "Nuevo equipo",

  cadastrarQualquerEquipamento:
    "Registra cualquier equipo industrial",

  cadastrarQualquerEquipamentoTexto:
    "Incluidos brazos robóticos, cintas, prensas, tornos, máquinas de corte y equipos personalizados.",

  vaiCadastrarBraco:
    "¿Vas a registrar un brazo robótico?",

  vaiCadastrarBracoTexto:
    "Completa automáticamente un ejemplo y modifica solo los datos de tu equipo.",

  usarModelo:
    "Usar modelo",

  identificacaoEquipamento:
    "Identificación del equipo",

  nomeEquipamento:
    "Nombre del equipo",

  nomeEquipamentoPlaceholder:
    "Ej: Brazo robótico 01",

  setorLabel:
    "Sector",

  setorPlaceholder:
    "Ej: Automatización",

  tipoEquipamento:
    "Tipo de equipo",

  selecionarTipo:
    "Selecciona el tipo",

  bracoRobotico:
    "Brazo robótico",

  roboIndustrial:
    "Robot industrial",

  esteiraIndustrial:
    "Cinta transportadora industrial",

  prensa:
    "Prensa",

  torno:
    "Torno",

  solda:
    "Soldadura",

  corte:
    "Corte",

  embalagem:
    "Embalaje",

  impressora3D:
    "Impresora 3D",

  outro:
    "Otro",

  modeloLabel:
    "Modelo",

  fabricanteLabel:
    "Fabricante",

  codigoLabel:
    "Código / Patrimonio",

  funcaoProcesso:
    "Función en el proceso industrial",

  descricaoEquipamento:
    "Descripción",

  cancelarCadastro:
    "Cancelar",

  cadastrarEquipamentoBotao:
    "Registrar equipo",

  parqueIndustrial:
    "Parque industrial",

  equipamentosCadastrados:
    "Equipos registrados",

  equipamentosCadastradosTexto:
    "Consulta y accede a los equipos de tu empresa.",

  buscarEquipamento:
    "Buscar equipo...",

  todosTipos:
    "Todos los tipos",

  robotica:
    "Robótica",

  esteiras:
    "Cintas",

  prensas:
    "Prensas",

  outros:
    "Otros",

  todosStatus:
    "Todos los estados",

  carregandoEquipamentos:
    "Cargando equipos...",

  fabricante:
    "Fabricante",

  modelo:
    "Modelo",

  codigo:
    "Código",

  setor:
    "Sector",

  tipo:
    "Tipo",

  pecas:
    "piezas",

  situacaoManutencao:
    "Estado de mantenimiento",

  abrirMonitoramento:
    "Abrir monitoreo",

  nenhumEquipamento:
    "No se encontraron equipos",

  nenhumEquipamentoTexto:
    "Registra una máquina o brazo robótico para iniciar el monitoreo industrial.",

  erroCarregarEquipamentos:
    "No se pudieron cargar los equipos",

  erroBackend:
    "Comprueba que el backend de SteelControl esté funcionando.",

  erroCamposEquipamento:
    "Completa todos los datos del equipo.",

  cadastrandoEquipamento:
    "Registrando equipo...",

  equipamentoCadastrado:
    "¡Equipo registrado correctamente! Monitoreo iniciado.",

  erroCadastrarEquipamento:
    "Error al registrar el equipo.",

  erroServidor:
    "Error al conectar con el servidor.",

  ligado:
    "Encendida",

  alertaStatus:
    "Alerta",

  manutencaoStatus:
    "Mantenimiento",

  empresaTitulo:
    "Mi Empresa",

  empresaSubtitulo:
    "Gestiona datos institucionales, ubicación, empleados y seguridad.",

  dadosEmpresa:
    "Datos de la empresa",

  editarDados:
    "Editar datos",

  salvarAlteracoes:
    "Guardar cambios",

  telefone:
    "Teléfono",

  endereco:
    "Dirección",

  numero:
    "Número",

  complemento:
    "Complemento",

  bairro:
    "Barrio",

  cidade:
    "Ciudad",

  estado:
    "Estado",

  pais:
    "País",

  cep:
    "Código postal",

  localizacao:
    "Ubicación",

  abrirMapa:
    "Abrir mapa",

  enderecoNaoCadastrado:
    "Dirección no registrada",

  adicionarLocalizacao:
    "Añade la ubicación de la empresa.",

  funcionarios:
    "Empleados",

  novoFuncionario:
    "Nuevo empleado",

  totalFuncionarios:
    "Empleados",

  totalComFacial:
    "Con reconocimiento facial",

  administradores:
    "Administradores",

  nomeFuncionario:
    "Nombre",

  cargoFuncionario:
    "Cargo",

  criarFuncionario:
    "Registrar empleado",

  facialAtiva:
    "Reconocimiento facial activo",

  facialNaoCadastrada:
    "Reconocimiento facial no registrado",

  cadastrarFacial:
    "Registrar reconocimiento facial",

  adicionarFacial:
    "Añadir muestra facial",

  removerFaciais:
    "Eliminar muestras faciales",

  cargoAdministrador:
    "Administrador",

  cargoSupervisor:
    "Supervisor",

  cargoTecnico:
    "Técnico",

  cargoOperador:
    "Operador",

  cargoVisitante:
    "Visitante"
};


// =========================================================
// FRANCÊS
// =========================================================

const FR = {

  simulationMode: "Mode simulation",
  realIntegration: "Intégration réelle",
  machineConnected: "Machine connectée",
  machineOffline: "Machine hors ligne",
  liveTelemetry: "Données en temps réel",
  awaitingRealTelemetry: "En attente de télémétrie réelle",
  connectionNotConfigured: "Connexion non configurée",
  simulationGeneratedData: "Données générées par SteelControl",

  ...EN,

  apiOffline: "API hors ligne",
  erroApiTexto: "Impossible de charger les données de la machine.",
  statusAlertaTexto: "La machine nécessite une attention.",
  statusManutencaoTexto: "La machine est en maintenance.",
  statusOkTexto: "Fonctionnement normal.",
  verificarEnergia: "Vérifier la charge électrique",
  verificarSuperaquecimento: "Vérifier la surchauffe",

  manutencaoPreventivaNecessaria: "Maintenance préventive nécessaire",

  usuario: "Utilisateur",
  cargo: "Rôle",
  sair: "Déconnexion",
  voltar: "Retour",
  salvar: "Enregistrer",
  cancelar: "Annuler",
  editar: "Modifier",
  excluir: "Supprimer",
  fechar: "Fermer",
  buscar: "Rechercher",
  carregando: "Chargement...",

  inicio: "Accueil",
  sobre: "À propos",
  recursos: "Fonctionnalités",
  seguranca: "Sécurité",
  tecnologia: "Technologie",
  contato: "Contact",

  maquinas: "Machines",
  producao: "Production",
  manutencao: "Maintenance",
  logs: "Journaux",
  alertas: "Alertes",
  configuracoes: "Paramètres",

  minhaEmpresa: "Mon entreprise",

  entrar: "Connexion",
  entrarSistema: "Se connecter",

  homeTituloPagina:
    "SteelControl | Gestion Industrielle Intelligente",

  homePlataformaGestao:
    "Plateforme de gestion industrielle",

  homeHeroTituloAntes:
    "Contrôle industriel",

  homeHeroTituloDestaque:
    "intelligent",

  homeHeroTituloDepois:
    "sur une seule plateforme.",

  homeHeroDescricao:
    "Surveillez les machines, la production, la maintenance, les alertes, la sécurité et les équipes en temps réel.",

  homeConhecerPlataforma:
    "Découvrir la plateforme",

  homeMonitoramentoTempoReal:
    "Surveillance en temps réel",

  homeSegurancaEmpresarial:
    "Sécurité d'entreprise",

  homeGestaoEquipes:
    "Gestion des équipes",

  homeTemperatura:
    "Température",

  homeProducao:
    "Production",

  homeCiclos:
    "Cycles",

  homeEnergia:
    "Énergie",

  homeHoje:
    "aujourd'hui",

  homeProducaoUltimasHoras:
    "Production des dernières heures",

  homeUltimas8Horas:
    "8 dernières heures",

  homeAlertasRecentes:
    "Alertes récentes",

  homeTemperaturaAlta:
    "Température élevée",

  homeManutencaoPreventiva:
    "Maintenance préventive",

  homeConsumoElevado:
    "Consommation élevée",

  homeVerAlertas:
    "Voir toutes les alertes",

  homeMonitoramentoContinuo:
    "Surveillance continue",

  homeGestaoCentralizada:
    "Gestion centralisée",

  homeDadosOperacionais:
    "Données opérationnelles",

  homeMultiusuario:
    "Multi-utilisateur",

  homeControleEquipes:
    "Contrôle des équipes",

  homeSobreNos:
    "À propos de nous",

  homeSobreTitulo:
    "Une technologie créée pour rendre la gestion industrielle plus intelligente.",

  homeInteligenciaIndustrial:
    "Intelligence industrielle",

  homeMonitoramentoMaquinas:
    "Surveillance des machines",

  homeControleProducao:
    "Contrôle de production",

  homeGestaoManutencao:
    "Gestion de la maintenance",

  homeSegurancaBiometrica:
    "Sécurité biométrique",

  homeGestaoFuncionarios:
    "Gestion des employés",

  homeIntegracaoAutomacao:
    "Intégration de l'automatisation",

  homeRecursosTitulo:
    "Tout ce dont votre activité a besoin au même endroit.",

  homeEquipes:
    "Équipes",

  homeReconhecimentoFacial:
    "Reconnaissance faciale",

  homeSegurancaTitulo:
    "Un contrôle d'accès conçu pour les environnements professionnels.",

  homeCargosPermissoes:
    "Rôles et autorisations",

  homeEmpresasSeparadas:
    "Entreprises séparées",

  homeTecnologiaTitulo:
    "Une technologie prête à évoluer avec l'industrie.",

  homePostgresTexto:
    "Base de données",

  homePythonTexto:
    "Vision par ordinateur",

  homeIoTTexto:
    "Capteurs et appareils",

  homeRobotica:
    "Robotique",

  homeRoboticaTexto:
    "Intégration industrielle",

  homePreparadoFuturo:
    "Prêt pour l'avenir",

  homeFuturoTitulo:
    "Capteurs, automatisation et robotique industrielle.",

  homeSensores:
    "Capteurs",

  homeAutomacao:
    "Automatisation",

  homeCtaTitulo:
    "Plus de contrôle pour votre activité. Plus d'informations pour vos décisions.",

  homeEntrarSteelControl:
    "Entrer dans SteelControl",

  homeConhecerMais:
    "En savoir plus",

  homePlataforma:
    "Plateforme",

  homeEmpresa:
    "Entreprise",

  homeContato:
    "Contact",

  homeTodosDireitos:
    "Tous droits réservés.",

  loginAcessoEmpresarial:
    "Accès entreprise",

  loginTitulo:
    "Accédez à votre entreprise",

  loginSubtitulo:
    "Accédez à l'environnement industriel de votre organisation avec SteelControl.",

  loginConfiancaTitulo:
    "Confiez votre activité à SteelControl",

  emailLabel:
    "E-mail",

  senhaLabel:
    "Mot de passe",

  senhaPlaceholder:
    "Saisissez votre mot de passe",

  loginAcessarEmpresa:
    "Accéder à mon entreprise",

  reconhecimentoFacial:
    "Reconnaissance faciale",

  loginBiometria:
    "Connexion biométrique",

  loginEmpresaNaoEsta:
    "VOTRE ENTREPRISE N'EST PAS ENCORE ICI ?",

  loginLeveIndustria:
    "Connectez votre industrie à SteelControl",

  cadastrarMinhaEmpresa:
    "Enregistrer mon entreprise",

  novaOrganizacao:
    "Nouvelle organisation",

  cadastrarEmpresaTitulo:
    "Enregistrez votre entreprise",

  primeiroAdministrador:
    "Premier administrateur",

  informacoesEmpresa:
    "Informations sur l'entreprise",

  nomeEmpresa:
    "Nom de l'entreprise",

  administradorEmpresa:
    "Administrateur de l'entreprise",

  nomeAdministrador:
    "Nom de l'administrateur",

  emailCorporativo:
    "E-mail professionnel",

  criarMinhaEmpresa:
    "Créer mon entreprise",

  voltarLogin:
    "Retour à la connexion",

  ambienteSeguro:
    "Environnement sécurisé",

  plataformaEmpresarial:
    "Plateforme professionnelle",

  loginSideTituloAntes:
    "Votre industrie",

  loginSideTituloDestaque:
    "connectée,",

  loginSideTituloDepois:
    "sécurisée et intelligente.",

  monitoramento:
    "Surveillance",

  gestaoIndustrial:
    "Gestion industrielle",

  faceTitulo:
    "Reconnaissance faciale",

  facePrepareTitulo:
    "Préparez-vous à la reconnaissance faciale",

  facePrepareTexto:
    "Centrez votre visage dans l’ovale. La reconnaissance se fait automatiquement.",

  faceAutomatico:
    "Reconnaissance automatique — aucun bouton n’est nécessaire.",

  faceTexto:
    "Placez votre visage devant la caméra",

  iniciandoCamera:
    "Démarrage de la caméra...",

  procurandoRosto:
    "Recherche du visage...",

  olharCamera:
    "Regardez directement la caméra",

  loginSucesso:
    "Connexion réussie !",

  erroLogin:
    "E-mail ou mot de passe incorrect.",

  erroCampos:
    "Remplissez tous les champs.",

  dashboardTitulo:
    "Tableau de bord des machines industrielles",

  dashboardSubtitulo:
    "Système de surveillance en temps réel",

  temperatura:
    "Température",

  producaoCard:
    "Production",

  ciclos:
    "Cycles",

  energia:
    "Énergie",

  producaoTempoReal:
    "Production en temps réel",

  situacaoMaquina:
    "État de la machine",

  consumoEnergia:
    "Charge électrique (%)",

  maquinaSelecionada:
    "Machine sélectionnée",

  verDetalhes:
    "Voir les détails",

  producaoMaquina:
    "Production de la machine",

  graficoProducao:
    "Graphique de production",

  resumoProdutivo:
    "Résumé de production",

  totalProduzido:
    "Total produit :",

  ciclosExecutados:
    "Cycles exécutés :",

  ultimaManutencao:
    "Dernière maintenance",

  proximaManutencao:
    "Prochaine maintenance",

  situacao:
    "Situation",

  cadastrarManutencao:
    "Enregistrer une maintenance",

  tipoManutencao:
    "Type de maintenance",

  selecioneTipo:
    "Sélectionnez le type",

  preventiva:
    "Préventive",

  corretiva:
    "Corrective",

  nomeTecnico:
    "Nom du technicien",

  descricao:
    "Description",

  salvarManutencao:
    "Enregistrer la maintenance",

  historicoManutencoes:
    "Historique des maintenances",

  logsTitulo:
    "Journaux de la machine",

  alertasTitulo:
    "Alertes",

  idioma:
    "Langue",

  tema:
    "Thème",

  claro:
    "Clair",

  escuro:
    "Sombre",

  equipamentosEmpresa:
    "Équipements de votre entreprise",

  monitoramentoIndustrial:
    "Surveillance industrielle en temps réel",

  equipamentos:
    "Équipements",

  emOperacao:
    "En fonctionnement",

  emManutencao:
    "En maintenance",

  comAlerta:
    "Avec alertes",

  gestaoEquipamentos:
    "Gestion des équipements",

  cadastrarEquipamento:
    "Ajouter un nouvel équipement",

  novoEquipamento:
    "Nouvel équipement",

  cadastrarQualquerEquipamento:
    "Enregistrez tout équipement industriel",

  vaiCadastrarBraco:
    "Vous enregistrez un bras robotisé ?",

  usarModelo:
    "Utiliser le modèle",

  identificacaoEquipamento:
    "Identification de l'équipement",

  nomeEquipamento:
    "Nom de l'équipement",

  setorLabel:
    "Secteur",

  tipoEquipamento:
    "Type d'équipement",

  selecionarTipo:
    "Sélectionnez le type",

  bracoRobotico:
    "Bras robotisé",

  roboIndustrial:
    "Robot industriel",

  esteiraIndustrial:
    "Convoyeur industriel",

  prensa:
    "Presse",

  torno:
    "Tour",

  solda:
    "Soudage",

  corte:
    "Découpe",

  embalagem:
    "Emballage",

  impressora3D:
    "Imprimante 3D",

  outro:
    "Autre",

  modeloLabel:
    "Modèle",

  fabricanteLabel:
    "Fabricant",

  codigoLabel:
    "Code / Actif",

  funcaoProcesso:
    "Fonction dans le processus industriel",

  descricaoEquipamento:
    "Description",

  cadastrarEquipamentoBotao:
    "Enregistrer l'équipement",

  parqueIndustrial:
    "Parc industriel",

  equipamentosCadastrados:
    "Équipements enregistrés",

  buscarEquipamento:
    "Rechercher un équipement...",

  todosTipos:
    "Tous les types",

  robotica:
    "Robotique",

  esteiras:
    "Convoyeurs",

  prensas:
    "Presses",

  outros:
    "Autres",

  todosStatus:
    "Tous les statuts",

  carregandoEquipamentos:
    "Chargement des équipements...",

  fabricante:
    "Fabricant",

  modelo:
    "Modèle",

  codigo:
    "Code",

  setor:
    "Secteur",

  tipo:
    "Type",

  pecas:
    "pièces",

  situacaoManutencao:
    "État de maintenance",

  abrirMonitoramento:
    "Ouvrir la surveillance",

  nenhumEquipamento:
    "Aucun équipement trouvé",

  erroServidor:
    "Erreur de connexion au serveur.",

  empresaTitulo:
    "Mon entreprise",

  empresaSubtitulo:
    "Gérez les informations, la localisation, les employés et la sécurité de l'entreprise.",

  dadosEmpresa:
    "Informations de l'entreprise",

  editarDados:
    "Modifier les informations",

  salvarAlteracoes:
    "Enregistrer les modifications",

  telefone:
    "Téléphone",

  endereco:
    "Adresse",

  numero:
    "Numéro",

  complemento:
    "Complément",

  bairro:
    "Quartier",

  cidade:
    "Ville",

  estado:
    "État / Région",

  pais:
    "Pays",

  cep:
    "Code postal",

  localizacao:
    "Localisation",

  abrirMapa:
    "Ouvrir la carte",

  funcionarios:
    "Employés",

  novoFuncionario:
    "Nouvel employé",

  totalFuncionarios:
    "Employés",

  totalComFacial:
    "Avec reconnaissance faciale",

  administradores:
    "Administrateurs",

  nomeFuncionario:
    "Nom",

  cargoFuncionario:
    "Rôle",

  criarFuncionario:
    "Enregistrer l'employé",

  facialAtiva:
    "Reconnaissance faciale active",

  facialNaoCadastrada:
    "Reconnaissance faciale non enregistrée",

  cadastrarFacial:
    "Enregistrer le visage",

  adicionarFacial:
    "Ajouter un visage",

  removerFaciais:
    "Supprimer les visages",

  cargoAdministrador:
    "Administrateur",

  cargoSupervisor:
    "Superviseur",

  cargoTecnico:
    "Technicien",

  cargoOperador:
    "Opérateur",

  cargoVisitante:
    "Visiteur"
};


// =========================================================
// ALEMÃO
// =========================================================

const DE = {

  simulationMode: "Simulationsmodus",
  realIntegration: "Reale Integration",
  machineConnected: "Maschine verbunden",
  machineOffline: "Maschine offline",
  liveTelemetry: "Echtzeitdaten",
  awaitingRealTelemetry: "Warte auf reale Telemetrie",
  connectionNotConfigured: "Verbindung nicht konfiguriert",
  simulationGeneratedData: "Von SteelControl erzeugte Daten",

  ...EN,

  apiOffline: "API offline",
  erroApiTexto: "Maschinendaten konnten nicht geladen werden.",
  statusAlertaTexto: "Die Maschine erfordert Aufmerksamkeit.",
  statusManutencaoTexto: "Die Maschine wird gewartet.",
  statusOkTexto: "Normalbetrieb.",
  verificarEnergia: "Elektrische Last prüfen",
  verificarSuperaquecimento: "Überhitzung prüfen",

  manutencaoPreventivaNecessaria: "Vorbeugende Wartung erforderlich",

  usuario: "Benutzer",
  cargo: "Rolle",
  sair: "Abmelden",
  voltar: "Zurück",
  salvar: "Speichern",
  cancelar: "Abbrechen",
  editar: "Bearbeiten",
  excluir: "Löschen",
  fechar: "Schließen",
  buscar: "Suchen",
  carregando: "Wird geladen...",

  inicio: "Startseite",
  sobre: "Über uns",
  recursos: "Funktionen",
  seguranca: "Sicherheit",
  tecnologia: "Technologie",
  contato: "Kontakt",

  maquinas: "Maschinen",
  producao: "Produktion",
  manutencao: "Wartung",
  logs: "Protokolle",
  alertas: "Warnungen",
  configuracoes: "Einstellungen",

  minhaEmpresa: "Mein Unternehmen",

  entrar: "Anmelden",
  entrarSistema: "Anmelden",

  homeTituloPagina:
    "SteelControl | Intelligentes Industriemanagement",

  homePlataformaGestao:
    "Industrielle Managementplattform",

  homeHeroTituloAntes:
    "Industrielle Steuerung",

  homeHeroTituloDestaque:
    "intelligent",

  homeHeroTituloDepois:
    "auf einer einzigen Plattform.",

  homeHeroDescricao:
    "Überwachen Sie Maschinen, Produktion, Wartung, Warnungen, Sicherheit und Teams in Echtzeit.",

  homeConhecerPlataforma:
    "Plattform entdecken",

  homeMonitoramentoTempoReal:
    "Echtzeitüberwachung",

  homeSegurancaEmpresarial:
    "Unternehmenssicherheit",

  homeGestaoEquipes:
    "Teamverwaltung",

  homeAdministrador:
    "Administrator",

  homeEmpresaExemplo:
    "Beispielunternehmen",

  homeTemperatura:
    "Temperatur",

  homeProducao:
    "Produktion",

  homeCiclos:
    "Zyklen",

  homeEnergia:
    "Energie",

  homeHoje:
    "heute",

  homeProducaoUltimasHoras:
    "Produktion der letzten Stunden",

  homeUltimas8Horas:
    "Letzte 8 Stunden",

  homeAlertasRecentes:
    "Aktuelle Warnungen",

  homeTemperaturaAlta:
    "Hohe Temperatur",

  homeManutencaoPreventiva:
    "Vorbeugende Wartung",

  homeConsumoElevado:
    "Hoher Verbrauch",

  homeVerAlertas:
    "Alle Warnungen anzeigen",

  homeMonitoramentoContinuo:
    "Kontinuierliche Überwachung",

  homeGestaoCentralizada:
    "Zentralisierte Verwaltung",

  homeDadosOperacionais:
    "Betriebsdaten",

  homeMultiusuario:
    "Mehrbenutzer",

  homeControleEquipes:
    "Teamsteuerung",

  homeSobreNos:
    "Über uns",

  homeSobreTitulo:
    "Technologie für ein intelligenteres Industriemanagement.",

  homeInteligenciaIndustrial:
    "Industrielle Intelligenz",

  homeMonitoramentoMaquinas:
    "Maschinenüberwachung",

  homeControleProducao:
    "Produktionskontrolle",

  homeGestaoManutencao:
    "Wartungsmanagement",

  homeSegurancaBiometrica:
    "Biometrische Sicherheit",

  homeGestaoFuncionarios:
    "Mitarbeiterverwaltung",

  homeIntegracaoAutomacao:
    "Automatisierungsintegration",

  homeRecursosTitulo:
    "Alles, was Ihr Betrieb braucht, an einem Ort.",

  homeEquipes:
    "Teams",

  homeReconhecimentoFacial:
    "Gesichtserkennung",

  homeSegurancaTitulo:
    "Zugriffskontrolle für Unternehmensumgebungen.",

  homeCargosPermissoes:
    "Rollen und Berechtigungen",

  homeEmpresasSeparadas:
    "Getrennte Unternehmen",

  homeTecnologiaTitulo:
    "Technologie, die mit der Industrie wächst.",

  homePostgresTexto:
    "Datenbank",

  homePythonTexto:
    "Computer Vision",

  homeIoTTexto:
    "Sensoren und Geräte",

  homeRobotica:
    "Robotik",

  homeRoboticaTexto:
    "Industrielle Integration",

  homePreparadoFuturo:
    "Bereit für die Zukunft",

  homeFuturoTitulo:
    "Sensoren, Automatisierung und Industrierobotik.",

  homeSensores:
    "Sensoren",

  homeAutomacao:
    "Automatisierung",

  homeCtaTitulo:
    "Mehr Kontrolle für Ihren Betrieb. Mehr Informationen für Ihre Entscheidungen.",

  homeEntrarSteelControl:
    "SteelControl öffnen",

  homeConhecerMais:
    "Mehr erfahren",

  homePlataforma:
    "Plattform",

  homeEmpresa:
    "Unternehmen",

  homeContato:
    "Kontakt",

  homeTodosDireitos:
    "Alle Rechte vorbehalten.",

  loginAcessoEmpresarial:
    "Unternehmenszugang",

  loginTitulo:
    "Auf Ihr Unternehmen zugreifen",

  loginSubtitulo:
    "Öffnen Sie die industrielle Umgebung Ihres Unternehmens mit SteelControl.",

  loginConfiancaTitulo:
    "Vertrauen Sie Ihren Betrieb SteelControl an",

  emailLabel:
    "E-Mail",

  senhaLabel:
    "Passwort",

  senhaPlaceholder:
    "Geben Sie Ihr Passwort ein",

  loginAcessarEmpresa:
    "Auf mein Unternehmen zugreifen",

  reconhecimentoFacial:
    "Gesichtserkennung",

  loginBiometria:
    "Mit Biometrie anmelden",

  loginEmpresaNaoEsta:
    "IST IHR UNTERNEHMEN NOCH NICHT HIER?",

  loginLeveIndustria:
    "Bringen Sie Ihre Industrie zu SteelControl",

  cadastrarMinhaEmpresa:
    "Mein Unternehmen registrieren",

  cadastrarEmpresaTitulo:
    "Unternehmen registrieren",

  primeiroAdministrador:
    "Erster Administrator",

  informacoesEmpresa:
    "Unternehmensinformationen",

  nomeEmpresa:
    "Unternehmensname",

  administradorEmpresa:
    "Unternehmensadministrator",

  nomeAdministrador:
    "Name des Administrators",

  emailCorporativo:
    "Geschäftliche E-Mail",

  criarMinhaEmpresa:
    "Mein Unternehmen erstellen",

  voltarLogin:
    "Zurück zur Anmeldung",

  ambienteSeguro:
    "Sichere Umgebung",

  plataformaEmpresarial:
    "Unternehmensplattform",

  loginSideTituloAntes:
    "Ihre Industrie",

  loginSideTituloDestaque:
    "vernetzt,",

  loginSideTituloDepois:
    "sicher und intelligent.",

  monitoramento:
    "Überwachung",

  gestaoIndustrial:
    "Industriemanagement",

  faceTitulo:
    "Gesichtserkennung",

  facePrepareTitulo:
    "Bereiten Sie sich auf die Gesichtserkennung vor",

  facePrepareTexto:
    "Zentrieren Sie Ihr Gesicht im Oval. Die Erkennung erfolgt automatisch.",

  faceAutomatico:
    "Automatische Erkennung — Sie müssen keine Taste drücken.",

  faceTexto:
    "Positionieren Sie Ihr Gesicht vor der Kamera",

  iniciandoCamera:
    "Kamera wird gestartet...",

  procurandoRosto:
    "Gesicht wird gesucht...",

  olharCamera:
    "Schauen Sie direkt in die Kamera",

  loginSucesso:
    "Anmeldung erfolgreich!",

  erroLogin:
    "Ungültige E-Mail oder Passwort.",

  erroCampos:
    "Füllen Sie alle Felder aus.",

  dashboardTitulo:
    "Dashboard für Industriemaschinen",

  dashboardSubtitulo:
    "Echtzeit-Überwachungssystem",

  temperatura:
    "Temperatur",

  producaoCard:
    "Produktion",

  ciclos:
    "Zyklen",

  energia:
    "Energie",

  producaoTempoReal:
    "Produktion in Echtzeit",

  situacaoMaquina:
    "Maschinenstatus",

  consumoEnergia:
    "Elektrische Last (%)",

  maquinaSelecionada:
    "Ausgewählte Maschine",

  verDetalhes:
    "Details anzeigen",

  producaoMaquina:
    "Maschinenproduktion",

  graficoProducao:
    "Produktionsdiagramm",

  resumoProdutivo:
    "Produktionsübersicht",

  totalProduzido:
    "Gesamt produziert:",

  ciclosExecutados:
    "Ausgeführte Zyklen:",

  ultimaManutencao:
    "Letzte Wartung",

  proximaManutencao:
    "Nächste Wartung",

  situacao:
    "Situation",

  cadastrarManutencao:
    "Wartung erfassen",

  tipoManutencao:
    "Wartungsart",

  selecioneTipo:
    "Typ auswählen",

  preventiva:
    "Vorbeugend",

  corretiva:
    "Korrektiv",

  nomeTecnico:
    "Name des Technikers",

  descricao:
    "Beschreibung",

  salvarManutencao:
    "Wartung speichern",

  historicoManutencoes:
    "Wartungsverlauf",

  logsTitulo:
    "Maschinenprotokolle",

  alertasTitulo:
    "Warnungen",

  idioma:
    "Sprache",

  tema:
    "Design",

  claro:
    "Hell",

  escuro:
    "Dunkel",

  equipamentosEmpresa:
    "Ausrüstung Ihres Unternehmens",

  monitoramentoIndustrial:
    "Industrielle Echtzeitüberwachung",

  equipamentos:
    "Ausrüstung",

  emOperacao:
    "In Betrieb",

  emManutencao:
    "In Wartung",

  comAlerta:
    "Mit Warnungen",

  gestaoEquipamentos:
    "Geräteverwaltung",

  cadastrarEquipamento:
    "Neue Ausrüstung registrieren",

  novoEquipamento:
    "Neue Ausrüstung",

  cadastrarQualquerEquipamento:
    "Industrielle Ausrüstung registrieren",

  vaiCadastrarBraco:
    "Registrieren Sie einen Roboterarm?",

  usarModelo:
    "Vorlage verwenden",

  identificacaoEquipamento:
    "Geräteidentifikation",

  nomeEquipamento:
    "Gerätename",

  setorLabel:
    "Bereich",

  tipoEquipamento:
    "Gerätetyp",

  selecionarTipo:
    "Typ auswählen",

  bracoRobotico:
    "Roboterarm",

  roboIndustrial:
    "Industrieroboter",

  esteiraIndustrial:
    "Industrieförderband",

  prensa:
    "Presse",

  torno:
    "Drehmaschine",

  solda:
    "Schweißen",

  corte:
    "Schneiden",

  embalagem:
    "Verpackung",

  impressora3D:
    "3D-Drucker",

  outro:
    "Andere",

  modeloLabel:
    "Modell",

  fabricanteLabel:
    "Hersteller",

  codigoLabel:
    "Code / Inventar",

  funcaoProcesso:
    "Funktion im Industrieprozess",

  descricaoEquipamento:
    "Beschreibung",

  cadastrarEquipamentoBotao:
    "Ausrüstung registrieren",

  parqueIndustrial:
    "Industriepark",

  equipamentosCadastrados:
    "Registrierte Ausrüstung",

  buscarEquipamento:
    "Ausrüstung suchen...",

  todosTipos:
    "Alle Typen",

  robotica:
    "Robotik",

  esteiras:
    "Förderbänder",

  prensas:
    "Pressen",

  outros:
    "Andere",

  todosStatus:
    "Alle Status",

  carregandoEquipamentos:
    "Ausrüstung wird geladen...",

  fabricante:
    "Hersteller",

  modelo:
    "Modell",

  codigo:
    "Code",

  setor:
    "Bereich",

  tipo:
    "Typ",

  pecas:
    "Teile",

  situacaoManutencao:
    "Wartungsstatus",

  abrirMonitoramento:
    "Überwachung öffnen",

  nenhumEquipamento:
    "Keine Ausrüstung gefunden",

  erroServidor:
    "Fehler bei der Verbindung zum Server.",

  empresaTitulo:
    "Mein Unternehmen",

  dadosEmpresa:
    "Unternehmensdaten",

  editarDados:
    "Daten bearbeiten",

  salvarAlteracoes:
    "Änderungen speichern",

  telefone:
    "Telefon",

  endereco:
    "Adresse",

  numero:
    "Nummer",

  complemento:
    "Zusatz",

  bairro:
    "Bezirk",

  cidade:
    "Stadt",

  estado:
    "Bundesland",

  pais:
    "Land",

  cep:
    "Postleitzahl",

  localizacao:
    "Standort",

  abrirMapa:
    "Karte öffnen",

  funcionarios:
    "Mitarbeiter",

  novoFuncionario:
    "Neuer Mitarbeiter",

  totalFuncionarios:
    "Mitarbeiter",

  totalComFacial:
    "Mit Gesichtserkennung",

  administradores:
    "Administratoren",

  nomeFuncionario:
    "Name",

  cargoFuncionario:
    "Rolle",

  criarFuncionario:
    "Mitarbeiter registrieren",

  facialAtiva:
    "Gesichtserkennung aktiv",

  facialNaoCadastrada:
    "Gesichtserkennung nicht registriert",

  cadastrarFacial:
    "Gesicht registrieren",

  adicionarFacial:
    "Gesicht hinzufügen",

  removerFaciais:
    "Gesichter entfernen",

  cargoAdministrador:
    "Administrator",

  cargoSupervisor:
    "Supervisor",

  cargoTecnico:
    "Techniker",

  cargoOperador:
    "Bediener",

  cargoVisitante:
    "Besucher"
};


// =========================================================
// ITALIANO
// =========================================================

const IT = {

  simulationMode: "Modalità simulazione",
  realIntegration: "Integrazione reale",
  machineConnected: "Macchina connessa",
  machineOffline: "Macchina offline",
  liveTelemetry: "Dati in tempo reale",
  awaitingRealTelemetry: "In attesa della telemetria reale",
  connectionNotConfigured: "Connessione non configurata",
  simulationGeneratedData: "Dati generati da SteelControl",

  ...EN,

  apiOffline: "API offline",
  erroApiTexto: "Impossibile caricare i dati della macchina.",
  statusAlertaTexto: "La macchina richiede attenzione.",
  statusManutencaoTexto: "La macchina è in manutenzione.",
  statusOkTexto: "Funzionamento normale.",
  verificarEnergia: "Verificare il carico elettrico",
  verificarSuperaquecimento: "Verificare il surriscaldamento",

  manutencaoPreventivaNecessaria: "Manutenzione preventiva necessaria",

  usuario: "Utente",
  cargo: "Ruolo",
  sair: "Esci",
  voltar: "Indietro",
  salvar: "Salva",
  cancelar: "Annulla",
  editar: "Modifica",
  excluir: "Elimina",
  fechar: "Chiudi",
  buscar: "Cerca",
  carregando: "Caricamento...",

  inicio: "Home",
  sobre: "Chi siamo",
  recursos: "Funzionalità",
  seguranca: "Sicurezza",
  tecnologia: "Tecnologia",
  contato: "Contatto",

  maquinas: "Macchine",
  producao: "Produzione",
  manutencao: "Manutenzione",
  logs: "Registri",
  alertas: "Avvisi",
  configuracoes: "Impostazioni",

  minhaEmpresa: "La mia azienda",

  entrar: "Accedi",
  entrarSistema: "Accedi",

  homeTituloPagina:
    "SteelControl | Gestione Industriale Intelligente",

  homePlataformaGestao:
    "Piattaforma di gestione industriale",

  homeHeroTituloAntes:
    "Controllo industriale",

  homeHeroTituloDestaque:
    "intelligente",

  homeHeroTituloDepois:
    "in un'unica piattaforma.",

  homeHeroDescricao:
    "Monitora macchine, produzione, manutenzione, avvisi, sicurezza e team in tempo reale.",

  homeConhecerPlataforma:
    "Scopri la piattaforma",

  homeMonitoramentoTempoReal:
    "Monitoraggio in tempo reale",

  homeSegurancaEmpresarial:
    "Sicurezza aziendale",

  homeGestaoEquipes:
    "Gestione dei team",

  homeAdministrador:
    "Amministratore",

  homeEmpresaExemplo:
    "Azienda Esempio",

  homeTemperatura:
    "Temperatura",

  homeProducao:
    "Produzione",

  homeCiclos:
    "Cicli",

  homeEnergia:
    "Energia",

  homeHoje:
    "oggi",

  homeProducaoUltimasHoras:
    "Produzione nelle ultime ore",

  homeUltimas8Horas:
    "Ultime 8 ore",

  homeAlertasRecentes:
    "Avvisi recenti",

  homeTemperaturaAlta:
    "Temperatura elevata",

  homeManutencaoPreventiva:
    "Manutenzione preventiva",

  homeConsumoElevado:
    "Consumo elevato",

  homeVerAlertas:
    "Visualizza tutti gli avvisi",

  homeMonitoramentoContinuo:
    "Monitoraggio continuo",

  homeGestaoCentralizada:
    "Gestione centralizzata",

  homeDadosOperacionais:
    "Dati operativi",

  homeMultiusuario:
    "Multiutente",

  homeControleEquipes:
    "Controllo dei team",

  homeSobreNos:
    "Chi siamo",

  homeSobreTitulo:
    "Tecnologia creata per rendere più intelligente la gestione industriale.",

  homeInteligenciaIndustrial:
    "Intelligenza industriale",

  homeMonitoramentoMaquinas:
    "Monitoraggio delle macchine",

  homeControleProducao:
    "Controllo della produzione",

  homeGestaoManutencao:
    "Gestione della manutenzione",

  homeSegurancaBiometrica:
    "Sicurezza biometrica",

  homeGestaoFuncionarios:
    "Gestione dei dipendenti",

  homeIntegracaoAutomacao:
    "Integrazione dell'automazione",

  homeRecursosTitulo:
    "Tutto ciò che serve alla tua attività in un unico posto.",

  homeEquipes:
    "Team",

  homeReconhecimentoFacial:
    "Riconoscimento facciale",

  homeSegurancaTitulo:
    "Controllo degli accessi pensato per gli ambienti aziendali.",

  homeCargosPermissoes:
    "Ruoli e autorizzazioni",

  homeEmpresasSeparadas:
    "Aziende separate",

  homeTecnologiaTitulo:
    "Tecnologia pronta a crescere con l'industria.",

  homePostgresTexto:
    "Database",

  homePythonTexto:
    "Visione artificiale",

  homeIoTTexto:
    "Sensori e dispositivi",

  homeRobotica:
    "Robotica",

  homeRoboticaTexto:
    "Integrazione industriale",

  homePreparadoFuturo:
    "Pronto per il futuro",

  homeFuturoTitulo:
    "Sensori, automazione e robotica industriale.",

  homeSensores:
    "Sensori",

  homeAutomacao:
    "Automazione",

  homeCtaTitulo:
    "Più controllo per la tua attività. Più informazioni per le tue decisioni.",

  homeEntrarSteelControl:
    "Entra in SteelControl",

  homeConhecerMais:
    "Scopri di più",

  homePlataforma:
    "Piattaforma",

  homeEmpresa:
    "Azienda",

  homeContato:
    "Contatto",

  homeTodosDireitos:
    "Tutti i diritti riservati.",

  loginAcessoEmpresarial:
    "Accesso aziendale",

  loginTitulo:
    "Accedi alla tua azienda",

  loginSubtitulo:
    "Accedi all'ambiente industriale della tua organizzazione con SteelControl.",

  loginConfiancaTitulo:
    "Affida la tua attività a SteelControl",

  emailLabel:
    "E-mail",

  senhaLabel:
    "Password",

  senhaPlaceholder:
    "Inserisci la password",

  loginAcessarEmpresa:
    "Accedi alla mia azienda",

  reconhecimentoFacial:
    "Riconoscimento facciale",

  loginBiometria:
    "Accedi con biometria",

  loginEmpresaNaoEsta:
    "LA TUA AZIENDA NON È ANCORA QUI?",

  loginLeveIndustria:
    "Porta la tua industria su SteelControl",

  cadastrarMinhaEmpresa:
    "Registra la mia azienda",

  cadastrarEmpresaTitulo:
    "Registra la tua azienda",

  primeiroAdministrador:
    "Primo amministratore",

  informacoesEmpresa:
    "Informazioni aziendali",

  nomeEmpresa:
    "Nome dell'azienda",

  administradorEmpresa:
    "Amministratore aziendale",

  nomeAdministrador:
    "Nome dell'amministratore",

  emailCorporativo:
    "E-mail aziendale",

  criarMinhaEmpresa:
    "Crea la mia azienda",

  voltarLogin:
    "Torna al login",

  ambienteSeguro:
    "Ambiente sicuro",

  plataformaEmpresarial:
    "Piattaforma aziendale",

  loginSideTituloAntes:
    "La tua industria",

  loginSideTituloDestaque:
    "connessa,",

  loginSideTituloDepois:
    "sicura e intelligente.",

  monitoramento:
    "Monitoraggio",

  gestaoIndustrial:
    "Gestione industriale",

  faceTitulo:
    "Riconoscimento facciale",

  facePrepareTitulo:
    "Preparati al riconoscimento facciale",

  facePrepareTexto:
    "Centra il viso all’interno dell’ovale. Il riconoscimento avviene automaticamente.",

  faceAutomatico:
    "Riconoscimento automatico — non è necessario premere alcun pulsante.",

  faceTexto:
    "Posiziona il volto davanti alla fotocamera",

  iniciandoCamera:
    "Avvio fotocamera...",

  procurandoRosto:
    "Ricerca volto...",

  olharCamera:
    "Guarda direttamente la fotocamera",

  loginSucesso:
    "Accesso effettuato!",

  erroLogin:
    "E-mail o password non validi.",

  erroCampos:
    "Compila tutti i campi.",

  dashboardTitulo:
    "Dashboard Macchine Industriali",

  dashboardSubtitulo:
    "Sistema di monitoraggio in tempo reale",

  temperatura:
    "Temperatura",

  producaoCard:
    "Produzione",

  ciclos:
    "Cicli",

  energia:
    "Energia",

  producaoTempoReal:
    "Produzione in tempo reale",

  situacaoMaquina:
    "Stato della macchina",

  consumoEnergia:
    "Carico elettrico (%)",

  maquinaSelecionada:
    "Macchina selezionata",

  verDetalhes:
    "Visualizza dettagli",

  producaoMaquina:
    "Produzione della macchina",

  graficoProducao:
    "Grafico di produzione",

  resumoProdutivo:
    "Riepilogo produttivo",

  totalProduzido:
    "Totale prodotto:",

  ciclosExecutados:
    "Cicli eseguiti:",

  ultimaManutencao:
    "Ultima manutenzione",

  proximaManutencao:
    "Prossima manutenzione",

  situacao:
    "Situazione",

  cadastrarManutencao:
    "Registra manutenzione",

  tipoManutencao:
    "Tipo di manutenzione",

  selecioneTipo:
    "Seleziona il tipo",

  preventiva:
    "Preventiva",

  corretiva:
    "Correttiva",

  nomeTecnico:
    "Nome del tecnico",

  descricao:
    "Descrizione",

  salvarManutencao:
    "Salva manutenzione",

  historicoManutencoes:
    "Storico manutenzioni",

  logsTitulo:
    "Registri della macchina",

  alertasTitulo:
    "Avvisi",

  idioma:
    "Lingua",

  tema:
    "Tema",

  claro:
    "Chiaro",

  escuro:
    "Scuro",

  equipamentosEmpresa:
    "Attrezzature della tua azienda",

  monitoramentoIndustrial:
    "Monitoraggio industriale in tempo reale",

  equipamentos:
    "Attrezzature",

  emOperacao:
    "In funzione",

  emManutencao:
    "In manutenzione",

  comAlerta:
    "Con avvisi",

  gestaoEquipamentos:
    "Gestione delle attrezzature",

  cadastrarEquipamento:
    "Registra nuova attrezzatura",

  novoEquipamento:
    "Nuova attrezzatura",

  cadastrarQualquerEquipamento:
    "Registra qualsiasi attrezzatura industriale",

  vaiCadastrarBraco:
    "Stai registrando un braccio robotico?",

  usarModelo:
    "Usa modello",

  identificacaoEquipamento:
    "Identificazione dell'attrezzatura",

  nomeEquipamento:
    "Nome dell'attrezzatura",

  setorLabel:
    "Settore",

  tipoEquipamento:
    "Tipo di attrezzatura",

  selecionarTipo:
    "Seleziona il tipo",

  bracoRobotico:
    "Braccio robotico",

  roboIndustrial:
    "Robot industriale",

  esteiraIndustrial:
    "Nastro trasportatore industriale",

  prensa:
    "Pressa",

  torno:
    "Tornio",

  solda:
    "Saldatura",

  corte:
    "Taglio",

  embalagem:
    "Imballaggio",

  impressora3D:
    "Stampante 3D",

  outro:
    "Altro",

  modeloLabel:
    "Modello",

  fabricanteLabel:
    "Produttore",

  codigoLabel:
    "Codice / Patrimonio",

  funcaoProcesso:
    "Funzione nel processo industriale",

  descricaoEquipamento:
    "Descrizione",

  cadastrarEquipamentoBotao:
    "Registra attrezzatura",

  parqueIndustrial:
    "Parco industriale",

  equipamentosCadastrados:
    "Attrezzature registrate",

  buscarEquipamento:
    "Cerca attrezzatura...",

  todosTipos:
    "Tutti i tipi",

  robotica:
    "Robotica",

  esteiras:
    "Nastri",

  prensas:
    "Presse",

  outros:
    "Altri",

  todosStatus:
    "Tutti gli stati",

  carregandoEquipamentos:
    "Caricamento attrezzature...",

  fabricante:
    "Produttore",

  modelo:
    "Modello",

  codigo:
    "Codice",

  setor:
    "Settore",

  tipo:
    "Tipo",

  pecas:
    "pezzi",

  situacaoManutencao:
    "Stato manutenzione",

  abrirMonitoramento:
    "Apri monitoraggio",

  nenhumEquipamento:
    "Nessuna attrezzatura trovata",

  erroServidor:
    "Errore di connessione al server.",

  empresaTitulo:
    "La mia azienda",

  dadosEmpresa:
    "Dati aziendali",

  editarDados:
    "Modifica dati",

  salvarAlteracoes:
    "Salva modifiche",

  telefone:
    "Telefono",

  endereco:
    "Indirizzo",

  numero:
    "Numero",

  complemento:
    "Complemento",

  bairro:
    "Quartiere",

  cidade:
    "Città",

  estado:
    "Regione",

  pais:
    "Paese",

  cep:
    "CAP",

  localizacao:
    "Posizione",

  abrirMapa:
    "Apri mappa",

  funcionarios:
    "Dipendenti",

  novoFuncionario:
    "Nuovo dipendente",

  totalFuncionarios:
    "Dipendenti",

  totalComFacial:
    "Con riconoscimento facciale",

  administradores:
    "Amministratori",

  nomeFuncionario:
    "Nome",

  cargoFuncionario:
    "Ruolo",

  criarFuncionario:
    "Registra dipendente",

  facialAtiva:
    "Riconoscimento facciale attivo",

  facialNaoCadastrada:
    "Riconoscimento facciale non registrato",

  cadastrarFacial:
    "Registra volto",

  adicionarFacial:
    "Aggiungi volto",

  removerFaciais:
    "Rimuovi volti",

  cargoAdministrador:
    "Amministratore",

  cargoSupervisor:
    "Supervisore",

  cargoTecnico:
    "Tecnico",

  cargoOperador:
    "Operatore",

  cargoVisitante:
    "Visitatore"
};


// =========================================================
// OBJETO FINAL
// =========================================================

const traducoes = {
  pt: PT,
  en: EN,
  es: ES,
  fr: FR,
  de: DE,
  it: IT
};


// =========================================================
// TRADUÇÕES COMPLEMENTARES DO DESKTOP
// =========================================================
//
// Estas chaves cobrem textos que estavam escritos diretamente
// nos arquivos HTML. Assim a troca de idioma alcança também
// títulos, descrições e áreas que ainda não tinham data-i18n.
// =========================================================

const TRADUCOES_COMPLEMENTARES = {
  pt: {
    loginPageTitle: "Entrar | SteelControl",
    dashboardPageTitle: "SteelControl | Painel Industrial",
    machinesPageTitle: "Equipamentos | SteelControl",
    companyPageTitle: "Minha Empresa | SteelControl",
    desktopMonitoramentoAtivo: "Monitoramento ativo",
    desktopOperacaoIndustrial: "Operação Industrial",
    desktopAcompanhamentoMaquina: "Acompanhamento da máquina em tempo real",
    desktopSistemaOnline: "Sistema online",
    desktopAtualizacaoAutomatica: "Atualização automática",
    desktopVisaoGeral: "Visão geral da operação",
    desktopIndicadoresGerais: "Indicadores gerais de todas as máquinas cadastradas na empresa.",
    desktopDadosAtualizados: "Dados atualizados",
    desktopSaudeOperacao: "Saúde da operação",
    desktopResumoOperacional: "Resumo operacional",
    desktopEquipamentosEmpresa: "Equipamentos da sua empresa",
    desktopMinhaEmpresaDescricao: "Gerencie funcionários, dados institucionais, localização e métodos de autenticação da empresa.",
    desktopDadosInstitucionais: "Dados institucionais",
    desktopFuncionariosEmpresa: "Funcionários da empresa",
    desktopGestaoAcessos: "Gestão de acessos",
    desktopAlterarLogo: "Alterar logo",
    desktopOndeEstamos: "Onde estamos",
    desktopSessaoAtual: "Sessão atual",
    desktopUsuarioConectado: "Usuário conectado",
    desktopEntrarFacial: "Entrar com reconhecimento facial",
    desktopNovaEmpresa: "NOVA EMPRESA",
    desktopPrimeiroAcesso: "Primeiro acesso",
    desktopCriarEmpresaAdmin: "Criar empresa e administrador",
    desktopVoltarAcesso: "Voltar para o acesso"
  },
  en: {
    loginPageTitle: "Sign in | SteelControl",
    dashboardPageTitle: "SteelControl | Industrial Dashboard",
    machinesPageTitle: "Equipment | SteelControl",
    companyPageTitle: "My Company | SteelControl",
    desktopMonitoramentoAtivo: "Active monitoring",
    desktopOperacaoIndustrial: "Industrial Operation",
    desktopAcompanhamentoMaquina: "Real-time machine monitoring",
    desktopSistemaOnline: "System online",
    desktopAtualizacaoAutomatica: "Automatic updates",
    desktopVisaoGeral: "Operation overview",
    desktopIndicadoresGerais: "General indicators for all machines registered in the company.",
    desktopDadosAtualizados: "Data updated",
    desktopSaudeOperacao: "Operation health",
    desktopResumoOperacional: "Operational summary",
    desktopEquipamentosEmpresa: "Your company's equipment",
    desktopMinhaEmpresaDescricao: "Manage employees, institutional data, location and company authentication methods.",
    desktopDadosInstitucionais: "Company information",
    desktopFuncionariosEmpresa: "Company employees",
    desktopGestaoAcessos: "Access management",
    desktopAlterarLogo: "Change logo",
    desktopOndeEstamos: "Our location",
    desktopSessaoAtual: "Current session",
    desktopUsuarioConectado: "Signed-in user",
    desktopEntrarFacial: "Sign in with facial recognition",
    desktopNovaEmpresa: "NEW COMPANY",
    desktopPrimeiroAcesso: "First access",
    desktopCriarEmpresaAdmin: "Create company and administrator",
    desktopVoltarAcesso: "Back to sign in"
  },
  es: {
    loginPageTitle: "Iniciar sesión | SteelControl",
    dashboardPageTitle: "SteelControl | Panel Industrial",
    machinesPageTitle: "Equipos | SteelControl",
    companyPageTitle: "Mi Empresa | SteelControl",
    desktopMonitoramentoAtivo: "Monitoreo activo",
    desktopOperacaoIndustrial: "Operación Industrial",
    desktopAcompanhamentoMaquina: "Monitoreo de la máquina en tiempo real",
    desktopSistemaOnline: "Sistema en línea",
    desktopAtualizacaoAutomatica: "Actualización automática",
    desktopVisaoGeral: "Resumen de la operación",
    desktopIndicadoresGerais: "Indicadores generales de todas las máquinas registradas en la empresa.",
    desktopDadosAtualizados: "Datos actualizados",
    desktopSaudeOperacao: "Estado de la operación",
    desktopResumoOperacional: "Resumen operativo",
    desktopEquipamentosEmpresa: "Equipos de su empresa",
    desktopMinhaEmpresaDescricao: "Gestione empleados, datos institucionales, ubicación y métodos de autenticación de la empresa.",
    desktopDadosInstitucionais: "Datos institucionales",
    desktopFuncionariosEmpresa: "Empleados de la empresa",
    desktopGestaoAcessos: "Gestión de accesos",
    desktopAlterarLogo: "Cambiar logotipo",
    desktopOndeEstamos: "Dónde estamos",
    desktopSessaoAtual: "Sesión actual",
    desktopUsuarioConectado: "Usuario conectado",
    desktopEntrarFacial: "Entrar con reconocimiento facial",
    desktopNovaEmpresa: "NUEVA EMPRESA",
    desktopPrimeiroAcesso: "Primer acceso",
    desktopCriarEmpresaAdmin: "Crear empresa y administrador",
    desktopVoltarAcesso: "Volver al acceso"
  },
  fr: {
    loginPageTitle: "Connexion | SteelControl",
    dashboardPageTitle: "SteelControl | Tableau de bord industriel",
    machinesPageTitle: "Équipements | SteelControl",
    companyPageTitle: "Mon Entreprise | SteelControl",
    desktopMonitoramentoAtivo: "Surveillance active",
    desktopOperacaoIndustrial: "Opération industrielle",
    desktopAcompanhamentoMaquina: "Suivi de la machine en temps réel",
    desktopSistemaOnline: "Système en ligne",
    desktopAtualizacaoAutomatica: "Mise à jour automatique",
    desktopVisaoGeral: "Vue d'ensemble de l'opération",
    desktopIndicadoresGerais: "Indicateurs généraux de toutes les machines enregistrées dans l'entreprise.",
    desktopDadosAtualizados: "Données mises à jour",
    desktopSaudeOperacao: "État de l'opération",
    desktopResumoOperacional: "Résumé opérationnel",
    desktopEquipamentosEmpresa: "Équipements de votre entreprise",
    desktopMinhaEmpresaDescricao: "Gérez les employés, les données de l'entreprise, la localisation et les méthodes d'authentification.",
    desktopDadosInstitucionais: "Informations de l'entreprise",
    desktopFuncionariosEmpresa: "Employés de l'entreprise",
    desktopGestaoAcessos: "Gestion des accès",
    desktopAlterarLogo: "Modifier le logo",
    desktopOndeEstamos: "Notre localisation",
    desktopSessaoAtual: "Session actuelle",
    desktopUsuarioConectado: "Utilisateur connecté",
    desktopEntrarFacial: "Se connecter par reconnaissance faciale",
    desktopNovaEmpresa: "NOUVELLE ENTREPRISE",
    desktopPrimeiroAcesso: "Premier accès",
    desktopCriarEmpresaAdmin: "Créer l'entreprise et l'administrateur",
    desktopVoltarAcesso: "Retour à la connexion"
  },
  de: {
    loginPageTitle: "Anmelden | SteelControl",
    dashboardPageTitle: "SteelControl | Industrie-Dashboard",
    machinesPageTitle: "Geräte | SteelControl",
    companyPageTitle: "Mein Unternehmen | SteelControl",
    desktopMonitoramentoAtivo: "Aktive Überwachung",
    desktopOperacaoIndustrial: "Industriebetrieb",
    desktopAcompanhamentoMaquina: "Maschinenüberwachung in Echtzeit",
    desktopSistemaOnline: "System online",
    desktopAtualizacaoAutomatica: "Automatische Aktualisierung",
    desktopVisaoGeral: "Betriebsübersicht",
    desktopIndicadoresGerais: "Allgemeine Kennzahlen aller im Unternehmen registrierten Maschinen.",
    desktopDadosAtualizados: "Daten aktualisiert",
    desktopSaudeOperacao: "Betriebszustand",
    desktopResumoOperacional: "Betriebsübersicht",
    desktopEquipamentosEmpresa: "Ausrüstung Ihres Unternehmens",
    desktopMinhaEmpresaDescricao: "Verwalten Sie Mitarbeiter, Unternehmensdaten, Standort und Authentifizierungsmethoden.",
    desktopDadosInstitucionais: "Unternehmensdaten",
    desktopFuncionariosEmpresa: "Mitarbeiter des Unternehmens",
    desktopGestaoAcessos: "Zugriffsverwaltung",
    desktopAlterarLogo: "Logo ändern",
    desktopOndeEstamos: "Unser Standort",
    desktopSessaoAtual: "Aktuelle Sitzung",
    desktopUsuarioConectado: "Angemeldeter Benutzer",
    desktopEntrarFacial: "Mit Gesichtserkennung anmelden",
    desktopNovaEmpresa: "NEUES UNTERNEHMEN",
    desktopPrimeiroAcesso: "Erster Zugriff",
    desktopCriarEmpresaAdmin: "Unternehmen und Administrator erstellen",
    desktopVoltarAcesso: "Zurück zur Anmeldung"
  },
  it: {
    loginPageTitle: "Accedi | SteelControl",
    dashboardPageTitle: "SteelControl | Dashboard Industriale",
    machinesPageTitle: "Apparecchiature | SteelControl",
    companyPageTitle: "La Mia Azienda | SteelControl",
    desktopMonitoramentoAtivo: "Monitoraggio attivo",
    desktopOperacaoIndustrial: "Operazione industriale",
    desktopAcompanhamentoMaquina: "Monitoraggio della macchina in tempo reale",
    desktopSistemaOnline: "Sistema online",
    desktopAtualizacaoAutomatica: "Aggiornamento automatico",
    desktopVisaoGeral: "Panoramica dell'operazione",
    desktopIndicadoresGerais: "Indicatori generali di tutte le macchine registrate nell'azienda.",
    desktopDadosAtualizados: "Dati aggiornati",
    desktopSaudeOperacao: "Stato dell'operazione",
    desktopResumoOperacional: "Riepilogo operativo",
    desktopEquipamentosEmpresa: "Attrezzature della tua azienda",
    desktopMinhaEmpresaDescricao: "Gestisci dipendenti, dati aziendali, posizione e metodi di autenticazione.",
    desktopDadosInstitucionais: "Dati aziendali",
    desktopFuncionariosEmpresa: "Dipendenti dell'azienda",
    desktopGestaoAcessos: "Gestione accessi",
    desktopAlterarLogo: "Cambia logo",
    desktopOndeEstamos: "Dove siamo",
    desktopSessaoAtual: "Sessione corrente",
    desktopUsuarioConectado: "Utente connesso",
    desktopEntrarFacial: "Accedi con riconoscimento facciale",
    desktopNovaEmpresa: "NUOVA AZIENDA",
    desktopPrimeiroAcesso: "Primo accesso",
    desktopCriarEmpresaAdmin: "Crea azienda e amministratore",
    desktopVoltarAcesso: "Torna all'accesso"
  }
};

Object.entries(TRADUCOES_COMPLEMENTARES).forEach(([idioma, tabela]) => {
  Object.assign(traducoes[idioma], tabela);
});



const TRADUCOES_REFINAMENTO = {
  pt: {
    maintenanceCentralTitle: "Central de manutenção",
    maintenanceCentralDesc: "Registre intervenções e mantenha um histórico técnico rastreável da máquina selecionada.",
    maintenanceAdminOnly: "Administrador: exclusão de registros habilitada",
    maintenanceFormHelp: "Registre uma manutenção realizada nesta máquina.",
    maintenanceHistoryHelp: "Linha do tempo das intervenções registradas para a máquina.",
    maintenanceTechnician: "Técnico",
    maintenanceDate: "Data",
    maintenanceAt: "às",
    maintenanceDelete: "Excluir registro de manutenção",
    maintenanceOnlyAdminDelete: "Somente administradores podem excluir registros de manutenção.",
    maintenanceNoMachine: "Selecione uma máquina antes de excluir o registro.",
    maintenanceDeleteConfirm: "Deseja excluir este registro de manutenção? Esta ação não pode ser desfeita.",
    maintenanceDeleteError: "Não foi possível excluir o registro de manutenção.",
    maintenanceDeleteSuccess: "Registro de manutenção excluído com sucesso."
  },
  en: {
    maintenanceCentralTitle: "Maintenance center",
    maintenanceCentralDesc: "Register interventions and keep a traceable technical history for the selected machine.",
    maintenanceAdminOnly: "Administrator: record deletion enabled",
    maintenanceFormHelp: "Register maintenance performed on this machine.",
    maintenanceHistoryHelp: "Timeline of interventions registered for the machine.",
    maintenanceTechnician: "Technician",
    maintenanceDate: "Date",
    maintenanceAt: "at",
    maintenanceDelete: "Delete maintenance record",
    maintenanceOnlyAdminDelete: "Only administrators can delete maintenance records.",
    maintenanceNoMachine: "Select a machine before deleting the record.",
    maintenanceDeleteConfirm: "Delete this maintenance record? This action cannot be undone.",
    maintenanceDeleteError: "The maintenance record could not be deleted.",
    maintenanceDeleteSuccess: "Maintenance record deleted successfully."
  },
  es: {
    maintenanceCentralTitle: "Centro de mantenimiento",
    maintenanceCentralDesc: "Registre intervenciones y mantenga un historial técnico trazable de la máquina seleccionada.",
    maintenanceAdminOnly: "Administrador: eliminación de registros habilitada",
    maintenanceFormHelp: "Registre un mantenimiento realizado en esta máquina.",
    maintenanceHistoryHelp: "Línea de tiempo de las intervenciones registradas para la máquina.",
    maintenanceTechnician: "Técnico",
    maintenanceDate: "Fecha",
    maintenanceAt: "a las",
    maintenanceDelete: "Eliminar registro de mantenimiento",
    maintenanceOnlyAdminDelete: "Solo los administradores pueden eliminar registros de mantenimiento.",
    maintenanceNoMachine: "Seleccione una máquina antes de eliminar el registro.",
    maintenanceDeleteConfirm: "¿Desea eliminar este registro de mantenimiento? Esta acción no se puede deshacer.",
    maintenanceDeleteError: "No se pudo eliminar el registro de mantenimiento.",
    maintenanceDeleteSuccess: "Registro de mantenimiento eliminado correctamente."
  },
  fr: {
    maintenanceCentralTitle: "Centre de maintenance",
    maintenanceCentralDesc: "Enregistrez les interventions et conservez un historique technique traçable de la machine sélectionnée.",
    maintenanceAdminOnly: "Administrateur : suppression des enregistrements activée",
    maintenanceFormHelp: "Enregistrez une maintenance effectuée sur cette machine.",
    maintenanceHistoryHelp: "Chronologie des interventions enregistrées pour la machine.",
    maintenanceTechnician: "Technicien",
    maintenanceDate: "Date",
    maintenanceAt: "à",
    maintenanceDelete: "Supprimer l'enregistrement de maintenance",
    maintenanceOnlyAdminDelete: "Seuls les administrateurs peuvent supprimer les enregistrements de maintenance.",
    maintenanceNoMachine: "Sélectionnez une machine avant de supprimer l'enregistrement.",
    maintenanceDeleteConfirm: "Supprimer cet enregistrement de maintenance ? Cette action est irréversible.",
    maintenanceDeleteError: "Impossible de supprimer l'enregistrement de maintenance.",
    maintenanceDeleteSuccess: "Enregistrement de maintenance supprimé."
  },
  de: {
    maintenanceCentralTitle: "Wartungszentrale",
    maintenanceCentralDesc: "Erfassen Sie Eingriffe und führen Sie eine nachvollziehbare technische Historie der ausgewählten Maschine.",
    maintenanceAdminOnly: "Administrator: Löschen von Einträgen aktiviert",
    maintenanceFormHelp: "Erfassen Sie eine an dieser Maschine durchgeführte Wartung.",
    maintenanceHistoryHelp: "Zeitleiste der für die Maschine erfassten Eingriffe.",
    maintenanceTechnician: "Techniker",
    maintenanceDate: "Datum",
    maintenanceAt: "um",
    maintenanceDelete: "Wartungseintrag löschen",
    maintenanceOnlyAdminDelete: "Nur Administratoren können Wartungseinträge löschen.",
    maintenanceNoMachine: "Wählen Sie eine Maschine aus, bevor Sie den Eintrag löschen.",
    maintenanceDeleteConfirm: "Diesen Wartungseintrag löschen? Diese Aktion kann nicht rückgängig gemacht werden.",
    maintenanceDeleteError: "Der Wartungseintrag konnte nicht gelöscht werden.",
    maintenanceDeleteSuccess: "Wartungseintrag erfolgreich gelöscht."
  },
  it: {
    maintenanceCentralTitle: "Centro manutenzione",
    maintenanceCentralDesc: "Registra gli interventi e mantieni uno storico tecnico tracciabile della macchina selezionata.",
    maintenanceAdminOnly: "Amministratore: eliminazione dei registri abilitata",
    maintenanceFormHelp: "Registra una manutenzione eseguita su questa macchina.",
    maintenanceHistoryHelp: "Cronologia degli interventi registrati per la macchina.",
    maintenanceTechnician: "Tecnico",
    maintenanceDate: "Data",
    maintenanceAt: "alle",
    maintenanceDelete: "Elimina registro di manutenzione",
    maintenanceOnlyAdminDelete: "Solo gli amministratori possono eliminare i registri di manutenzione.",
    maintenanceNoMachine: "Seleziona una macchina prima di eliminare il registro.",
    maintenanceDeleteConfirm: "Eliminare questo registro di manutenzione? L'azione non può essere annullata.",
    maintenanceDeleteError: "Impossibile eliminare il registro di manutenzione.",
    maintenanceDeleteSuccess: "Registro di manutenzione eliminato."
  }
};

Object.entries(TRADUCOES_REFINAMENTO).forEach(([idioma, tabela]) => {
  Object.assign(traducoes[idioma], tabela);
});



const TRADUCOES_INGLES_COMPLETAS = {
  sim: "Yes",
  nao: "No",
  manutencaoTitulo: "Maintenance",
  cargoSupervisor: "Supervisor",
  modeloPlaceholder: "Example: RB-2000",
  fabricantePlaceholder: "Example: ABB, KUKA, FANUC, Universal Robots",
  codigoPlaceholder: "Example: ROB-001"
};

Object.assign(traducoes.en, TRADUCOES_INGLES_COMPLETAS);


const TRADUCOES_FR_COMPLEMENTARES = {
  homeCtaTexto:
    "Accédez à la plateforme et surveillez votre activité industrielle dans un environnement centralisé et sécurisé.",
  loginConfiancaTexto:
    "Centralisez les machines, la maintenance, la production, les équipes et la sécurité sur une seule plateforme.",
  loginCadastroDescricao:
    "Enregistrez votre organisation et commencez à structurer une gestion industrielle plus connectée, organisée et intelligente.",
  loginSideTexto:
    "Plus de contrôle, plus de sécurité et plus d'informations pour prendre de meilleures décisions.",
  loginInfoTitulo:
    "Accès sécurisé à votre environnement industriel",
  loginInfoTexto:
    "Utilisez votre compte d'entreprise ou la reconnaissance faciale pour vous authentifier.",
  loginTecnologiaIndustrial:
    "Technologie pour les environnements industriels",
  cameraSomenteAutenticacao:
    "La caméra est utilisée uniquement pendant l'authentification.",
  empresaSubtitulo:
    "Gérez les employés, les données institutionnelles, la localisation et les méthodes d'authentification de l'entreprise.",
  equipamentosIntro:
    "Enregistrez des machines, des robots industriels et d'autres équipements de votre activité.",
  historicoOperacional:
    "Historique opérationnel",
  manutencaoIntegrada:
    "Maintenance intégrée",
  cadastrarEquipamentoTexto:
    "Enregistrez l'identification et, si vous le souhaitez, préparez la communication pour l'intégration avec l'équipement réel.",
  equipamentosCadastradosTexto:
    "Consultez et accédez aux équipements de votre entreprise.",
  nenhumEquipamentoTexto:
    "Aucun équipement enregistré.",
  erroCarregarEquipamentos:
    "Impossible de charger les équipements.",
  erroBackend:
    "Vérifiez que le backend SteelControl est en cours d'exécution.",
  gerenciarEmpresaTitle:
    "Gérer l'entreprise",
  configDesc:
    "Personnalisez SteelControl et gérez votre entreprise.",
  nomeTecnicoPlaceholder:
    "Saisissez le nom du technicien",
  descricaoManutencaoPlaceholder:
    "Décrivez le service effectué",
  manutencaoDesc:
    "Contrôle de la maintenance préventive et corrective de la machine",
  ultimaManutencaoDesc:
    "Enregistrement le plus récent",
  proximaManutencaoDesc:
    "Prévision préventive",
  situacaoDesc:
    "État actuel",
  ciclosManutencaoDesc:
    "Base pour la révision",
  carregandoHistorico:
    "Chargement de l'historique...",
  nenhumLog:
    "Aucun journal enregistré.",
  nenhumAlerta:
    "Aucune alerte enregistrée.",
  nenhumaManutencao:
    "Aucune maintenance enregistrée."
};

Object.assign(traducoes.fr, TRADUCOES_FR_COMPLEMENTARES);


Object.assign(traducoes.es, {
  homeCtaTexto:
    "Acceda a la plataforma y supervise su operación industrial en un entorno centralizado y seguro.",
  loginConfiancaTexto:
    "Centralice máquinas, mantenimiento, producción, equipos y seguridad en una sola plataforma.",
  loginCadastroDescricao:
    "Registre su organización y comience una gestión industrial más conectada, organizada e inteligente.",
  loginSideTexto:
    "Más control, más seguridad y más información para tomar mejores decisiones.",
  empresaSubtitulo:
    "Gestione empleados, datos institucionales, ubicación y métodos de autenticación de la empresa.",
  equipamentosCadastradosTexto:
    "Consulte y acceda a los equipos de su empresa.",
  configDesc:
    "Personalice SteelControl y gestione su empresa."
});

Object.assign(traducoes.de, {
  homeCtaTexto:
    "Greifen Sie auf die Plattform zu und überwachen Sie Ihren Industriebetrieb in einer zentralen und sicheren Umgebung.",
  loginConfiancaTexto:
    "Zentralisieren Sie Maschinen, Wartung, Produktion, Teams und Sicherheit auf einer einzigen Plattform.",
  loginCadastroDescricao:
    "Registrieren Sie Ihre Organisation und strukturieren Sie ein vernetztes, organisiertes und intelligentes Industriemanagement.",
  loginSideTexto:
    "Mehr Kontrolle, mehr Sicherheit und mehr Informationen für bessere Entscheidungen.",
  empresaSubtitulo:
    "Verwalten Sie Mitarbeiter, Unternehmensdaten, Standort und Authentifizierungsmethoden.",
  equipamentosCadastradosTexto:
    "Zeigen Sie die Geräte Ihres Unternehmens an und greifen Sie darauf zu.",
  configDesc:
    "Passen Sie SteelControl an und verwalten Sie Ihr Unternehmen."
});

Object.assign(traducoes.it, {
  homeCtaTexto:
    "Accedi alla piattaforma e monitora la tua attività industriale in un ambiente centralizzato e sicuro.",
  loginConfiancaTexto:
    "Centralizza macchine, manutenzione, produzione, team e sicurezza in un'unica piattaforma.",
  loginCadastroDescricao:
    "Registra la tua organizzazione e inizia una gestione industriale più connessa, organizzata e intelligente.",
  loginSideTexto:
    "Più controllo, più sicurezza e più informazioni per decisioni migliori.",
  empresaSubtitulo:
    "Gestisci dipendenti, dati aziendali, posizione e metodi di autenticazione.",
  equipamentosCadastradosTexto:
    "Consulta e accedi alle attrezzature della tua azienda.",
  configDesc:
    "Personalizza SteelControl e gestisci la tua azienda."
});

// =========================================================
// EXPERIÊNCIA DE ACESSO E CADASTRO
// =========================================================
// Textos usados pelas mensagens visuais de boas-vindas e pelos
// estados dinâmicos do fluxo de criação de conta.

const TRADUCOES_EXPERIENCIA_ACESSO = {
  pt: {
    loginWelcomeTitle: "Bem-vindo, {nome}!",
    loginWelcomeText: "Acesso confirmado. Estamos preparando o painel da sua empresa com segurança.",
    registerWelcomeTitle: "Bem-vindo ao SteelControl, {nome}!",
    registerWelcomeText: "Sua empresa foi criada e sua biometria foi protegida com sucesso. Tudo pronto para começar.",
    redirectingWorkspace: "Abrindo seu ambiente industrial...",
    emailConfirmedFaceNext: "E-mail confirmado e empresa criada. Agora vamos proteger sua conta com a biometria facial.",
    faceRegisteredTitle: "Cadastro concluído!",
    faceRegisteredText: "Biometria vinculada com segurança à sua conta.",
    resendCodeIn: "Reenviar código em {segundos}s",
    resendCode: "Reenviar código",
    sendingCode: "Enviando código para o e-mail informado...",
    codeSent: "Código enviado.",
    newCodeSent: "Novo código enviado.",
    invalidCodeLength: "Digite o código de 6 dígitos enviado para seu e-mail.",
    checkingIdentity: "Verificando identidade...",
    doNotMove: "Não se mova",
    faceRecognizedTitle: "Identidade confirmada!",
    faceRecognizedText: "Bem-vindo, {nome}. Seu acesso seguro foi autorizado.",
    cameraStarting: "Iniciando câmera...", cameraWait: "Aguarde alguns segundos",
    faceSearching: "Procurando rosto...", faceCenter: "Posicione seu rosto no centro da câmera",
    cameraUnavailable: "Câmera indisponível", cameraPermission: "Permita o acesso à câmera no navegador",
    movementConfirmed: "Movimento confirmado", lookFrontAgain: "Agora volte a olhar diretamente para a câmera.",
    livenessCheck: "Prova de vida", turnHead: "Vire levemente a cabeça para um dos lados.",
    correctPosition: "Posição correta", stayStillCount: "Mantenha-se parado... {atual}/2",
    livenessComplete: "Prova de vida concluída", lookCameraCount: "Olhe para a câmera... {atual}/2",
    analysisFailed: "Falha na análise", checkPythonApi: "Verifique se a API Python está funcionando",
    adjustPosition: "Ajuste sua posição", validationFailed: "Não foi possível validar",
    ambiguousIdentity: "Identidade ambígua", faceNotRegistered: "Rosto não cadastrado",
    faceNotFoundSecurely: "Não encontramos este rosto com segurança. Entre com e-mail e senha."
  },
  en: {
    loginWelcomeTitle: "Welcome, {nome}!",
    loginWelcomeText: "Access confirmed. We are securely preparing your company's dashboard.",
    registerWelcomeTitle: "Welcome to SteelControl, {nome}!",
    registerWelcomeText: "Your company has been created and your biometric data was secured successfully. Everything is ready.",
    redirectingWorkspace: "Opening your industrial workspace...",
    emailConfirmedFaceNext: "Email confirmed and company created. Now let's protect your account with facial biometrics.",
    faceRegisteredTitle: "Registration complete!",
    faceRegisteredText: "Biometric data securely linked to your account.",
    resendCodeIn: "Resend code in {segundos}s",
    resendCode: "Resend code",
    sendingCode: "Sending a code to the provided email...",
    codeSent: "Code sent.",
    newCodeSent: "New code sent.",
    invalidCodeLength: "Enter the 6-digit code sent to your email.",
    checkingIdentity: "Verifying identity...",
    doNotMove: "Do not move",
    faceRecognizedTitle: "Identity confirmed!",
    faceRecognizedText: "Welcome, {nome}. Your secure access has been authorized.",
    cameraStarting: "Starting camera...", cameraWait: "Please wait a few seconds",
    faceSearching: "Searching for a face...", faceCenter: "Position your face in the center of the camera",
    cameraUnavailable: "Camera unavailable", cameraPermission: "Allow camera access in your browser",
    movementConfirmed: "Movement confirmed", lookFrontAgain: "Now look directly at the camera again.",
    livenessCheck: "Liveness check", turnHead: "Turn your head slightly to one side.",
    correctPosition: "Correct position", stayStillCount: "Stay still... {atual}/2",
    livenessComplete: "Liveness check complete", lookCameraCount: "Look at the camera... {atual}/2",
    analysisFailed: "Analysis failed", checkPythonApi: "Make sure the Python API is running",
    adjustPosition: "Adjust your position", validationFailed: "Unable to validate",
    ambiguousIdentity: "Ambiguous identity", faceNotRegistered: "Face not registered",
    faceNotFoundSecurely: "We could not identify this face securely. Sign in with email and password."
  },
  es: {
    loginWelcomeTitle: "¡Bienvenido, {nome}!",
    loginWelcomeText: "Acceso confirmado. Estamos preparando de forma segura el panel de su empresa.",
    registerWelcomeTitle: "¡Bienvenido a SteelControl, {nome}!",
    registerWelcomeText: "Su empresa fue creada y sus datos biométricos se protegieron correctamente. Todo está listo.",
    redirectingWorkspace: "Abriendo su entorno industrial...",
    emailConfirmedFaceNext: "Correo confirmado y empresa creada. Ahora protegeremos su cuenta con biometría facial.",
    faceRegisteredTitle: "¡Registro completado!",
    faceRegisteredText: "Biometría vinculada de forma segura a su cuenta.",
    resendCodeIn: "Reenviar código en {segundos}s",
    resendCode: "Reenviar código",
    sendingCode: "Enviando un código al correo indicado...",
    codeSent: "Código enviado.",
    newCodeSent: "Nuevo código enviado.",
    invalidCodeLength: "Ingrese el código de 6 dígitos enviado a su correo.",
    checkingIdentity: "Verificando identidad...",
    doNotMove: "No se mueva",
    faceRecognizedTitle: "¡Identidad confirmada!",
    faceRecognizedText: "Bienvenido, {nome}. Su acceso seguro fue autorizado.",
    cameraStarting: "Iniciando cámara...", cameraWait: "Espere unos segundos",
    faceSearching: "Buscando rostro...", faceCenter: "Coloque su rostro en el centro de la cámara",
    cameraUnavailable: "Cámara no disponible", cameraPermission: "Permita el acceso a la cámara en el navegador",
    movementConfirmed: "Movimiento confirmado", lookFrontAgain: "Vuelva a mirar directamente a la cámara.",
    livenessCheck: "Prueba de vida", turnHead: "Gire ligeramente la cabeza hacia un lado.",
    correctPosition: "Posición correcta", stayStillCount: "Manténgase quieto... {atual}/2",
    livenessComplete: "Prueba de vida completada", lookCameraCount: "Mire a la cámara... {atual}/2",
    analysisFailed: "Error de análisis", checkPythonApi: "Compruebe que la API de Python esté funcionando",
    adjustPosition: "Ajuste su posición", validationFailed: "No fue posible validar",
    ambiguousIdentity: "Identidad ambigua", faceNotRegistered: "Rostro no registrado",
    faceNotFoundSecurely: "No pudimos identificar este rostro de forma segura. Ingrese con correo y contraseña."
  },
  fr: {
    loginWelcomeTitle: "Bienvenue, {nome} !",
    loginWelcomeText: "Accès confirmé. Nous préparons le tableau de bord de votre entreprise en toute sécurité.",
    registerWelcomeTitle: "Bienvenue sur SteelControl, {nome} !",
    registerWelcomeText: "Votre entreprise a été créée et vos données biométriques ont été sécurisées. Tout est prêt.",
    redirectingWorkspace: "Ouverture de votre environnement industriel...",
    emailConfirmedFaceNext: "E-mail confirmé et entreprise créée. Protégeons maintenant votre compte avec la biométrie faciale.",
    faceRegisteredTitle: "Inscription terminée !",
    faceRegisteredText: "Données biométriques associées à votre compte en toute sécurité.",
    resendCodeIn: "Renvoyer le code dans {segundos}s",
    resendCode: "Renvoyer le code",
    sendingCode: "Envoi d'un code à l'adresse indiquée...",
    codeSent: "Code envoyé.",
    newCodeSent: "Nouveau code envoyé.",
    invalidCodeLength: "Saisissez le code à 6 chiffres envoyé à votre adresse e-mail.",
    checkingIdentity: "Vérification de l'identité...",
    doNotMove: "Ne bougez pas",
    faceRecognizedTitle: "Identité confirmée !",
    faceRecognizedText: "Bienvenue, {nome}. Votre accès sécurisé a été autorisé.",
    cameraStarting: "Démarrage de la caméra...", cameraWait: "Veuillez patienter quelques secondes",
    faceSearching: "Recherche d'un visage...", faceCenter: "Placez votre visage au centre de la caméra",
    cameraUnavailable: "Caméra indisponible", cameraPermission: "Autorisez l'accès à la caméra dans le navigateur",
    movementConfirmed: "Mouvement confirmé", lookFrontAgain: "Regardez de nouveau directement la caméra.",
    livenessCheck: "Test de présence", turnHead: "Tournez légèrement la tête d'un côté.",
    correctPosition: "Position correcte", stayStillCount: "Restez immobile... {atual}/2",
    livenessComplete: "Test de présence terminé", lookCameraCount: "Regardez la caméra... {atual}/2",
    analysisFailed: "Échec de l'analyse", checkPythonApi: "Vérifiez que l'API Python fonctionne",
    adjustPosition: "Ajustez votre position", validationFailed: "Validation impossible",
    ambiguousIdentity: "Identité ambiguë", faceNotRegistered: "Visage non enregistré",
    faceNotFoundSecurely: "Nous n'avons pas pu identifier ce visage de manière sûre. Connectez-vous par e-mail et mot de passe."
  },
  de: {
    loginWelcomeTitle: "Willkommen, {nome}!",
    loginWelcomeText: "Zugriff bestätigt. Das Dashboard Ihres Unternehmens wird sicher vorbereitet.",
    registerWelcomeTitle: "Willkommen bei SteelControl, {nome}!",
    registerWelcomeText: "Ihr Unternehmen wurde erstellt und Ihre biometrischen Daten wurden sicher geschützt. Alles ist bereit.",
    redirectingWorkspace: "Ihr industrieller Arbeitsbereich wird geöffnet...",
    emailConfirmedFaceNext: "E-Mail bestätigt und Unternehmen erstellt. Jetzt schützen wir Ihr Konto mit Gesichtsbiometrie.",
    faceRegisteredTitle: "Registrierung abgeschlossen!",
    faceRegisteredText: "Biometrische Daten wurden sicher mit Ihrem Konto verknüpft.",
    resendCodeIn: "Code in {segundos}s erneut senden",
    resendCode: "Code erneut senden",
    sendingCode: "Code wird an die angegebene E-Mail gesendet...",
    codeSent: "Code gesendet.",
    newCodeSent: "Neuer Code gesendet.",
    invalidCodeLength: "Geben Sie den 6-stelligen Code aus Ihrer E-Mail ein.",
    checkingIdentity: "Identität wird überprüft...",
    doNotMove: "Nicht bewegen",
    faceRecognizedTitle: "Identität bestätigt!",
    faceRecognizedText: "Willkommen, {nome}. Ihr sicherer Zugriff wurde autorisiert.",
    cameraStarting: "Kamera wird gestartet...", cameraWait: "Bitte warten Sie einige Sekunden",
    faceSearching: "Gesicht wird gesucht...", faceCenter: "Positionieren Sie Ihr Gesicht in der Mitte der Kamera",
    cameraUnavailable: "Kamera nicht verfügbar", cameraPermission: "Erlauben Sie den Kamerazugriff im Browser",
    movementConfirmed: "Bewegung bestätigt", lookFrontAgain: "Schauen Sie wieder direkt in die Kamera.",
    livenessCheck: "Lebenderkennung", turnHead: "Drehen Sie den Kopf leicht zu einer Seite.",
    correctPosition: "Korrekte Position", stayStillCount: "Stillhalten... {atual}/2",
    livenessComplete: "Lebenderkennung abgeschlossen", lookCameraCount: "In die Kamera schauen... {atual}/2",
    analysisFailed: "Analyse fehlgeschlagen", checkPythonApi: "Prüfen Sie, ob die Python-API läuft",
    adjustPosition: "Position anpassen", validationFailed: "Validierung nicht möglich",
    ambiguousIdentity: "Mehrdeutige Identität", faceNotRegistered: "Gesicht nicht registriert",
    faceNotFoundSecurely: "Dieses Gesicht konnte nicht sicher erkannt werden. Melden Sie sich mit E-Mail und Passwort an."
  },
  it: {
    loginWelcomeTitle: "Benvenuto, {nome}!",
    loginWelcomeText: "Accesso confermato. Stiamo preparando in sicurezza la dashboard della tua azienda.",
    registerWelcomeTitle: "Benvenuto su SteelControl, {nome}!",
    registerWelcomeText: "La tua azienda è stata creata e i dati biometrici sono stati protetti. È tutto pronto.",
    redirectingWorkspace: "Apertura del tuo ambiente industriale...",
    emailConfirmedFaceNext: "E-mail confermata e azienda creata. Ora proteggiamo il tuo account con la biometria facciale.",
    faceRegisteredTitle: "Registrazione completata!",
    faceRegisteredText: "Dati biometrici collegati in modo sicuro al tuo account.",
    resendCodeIn: "Invia nuovamente il codice tra {segundos}s",
    resendCode: "Invia nuovamente il codice",
    sendingCode: "Invio del codice all'e-mail indicata...",
    codeSent: "Codice inviato.",
    newCodeSent: "Nuovo codice inviato.",
    invalidCodeLength: "Inserisci il codice di 6 cifre inviato alla tua e-mail.",
    checkingIdentity: "Verifica dell'identità...",
    doNotMove: "Non muoverti",
    faceRecognizedTitle: "Identità confermata!",
    faceRecognizedText: "Benvenuto, {nome}. Il tuo accesso sicuro è stato autorizzato.",
    cameraStarting: "Avvio fotocamera...", cameraWait: "Attendi alcuni secondi",
    faceSearching: "Ricerca del volto...", faceCenter: "Posiziona il volto al centro della fotocamera",
    cameraUnavailable: "Fotocamera non disponibile", cameraPermission: "Consenti l'accesso alla fotocamera nel browser",
    movementConfirmed: "Movimento confermato", lookFrontAgain: "Guarda di nuovo direttamente la fotocamera.",
    livenessCheck: "Prova di vitalità", turnHead: "Gira leggermente la testa da un lato.",
    correctPosition: "Posizione corretta", stayStillCount: "Rimani fermo... {atual}/2",
    livenessComplete: "Prova di vitalità completata", lookCameraCount: "Guarda la fotocamera... {atual}/2",
    analysisFailed: "Analisi non riuscita", checkPythonApi: "Verifica che l'API Python sia in esecuzione",
    adjustPosition: "Regola la posizione", validationFailed: "Impossibile convalidare",
    ambiguousIdentity: "Identità ambigua", faceNotRegistered: "Volto non registrato",
    faceNotFoundSecurely: "Non è stato possibile identificare il volto in modo sicuro. Accedi con e-mail e password."
  }
};

Object.entries(TRADUCOES_EXPERIENCIA_ACESSO).forEach(([idioma, tabela]) => {
  Object.assign(traducoes[idioma], tabela);
});

const STEEL_LITERAL_I18N = {
  "MÁQUINA SELECIONADA": {
    "en": "SELECTED MACHINE",
    "es": "MÁQUINA SELECCIONADA",
    "fr": "MACHINE SÉLECTIONNÉE",
    "de": "AUSGEWÄHLTE MASCHINE",
    "it": "MACCHINA SELEZIONATA"
  },
  "Carregando máquina...": {
    "en": "Loading machine...",
    "es": "Cargando máquina...",
    "fr": "Chargement de la machine...",
    "de": "Maschine wird geladen...",
    "it": "Caricamento macchina..."
  },
  "VISÃO GERAL": {
    "en": "OVERVIEW",
    "es": "VISTA GENERAL",
    "fr": "VUE D'ENSEMBLE",
    "de": "ÜBERSICHT",
    "it": "PANORAMICA"
  },
  "Cadastrados na empresa": {
    "en": "Registered in the company",
    "es": "Registrados en la empresa",
    "fr": "Enregistrés dans l'entreprise",
    "de": "Im Unternehmen registriert",
    "it": "Registrati nell'azienda"
  },
  "Funcionando normalmente": {
    "en": "Running normally",
    "es": "Funcionando normalmente",
    "fr": "Fonctionnement normal",
    "de": "Normaler Betrieb",
    "it": "Funzionamento normale"
  },
  "Em alerta": {
    "en": "In alert",
    "es": "En alerta",
    "fr": "En alerte",
    "de": "Alarmstatus",
    "it": "In allerta"
  },
  "Precisam de atenção": {
    "en": "Require attention",
    "es": "Requieren atención",
    "fr": "Nécessitent une attention",
    "de": "Benötigen Aufmerksamkeit",
    "it": "Richiedono attenzione"
  },
  "Equipamentos indisponíveis": {
    "en": "Unavailable equipment",
    "es": "Equipos no disponibles",
    "fr": "Équipements indisponibles",
    "de": "Nicht verfügbare Geräte",
    "it": "Attrezzature non disponibili"
  },
  "DESEMPENHO": {
    "en": "PERFORMANCE",
    "es": "RENDIMIENTO",
    "fr": "PERFORMANCE",
    "de": "LEISTUNG",
    "it": "PRESTAZIONI"
  },
  "Calculando condição geral...": {
    "en": "Calculating overall condition...",
    "es": "Calculando condición general...",
    "fr": "Calcul de l'état général...",
    "de": "Gesamtzustand wird berechnet...",
    "it": "Calcolo della condizione generale..."
  },
  "Operação normal": {
    "en": "Normal operation",
    "es": "Operación normal",
    "fr": "Fonctionnement normal",
    "de": "Normalbetrieb",
    "it": "Funzionamento normale"
  },
  "Atenção": {
    "en": "Attention",
    "es": "Atención",
    "fr": "Attention",
    "de": "Achtung",
    "it": "Attenzione"
  },
  "Crítico": {
    "en": "Critical",
    "es": "Crítico",
    "fr": "Critique",
    "de": "Kritisch",
    "it": "Critico"
  },
  "PRODUÇÃO": {
    "en": "PRODUCTION",
    "es": "PRODUCCIÓN",
    "fr": "PRODUCTION",
    "de": "PRODUKTION",
    "it": "PRODUZIONE"
  },
  "Produção total": {
    "en": "Total production",
    "es": "Producción total",
    "fr": "Production totale",
    "de": "Gesamtproduktion",
    "it": "Produzione totale"
  },
  "Consumo médio": {
    "en": "Average consumption",
    "es": "Consumo medio",
    "fr": "Consommation moyenne",
    "de": "Durchschnittsverbrauch",
    "it": "Consumo medio"
  },
  "energia": {
    "en": "energy",
    "es": "energía",
    "fr": "énergie",
    "de": "Energie",
    "it": "energia"
  },
  "Ciclos totais": {
    "en": "Total cycles",
    "es": "Ciclos totales",
    "fr": "Cycles totaux",
    "de": "Gesamtzyklen",
    "it": "Cicli totali"
  },
  "ciclos": {
    "en": "cycles",
    "es": "ciclos",
    "fr": "cycles",
    "de": "Zyklen",
    "it": "cicli"
  },
  "Temperatura média": {
    "en": "Average temperature",
    "es": "Temperatura media",
    "fr": "Température moyenne",
    "de": "Durchschnittstemperatur",
    "it": "Temperatura media"
  },
  "equipamentos": {
    "en": "equipment",
    "es": "equipos",
    "fr": "équipements",
    "de": "Geräte",
    "it": "attrezzature"
  },
  "Sensor": {
    "en": "Sensor",
    "es": "Sensor",
    "fr": "Capteur",
    "de": "Sensor",
    "it": "Sensore"
  },
  "Operação": {
    "en": "Operation",
    "es": "Operación",
    "fr": "Opération",
    "de": "Betrieb",
    "it": "Operazione"
  },
  "Consumo": {
    "en": "Consumption",
    "es": "Consumo",
    "fr": "Consommation",
    "de": "Verbrauch",
    "it": "Consumo"
  },
  "Evolução da produtividade da máquina": {
    "en": "Machine productivity evolution",
    "es": "Evolución de la productividad de la máquina",
    "fr": "Évolution de la productivité de la machine",
    "de": "Entwicklung der Maschinenproduktivität",
    "it": "Evoluzione della produttività della macchina"
  },
  "AO VIVO": {
    "en": "LIVE",
    "es": "EN VIVO",
    "fr": "EN DIRECT",
    "de": "LIVE",
    "it": "LIVE"
  },
  "Diagnóstico": {
    "en": "Diagnostics",
    "es": "Diagnóstico",
    "fr": "Diagnostic",
    "de": "Diagnose",
    "it": "Diagnostica"
  },
  "Condição operacional": {
    "en": "Operational condition",
    "es": "Condición operativa",
    "fr": "Condition opérationnelle",
    "de": "Betriebszustand",
    "it": "Condizione operativa"
  },
  "Situação atual": {
    "en": "Current status",
    "es": "Situación actual",
    "fr": "Situation actuelle",
    "de": "Aktueller Zustand",
    "it": "Situazione attuale"
  },
  "Status da máquina": {
    "en": "Machine status",
    "es": "Estado de la máquina",
    "fr": "État de la machine",
    "de": "Maschinenstatus",
    "it": "Stato della macchina"
  },
  "Ver manutenção": {
    "en": "View maintenance",
    "es": "Ver mantenimiento",
    "fr": "Voir la maintenance",
    "de": "Wartung anzeigen",
    "it": "Vedi manutenzione"
  },
  "Análise operacional": {
    "en": "Operational analysis",
    "es": "Análisis operativo",
    "fr": "Analyse opérationnelle",
    "de": "Betriebsanalyse",
    "it": "Analisi operativa"
  },
  "Indicadores da máquina": {
    "en": "Machine indicators",
    "es": "Indicadores de la máquina",
    "fr": "Indicateurs de la machine",
    "de": "Maschinenkennzahlen",
    "it": "Indicatori della macchina"
  },
  "Sensor térmico": {
    "en": "Thermal sensor",
    "es": "Sensor térmico",
    "fr": "Capteur thermique",
    "de": "Temperatursensor",
    "it": "Sensore termico"
  },
  "Eficiência": {
    "en": "Efficiency",
    "es": "Eficiencia",
    "fr": "Efficacité",
    "de": "Effizienz",
    "it": "Efficienza"
  },
  "Acessos rápidos": {
    "en": "Quick access",
    "es": "Accesos rápidos",
    "fr": "Accès rapides",
    "de": "Schnellzugriff",
    "it": "Accessi rapidi"
  },
  "Máquina": {
    "en": "Machine",
    "es": "Máquina",
    "fr": "Machine",
    "de": "Maschine",
    "it": "Macchina"
  },
  "Visualizar informações": {
    "en": "View information",
    "es": "Ver información",
    "fr": "Voir les informations",
    "de": "Informationen anzeigen",
    "it": "Visualizza informazioni"
  },
  "Histórico e registros": {
    "en": "History and records",
    "es": "Historial y registros",
    "fr": "Historique et enregistrements",
    "de": "Historie und Einträge",
    "it": "Storico e registri"
  },
  "Ocorrências da máquina": {
    "en": "Machine events",
    "es": "Eventos de la máquina",
    "fr": "Événements de la machine",
    "de": "Maschinenereignisse",
    "it": "Eventi della macchina"
  },
  "Personalize o SteelControl e gerencie sua empresa.": {
    "en": "Customize SteelControl and manage your company.",
    "es": "Personalice SteelControl y gestione su empresa.",
    "fr": "Personnalisez SteelControl et gérez votre entreprise.",
    "de": "Passen Sie SteelControl an und verwalten Sie Ihr Unternehmen.",
    "it": "Personalizza SteelControl e gestisci la tua azienda."
  },
  "Personalização": {
    "en": "Customization",
    "es": "Personalización",
    "fr": "Personnalisation",
    "de": "Personalisierung",
    "it": "Personalizzazione"
  },
  "Aparência": {
    "en": "Appearance",
    "es": "Apariencia",
    "fr": "Apparence",
    "de": "Darstellung",
    "it": "Aspetto"
  },
  "Escolha o idioma e o tema visual do sistema.": {
    "en": "Choose the system language and visual theme.",
    "es": "Elija el idioma y el tema visual del sistema.",
    "fr": "Choisissez la langue et le thème visuel du système.",
    "de": "Wählen Sie Sprache und Design des Systems.",
    "it": "Scegli la lingua e il tema visivo del sistema."
  },
  "Idioma": {
    "en": "Language",
    "es": "Idioma",
    "fr": "Langue",
    "de": "Sprache",
    "it": "Lingua"
  },
  "Idioma utilizado na interface": {
    "en": "Language used in the interface",
    "es": "Idioma utilizado en la interfaz",
    "fr": "Langue utilisée dans l'interface",
    "de": "In der Oberfläche verwendete Sprache",
    "it": "Lingua usata nell'interfaccia"
  },
  "Tema": {
    "en": "Theme",
    "es": "Tema",
    "fr": "Thème",
    "de": "Design",
    "it": "Tema"
  },
  "Aparência geral do SteelControl": {
    "en": "SteelControl overall appearance",
    "es": "Apariencia general de SteelControl",
    "fr": "Apparence générale de SteelControl",
    "de": "Allgemeines Erscheinungsbild von SteelControl",
    "it": "Aspetto generale di SteelControl"
  },
  "Claro": {
    "en": "Light",
    "es": "Claro",
    "fr": "Clair",
    "de": "Hell",
    "it": "Chiaro"
  },
  "Escuro": {
    "en": "Dark",
    "es": "Oscuro",
    "fr": "Sombre",
    "de": "Dunkel",
    "it": "Scuro"
  },
  "Organização": {
    "en": "Organization",
    "es": "Organización",
    "fr": "Organisation",
    "de": "Organisation",
    "it": "Organizzazione"
  },
  "Informações da empresa vinculada à sua conta.": {
    "en": "Company information linked to your account.",
    "es": "Información de la empresa vinculada a su cuenta.",
    "fr": "Informations de l'entreprise liées à votre compte.",
    "de": "Mit Ihrem Konto verknüpfte Unternehmensinformationen.",
    "it": "Informazioni dell'azienda collegate al tuo account."
  },
  "Empresa": {
    "en": "Company",
    "es": "Empresa",
    "fr": "Entreprise",
    "de": "Unternehmen",
    "it": "Azienda"
  },
  "Empresa ativa": {
    "en": "Active company",
    "es": "Empresa activa",
    "fr": "Entreprise active",
    "de": "Aktives Unternehmen",
    "it": "Azienda attiva"
  },
  "Funcionários": {
    "en": "Employees",
    "es": "Empleados",
    "fr": "Employés",
    "de": "Mitarbeiter",
    "it": "Dipendenti"
  },
  "Com facial": {
    "en": "With face ID",
    "es": "Con reconocimiento facial",
    "fr": "Avec reconnaissance faciale",
    "de": "Mit Gesichtserkennung",
    "it": "Con riconoscimento facciale"
  },
  "Gerenciar Minha Empresa": {
    "en": "Manage My Company",
    "es": "Gestionar Mi Empresa",
    "fr": "Gérer Mon Entreprise",
    "de": "Mein Unternehmen verwalten",
    "it": "Gestisci La Mia Azienda"
  },
  "GESTÃO DE EQUIPAMENTOS": {
    "en": "EQUIPMENT MANAGEMENT",
    "es": "GESTIÓN DE EQUIPOS",
    "fr": "GESTION DES ÉQUIPEMENTS",
    "de": "GERÄTEVERWALTUNG",
    "it": "GESTIONE ATTREZZATURE"
  },
  "Cadastre a identificação e, se desejar, deixe preparada a configuração de comunicação para integração com o equipamento real.": {
    "en": "Register the identification and, if desired, prepare the communication settings for integration with the real equipment.",
    "es": "Registre la identificación y, si lo desea, prepare la configuración de comunicación para integrar el equipo real.",
    "fr": "Enregistrez l'identification et, si vous le souhaitez, préparez la configuration de communication pour l'intégration avec l'équipement réel.",
    "de": "Erfassen Sie die Identifikation und bereiten Sie bei Bedarf die Kommunikation für die Integration mit dem realen Gerät vor.",
    "it": "Registra l'identificazione e, se desideri, prepara la configurazione di comunicazione per l'integrazione con l'apparecchiatura reale."
  },
  "Comunicação industrial": {
    "en": "Industrial communication",
    "es": "Comunicación industrial",
    "fr": "Communication industrielle",
    "de": "Industriekommunikation",
    "it": "Comunicazione industriale"
  },
  "Configuração opcional para equipamento real": {
    "en": "Optional setup for real equipment",
    "es": "Configuración opcional para equipo real",
    "fr": "Configuration optionnelle pour équipement réel",
    "de": "Optionale Einrichtung für reale Geräte",
    "it": "Configurazione opzionale per apparecchiatura reale"
  },
  "Informe os dados fornecidos pelo fabricante, CLP, gateway ou controlador. O SteelControl salva essa configuração para a integração futura sem transformar o equipamento em uma simulação.": {
    "en": "Enter the data provided by the manufacturer, PLC, gateway or controller. SteelControl stores this configuration for future integration without turning the equipment into a simulation.",
    "es": "Introduzca los datos proporcionados por el fabricante, PLC, gateway o controlador. SteelControl guarda esta configuración para una integración futura sin convertir el equipo en una simulación.",
    "fr": "Saisissez les données fournies par le fabricant, l'automate, la passerelle ou le contrôleur. SteelControl enregistre cette configuration pour une intégration future sans transformer l'équipement en simulation.",
    "de": "Geben Sie die vom Hersteller, der SPS, dem Gateway oder Controller bereitgestellten Daten ein. SteelControl speichert diese Konfiguration für eine spätere Integration, ohne das Gerät zu simulieren.",
    "it": "Inserisci i dati forniti dal produttore, PLC, gateway o controller. SteelControl salva questa configurazione per una futura integrazione senza trasformare l'apparecchiatura in una simulazione."
  },
  "Protocolo": {
    "en": "Protocol",
    "es": "Protocolo",
    "fr": "Protocole",
    "de": "Protokoll",
    "it": "Protocollo"
  },
  "Configurar depois": {
    "en": "Configure later",
    "es": "Configurar después",
    "fr": "Configurer plus tard",
    "de": "Später konfigurieren",
    "it": "Configura più tardi"
  },
  "IP / Host": {
    "en": "IP / Host",
    "es": "IP / Host",
    "fr": "IP / Hôte",
    "de": "IP / Host",
    "it": "IP / Host"
  },
  "Porta": {
    "en": "Port",
    "es": "Puerto",
    "fr": "Port",
    "de": "Port",
    "it": "Porta"
  },
  "Unit ID / Device ID": {
    "en": "Unit ID / Device ID",
    "es": "Unit ID / Device ID",
    "fr": "Unit ID / Device ID",
    "de": "Unit ID / Device ID",
    "it": "Unit ID / Device ID"
  },
  "Endpoint / caminho": {
    "en": "Endpoint / path",
    "es": "Endpoint / ruta",
    "fr": "Endpoint / chemin",
    "de": "Endpoint / Pfad",
    "it": "Endpoint / percorso"
  },
  "Tópico MQTT (se aplicável)": {
    "en": "MQTT topic (if applicable)",
    "es": "Tema MQTT (si aplica)",
    "fr": "Sujet MQTT (si applicable)",
    "de": "MQTT-Thema (falls zutreffend)",
    "it": "Topic MQTT (se applicabile)"
  },
  "PARQUE INDUSTRIAL": {
    "en": "INDUSTRIAL PARK",
    "es": "PARQUE INDUSTRIAL",
    "fr": "PARC INDUSTRIEL",
    "de": "INDUSTRIEPARK",
    "it": "PARCO INDUSTRIALE"
  },
  "Carregando empresa...": {
    "en": "Loading company...",
    "es": "Cargando empresa...",
    "fr": "Chargement de l'entreprise...",
    "de": "Unternehmen wird geladen...",
    "it": "Caricamento azienda..."
  },
  "Status": {
    "en": "Status",
    "es": "Estado",
    "fr": "Statut",
    "de": "Status",
    "it": "Stato"
  },
  "Protegido": {
    "en": "Protected",
    "es": "Protegido",
    "fr": "Protégé",
    "de": "Geschützt",
    "it": "Protetto"
  },
  "Mantenha os dados e o endereço da organização atualizados.": {
    "en": "Keep your organization's information and address up to date.",
    "es": "Mantenga actualizados los datos y la dirección de la organización.",
    "fr": "Maintenez à jour les données et l'adresse de l'organisation.",
    "de": "Halten Sie die Daten und die Adresse Ihrer Organisation aktuell.",
    "it": "Mantieni aggiornati i dati e l'indirizzo dell'organizzazione."
  },
  "Endereço da empresa": {
    "en": "Company address",
    "es": "Dirección de la empresa",
    "fr": "Adresse de l'entreprise",
    "de": "Unternehmensadresse",
    "it": "Indirizzo dell'azienda"
  },
  "As informações abaixo serão usadas para gerar o mapa.": {
    "en": "The information below will be used to generate the map.",
    "es": "La información siguiente se utilizará para generar el mapa.",
    "fr": "Les informations ci-dessous seront utilisées pour générer la carte.",
    "de": "Die folgenden Informationen werden zur Kartenerstellung verwendet.",
    "it": "Le informazioni seguenti verranno utilizzate per generare la mappa."
  },
  "Rua / Avenida": {
    "en": "Street / Avenue",
    "es": "Calle / Avenida",
    "fr": "Rue / Avenue",
    "de": "Straße / Allee",
    "it": "Via / Viale"
  },
  "Localização cadastrada da empresa.": {
    "en": "Registered company location.",
    "es": "Ubicación registrada de la empresa.",
    "fr": "Localisation enregistrée de l'entreprise.",
    "de": "Registrierter Unternehmensstandort.",
    "it": "Posizione registrata dell'azienda."
  },
  "Localização não cadastrada": {
    "en": "No location registered",
    "es": "Ubicación no registrada",
    "fr": "Localisation non enregistrée",
    "de": "Kein Standort registriert",
    "it": "Posizione non registrata"
  },
  "Clique em editar dados e informe o endereço da empresa.": {
    "en": "Click edit data and enter the company address.",
    "es": "Haga clic en editar datos e introduzca la dirección de la empresa.",
    "fr": "Cliquez sur modifier les données et renseignez l'adresse de l'entreprise.",
    "de": "Klicken Sie auf Daten bearbeiten und geben Sie die Unternehmensadresse ein.",
    "it": "Fai clic su modifica dati e inserisci l'indirizzo dell'azienda."
  },
  "Abrir localização no Google Maps": {
    "en": "Open location in Google Maps",
    "es": "Abrir ubicación en Google Maps",
    "fr": "Ouvrir la localisation dans Google Maps",
    "de": "Standort in Google Maps öffnen",
    "it": "Apri posizione in Google Maps"
  },
  "Informações da conta atualmente autenticada.": {
    "en": "Information about the currently authenticated account.",
    "es": "Información de la cuenta actualmente autenticada.",
    "fr": "Informations sur le compte actuellement authentifié.",
    "de": "Informationen zum aktuell authentifizierten Konto.",
    "it": "Informazioni sull'account attualmente autenticato."
  },
  "Cadastre usuários e configure o reconhecimento facial de cada funcionário.": {
    "en": "Register users and configure facial recognition for each employee.",
    "es": "Registre usuarios y configure el reconocimiento facial de cada empleado.",
    "fr": "Enregistrez les utilisateurs et configurez la reconnaissance faciale de chaque employé.",
    "de": "Registrieren Sie Benutzer und konfigurieren Sie die Gesichtserkennung für jeden Mitarbeiter.",
    "it": "Registra gli utenti e configura il riconoscimento facciale per ogni dipendente."
  },
  "Carregando funcionários...": {
    "en": "Loading employees...",
    "es": "Cargando empleados...",
    "fr": "Chargement des employés...",
    "de": "Mitarbeiter werden geladen...",
    "it": "Caricamento dipendenti..."
  },
  "Cadastre uma pessoa para acessar o SteelControl.": {
    "en": "Register a person to access SteelControl.",
    "es": "Registre una persona para acceder a SteelControl.",
    "fr": "Enregistrez une personne pour accéder à SteelControl.",
    "de": "Registrieren Sie eine Person für den Zugriff auf SteelControl.",
    "it": "Registra una persona per accedere a SteelControl."
  },
  "Nome completo": {
    "en": "Full name",
    "es": "Nombre completo",
    "fr": "Nom complet",
    "de": "Vollständiger Name",
    "it": "Nome completo"
  },
  "Senha inicial": {
    "en": "Initial password",
    "es": "Contraseña inicial",
    "fr": "Mot de passe initial",
    "de": "Initiales Passwort",
    "it": "Password iniziale"
  },
  "Selecione o cargo": {
    "en": "Select role",
    "es": "Seleccione el cargo",
    "fr": "Sélectionnez le rôle",
    "de": "Rolle auswählen",
    "it": "Seleziona ruolo"
  },
  "Funcionário": {
    "en": "Employee",
    "es": "Empleado",
    "fr": "Employé",
    "de": "Mitarbeiter",
    "it": "Dipendente"
  },
  "Confirmo que o funcionário autorizou o uso dos dados biométricos para autenticação.": {
    "en": "I confirm that the employee authorized the use of biometric data for authentication.",
    "es": "Confirmo que el empleado autorizó el uso de datos biométricos para autenticación.",
    "fr": "Je confirme que l'employé a autorisé l'utilisation des données biométriques pour l'authentification.",
    "de": "Ich bestätige, dass der Mitarbeiter der Nutzung biometrischer Daten zur Authentifizierung zugestimmt hat.",
    "it": "Confermo che il dipendente ha autorizzato l'uso dei dati biometrici per l'autenticazione."
  },
  "Abrindo câmera...": {
    "en": "Opening camera...",
    "es": "Abriendo cámara...",
    "fr": "Ouverture de la caméra...",
    "de": "Kamera wird geöffnet...",
    "it": "Apertura fotocamera..."
  },
  "Posicione seu rosto no centro.": {
    "en": "Center your face.",
    "es": "Centre su rostro.",
    "fr": "Centrez votre visage.",
    "de": "Zentrieren Sie Ihr Gesicht.",
    "it": "Centra il volto."
  },
  "Qualidade da captura": {
    "en": "Capture quality",
    "es": "Calidad de captura",
    "fr": "Qualité de la capture",
    "de": "Aufnahmequalität",
    "it": "Qualità acquisizione"
  },
  "Olhe diretamente para a câmera. Evite bonés, óculos escuros e pouca iluminação.": {
    "en": "Look directly at the camera. Avoid hats, dark glasses and poor lighting.",
    "es": "Mire directamente a la cámara. Evite gorras, gafas oscuras y poca iluminación.",
    "fr": "Regardez directement la caméra. Évitez les casquettes, lunettes de soleil et le faible éclairage.",
    "de": "Blicken Sie direkt in die Kamera. Vermeiden Sie Mützen, Sonnenbrillen und schlechte Beleuchtung.",
    "it": "Guarda direttamente la fotocamera. Evita cappelli, occhiali scuri e scarsa illuminazione."
  },
  "Entre com seu e-mail corporativo e acesse o ambiente de gestão da sua empresa no SteelControl.": {
    "en": "Sign in with your corporate email and access your company's management environment in SteelControl.",
    "es": "Inicie sesión con su correo corporativo y acceda al entorno de gestión de su empresa en SteelControl.",
    "fr": "Connectez-vous avec votre e-mail professionnel et accédez à l'environnement de gestion de votre entreprise dans SteelControl.",
    "de": "Melden Sie sich mit Ihrer geschäftlichen E-Mail an und greifen Sie auf die Verwaltungsumgebung Ihres Unternehmens in SteelControl zu.",
    "it": "Accedi con la tua e-mail aziendale e apri l'ambiente di gestione della tua azienda in SteelControl."
  },
  "Centralize máquinas, manutenção, produção, equipes e segurança em uma única plataforma.": {
    "en": "Centralize machines, maintenance, production, teams and security on a single platform.",
    "es": "Centralice máquinas, mantenimiento, producción, equipos y seguridad en una sola plataforma.",
    "fr": "Centralisez les machines, la maintenance, la production, les équipes et la sécurité sur une seule plateforme.",
    "de": "Zentralisieren Sie Maschinen, Wartung, Produktion, Teams und Sicherheit auf einer einzigen Plattform.",
    "it": "Centralizza macchine, manutenzione, produzione, team e sicurezza in un'unica piattaforma."
  },
  "Acesso rápido e seguro por biometria": {
    "en": "Fast and secure biometric access",
    "es": "Acceso biométrico rápido y seguro",
    "fr": "Accès biométrique rapide et sécurisé",
    "de": "Schneller und sicherer biometrischer Zugriff",
    "it": "Accesso biometrico rapido e sicuro"
  },
  "Sua empresa ainda não está no SteelControl?": {
    "en": "Is your company not on SteelControl yet?",
    "es": "¿Su empresa aún no está en SteelControl?",
    "fr": "Votre entreprise n'est pas encore sur SteelControl ?",
    "de": "Ist Ihr Unternehmen noch nicht bei SteelControl?",
    "it": "La tua azienda non è ancora su SteelControl?"
  },
  "Cadastre sua organização e comece a estruturar uma gestão industrial mais conectada, organizada e inteligente.": {
    "en": "Register your organization and start building more connected, organized and intelligent industrial management.",
    "es": "Registre su organización y comience una gestión industrial más conectada, organizada e inteligente.",
    "fr": "Enregistrez votre organisation et commencez à structurer une gestion industrielle plus connectée, organisée et intelligente.",
    "de": "Registrieren Sie Ihre Organisation und beginnen Sie mit einem vernetzteren, organisierteren und intelligenteren Industriemanagement.",
    "it": "Registra la tua organizzazione e inizia una gestione industriale più connessa, organizzata e intelligente."
  },
  "Equipes e acessos": {
    "en": "Teams and access",
    "es": "Equipos y accesos",
    "fr": "Équipes et accès",
    "de": "Teams und Zugriffe",
    "it": "Team e accessi"
  },
  "Monitoramento industrial": {
    "en": "Industrial monitoring",
    "es": "Monitoreo industrial",
    "fr": "Surveillance industrielle",
    "de": "Industrieüberwachung",
    "it": "Monitoraggio industriale"
  },
  "Comece no SteelControl": {
    "en": "Get started with SteelControl",
    "es": "Comience con SteelControl",
    "fr": "Commencez avec SteelControl",
    "de": "Starten Sie mit SteelControl",
    "it": "Inizia con SteelControl"
  },
  "Crie o ambiente da sua organização e cadastre o primeiro administrador do sistema.": {
    "en": "Create your organization's environment and register the first system administrator.",
    "es": "Cree el entorno de su organización y registre al primer administrador del sistema.",
    "fr": "Créez l'environnement de votre organisation et enregistrez le premier administrateur du système.",
    "de": "Erstellen Sie die Umgebung Ihrer Organisation und registrieren Sie den ersten Systemadministrator.",
    "it": "Crea l'ambiente della tua organizzazione e registra il primo amministratore del sistema."
  },
  "O usuário criado abaixo será o primeiro administrador da empresa.": {
    "en": "The user created below will be the company's first administrator.",
    "es": "El usuario creado a continuación será el primer administrador de la empresa.",
    "fr": "L'utilisateur créé ci-dessous sera le premier administrateur de l'entreprise.",
    "de": "Der unten erstellte Benutzer wird der erste Administrator des Unternehmens.",
    "it": "L'utente creato di seguito sarà il primo amministratore dell'azienda."
  },
  "Opcional": {
    "en": "Optional",
    "es": "Opcional",
    "fr": "Optionnel",
    "de": "Optional",
    "it": "Opzionale"
  },
  "Acesso protegido": {
    "en": "Protected access",
    "es": "Acceso protegido",
    "fr": "Accès protégé",
    "de": "Geschützter Zugriff",
    "it": "Accesso protetto"
  },
  "SteelControl Gestão Industrial": {
    "en": "SteelControl Industrial Management",
    "es": "SteelControl Gestión Industrial",
    "fr": "SteelControl Gestion Industrielle",
    "de": "SteelControl Industriemanagement",
    "it": "SteelControl Gestione Industriale"
  },
  "Sua operação industrial": {
    "en": "Your industrial operation",
    "es": "Su operación industrial",
    "fr": "Votre activité industrielle",
    "de": "Ihr Industriebetrieb",
    "it": "La tua attività industriale"
  },
  "conectada": {
    "en": "connected",
    "es": "conectada",
    "fr": "connectée",
    "de": "vernetzt",
    "it": "connessa"
  },
  "em um só lugar.": {
    "en": "in one place.",
    "es": "en un solo lugar.",
    "fr": "en un seul endroit.",
    "de": "an einem Ort.",
    "it": "in un unico posto."
  },
  "Mais controle, mais segurança e mais informação para decisões melhores.": {
    "en": "More control, more security and more information for better decisions.",
    "es": "Más control, más seguridad y más información para tomar mejores decisiones.",
    "fr": "Plus de contrôle, plus de sécurité et plus d'informations pour de meilleures décisions.",
    "de": "Mehr Kontrolle, mehr Sicherheit und mehr Informationen für bessere Entscheidungen.",
    "it": "Più controllo, più sicurezza e più informazioni per decisioni migliori."
  },
  "Tecnologia para ambientes industriais": {
    "en": "Technology for industrial environments",
    "es": "Tecnología para entornos industriales",
    "fr": "Technologie pour les environnements industriels",
    "de": "Technologie für industrielle Umgebungen",
    "it": "Tecnologia per ambienti industriali"
  },
  "em tempo real": {
    "en": "in real time",
    "es": "en tiempo real",
    "fr": "en temps réel",
    "de": "in Echtzeit",
    "it": "in tempo reale"
  },
  "empresarial": {
    "en": "enterprise",
    "es": "empresarial",
    "fr": "d'entreprise",
    "de": "Unternehmen",
    "it": "aziendale"
  },
  "Gestão de": {
    "en": "Team",
    "es": "Gestión de",
    "fr": "Gestion des",
    "de": "Verwaltung von",
    "it": "Gestione di"
  },
  "equipes": {
    "en": "management",
    "es": "equipos",
    "fr": "équipes",
    "de": "Teams",
    "it": "team"
  },
  "Autenticação biométrica integrada.": {
    "en": "Integrated biometric authentication.",
    "es": "Autenticación biométrica integrada.",
    "fr": "Authentification biométrique intégrée.",
    "de": "Integrierte biometrische Authentifizierung.",
    "it": "Autenticazione biometrica integrata."
  },
  "Mais controle para sua operação.": {
    "en": "More control for your operation.",
    "es": "Más control para su operación.",
    "fr": "Plus de contrôle pour votre activité.",
    "de": "Mehr Kontrolle für Ihren Betrieb.",
    "it": "Più controllo per la tua attività."
  },
  "Mais informação para suas decisões.": {
    "en": "More information for your decisions.",
    "es": "Más información para sus decisiones.",
    "fr": "Plus d'informations pour vos décisions.",
    "de": "Mehr Informationen für Ihre Entscheidungen.",
    "it": "Più informazioni per le tue decisioni."
  },
  "Brasil": {
    "en": "Brazil",
    "es": "Brasil",
    "fr": "Brésil",
    "de": "Brasilien",
    "it": "Brasile"
  },
  "© 2026 SteelControl. Todos os direitos reservados.": {
    "en": "© 2026 SteelControl. All rights reserved.",
    "es": "© 2026 SteelControl. Todos los derechos reservados.",
    "fr": "© 2026 SteelControl. Tous droits réservés.",
    "de": "© 2026 SteelControl. Alle Rechte vorbehalten.",
    "it": "© 2026 SteelControl. Tutti i diritti riservati."
  }
};


Object.assign(STEEL_LITERAL_I18N, {
  "Gestão Industrial": {
    en: "Industrial Management",
    es: "Gestión Industrial",
    fr: "Gestion Industrielle",
    de: "Industriemanagement",
    it: "Gestione Industriale"
  },
  "CNPJ:": {
    en: "Company ID:",
    es: "ID de empresa:",
    fr: "Identifiant de l'entreprise :",
    de: "Unternehmens-ID:",
    it: "ID azienda:"
  },
  "CNPJ: -": {
    en: "Company ID: -",
    es: "ID de empresa: -",
    fr: "Identifiant de l'entreprise : -",
    de: "Unternehmens-ID: -",
    it: "ID azienda: -"
  }
});

// Cobertura das telas adicionadas depois do primeiro dicionário.
// A função curta mantém as cinco traduções juntas e facilita a auditoria.
const steelL = (en, es, fr, de, it) => ({ en, es, fr, de, it });

Object.assign(STEEL_LITERAL_I18N, {
  // Login e criação de conta
  "Obrigatório": steelL("Required", "Obligatorio", "Obligatoire", "Erforderlich", "Obbligatorio"),
  "03 Biometria facial": steelL("03 Facial biometrics", "03 Biometría facial", "03 Biométrie faciale", "03 Gesichtsbiometrie", "03 Biometria facciale"),
  "Depois de confirmar o código do e-mail, a câmera abrirá automaticamente para cadastrar o rosto do administrador.": steelL("After confirming the email code, the camera will open automatically to register the administrator's face.", "Después de confirmar el código del correo, la cámara se abrirá automáticamente para registrar el rostro del administrador.", "Après confirmation du code reçu par e-mail, la caméra s'ouvrira automatiquement pour enregistrer le visage de l'administrateur.", "Nach Bestätigung des E-Mail-Codes öffnet sich die Kamera automatisch, um das Gesicht des Administrators zu registrieren.", "Dopo aver confermato il codice e-mail, la fotocamera si aprirà automaticamente per registrare il volto dell'amministratore."),
  "Confirme seu e-mail": steelL("Confirm your email", "Confirme su correo", "Confirmez votre e-mail", "Bestätigen Sie Ihre E-Mail", "Conferma la tua e-mail"),
  "Enviamos um código de 6 dígitos para": steelL("We sent a 6-digit code to", "Enviamos un código de 6 dígitos a", "Nous avons envoyé un code à 6 chiffres à", "Wir haben einen 6-stelligen Code gesendet an", "Abbiamo inviato un codice di 6 cifre a"),
  "seu e-mail": steelL("your email", "su correo", "votre e-mail", "Ihre E-Mail", "la tua e-mail"),
  ". A empresa só será criada depois da confirmação.": steelL(". The company will only be created after confirmation.", ". La empresa solo se creará después de la confirmación.", ". L'entreprise ne sera créée qu'après confirmation.", ". Das Unternehmen wird erst nach der Bestätigung erstellt.", ". L'azienda verrà creata solo dopo la conferma."),
  "Código de confirmação": steelL("Confirmation code", "Código de confirmación", "Code de confirmation", "Bestätigungscode", "Codice di conferma"),
  "Confirmar e criar conta": steelL("Confirm and create account", "Confirmar y crear cuenta", "Confirmer et créer le compte", "Bestätigen und Konto erstellen", "Conferma e crea account"),
  "Reenviar código": steelL("Resend code", "Reenviar código", "Renvoyer le code", "Code erneut senden", "Invia nuovamente il codice"),
  "Alterar dados": steelL("Edit information", "Modificar datos", "Modifier les informations", "Daten ändern", "Modifica dati"),
  "Verificar e-mail e continuar": steelL("Verify email and continue", "Verificar correo y continuar", "Vérifier l'e-mail et continuer", "E-Mail prüfen und fortfahren", "Verifica e-mail e continua"),

  // Minha empresa e biometria
  "Remover logo": steelL("Remove logo", "Eliminar logo", "Supprimer le logo", "Logo entfernen", "Rimuovi logo"),
  "E-mail institucional da empresa": steelL("Company email", "Correo institucional de la empresa", "E-mail institutionnel de l'entreprise", "Unternehmens-E-Mail", "E-mail aziendale"),
  "As informações abaixo ficam disponíveis localmente no SteelControl.": steelL("The information below remains available locally in SteelControl.", "La información siguiente permanece disponible localmente en SteelControl.", "Les informations ci-dessous restent disponibles localement dans SteelControl.", "Die folgenden Informationen bleiben lokal in SteelControl verfügbar.", "Le informazioni seguenti restano disponibili localmente in SteelControl."),
  "Localização cadastrada": steelL("Saved location", "Ubicación registrada", "Emplacement enregistré", "Gespeicherter Standort", "Posizione registrata"),
  "Dados de localização disponíveis mesmo sem internet.": steelL("Location data available even without internet.", "Datos de ubicación disponibles incluso sin internet.", "Données de localisation disponibles même sans Internet.", "Standortdaten sind auch ohne Internet verfügbar.", "Dati sulla posizione disponibili anche senza Internet."),
  "Copiar endereço": steelL("Copy address", "Copiar dirección", "Copier l'adresse", "Adresse kopieren", "Copia indirizzo"),
  "Editar acesso": steelL("Edit access", "Editar acceso", "Modifier l'accès", "Zugriff bearbeiten", "Modifica accesso"),
  "Atualize e-mail, senha, nome e cargo.": steelL("Update email, password, name and role.", "Actualice correo, contraseña, nombre y cargo.", "Mettez à jour l'e-mail, le mot de passe, le nom et le rôle.", "Aktualisieren Sie E-Mail, Passwort, Name und Rolle.", "Aggiorna e-mail, password, nome e ruolo."),
  "E-mail de acesso": steelL("Access email", "Correo de acceso", "E-mail d'accès", "Zugangs-E-Mail", "E-mail di accesso"),
  "Ao alterar o próprio e-mail de administrador, um código de 6 dígitos será enviado ao novo endereço.": steelL("When changing your administrator email, a 6-digit code will be sent to the new address.", "Al cambiar su correo de administrador, se enviará un código de 6 dígitos a la nueva dirección.", "Lors du changement de votre e-mail administrateur, un code à 6 chiffres sera envoyé à la nouvelle adresse.", "Beim Ändern Ihrer Administrator-E-Mail wird ein 6-stelliger Code an die neue Adresse gesendet.", "Quando modifichi l'e-mail amministratore, verrà inviato un codice di 6 cifre al nuovo indirizzo."),
  "Nova senha": steelL("New password", "Nueva contraseña", "Nouveau mot de passe", "Neues Passwort", "Nuova password"),
  "Confirme o novo e-mail": steelL("Confirm the new email", "Confirme el nuevo correo", "Confirmez le nouvel e-mail", "Neue E-Mail bestätigen", "Conferma la nuova e-mail"),
  "Digite o código enviado para o novo endereço.": steelL("Enter the code sent to the new address.", "Ingrese el código enviado a la nueva dirección.", "Saisissez le code envoyé à la nouvelle adresse.", "Geben Sie den an die neue Adresse gesendeten Code ein.", "Inserisci il codice inviato al nuovo indirizzo."),
  "Confirmar código": steelL("Confirm code", "Confirmar código", "Confirmer le code", "Code bestätigen", "Conferma codice"),
  "Nome desta facial": steelL("Name for this face ID", "Nombre de este reconocimiento facial", "Nom de cette biométrie faciale", "Name dieser Gesichts-ID", "Nome di questa biometria facciale"),
  "Esse nome será usado para identificar a amostra na hora de remover.": steelL("This name will identify the sample when it is removed.", "Este nombre identificará la muestra al eliminarla.", "Ce nom identifiera l'échantillon lors de sa suppression.", "Dieser Name kennzeichnet die Probe beim Entfernen.", "Questo nome identificherà il campione durante la rimozione."),
  "Confirmo que o funcionário autorizou o uso dos dados biométricos para autenticação. Cada rosto pode ficar vinculado a apenas um perfil no SteelControl.": steelL("I confirm that the employee authorized the use of biometric data for authentication. Each face can be linked to only one SteelControl profile.", "Confirmo que el empleado autorizó el uso de datos biométricos para autenticación. Cada rostro solo puede vincularse a un perfil de SteelControl.", "Je confirme que l'employé a autorisé l'utilisation des données biométriques pour l'authentification. Chaque visage ne peut être lié qu'à un seul profil SteelControl.", "Ich bestätige, dass der Mitarbeiter die Nutzung biometrischer Daten zur Authentifizierung genehmigt hat. Jedes Gesicht kann nur mit einem SteelControl-Profil verknüpft werden.", "Confermo che il dipendente ha autorizzato l'uso dei dati biometrici per l'autenticazione. Ogni volto può essere collegato a un solo profilo SteelControl."),
  "Biometria cadastrada": steelL("Biometrics registered", "Biometría registrada", "Biométrie enregistrée", "Biometrie registriert", "Biometria registrata"),
  "Este perfil pode possuir apenas uma biometria. Remova-a somente quando precisar cadastrar outro rosto.": steelL("This profile can have only one biometric identity. Remove it only when another face must be registered.", "Este perfil solo puede tener una identidad biométrica. Elimínela únicamente cuando necesite registrar otro rostro.", "Ce profil ne peut avoir qu'une seule identité biométrique. Supprimez-la uniquement pour enregistrer un autre visage.", "Dieses Profil kann nur eine biometrische Identität haben. Entfernen Sie sie nur, wenn ein anderes Gesicht registriert werden muss.", "Questo profilo può avere una sola identità biometrica. Rimuovila solo quando devi registrare un altro volto."),

  // Cadastro e comunicação de equipamentos
  "Informe o controlador, protocolo e dados de comunicação fornecidos pelo fabricante, CLP, gateway ou controlador do equipamento.": steelL("Enter the controller, protocol and communication data provided by the equipment manufacturer, PLC, gateway or controller.", "Informe el controlador, protocolo y datos de comunicación proporcionados por el fabricante, PLC, gateway o controlador del equipo.", "Renseignez le contrôleur, le protocole et les données de communication fournis par le fabricant, l'automate, la passerelle ou le contrôleur de l'équipement.", "Geben Sie Controller, Protokoll und Kommunikationsdaten des Herstellers, der SPS, des Gateways oder des Gerätesteuergeräts ein.", "Inserisci controller, protocollo e dati di comunicazione forniti dal produttore, PLC, gateway o controller dell'apparecchiatura."),
  "Modo de operação": steelL("Operating mode", "Modo de operación", "Mode de fonctionnement", "Betriebsmodus", "Modalità operativa"),
  "Simulação do SteelControl": steelL("SteelControl simulation", "Simulación de SteelControl", "Simulation SteelControl", "SteelControl-Simulation", "Simulazione SteelControl"),
  "Equipamento real": steelL("Real equipment", "Equipo real", "Équipement réel", "Reales Gerät", "Apparecchiatura reale"),
  "Use simulação enquanto não houver um equipamento físico conectado.": steelL("Use simulation while no physical equipment is connected.", "Use la simulación mientras no haya un equipo físico conectado.", "Utilisez la simulation tant qu'aucun équipement physique n'est connecté.", "Verwenden Sie die Simulation, solange kein physisches Gerät verbunden ist.", "Usa la simulazione finché non è collegata un'apparecchiatura fisica."),
  "Controlador / Gateway": steelL("Controller / Gateway", "Controlador / Gateway", "Contrôleur / Passerelle", "Controller / Gateway", "Controller / Gateway"),
  "Selecione": steelL("Select", "Seleccione", "Sélectionner", "Auswählen", "Seleziona"),
  "Controlador robótico": steelL("Robot controller", "Controlador robótico", "Contrôleur robotique", "Robotersteuerung", "Controller robotico"),
  "Controlador CNC": steelL("CNC controller", "Controlador CNC", "Contrôleur CNC", "CNC-Steuerung", "Controller CNC"),
  "Gateway industrial": steelL("Industrial gateway", "Gateway industrial", "Passerelle industrielle", "Industrie-Gateway", "Gateway industriale"),
  "PAINEL QUE SERÁ CRIADO": steelL("DASHBOARD TO BE CREATED", "PANEL QUE SE CREARÁ", "TABLEAU DE BORD À CRÉER", "ZU ERSTELLENDES DASHBOARD", "DASHBOARD DA CREARE"),
  "Painel adaptativo": steelL("Adaptive dashboard", "Panel adaptativo", "Tableau de bord adaptatif", "Adaptives Dashboard", "Dashboard adattiva"),
  "Deixe tudo preparado agora em MOCK e troque para REAL quando conectar o braço.": steelL("Prepare everything in MOCK now and switch to REAL when the arm is connected.", "Prepare todo en MOCK ahora y cambie a REAL cuando conecte el brazo.", "Préparez tout en mode MOCK maintenant, puis passez en mode REAL lorsque le bras sera connecté.", "Bereiten Sie jetzt alles im MOCK-Modus vor und wechseln Sie zu REAL, sobald der Arm verbunden ist.", "Prepara tutto in modalità MOCK e passa a REAL quando colleghi il braccio."),
  "Modo do gateway": steelL("Gateway mode", "Modo del gateway", "Mode de la passerelle", "Gateway-Modus", "Modalità gateway"),
  "MOCK — sem braço": steelL("MOCK — no arm", "MOCK — sin brazo", "MOCK — sans bras", "MOCK — ohne Arm", "MOCK — senza braccio"),
  "REAL — USB físico": steelL("REAL — physical USB", "REAL — USB físico", "REAL — USB physique", "REAL — physisches USB", "REAL — USB fisico"),
  "Porta serial": steelL("Serial port", "Puerto serie", "Port série", "Serieller Port", "Porta seriale"),
  "Preparar controle físico (continua protegido pelo gateway)": steelL("Prepare physical control (still protected by the gateway)", "Preparar control físico (sigue protegido por el gateway)", "Préparer le contrôle physique (toujours protégé par la passerelle)", "Physische Steuerung vorbereiten (weiterhin durch das Gateway geschützt)", "Prepara il controllo fisico (ancora protetto dal gateway)"),
  "Segurança: no gateway, DOBOT_ALLOW_MOTION=false continua bloqueando movimento mesmo que a interface esteja preparada.": steelL("Safety: on the gateway, DOBOT_ALLOW_MOTION=false continues to block movement even when the interface is ready.", "Seguridad: en el gateway, DOBOT_ALLOW_MOTION=false sigue bloqueando el movimiento aunque la interfaz esté lista.", "Sécurité : sur la passerelle, DOBOT_ALLOW_MOTION=false continue de bloquer les mouvements même si l'interface est prête.", "Sicherheit: Im Gateway blockiert DOBOT_ALLOW_MOTION=false weiterhin Bewegungen, auch wenn die Oberfläche bereit ist.", "Sicurezza: nel gateway, DOBOT_ALLOW_MOTION=false continua a bloccare il movimento anche quando l'interfaccia è pronta."),
  "Intervalo esperado de leitura": steelL("Expected reading interval", "Intervalo de lectura esperado", "Intervalle de lecture attendu", "Erwartetes Leseintervall", "Intervallo di lettura previsto"),
  "Valor em milissegundos. Ex.: 2000 = 2 segundos.": steelL("Value in milliseconds. Example: 2000 = 2 seconds.", "Valor en milisegundos. Ej.: 2000 = 2 segundos.", "Valeur en millisecondes. Ex. : 2000 = 2 secondes.", "Wert in Millisekunden. Beispiel: 2000 = 2 Sekunden.", "Valore in millisecondi. Es.: 2000 = 2 secondi."),
  "Credencial do equipamento": steelL("Equipment credential", "Credencial del equipo", "Identifiant de l'équipement", "Gerätezugangsdaten", "Credenziale dell'apparecchiatura"),
  "O SteelControl gera automaticamente uma chave exclusiva no cadastro. Ela será usada pelo ESP32, CLP ou gateway para enviar dados com segurança.": steelL("SteelControl automatically generates a unique key during registration. The ESP32, PLC or gateway will use it to send data securely.", "SteelControl genera automáticamente una clave única durante el registro. El ESP32, PLC o gateway la usará para enviar datos de forma segura.", "SteelControl génère automatiquement une clé unique lors de l'enregistrement. L'ESP32, l'automate ou la passerelle l'utilisera pour envoyer les données en toute sécurité.", "SteelControl erzeugt bei der Registrierung automatisch einen eindeutigen Schlüssel. ESP32, SPS oder Gateway verwenden ihn zur sicheren Datenübertragung.", "SteelControl genera automaticamente una chiave univoca durante la registrazione. ESP32, PLC o gateway la useranno per inviare dati in sicurezza."),
  "Limites operacionais e segurança": steelL("Operating limits and safety", "Límites operativos y seguridad", "Limites de fonctionnement et sécurité", "Betriebsgrenzen und Sicherheit", "Limiti operativi e sicurezza"),
  "Alertas configuráveis por equipamento": steelL("Configurable alerts per equipment", "Alertas configurables por equipo", "Alertes configurables par équipement", "Konfigurierbare Warnungen pro Gerät", "Avvisi configurabili per apparecchiatura"),
  "Defina quando o SteelControl deve avisar, gerar alerta crítico e solicitar parada de segurança.": steelL("Define when SteelControl should notify, generate a critical alert and request a safety stop.", "Defina cuándo SteelControl debe avisar, generar una alerta crítica y solicitar una parada de seguridad.", "Définissez quand SteelControl doit avertir, générer une alerte critique et demander un arrêt de sécurité.", "Legen Sie fest, wann SteelControl warnen, einen kritischen Alarm auslösen und einen Sicherheitsstopp anfordern soll.", "Definisci quando SteelControl deve avvisare, generare un allarme critico e richiedere un arresto di sicurezza."),
  "Temperatura de atenção (°C)": steelL("Warning temperature (°C)", "Temperatura de atención (°C)", "Température d'alerte (°C)", "Warntemperatur (°C)", "Temperatura di attenzione (°C)"),
  "Temperatura crítica (°C)": steelL("Critical temperature (°C)", "Temperatura crítica (°C)", "Température critique (°C)", "Kritische Temperatur (°C)", "Temperatura critica (°C)"),
  "Carga elétrica de atenção (%)": steelL("Electrical load warning (%)", "Carga eléctrica de atención (%)", "Alerte de charge électrique (%)", "Warnwert elektrische Last (%)", "Carico elettrico di attenzione (%)"),
  "Carga elétrica crítica (%)": steelL("Critical electrical load (%)", "Carga eléctrica crítica (%)", "Charge électrique critique (%)", "Kritische elektrische Last (%)", "Carico elettrico critico (%)"),
  "Vibração de atenção (mm/s)": steelL("Vibration warning (mm/s)", "Vibración de atención (mm/s)", "Alerte de vibration (mm/s)", "Vibrationswarnwert (mm/s)", "Vibrazione di attenzione (mm/s)"),
  "Vibração crítica (mm/s)": steelL("Critical vibration (mm/s)", "Vibración crítica (mm/s)", "Vibration critique (mm/s)", "Kritische Vibration (mm/s)", "Vibrazione critica (mm/s)"),
  "Ciclos para manutenção preventiva": steelL("Cycles until preventive maintenance", "Ciclos para mantenimiento preventivo", "Cycles avant maintenance préventive", "Zyklen bis zur vorbeugenden Wartung", "Cicli per manutenzione preventiva"),

  // Painéis, diagnóstico e auditoria
  "Carga média": steelL("Average load", "Carga media", "Charge moyenne", "Durchschnittliche Last", "Carico medio"),
  "carga elétrica": steelL("electrical load", "carga eléctrica", "charge électrique", "elektrische Last", "carico elettrico"),
  "Condição": steelL("Condition", "Condición", "État", "Zustand", "Condizione"),
  "Corrente informada pelo controlador": steelL("Current reported by the controller", "Corriente informada por el controlador", "Courant indiqué par le contrôleur", "Vom Controller gemeldeter Strom", "Corrente indicata dal controller"),
  "Diagnóstico da máquina": steelL("Machine diagnostics", "Diagnóstico de la máquina", "Diagnostic de la machine", "Maschinendiagnose", "Diagnostica della macchina"),
  "Comunicação, último sinal, segurança e configuração do dispositivo.": steelL("Communication, last signal, safety and device configuration.", "Comunicación, última señal, seguridad y configuración del dispositivo.", "Communication, dernier signal, sécurité et configuration de l'appareil.", "Kommunikation, letztes Signal, Sicherheit und Gerätekonfiguration.", "Comunicazione, ultimo segnale, sicurezza e configurazione del dispositivo."),
  "Verificando conexão": steelL("Checking connection", "Verificando conexión", "Vérification de la connexion", "Verbindung wird geprüft", "Verifica della connessione"),
  "Último sinal": steelL("Last signal", "Última señal", "Dernier signal", "Letztes Signal", "Ultimo segnale"),
  "Qualidade": steelL("Quality", "Calidad", "Qualité", "Qualität", "Qualità"),
  "Chave do dispositivo": steelL("Device key", "Clave del dispositivo", "Clé de l'appareil", "Geräteschlüssel", "Chiave del dispositivo"),
  "Segurança operacional": steelL("Operational safety", "Seguridad operativa", "Sécurité opérationnelle", "Betriebssicherheit", "Sicurezza operativa"),
  "Operação liberada": steelL("Operation enabled", "Operación habilitada", "Fonctionnement autorisé", "Betrieb freigegeben", "Operazione abilitata"),
  "Nenhuma parada de segurança ativa.": steelL("No active safety stop.", "Ninguna parada de seguridad activa.", "Aucun arrêt de sécurité actif.", "Kein aktiver Sicherheitsstopp.", "Nessun arresto di sicurezza attivo."),
  "Liberar equipamento": steelL("Enable equipment", "Habilitar equipo", "Autoriser l'équipement", "Gerät freigeben", "Abilita apparecchiatura"),
  "Modo demonstração": steelL("Demo mode", "Modo demostración", "Mode démonstration", "Demomodus", "Modalità demo"),
  "Use estes cenários para apresentar o TCC sem equipamento físico.": steelL("Use these scenarios to present the project without physical equipment.", "Use estos escenarios para presentar el proyecto sin equipo físico.", "Utilisez ces scénarios pour présenter le projet sans équipement physique.", "Verwenden Sie diese Szenarien, um das Projekt ohne physische Geräte zu präsentieren.", "Usa questi scenari per presentare il progetto senza apparecchiature fisiche."),
  "Aquecimento": steelL("Heating", "Calentamiento", "Échauffement", "Erwärmung", "Riscaldamento"),
  "Superaquecimento crítico": steelL("Critical overheating", "Sobrecalentamiento crítico", "Surchauffe critique", "Kritische Überhitzung", "Surriscaldamento critico"),
  "Normalizar": steelL("Normalize", "Normalizar", "Normaliser", "Normalisieren", "Normalizza"),
  "Produção e operação vinculadas exclusivamente a este equipamento.": steelL("Production and operation linked exclusively to this equipment.", "Producción y operación vinculadas exclusivamente a este equipo.", "Production et fonctionnement exclusivement liés à cet équipement.", "Produktion und Betrieb ausschließlich mit diesem Gerät verknüpft.", "Produzione e funzionamento collegati esclusivamente a questa apparecchiatura."),
  "Aguardando dados": steelL("Waiting for data", "Esperando datos", "En attente de données", "Warten auf Daten", "In attesa dei dati"),
  "Indicador do controlador": steelL("Controller indicator", "Indicador del controlador", "Indicateur du contrôleur", "Controller-Anzeige", "Indicatore del controller"),
  "Não configurado": steelL("Not configured", "No configurado", "Non configuré", "Nicht konfiguriert", "Non configurato"),
  "O painel será adaptado aos dados enviados pelo equipamento.": steelL("The dashboard will adapt to the data sent by the equipment.", "El panel se adaptará a los datos enviados por el equipo.", "Le tableau de bord s'adaptera aux données envoyées par l'équipement.", "Das Dashboard passt sich den vom Gerät gesendeten Daten an.", "La dashboard si adatterà ai dati inviati dall'apparecchiatura."),
  "Plano e histórico técnico exclusivos deste equipamento.": steelL("Technical plan and history exclusive to this equipment.", "Plan e historial técnico exclusivos de este equipo.", "Plan et historique techniques propres à cet équipement.", "Technischer Plan und Verlauf ausschließlich für dieses Gerät.", "Piano e storico tecnico esclusivi di questa apparecchiatura."),
  "Eventos técnicos gerados somente por este equipamento.": steelL("Technical events generated only by this equipment.", "Eventos técnicos generados únicamente por este equipo.", "Événements techniques générés uniquement par cet équipement.", "Technische Ereignisse, die nur von diesem Gerät erzeugt werden.", "Eventi tecnici generati solo da questa apparecchiatura."),
  "Auditoria do sistema": steelL("System audit", "Auditoría del sistema", "Audit du système", "Systemprüfung", "Audit del sistema"),
  "Ações administrativas registradas com usuário, entidade e horário.": steelL("Administrative actions recorded with user, entity and time.", "Acciones administrativas registradas con usuario, entidad y hora.", "Actions administratives enregistrées avec l'utilisateur, l'entité et l'heure.", "Administrative Aktionen mit Benutzer, Entität und Uhrzeit protokolliert.", "Azioni amministrative registrate con utente, entità e orario."),
  "Atualizar": steelL("Refresh", "Actualizar", "Actualiser", "Aktualisieren", "Aggiorna"),
  "Eventos exibidos": steelL("Events displayed", "Eventos mostrados", "Événements affichés", "Angezeigte Ereignisse", "Eventi visualizzati"),
  "Últimos registros": steelL("Latest records", "Últimos registros", "Derniers enregistrements", "Neueste Einträge", "Ultimi registri"),
  "Usuários envolvidos": steelL("Users involved", "Usuarios involucrados", "Utilisateurs concernés", "Beteiligte Benutzer", "Utenti coinvolti"),
  "Rastreabilidade por conta": steelL("Traceability by account", "Trazabilidad por cuenta", "Traçabilité par compte", "Rückverfolgbarkeit nach Konto", "Tracciabilità per account"),
  "Última atividade": steelL("Last activity", "Última actividad", "Dernière activité", "Letzte Aktivität", "Ultima attività"),
  "Todas as ações": steelL("All actions", "Todas las acciones", "Toutes les actions", "Alle Aktionen", "Tutte le azioni"),
  "Criar": steelL("Create", "Crear", "Créer", "Erstellen", "Crea"),
  "Desativar": steelL("Deactivate", "Desactivar", "Désactiver", "Deaktivieren", "Disattiva"),
  "Carregando auditoria...": steelL("Loading audit...", "Cargando auditoría...", "Chargement de l'audit...", "Audit wird geladen...", "Caricamento audit..."),
  "PAINEL ADAPTATIVO": steelL("ADAPTIVE DASHBOARD", "PANEL ADAPTATIVO", "TABLEAU DE BORD ADAPTATIF", "ADAPTIVES DASHBOARD", "DASHBOARD ADATTIVA"),
  "Recursos e telemetria compatíveis com o equipamento selecionado.": steelL("Features and telemetry compatible with the selected equipment.", "Recursos y telemetría compatibles con el equipo seleccionado.", "Fonctions et télémétrie compatibles avec l'équipement sélectionné.", "Mit dem ausgewählten Gerät kompatible Funktionen und Telemetrie.", "Funzioni e telemetria compatibili con l'apparecchiatura selezionata."),
  "Aguardando telemetria": steelL("Waiting for telemetry", "Esperando telemetría", "En attente de télémétrie", "Warten auf Telemetrie", "In attesa della telemetria"),
  "Qualidade do sinal": steelL("Signal quality", "Calidad de señal", "Qualité du signal", "Signalqualität", "Qualità del segnale"),
  "Última leitura": steelL("Last reading", "Última lectura", "Dernière lecture", "Letzter Messwert", "Ultima lettura"),
  "Indicadores do equipamento": steelL("Equipment indicators", "Indicadores del equipo", "Indicateurs de l'équipement", "Geräteanzeigen", "Indicatori dell'apparecchiatura"),
  "Integração configurada": steelL("Integration configured", "Integración configurada", "Intégration configurée", "Integration konfiguriert", "Integrazione configurata"),
  "Capacidades do painel": steelL("Dashboard capabilities", "Capacidades del panel", "Capacités du tableau de bord", "Dashboard-Funktionen", "Funzionalità della dashboard"),
  "Informações disponíveis": steelL("Available information", "Información disponible", "Informations disponibles", "Verfügbare Informationen", "Informazioni disponibili"),
  "O painel mostra “Não configurado” quando o controlador ainda não envia determinado dado.": steelL("The dashboard shows “Not configured” when the controller does not yet send a given value.", "El panel muestra «No configurado» cuando el controlador aún no envía un dato determinado.", "Le tableau de bord affiche « Non configuré » lorsque le contrôleur n'envoie pas encore une donnée.", "Das Dashboard zeigt „Nicht konfiguriert“, wenn der Controller einen bestimmten Wert noch nicht sendet.", "La dashboard mostra “Non configurato” quando il controller non invia ancora un determinato dato."),
  "PAINEL EXCLUSIVO DA MÁQUINA": steelL("MACHINE-SPECIFIC DASHBOARD", "PANEL EXCLUSIVO DE LA MÁQUINA", "TABLEAU DE BORD DÉDIÉ À LA MACHINE", "MASCHINENSPEZIFISCHES DASHBOARD", "DASHBOARD ESCLUSIVA DELLA MACCHINA"),
  "Aguardando gateway": steelL("Waiting for gateway", "Esperando gateway", "En attente de la passerelle", "Warten auf Gateway", "In attesa del gateway"),
  "Alarmes": steelL("Alarms", "Alarmas", "Alarmes", "Alarme", "Allarmi"),
  "Posição do efetuador": steelL("End-effector position", "Posición del efector", "Position de l'effecteur", "Position des Endeffektors", "Posizione dell'effettore"),
  "Ângulos das juntas": steelL("Joint angles", "Ángulos de las articulaciones", "Angles des articulations", "Gelenkwinkel", "Angoli dei giunti"),
  "Sensores da célula": steelL("Cell sensors", "Sensores de la celda", "Capteurs de la cellule", "Zellensensoren", "Sensori della cella"),
  "Não instalado": steelL("Not installed", "No instalado", "Non installé", "Nicht installiert", "Non installato"),
  "Ferramenta e estado": steelL("Tool and status", "Herramienta y estado", "Outil et état", "Werkzeug und Status", "Strumento e stato"),
  "Comandos do robô": steelL("Robot commands", "Comandos del robot", "Commandes du robot", "Roboterbefehle", "Comandi del robot"),
  "Comandos passam pelo backend, PostgreSQL e fila autenticada do equipamento.": steelL("Commands pass through the backend, PostgreSQL and the equipment's authenticated queue.", "Los comandos pasan por el backend, PostgreSQL y la cola autenticada del equipo.", "Les commandes passent par le backend, PostgreSQL et la file authentifiée de l'équipement.", "Befehle laufen über Backend, PostgreSQL und die authentifizierte Gerätewarteschlange.", "I comandi passano attraverso backend, PostgreSQL e coda autenticata dell'apparecchiatura."),
  "Movimento protegido": steelL("Protected movement", "Movimiento protegido", "Mouvement protégé", "Geschützte Bewegung", "Movimento protetto"),
  "PARAR": steelL("STOP", "DETENER", "ARRÊTER", "STOPP", "ARRESTA"),
  "Limpar alarmes": steelL("Clear alarms", "Limpiar alarmas", "Effacer les alarmes", "Alarme löschen", "Cancella allarmi"),
  "Ventosa ON": steelL("Suction ON", "Ventosa ON", "Ventouse ON", "Sauger EIN", "Ventosa ON"),
  "Ventosa OFF": steelL("Suction OFF", "Ventosa OFF", "Ventouse OFF", "Sauger AUS", "Ventosa OFF"),
  "Abrir garra": steelL("Open gripper", "Abrir pinza", "Ouvrir la pince", "Greifer öffnen", "Apri pinza"),
  "Fechar garra": steelL("Close gripper", "Cerrar pinza", "Fermer la pince", "Greifer schließen", "Chiudi pinza"),
  "Velocidade (%)": steelL("Speed (%)", "Velocidad (%)", "Vitesse (%)", "Geschwindigkeit (%)", "Velocità (%)"),
  "Enviar PTP": steelL("Send PTP", "Enviar PTP", "Envoyer PTP", "PTP senden", "Invia PTP")
});

Object.assign(STEEL_LITERAL_I18N, {
  "Auditoria": steelL("Audit", "Auditoría", "Audit", "Audit", "Audit"),
  "Carga": steelL("Load", "Carga", "Charge", "Last", "Carico"),
  "Carga elétrica": steelL("Electrical load", "Carga eléctrica", "Charge électrique", "Elektrische Last", "Carico elettrico"),
  "Vibração": steelL("Vibration", "Vibración", "Vibration", "Vibration", "Vibrazione"),
  "Vibração atual do equipamento": steelL("Current equipment vibration", "Vibración actual del equipo", "Vibration actuelle de l'équipement", "Aktuelle Gerätevibration", "Vibrazione attuale dell'apparecchiatura"),
  "Elétrica": steelL("Electrical", "Eléctrica", "Électrique", "Elektrisch", "Elettrica"),
  "Corrente": steelL("Current", "Corriente", "Courant", "Strom", "Corrente"),
  "Latência": steelL("Latency", "Latencia", "Latence", "Latenz", "Latenza"),
  "Vibração crítica": steelL("Critical vibration", "Vibración crítica", "Vibration critique", "Kritische Vibration", "Vibrazione critica"),
  "Braço Robótico Industrial": steelL("Industrial Robotic Arm", "Brazo Robótico Industrial", "Bras Robotique Industriel", "Industrieller Roboterarm", "Braccio Robotico Industriale"),
  "Linha de Produção A": steelL("Production Line A", "Línea de Producción A", "Ligne de Production A", "Produktionslinie A", "Linea di Produzione A"),
  "CONTROLADOR": steelL("CONTROLLER", "CONTROLADOR", "CONTRÔLEUR", "CONTROLLER", "CONTROLLER"),
  "Eventos carregados": steelL("Events loaded", "Eventos cargados", "Événements chargés", "Ereignisse geladen", "Eventi caricati"),
  "Origem": steelL("Source", "Origen", "Origine", "Quelle", "Origine"),
  "Controlador": steelL("Controller", "Controlador", "Contrôleur", "Controller", "Controller"),
  "Escopo": steelL("Scope", "Alcance", "Périmètre", "Umfang", "Ambito"),
  "RASTREABILIDADE": steelL("TRACEABILITY", "TRAZABILIDAD", "TRAÇABILITÉ", "RÜCKVERFOLGBARKEIT", "TRACCIABILITÀ"),
  "Horário mais recente": steelL("Most recent time", "Hora más reciente", "Heure la plus récente", "Neueste Uhrzeit", "Orario più recente"),
  "Login": steelL("Sign in", "Inicio de sesión", "Connexion", "Anmeldung", "Accesso"),
  "Controlador industrial": steelL("Industrial controller", "Controlador industrial", "Contrôleur industriel", "Industriesteuerung", "Controller industriale"),
  "TELEMETRIA COMPATÍVEL": steelL("COMPATIBLE TELEMETRY", "TELEMETRÍA COMPATIBLE", "TÉLÉMÉTRIE COMPATIBLE", "KOMPATIBLE TELEMETRIE", "TELEMETRIA COMPATIBILE"),
  "COMUNICAÇÃO": steelL("COMMUNICATION", "COMUNICACIÓN", "COMMUNICATION", "KOMMUNIKATION", "COMUNICAZIONE"),
  "RECURSOS DO CONTROLADOR": steelL("CONTROLLER FEATURES", "RECURSOS DEL CONTROLADOR", "FONCTIONS DU CONTRÔLEUR", "CONTROLLER-FUNKTIONEN", "FUNZIONI DEL CONTROLLER"),
  "QUALIDADE DOS DADOS": steelL("DATA QUALITY", "CALIDAD DE LOS DATOS", "QUALITÉ DES DONNÉES", "DATENQUALITÄT", "QUALITÀ DEI DATI"),
  "Gateway Python • USB/Serial • Telemetria e comandos pela fila segura do SteelControl": steelL("Python Gateway • USB/Serial • Telemetry and commands through SteelControl's secure queue", "Gateway Python • USB/Serial • Telemetría y comandos mediante la cola segura de SteelControl", "Passerelle Python • USB/Série • Télémétrie et commandes via la file sécurisée de SteelControl", "Python-Gateway • USB/Seriell • Telemetrie und Befehle über die sichere SteelControl-Warteschlange", "Gateway Python • USB/Seriale • Telemetria e comandi tramite la coda sicura di SteelControl"),
  "POSE CARTESIANA": steelL("CARTESIAN POSE", "POSE CARTESIANA", "POSE CARTÉSIENNE", "KARTESISCHE POSE", "POSA CARTESIANA"),
  "ARTICULAÇÕES": steelL("JOINTS", "ARTICULACIONES", "ARTICULATIONS", "GELENKE", "GIUNTI"),
  "INSTRUMENTAÇÃO": steelL("INSTRUMENTATION", "INSTRUMENTACIÓN", "INSTRUMENTATION", "INSTRUMENTIERUNG", "STRUMENTAZIONE"),
  "O SteelControl não inventa temperatura interna do Dobot. Esses dados entram quando sensores externos/ESP32 estiverem instalados.": steelL("SteelControl does not fabricate Dobot internal temperature data. These values become available when external sensors or an ESP32 are installed.", "SteelControl no inventa la temperatura interna del Dobot. Estos datos estarán disponibles cuando se instalen sensores externos o un ESP32.", "SteelControl n'invente pas la température interne du Dobot. Ces données seront disponibles lorsque des capteurs externes ou un ESP32 seront installés.", "SteelControl erfindet keine internen Dobot-Temperaturdaten. Diese Werte stehen zur Verfügung, sobald externe Sensoren oder ein ESP32 installiert sind.", "SteelControl non inventa la temperatura interna del Dobot. Questi dati saranno disponibili quando verranno installati sensori esterni o un ESP32."),
  "EFETOR": steelL("END EFFECTOR", "EFECTOR", "EFFECTEUR", "ENDEFFEKTOR", "EFFETTORE"),
  "Ventosa": steelL("Suction cup", "Ventosa", "Ventouse", "Sauger", "Ventosa"),
  "Garra": steelL("Gripper", "Pinza", "Pince", "Greifer", "Pinza"),
  "Fila": steelL("Queue", "Cola", "File", "Warteschlange", "Coda"),
  "Modo": steelL("Mode", "Modo", "Mode", "Modus", "Modalità"),
  "CONTROLE SUPERVISIONADO": steelL("SUPERVISED CONTROL", "CONTROL SUPERVISADO", "CONTRÔLE SUPERVISÉ", "ÜBERWACHTE STEUERUNG", "CONTROLLO SUPERVISIONATO"),
  "HOME": steelL("HOME", "INICIO", "ACCUEIL", "START", "HOME"),
  "No equipamento real, o gateway inicia com": steelL("On real equipment, the gateway starts with", "En el equipo real, el gateway se inicia con", "Sur l'équipement réel, la passerelle démarre avec", "Am realen Gerät startet das Gateway mit", "Sull'apparecchiatura reale, il gateway si avvia con"),
  ". STOP permanece disponível; movimentos só são executados após liberação consciente no computador do robô.": steelL(". STOP remains available; movements are executed only after explicit authorization on the robot computer.", ". STOP permanece disponible; los movimientos solo se ejecutan después de una autorización explícita en el ordenador del robot.", ". STOP reste disponible ; les mouvements ne sont exécutés qu'après une autorisation explicite sur l'ordinateur du robot.", ". STOP bleibt verfügbar; Bewegungen werden erst nach ausdrücklicher Freigabe am Robotercomputer ausgeführt.", ". STOP rimane disponibile; i movimenti vengono eseguiti solo dopo un'autorizzazione esplicita sul computer del robot."),
  "Baud rate": steelL("Baud rate", "Velocidad en baudios", "Débit en bauds", "Baudrate", "Velocità in baud")
});

Object.assign(STEEL_LITERAL_I18N, {
  "Informe um CNPJ válido.": steelL("Enter a valid company ID.", "Ingrese un CNPJ válido.", "Saisissez un identifiant d'entreprise valide.", "Geben Sie eine gültige Unternehmens-ID ein.", "Inserisci un CNPJ valido."),
  "Informe um e-mail real e válido para receber o código de confirmação.": steelL("Enter a real, valid email to receive the confirmation code.", "Ingrese un correo real y válido para recibir el código de confirmación.", "Saisissez une adresse e-mail réelle et valide pour recevoir le code de confirmation.", "Geben Sie eine echte, gültige E-Mail-Adresse ein, um den Bestätigungscode zu erhalten.", "Inserisci un'e-mail reale e valida per ricevere il codice di conferma."),
  "A senha deve possuir pelo menos 8 caracteres.": steelL("The password must be at least 8 characters long.", "La contraseña debe tener al menos 8 caracteres.", "Le mot de passe doit comporter au moins 8 caractères.", "Das Passwort muss mindestens 8 Zeichen lang sein.", "La password deve contenere almeno 8 caratteri."),
  "Muitas solicitações de código para este e-mail. Tente novamente mais tarde.": steelL("Too many code requests for this email. Try again later.", "Demasiadas solicitudes de código para este correo. Inténtelo más tarde.", "Trop de demandes de code pour cette adresse. Réessayez plus tard.", "Zu viele Code-Anfragen für diese E-Mail. Versuchen Sie es später erneut.", "Troppe richieste di codice per questa e-mail. Riprova più tardi."),
  "Enviamos um código de 6 dígitos para o e-mail informado. A conta ainda não foi criada.": steelL("We sent a 6-digit code to the provided email. The account has not been created yet.", "Enviamos un código de 6 dígitos al correo indicado. La cuenta aún no fue creada.", "Nous avons envoyé un code à 6 chiffres à l'adresse indiquée. Le compte n'a pas encore été créé.", "Wir haben einen 6-stelligen Code an die angegebene E-Mail gesendet. Das Konto wurde noch nicht erstellt.", "Abbiamo inviato un codice di 6 cifre all'e-mail indicata. L'account non è ancora stato creato."),
  "Novo código enviado com sucesso.": steelL("New code sent successfully.", "Nuevo código enviado correctamente.", "Nouveau code envoyé avec succès.", "Neuer Code erfolgreich gesendet.", "Nuovo codice inviato correttamente."),
  "Informe o código de 6 dígitos enviado para seu e-mail.": steelL("Enter the 6-digit code sent to your email.", "Ingrese el código de 6 dígitos enviado a su correo.", "Saisissez le code à 6 chiffres envoyé à votre adresse e-mail.", "Geben Sie den 6-stelligen Code aus Ihrer E-Mail ein.", "Inserisci il codice di 6 cifre inviato alla tua e-mail."),
  "O código expirou. Volte ao cadastro e solicite um novo código.": steelL("The code has expired. Return to registration and request a new code.", "El código expiró. Vuelva al registro y solicite uno nuevo.", "Le code a expiré. Revenez à l'inscription et demandez un nouveau code.", "Der Code ist abgelaufen. Kehren Sie zur Registrierung zurück und fordern Sie einen neuen Code an.", "Il codice è scaduto. Torna alla registrazione e richiedi un nuovo codice."),
  "E-mail ou senha inválidos.": steelL("Invalid email or password.", "Correo o contraseña no válidos.", "E-mail ou mot de passe invalide.", "Ungültige E-Mail oder ungültiges Passwort.", "E-mail o password non validi."),
  "E-mail e senha são obrigatórios.": steelL("Email and password are required.", "El correo y la contraseña son obligatorios.", "L'e-mail et le mot de passe sont obligatoires.", "E-Mail und Passwort sind erforderlich.", "E-mail e password sono obbligatori."),
  "A prova de vida é obrigatória para o login facial.": steelL("A liveness check is required for facial sign-in.", "La prueba de vida es obligatoria para el acceso facial.", "Un test de présence est obligatoire pour la connexion faciale.", "Für die Gesichtsanmeldung ist eine Lebenderkennung erforderlich.", "La prova di vitalità è obbligatoria per l'accesso facciale."),
  "Olhe para a câmera, mova levemente a cabeça e retorne para a posição frontal.": steelL("Look at the camera, move your head slightly and return to the front position.", "Mire a la cámara, mueva ligeramente la cabeza y vuelva a la posición frontal.", "Regardez la caméra, bougez légèrement la tête puis revenez en position frontale.", "Schauen Sie in die Kamera, bewegen Sie den Kopf leicht und kehren Sie in die Frontalposition zurück.", "Guarda la fotocamera, muovi leggermente la testa e torna in posizione frontale."),
  "A prova de vida não foi confirmada.": steelL("The liveness check was not confirmed.", "La prueba de vida no fue confirmada.", "Le test de présence n'a pas été confirmé.", "Die Lebenderkennung wurde nicht bestätigt.", "La prova di vitalità non è stata confermata."),
  "Vire levemente a cabeça para um dos lados e retorne para a câmera.": steelL("Turn your head slightly to one side and return to the camera.", "Gire ligeramente la cabeza hacia un lado y vuelva a mirar la cámara.", "Tournez légèrement la tête d'un côté puis revenez vers la caméra.", "Drehen Sie den Kopf leicht zu einer Seite und schauen Sie wieder in die Kamera.", "Gira leggermente la testa da un lato e torna verso la fotocamera."),
  "Rosto não cadastrado ou não reconhecido.": steelL("Face not registered or not recognized.", "Rostro no registrado o no reconocido.", "Visage non enregistré ou non reconnu.", "Gesicht nicht registriert oder nicht erkannt.", "Volto non registrato o non riconosciuto."),
  "Entre com seu e-mail e senha ou cadastre seu rosto.": steelL("Sign in with your email and password or register your face.", "Ingrese con su correo y contraseña o registre su rostro.", "Connectez-vous avec votre e-mail et votre mot de passe ou enregistrez votre visage.", "Melden Sie sich mit E-Mail und Passwort an oder registrieren Sie Ihr Gesicht.", "Accedi con e-mail e password oppure registra il tuo volto."),
  "Não foi possível confirmar sua identidade com segurança.": steelL("We could not confirm your identity securely.", "No fue posible confirmar su identidad de forma segura.", "Nous n'avons pas pu confirmer votre identité de manière sûre.", "Ihre Identität konnte nicht sicher bestätigt werden.", "Non è stato possibile confermare la tua identità in modo sicuro."),
  "Olhe diretamente para a câmera e tente novamente.": steelL("Look directly at the camera and try again.", "Mire directamente a la cámara e inténtelo nuevamente.", "Regardez directement la caméra et réessayez.", "Schauen Sie direkt in die Kamera und versuchen Sie es erneut.", "Guarda direttamente la fotocamera e riprova.")
});



/* =========================================================
   AJUSTES FINAIS - AÇÕES DE EQUIPAMENTO
========================================================= */

const TRADUCOES_ACOES_EQUIPAMENTO = {
  pt: {
    remover: "Remover",
    removerEquipamento: "Remover equipamento",
    somenteAdminRemoverEquipamento: "Somente administradores podem remover equipamentos.",
    confirmarRemoverEquipamento: "Remover equipamento",
    removerEquipamentoAviso: "Esta ação também remove os dados vinculados à máquina.",
    erroRemoverEquipamento: "Não foi possível remover o equipamento.",
    salvarAlteracoes: "Salvar alterações",
    editandoEquipamento: "Editando"
  },
  en: {
    remover: "Remove",
    removerEquipamento: "Remove equipment",
    somenteAdminRemoverEquipamento: "Only administrators can remove equipment.",
    confirmarRemoverEquipamento: "Remove equipment",
    removerEquipamentoAviso: "This action also removes data linked to the machine.",
    erroRemoverEquipamento: "The equipment could not be removed.",
    salvarAlteracoes: "Save changes",
    editandoEquipamento: "Editing"
  },
  es: {
    remover: "Eliminar",
    removerEquipamento: "Eliminar equipo",
    somenteAdminRemoverEquipamento: "Solo los administradores pueden eliminar equipos.",
    confirmarRemoverEquipamento: "Eliminar equipo",
    removerEquipamentoAviso: "Esta acción también elimina los datos vinculados a la máquina.",
    erroRemoverEquipamento: "No se pudo eliminar el equipo.",
    salvarAlteracoes: "Guardar cambios",
    editandoEquipamento: "Editando"
  },
  fr: {
    remover: "Supprimer",
    removerEquipamento: "Supprimer l'équipement",
    somenteAdminRemoverEquipamento: "Seuls les administrateurs peuvent supprimer des équipements.",
    confirmarRemoverEquipamento: "Supprimer l'équipement",
    removerEquipamentoAviso: "Cette action supprime également les données liées à la machine.",
    erroRemoverEquipamento: "Impossible de supprimer l'équipement.",
    salvarAlteracoes: "Enregistrer les modifications",
    editandoEquipamento: "Modification de"
  },
  de: {
    remover: "Entfernen",
    removerEquipamento: "Gerät entfernen",
    somenteAdminRemoverEquipamento: "Nur Administratoren können Geräte entfernen.",
    confirmarRemoverEquipamento: "Gerät entfernen",
    removerEquipamentoAviso: "Dabei werden auch die mit der Maschine verknüpften Daten entfernt.",
    erroRemoverEquipamento: "Das Gerät konnte nicht entfernt werden.",
    salvarAlteracoes: "Änderungen speichern",
    editandoEquipamento: "Bearbeitung von"
  },
  it: {
    remover: "Rimuovi",
    removerEquipamento: "Rimuovi attrezzatura",
    somenteAdminRemoverEquipamento: "Solo gli amministratori possono rimuovere le attrezzature.",
    confirmarRemoverEquipamento: "Rimuovi attrezzatura",
    removerEquipamentoAviso: "Questa azione rimuove anche i dati collegati alla macchina.",
    erroRemoverEquipamento: "Impossibile rimuovere l'attrezzatura.",
    salvarAlteracoes: "Salva modifiche",
    editandoEquipamento: "Modifica di"
  }
};

Object.entries(
  TRADUCOES_ACOES_EQUIPAMENTO
).forEach(
  ([idioma, tabela]) => {
    Object.assign(
      traducoes[idioma],
      tabela
    );
  }
);


// =========================================================
// TRADUÇÃO AUTOMÁTICA DOS TEXTOS ESTÁTICOS
// =========================================================

const CHAVE_POR_TEXTO_PT = new Map(
  Object.entries(traducoes.pt)
    .filter(([, valor]) => typeof valor === "string" && valor.trim())
    .map(([chave, valor]) => [valor.replace(/\s+/g, " ").trim(), chave])
);

// Mapa reverso global: reconhece o texto independentemente do idioma
// que estava aplicado antes. Isso evita páginas "meio inglês / meio português"
// quando o usuário troca EN -> FR -> ES, por exemplo.
const CHAVE_POR_TEXTO_GLOBAL = new Map();

Object.values(traducoes).forEach(tabela => {
  Object.entries(tabela).forEach(([chave, valor]) => {
    if (typeof valor !== "string" || !valor.trim()) {
      return;
    }

    CHAVE_POR_TEXTO_GLOBAL.set(
      valor.replace(/\s+/g, " ").trim(),
      chave
    );
  });
});

function traduzirTextosEstaticos(root = document.body) {
  if (!root) return;

  const idioma = pegarIdiomaAtual();

  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT
  );

  const nodes = [];

  while (walker.nextNode()) {
    nodes.push(walker.currentNode);
  }

  nodes.forEach(node => {
    const parent = node.parentElement;

    if (!parent) return;

    if (
      ["SCRIPT", "STYLE", "NOSCRIPT", "TEXTAREA"].includes(
        parent.tagName
      )
    ) {
      return;
    }

    const atual =
      String(node.nodeValue || "")
        .replace(/\s+/g, " ")
        .trim();

    if (!atual) return;

    // Guarda uma chave ou o texto-base uma única vez.
    // Assim trocar EN -> FR -> DE nunca depende do idioma anterior.
    let chave = node.__steelI18nKey;
    let literalBase = node.__steelLiteralBase;

    if (!chave && !literalBase) {
      chave =
        CHAVE_POR_TEXTO_GLOBAL.get(atual) ||
        CHAVE_POR_TEXTO_PT.get(atual);

      if (chave) {
        node.__steelI18nKey = chave;
      } else if (STEEL_LITERAL_I18N[atual]) {
        literalBase = atual;
        node.__steelLiteralBase = atual;
      } else {
        // Talvez o DOM tenha sido criado já traduzido por outro idioma.
        for (const [base, tabela] of Object.entries(STEEL_LITERAL_I18N)) {
          if (
            base === atual ||
            Object.values(tabela).includes(atual)
          ) {
            literalBase = base;
            node.__steelLiteralBase = base;
            break;
          }
        }
      }
    }

    let traduzido = null;

    if (chave) {
      traduzido = pegarTexto(chave);
    } else if (literalBase) {
      traduzido =
        idioma === "pt"
          ? literalBase
          : (
              STEEL_LITERAL_I18N[literalBase]?.[idioma] ||
              STEEL_LITERAL_I18N[literalBase]?.en ||
              literalBase
            );
    }

    if (traduzido == null) return;

    const original = node.nodeValue || "";
    const prefixo = original.match(/^\s*/)?.[0] || "";
    const sufixo = original.match(/\s*$/)?.[0] || "";

    node.nodeValue =
      `${prefixo}${traduzido}${sufixo}`;
  });

  root
    .querySelectorAll("[placeholder], [title], [aria-label]")
    .forEach(elemento => {
      ["placeholder", "title", "aria-label"]
        .forEach(atributo => {
          const atual =
            String(
              elemento.getAttribute(atributo) || ""
            )
              .replace(/\s+/g, " ")
              .trim();

          if (!atual) return;

          const cacheKey =
            `steelI18nOriginal_${atributo}`;

          let original =
            elemento.dataset?.[cacheKey];

          if (!original) {
            // tenta descobrir a forma portuguesa/base por qualquer idioma
            const key =
              CHAVE_POR_TEXTO_GLOBAL.get(atual) ||
              CHAVE_POR_TEXTO_PT.get(atual);

            if (key) {
              elemento.setAttribute(
                atributo,
                pegarTexto(key)
              );
              return;
            }

            let baseEncontrado = null;

            if (STEEL_LITERAL_I18N[atual]) {
              baseEncontrado = atual;
            } else {
              for (const [base, tabela] of Object.entries(STEEL_LITERAL_I18N)) {
                if (Object.values(tabela).includes(atual)) {
                  baseEncontrado = base;
                  break;
                }
              }
            }

            if (!baseEncontrado) return;

            original = baseEncontrado;
            elemento.setAttribute(
              `data-steel-i18n-original-${atributo}`,
              original
            );
          }

          const base =
            elemento.getAttribute(
              `data-steel-i18n-original-${atributo}`
            ) || original;

          if (!base) return;

          const traduzido =
            idioma === "pt"
              ? base
              : (
                  STEEL_LITERAL_I18N[base]?.[idioma] ||
                  STEEL_LITERAL_I18N[base]?.en ||
                  base
                );

          elemento.setAttribute(
            atributo,
            traduzido
          );
        });
    });
}


// =========================================================
// SELETOR GLOBAL DE IDIOMA
// =========================================================

function criarSeletorGlobalIdioma() {
  if (document.getElementById("steelLanguageSwitcher")) {
    return;
  }

  // A tela de login já possui seletor próprio.
  if (document.querySelector(".language-box")) {
    return;
  }

  const container = document.createElement("div");
  container.id = "steelLanguageSwitcher";
  container.className = "steel-language-switcher";
  container.setAttribute("aria-label", "Language");

  container.innerHTML = `
    <span class="steel-language-icon" aria-hidden="true">🌐</span>
    <select id="steelLanguageSelect" aria-label="Language">
      <option value="pt">PT</option>
      <option value="en">EN</option>
      <option value="es">ES</option>
      <option value="fr">FR</option>
      <option value="de">DE</option>
      <option value="it">IT</option>
    </select>
  `;

  document.body.appendChild(container);

  const select = container.querySelector("#steelLanguageSelect");

  select.value = pegarIdiomaAtual();

  select.addEventListener("change", () => {
    trocarIdioma(select.value);
  });
}

function atualizarSeletorGlobalIdioma() {
  const select = document.getElementById("steelLanguageSelect");

  if (select) {
    select.value = pegarIdiomaAtual();
  }
}


// =========================================================
// IDIOMA ATUAL
// =========================================================

function pegarIdiomaAtual() {

  const idiomaSalvo =
    localStorage.getItem(
      "idiomaSistema"
    );


  if (
    IDIOMAS_SUPORTADOS.includes(
      idiomaSalvo
    )
  ) {

    return idiomaSalvo;

  }


  return "pt";
}


// =========================================================
// PEGAR TEXTO
// =========================================================

function pegarTexto(
  chave,
  parametros = {}
) {

  const idioma =
    pegarIdiomaAtual();


  const tabela =
    traducoes[idioma] ||
    traducoes.pt;


  let texto =
    tabela[chave];


  /*
    Se a tradução do idioma selecionado ainda estiver herdando
    exatamente o português, preferimos a versão inglesa.
    Assim nunca aparece português misturado no meio de EN/ES/FR/DE/IT.
  */
  if (
    idioma !== "pt" &&
    texto !== undefined &&
    traducoes.pt[chave] !== undefined &&
    texto === traducoes.pt[chave] &&
    traducoes.en[chave] !== undefined &&
    traducoes.en[chave] !== traducoes.pt[chave]
  ) {
    texto = traducoes.en[chave];
  }


  /*
    Se faltar uma chave em outro idioma,
    usamos inglês antes de português.
  */

  if (
    texto === undefined &&
    idioma !== "pt"
  ) {

    texto =
      traducoes.en[chave];
  }


  if (
    texto === undefined
  ) {

    texto =
      traducoes.pt[chave];
  }


  if (
    texto === undefined
  ) {

    console.warn(
      `[SteelControl i18n] Tradução não encontrada: ${chave}`
    );


    return chave;
  }


  texto =
    String(texto);


  Object.entries(
    parametros
  )
    .forEach(
      ([nome, valor]) => {

        texto =
          texto.replaceAll(
            `{${nome}}`,
            String(valor)
          );

      }
    );


  return texto;
}


// =========================================================
// ALIAS
// =========================================================

function t(
  chave,
  parametros = {}
) {

  return pegarTexto(
    chave,
    parametros
  );
}


// Traduz mensagens vindas de APIs ou criadas dinamicamente quando elas
// correspondem a um texto conhecido pelo dicionário global.
function traduzirTextoLivre(texto) {
  const valor =
    String(texto ?? "")
      .replace(/\s+/g, " ")
      .trim();

  if (!valor) return "";

  const chave =
    CHAVE_POR_TEXTO_GLOBAL.get(valor) ||
    CHAVE_POR_TEXTO_PT.get(valor);

  if (chave) {
    return pegarTexto(chave);
  }

  let base =
    STEEL_LITERAL_I18N[valor]
      ? valor
      : null;

  if (!base) {
    for (const [textoBase, tabela] of Object.entries(STEEL_LITERAL_I18N)) {
      if (Object.values(tabela).includes(valor)) {
        base = textoBase;
        break;
      }
    }
  }

  if (!base) return valor;

  const idioma = pegarIdiomaAtual();

  return idioma === "pt"
    ? base
    : (
        STEEL_LITERAL_I18N[base]?.[idioma] ||
        STEEL_LITERAL_I18N[base]?.en ||
        base
      );
}


// =========================================================
// TRADUZIR ELEMENTO
// =========================================================

function traduzirElemento(
  elemento
) {

  if (
    !elemento ||
    elemento.nodeType !== 1
  ) {

    return;
  }


  // =======================================================
  // TEXTO
  // =======================================================

  const chave =
    elemento.getAttribute(
      "data-i18n"
    );


  if (
    chave
  ) {

    elemento.innerHTML =
      pegarTexto(
        chave
      );
  }


  // =======================================================
  // PLACEHOLDER
  // =======================================================

  const placeholder =
    elemento.getAttribute(
      "data-i18n-placeholder"
    ) ||
    elemento.getAttribute(
      "data-placeholder"
    );


  if (
    placeholder
  ) {

    elemento.setAttribute(
      "placeholder",
      pegarTexto(
        placeholder
      )
    );
  }


  // =======================================================
  // TITLE
  // =======================================================

  const title =
    elemento.getAttribute(
      "data-i18n-title"
    );


  if (
    title
  ) {

    elemento.setAttribute(
      "title",
      pegarTexto(
        title
      )
    );
  }


  // =======================================================
  // ARIA LABEL
  // =======================================================

  const aria =
    elemento.getAttribute(
      "data-i18n-aria"
    );


  if (
    aria
  ) {

    elemento.setAttribute(
      "aria-label",
      pegarTexto(
        aria
      )
    );
  }


  // =======================================================
  // VALUE
  // =======================================================

  const value =
    elemento.getAttribute(
      "data-i18n-value"
    );


  if (
    value
  ) {

    elemento.value =
      pegarTexto(
        value
      );
  }
}


// =========================================================
// APLICAR IDIOMA
// =========================================================

function aplicarIdioma() {

  const idioma =
    pegarIdiomaAtual();


  document.documentElement.lang =
    idioma;


  document
    .querySelectorAll(
      `
        [data-i18n],
        [data-i18n-placeholder],
        [data-placeholder],
        [data-i18n-title],
        [data-i18n-aria],
        [data-i18n-value]
      `
    )
    .forEach(
      traduzirElemento
    );


  // =======================================================
  // BOTÃO DE IDIOMA
  // =======================================================

  const idiomaAtual =
    document.getElementById(
      "idiomaAtual"
    );


  if (
    idiomaAtual
  ) {

    idiomaAtual.textContent =
      idioma.toUpperCase();
  }


  // =======================================================
  // SELECT CONFIGURAÇÕES
  // =======================================================

  const idiomaConfig =
    document.getElementById(
      "idiomaConfig"
    );


  if (
    idiomaConfig
  ) {

    idiomaConfig.value =
      idioma;
  }


  // =======================================================
  // TITLE DA PÁGINA
  // =======================================================

  const chaveTitulo =
    document.body
      ?.getAttribute(
        "data-i18n-page-title"
      );


  if (
    chaveTitulo
  ) {

    document.title =
      pegarTexto(
        chaveTitulo
      );
  }


  // =======================================================
  // META DESCRIPTION
  // =======================================================

  const meta =
    document.querySelector(
      'meta[name="description"][data-i18n-content]'
    );


  if (
    meta
  ) {

    const chaveMeta =
      meta.getAttribute(
        "data-i18n-content"
      );


    meta.setAttribute(
      "content",
      pegarTexto(
        chaveMeta
      )
    );
  }


  traduzirTextosEstaticos(document.body);

  atualizarSeletorGlobalIdioma();


  window.dispatchEvent(
    new CustomEvent(
      "idiomaAplicado",
      {
        detail: {
          idioma
        }
      }
    )
  );
}


// =========================================================
// TROCAR IDIOMA
// =========================================================

function trocarIdioma(
  idioma
) {

  if (
    !IDIOMAS_SUPORTADOS.includes(
      idioma
    )
  ) {

    return;
  }


  localStorage.setItem(
    "idiomaSistema",
    idioma
  );


  aplicarIdioma();


  const menu =
    document.getElementById(
      "languageMenu"
    );


  menu?.classList.remove(
    "ativo"
  );


  window.dispatchEvent(
    new CustomEvent(
      "idiomaAlterado",
      {
        detail: {
          idioma
        }
      }
    )
  );


  window.dispatchEvent(
    new CustomEvent(
      "configAtualizada",
      {
        detail: {
          idioma
        }
      }
    )
  );
}


// =========================================================
// MENU IDIOMA
// =========================================================

function abrirIdiomas() {

  document
    .getElementById(
      "languageMenu"
    )
    ?.classList.toggle(
      "ativo"
    );
}


// =========================================================
// TEMA
// =========================================================


function aplicarContrasteLogoEmpresa() {
  const escuro =
    document.documentElement.getAttribute("data-theme") === "escuro";

  [
    document.getElementById("empresaLogoSidebar"),
    document.getElementById("configEmpresaLogo"),
    document.getElementById("empresaLogo")
  ]
    .filter(Boolean)
    .forEach(img => {
      if (escuro) {
        img.style.setProperty(
          "filter",
          "grayscale(1) brightness(0) invert(1)",
          "important"
        );
      } else {
        img.style.removeProperty("filter");
      }
    });
}

function aplicarTemaGlobal() {

  const tema =
    localStorage.getItem(
      "temaSistema"
    ) ||
    "claro";


  document.documentElement.setAttribute(
    "data-theme",
    tema
  );


  document.documentElement.style.colorScheme =
    tema === "escuro"
      ? "dark"
      : "light";

  setTimeout(aplicarContrasteLogoEmpresa, 0);


  const temaConfig =
    document.getElementById(
      "temaConfig"
    );


  if (
    temaConfig
  ) {

    temaConfig.value =
      tema;
  }
}


// =========================================================
// TROCAR TEMA
// =========================================================

function trocarTema(
  tema
) {

  if (
    ![
      "claro",
      "escuro"
    ].includes(
      tema
    )
  ) {

    return;
  }


  localStorage.setItem(
    "temaSistema",
    tema
  );


  aplicarTemaGlobal();


  window.dispatchEvent(
    new CustomEvent(
      "configAtualizada",
      {
        detail: {
          tema
        }
      }
    )
  );
}


// =========================================================
// SELECTS
// =========================================================

document.addEventListener(
  "change",
  event => {

    if (
      event.target?.id ===
      "idiomaConfig"
    ) {

      trocarIdioma(
        event.target.value
      );
    }


    if (
      event.target?.id ===
      "temaConfig"
    ) {

      trocarTema(
        event.target.value
      );
    }

  }
);


// =========================================================
// FECHAR MENU DE IDIOMA
// =========================================================

document.addEventListener(
  "click",
  event => {

    const box =
      document.querySelector(
        ".language-box"
      );


    const menu =
      document.getElementById(
        "languageMenu"
      );


    if (
      box &&
      menu &&
      !box.contains(
        event.target
      )
    ) {

      menu.classList.remove(
        "ativo"
      );
    }

  }
);


// =========================================================
// OBSERVADOR
//
// Traduz elementos adicionados depois pelo JavaScript.
// Exemplo: cards de máquinas e funcionários.
// =========================================================

const observadorIdioma =
  new MutationObserver(
    mutacoes => {

      mutacoes.forEach(
        mutacao => {

          mutacao.addedNodes.forEach(
            node => {

              if (
                node.nodeType !== 1
              ) {

                return;
              }


              if (
                node.matches?.(
                  `
                    [data-i18n],
                    [data-i18n-placeholder],
                    [data-placeholder],
                    [data-i18n-title],
                    [data-i18n-aria],
                    [data-i18n-value]
                  `
                )
              ) {

                traduzirElemento(
                  node
                );
              }


              node
                .querySelectorAll?.(
                  `
                    [data-i18n],
                    [data-i18n-placeholder],
                    [data-placeholder],
                    [data-i18n-title],
                    [data-i18n-aria],
                    [data-i18n-value]
                  `
                )
                .forEach(
                  traduzirElemento
                );

              traduzirTextosEstaticos(node);

            }
          );

        }
      );

    }
  );


// =========================================================
// ALTERAÇÃO EM OUTRA ABA
// =========================================================

window.addEventListener(
  "storage",
  event => {

    if (
      event.key ===
      "idiomaSistema"
    ) {

      aplicarIdioma();
    }


    if (
      event.key ===
      "temaSistema"
    ) {

      aplicarTemaGlobal();
    }

  }
);


// =========================================================
// VOLTAR PARA PÁGINA PELO NAVEGADOR
// =========================================================

window.addEventListener(
  "pageshow",
  () => {

    criarSeletorGlobalIdioma();

    aplicarTemaGlobal();

    aplicarIdioma();

  }
);


// =========================================================
// INICIALIZAÇÃO
// =========================================================

document.addEventListener(
  "DOMContentLoaded",
  () => {

    aplicarTemaGlobal();

    aplicarIdioma();


    if (
      document.body
    ) {

      observadorIdioma.observe(
        document.body,
        {
          childList: true,
          subtree: true
        }
      );
    }

  }
);

// =========================================================
// STEELCONTROL UI — DOM seguro (sem interpolar conteúdo em innerHTML)
// =========================================================

function scElemento(tag, { classe = "", texto = "", atributos = {} } = {}) {
  const el = document.createElement(tag);
  if (classe) el.className = classe;
  if (texto !== undefined && texto !== null) el.textContent = String(texto);
  Object.entries(atributos).forEach(([nome, valor]) => {
    if (valor !== undefined && valor !== null) el.setAttribute(nome, String(valor));
  });
  return el;
}

function scIcone(nome) {
  const i = scElemento("i", { classe: `fa-solid ${nome}` });
  i.setAttribute("aria-hidden", "true");
  return i;
}

window.SteelUI = {
  toast({ titulo = "SteelControl", mensagem = "", tipo = "info", duracao = 4200 } = {}) {
    let regiao = document.querySelector(".sc-toast-region");
    if (!regiao) {
      regiao = scElemento("div", {
        classe: "sc-toast-region",
        atributos: { "aria-live": "polite", "aria-atomic": "false" }
      });
      document.body.appendChild(regiao);
    }

    const icones = {
      success: "fa-circle-check",
      error: "fa-circle-xmark",
      warning: "fa-triangle-exclamation",
      info: "fa-circle-info"
    };

    const toast = scElemento("div", { classe: `sc-toast ${tipo}` });
    const iconWrap = scElemento("span", { classe: "sc-toast-icon" });
    iconWrap.appendChild(scIcone(icones[tipo] || icones.info));

    const copy = scElemento("div");
    copy.appendChild(scElemento("strong", { texto: titulo }));
    copy.appendChild(scElemento("p", { texto: mensagem }));

    const fechar = scElemento("button", {
      classe: "sc-toast-close",
      atributos: { type: "button", "aria-label": "Fechar" }
    });
    fechar.appendChild(scIcone("fa-xmark"));

    toast.append(iconWrap, copy, fechar);
    const remover = () => toast.remove();
    fechar.addEventListener("click", remover);
    regiao.appendChild(toast);
    setTimeout(remover, Math.max(800, Number(duracao) || 4200));
  },

  confirm({
    titulo = "Confirmar ação",
    mensagem = "Deseja continuar?",
    confirmar = "Confirmar",
    cancelar = "Cancelar",
    perigoso = true
  } = {}) {
    return new Promise(resolve => {
      const fundo = scElemento("div", { classe: "sc-confirm-backdrop" });
      const card = scElemento("div", {
        classe: "sc-confirm-card",
        atributos: { role: "dialog", "aria-modal": "true", "aria-labelledby": "sc-confirm-title" }
      });

      const iconWrap = scElemento("div", { classe: "sc-confirm-icon" });
      iconWrap.appendChild(scIcone(perigoso ? "fa-triangle-exclamation" : "fa-circle-info"));

      const h3 = scElemento("h3", { texto: titulo, atributos: { id: "sc-confirm-title" } });
      const p = scElemento("p", { texto: mensagem });
      // Preserva quebras de linha do texto, sem interpretar HTML.
      p.style.whiteSpace = "pre-line";

      const actions = scElemento("div", { classe: "sc-confirm-actions" });
      const cancelarBtn = scElemento("button", {
        classe: "sc-confirm-cancel",
        texto: cancelar,
        atributos: { type: "button" }
      });
      const confirmarBtn = scElemento("button", {
        classe: "sc-confirm-ok",
        texto: confirmar,
        atributos: { type: "button", "data-confirmar": "true" }
      });
      actions.append(cancelarBtn, confirmarBtn);
      card.append(iconWrap, h3, p, actions);
      fundo.appendChild(card);

      let finalizado = false;
      const finalizar = valor => {
        if (finalizado) return;
        finalizado = true;
        fundo.remove();
        document.removeEventListener("keydown", teclaEscape);
        resolve(valor);
      };
      const teclaEscape = event => {
        if (event.key === "Escape") finalizar(false);
      };

      cancelarBtn.addEventListener("click", () => finalizar(false));
      confirmarBtn.addEventListener("click", () => finalizar(true));
      fundo.addEventListener("click", event => {
        if (event.target === fundo) finalizar(false);
      });
      document.addEventListener("keydown", teclaEscape);
      document.body.appendChild(fundo);
      setTimeout(() => confirmarBtn.focus(), 0);
    });
  }
};
